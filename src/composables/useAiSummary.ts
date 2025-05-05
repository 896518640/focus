import { ref, computed, Ref } from 'vue';
import { AiSummaryParams, getStreamSummary } from '@/api/translation/summarize';
import { showToast, showSuccessToast, showFailToast } from 'vant';
import { useAiSummaryTextEffect } from './useAiSummaryTextEffect';

/**
 * 将文本复制到剪贴板
 * @param text 要复制的文本
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 回退方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('复制操作失败');
      }
      
      return true;
    }
  } catch (err) {
    console.error('复制失败:', err);
    throw err;
  }
}

// 模拟数据类型（用于开发环境下测试）
interface MockSummaryData {
  [key: string]: string[];
}

// 模拟数据
const mockSummaries: MockSummaryData = {
  cn: [
    "这是一段关于人工智能发展历程的讨论，主要涵盖了从早期的专家系统到现代深度学习的演变。内容指出AI技术在医疗、金融和自动驾驶领域的应用前景广阔，但同时也强调了数据隐私和伦理问题的重要性。",
    "讨论了气候变化对全球生态系统的影响，包括极端天气事件增加、冰川融化和海平面上升等现象。演讲者呼吁加强国际合作，采取更积极的减排措施，并投资可再生能源技术。"
  ],
  en: [
    "This discussion covers the evolution of artificial intelligence, from early expert systems to modern deep learning. It highlights AI's promising applications in healthcare, finance, and autonomous driving, while emphasizing the importance of data privacy and ethical considerations.",
    "The talk addresses climate change impacts on global ecosystems, including increased extreme weather events, glacier melting, and rising sea levels. The speaker calls for stronger international cooperation, more aggressive emission reduction measures, and investment in renewable energy technologies."
  ]
};

/**
 * AI总结组合式函数参数选项接口
 */
export interface UseAiSummaryOptions {
  /** 要总结的翻译文本（页面特定接口使用） */
  translationText?: Ref<string>;
  /** 目标语言（页面特定接口使用） */
  targetLanguage?: Ref<string>;
  /** 是否使用模拟数据 */
  useMockData?: boolean; 
  /** 打字速度（毫秒/字符） */
  typingSpeed?: number;
  /** 最小打字速度 */
  minTypingSpeed?: number;
  /** 最大打字速度 */
  maxTypingSpeed?: number;
  /** 是否启用字符变化的随机速度 */
  characterVariation?: boolean;
}

/**
 * AI总结组合式函数
 * 提供AI总结的相关逻辑
 * @param options 可选配置参数，用于页面特定场景
 */
export function useAiSummary(options: UseAiSummaryOptions = {}) {
  const {
    translationText,
    targetLanguage,
    useMockData = false,
    typingSpeed = 15,
    minTypingSpeed = 10, 
    maxTypingSpeed = 25,
    characterVariation = true
  } = options;
  
  // 原始内容（用于复制）
  const summaryContent = ref<string>('');
  
  // 加载状态
  const loading = ref<boolean>(false);
  // 错误信息
  const error = ref<string>('');
  // 结束标记
  const isStreamComplete = ref<boolean>(false);
  // 进度百分比
  const progressPercentage = ref<number>(0);
  // 弹窗显示状态（页面特定）
  const showSummary = ref<boolean>(false);
  
  // 使用更高级的打字机特效
  const {
    displayedSummary: displayedContent,
    showFullText,
    cleanup: cleanupTextEffect
  } = useAiSummaryTextEffect({
    summaryText: summaryContent,
    speed: typingSpeed,
    minSpeed: minTypingSpeed,
    maxSpeed: maxTypingSpeed,
    characterVariation: characterVariation
  });
  
  // 取消函数
  let cancelRequest: (() => void) | null = null;
  
  /**
   * 模拟流式响应（用于开发环境测试）
   * @param text 模拟的总结文本
   */
  const simulateStreamResponse = async (text: string) => {
    console.log('开始模拟流式响应，总长度:', text.length);
    
    // 重置状态
    loading.value = true;
    error.value = '';
    summaryContent.value = '';
    isStreamComplete.value = false;
    progressPercentage.value = 0;
    
    const chunkSize = 1; // 每次发送的字符数
    const minDelay = 30; // 最小延迟（毫秒）
    const maxDelay = 100; // 最大延迟（毫秒）
    
    try {
      for (let i = 0; i < text.length; i += chunkSize) {
        // 检查是否被取消
        if (!loading.value) {
          console.log('模拟流被取消，在位置', i);
          break;
        }
        
        const chunk = text.slice(i, i + chunkSize);
        
        // 等待随机延迟
        const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 更新完整内容（同时会触发打字机效果）
        summaryContent.value += chunk;
        
        // 更新进度
        progressPercentage.value = Math.round((i / text.length) * 100);
      }
      
      // 只有在未被取消的情况下才标记为完成
      if (loading.value) {
        console.log('模拟流响应完成');
        // 标记完成
        loading.value = false;
        isStreamComplete.value = true;
        progressPercentage.value = 100;
      }
    } catch (err) {
      console.error('模拟流式响应出错:', err);
      loading.value = false;
      error.value = '模拟响应生成失败';
      
      showFailToast({
        message: error.value,
        position: 'bottom'
      });
    }
  };
  
  /**
   * 获取AI总结内容（页面特定场景使用）
   */
  const getSummaryContent = () => {
    console.log('getSummaryContent被调用', {
      hasTranslationText: !!translationText,
      hasTargetLanguage: !!targetLanguage,
      isLoading: loading.value
    });
    
    if (!translationText || !targetLanguage) {
      console.error('缺少翻译文本或目标语言');
      error.value = '缺少翻译文本或目标语言';
      showToast({
        message: '无法生成总结：缺少必要参数',
        position: 'bottom'
      });
      return;
    }
    
    if (loading.value) {
      console.log('已经在生成中，忽略请求');
      return;
    }
    
    // 检查翻译文本是否为空
    if (!translationText.value || translationText.value.trim() === '') {
      console.error('翻译文本为空');
      error.value = '翻译文本为空';
      showToast({
        message: '没有可用的翻译内容',
        position: 'bottom'
      });
      return;
    }
    
    console.log('准备生成总结', {
      textLength: translationText.value.length,
      language: targetLanguage.value
    });
    
    const params: AiSummaryParams = {
      text: translationText.value,
      language: targetLanguage.value
    };
    
    fetchSummary(params, true);
  };
  
  /**
   * 获取AI总结
   * @param params 总结参数
   * @param useStream 是否使用流式输出 
   */
  const fetchSummary = async (params: AiSummaryParams, useStream = true) => {
    console.log('fetchSummary被调用', { params, useStream });
    
    // 重置状态
    loading.value = true;
    error.value = '';
    summaryContent.value = '';
    isStreamComplete.value = false;
    progressPercentage.value = 0;
    
    try {
      // 如果使用模拟数据
      if (useMockData) {
        console.log('使用模拟数据模式');
        const language = params.language.toLowerCase();
        const availableLangs = Object.keys(mockSummaries);
        const closestLang = availableLangs.includes(language) ? language : 'en';
        
        // 随机选择一条模拟总结
        const mockData = mockSummaries[closestLang];
        const randomIndex = Math.floor(Math.random() * mockData.length);
        const mockText = mockData[randomIndex];
        
        console.log('开始模拟流式响应');
        // 模拟流式响应
        await simulateStreamResponse(mockText);
        return;
      }
      
      console.log('调用API获取流式总结');
      // 使用getStreamSummary方法获取流式输出
      cancelRequest = getStreamSummary(
        params,
        (message) => {
          console.log('流式总结消息', message);
          if (message.content) {
            // 累加到完整内容（会自动触发打字机效果）
            summaryContent.value += message.content;
          }
        },
        () => {
          // 完成回调
          console.log('流式总结完成');
          loading.value = false;
          isStreamComplete.value = true;
          progressPercentage.value = 100;
        },
        (err) => {
          // 错误回调
          console.error('流式总结出错', err);
          loading.value = false;
          error.value = err.message || '总结生成失败';
          
          showFailToast({
            message: error.value,
            position: 'bottom'
          });
          
          // 如果出错且启用了模拟数据备用选项，使用模拟数据
          if (useMockData) {
            console.log('出错后使用备用模拟数据');
            const fallbackLang = typeof params.language === 'string' && 
              params.language.toLowerCase().startsWith('zh') ? 'cn' : 'en';
            simulateStreamResponse(mockSummaries[fallbackLang][0]);
            error.value = '';
          }
        }
      );
    } catch (err: any) {
      console.error('fetchSummary执行出错', err);
      loading.value = false;
      error.value = err.message || '总结生成失败';
      
      showFailToast({
        message: error.value,
        position: 'bottom'
      });
    }
  };
  
  /**
   * 复制总结内容到剪贴板
   */
  const copySummary = async () => {
    if (!summaryContent.value) {
      showToast({
        message: '没有可复制的内容',
        position: 'bottom'
      });
      return;
    }
    
    try {
      await copyTextToClipboard(summaryContent.value);
      showSuccessToast({
        message: '复制成功',
        position: 'bottom'
      });
    } catch (err) {
      showFailToast({
        message: '复制失败',
        position: 'bottom'
      });
    }
  };
  
  /**
   * 取消生成总结
   */
  const stopGeneratingSummary = () => {
    if (cancelRequest) {
      cancelRequest();
      cancelRequest = null;
      loading.value = false;
      isStreamComplete.value = true;
      
      showToast({
        message: '已停止生成',
        position: 'bottom'
      });
    }
  };
  
  /**
   * 重置总结内容和状态
   */
  const resetSummary = () => {
    summaryContent.value = '';
    error.value = '';
    isStreamComplete.value = false;
    progressPercentage.value = 0;
  };
  
  /**
   * 切换总结弹窗（页面特定场景使用）
   */
  const toggleSummary = () => {
    // 如果没有翻译内容，提示用户并不显示弹窗
    if (translationText && (!translationText.value || translationText.value.trim() === '')) {
      showToast({
        message: '没有可用的翻译内容',
        position: 'bottom'
      });
      return;
    }
    
    if (showSummary.value) {
      // 关闭弹窗，停止流式请求
      showSummary.value = false;
      stopGeneratingSummary();
      resetSummary();
    } else {
      // 打开弹窗，重置状态
      showSummary.value = true;
      
      // 如果有翻译文本和目标语言引用，自动生成总结
      if (translationText && targetLanguage && !loading.value) {
        const params: AiSummaryParams = {
          text: translationText.value,
          language: targetLanguage.value
        };
        fetchSummary(params, true);
      }
    }
  };
  
  /**
   * 是否有内容
   */
  const hasSummary = computed(() => !!summaryContent.value);
  
  // 组件销毁时清理资源
  const cleanup = () => {
    if (cancelRequest) {
      cancelRequest();
    }
    cleanupTextEffect();
  };
  
  return {
    // 状态
    summaryContent,
    displayedContent,
    loading,
    error,
    isStreamComplete,
    progressPercentage,
    hasSummary,
    showSummary,
    
    // 方法
    fetchSummary,
    copySummary,
    stopGeneratingSummary,
    resetSummary,
    toggleSummary,
    getSummaryContent,
    showFullText,
    cleanup,
    
    // 开发辅助方法
    simulateStreamResponse
  };
}

export default useAiSummary; 