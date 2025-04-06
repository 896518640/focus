import { ref, computed } from 'vue';
import tingwuService, { TingwuTaskStatus } from '@/common/services/tingwuService';
import { showToast } from 'vant';

/**
 * 转录设置接口
 */
export interface TranscriptionSettings {
  sourceLanguage?: string;
  translation?: string;
  speaker?: string;
  type?: string;
}

/**
 * 音频转录Hook
 * 提供音频文件上传和转录功能
 */
export default function useAudioTranscription() {
  // 转录状态
  const transcribing = ref(false);
  const transcriptionComplete = ref(false);
  const transcriptionProgress = ref(0);
  const transcriptionText = ref('');
  const transcriptionError = ref('');
  const currentTaskId = ref('');
  
  // 轮询定时器
  let pollingTimer: any = null;
  
  // 计算属性：转录状态文本
  const statusText = computed(() => {
    if (transcriptionError.value) return '转录失败';
    if (transcriptionComplete.value) return '转录完成';
    if (transcribing.value) return '转录中';
    return '准备转录';
  });
  
  /**
   * 上传并转录音频文件
   * @param file 音频文件
   * @param settings 转录设置
   * @returns 转录任务ID
   */
  const uploadAndTranscribe = async (file: File, settings?: TranscriptionSettings) => {
    try {
      // 重置状态
      resetTranscription();
      
      // 开始转录
      transcribing.value = true;
      transcriptionProgress.value = 10; // 初始进度
      
      // 默认设置
      const defaultSettings: TranscriptionSettings = {
        sourceLanguage: 'cn',
        type: 'offline'
      };
      
      // 合并设置
      const finalSettings = { ...defaultSettings, ...settings };
      
      console.log('开始转录，使用设置:', finalSettings);
      
      // 上传文件并创建转录任务
      const result = await tingwuService.uploadAndTranscribe(file, finalSettings);
      
      // 保存任务ID
      currentTaskId.value = result.taskId;
      transcriptionProgress.value = 30; // 上传完成进度
      
      // 开始轮询任务状态
      startPolling(result.taskId);
      
      return result.taskId;
    } catch (error: any) {
      console.error('上传并转录音频失败:', error);
      transcriptionError.value = error.message || '上传并转录音频失败';
      transcribing.value = false;
      
      showToast({
        type: 'fail',
        message: error.message || '上传并转录音频失败'
      });
      
      return '';
    }
  };
  
  /**
   * 开始轮询任务状态
   * @param taskId 任务ID
   */
  const startPolling = (taskId: string) => {
    // 清除之前的定时器
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }
    
    // 使用客户端轮询方式
    pollingTimer = setInterval(async () => {
      try {
        // 获取任务信息
        const taskInfo = await tingwuService.getTingwuTaskInfo(taskId);
        
        console.log('轮询任务状态:', taskInfo);
        
        // 更新进度
        if (taskInfo.status === TingwuTaskStatus.SUCCESS || taskInfo.status === TingwuTaskStatus.COMPLETED) {
          transcriptionProgress.value = 100;
          transcriptionComplete.value = true;
          transcribing.value = false;
          
          // 提取转录文本
          if (taskInfo.result) {
            await extractTranscriptionText(taskInfo.result);
          }
          
          // 停止轮询
          clearInterval(pollingTimer);
          pollingTimer = null;
        } else if (taskInfo.status === TingwuTaskStatus.FAILED) {
          transcriptionError.value = taskInfo.errorMessage || '转录失败';
          transcribing.value = false;
          
          // 停止轮询
          clearInterval(pollingTimer);
          pollingTimer = null;
          
          showToast({
            type: 'fail',
            message: '转录失败: ' + transcriptionError.value
          });
        } else {
          // 任务仍在进行中，更新进度
          transcriptionProgress.value = Math.min(90, transcriptionProgress.value + 5);
        }
      } catch (error: any) {
        console.error('获取任务状态失败:', error);
        
        // 显示错误消息
        showToast({
          type: 'fail',
          message: error.message || '获取任务状态失败'
        });
        
        // 停止轮询
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    }, 5000); // 5秒一次轮询
  };
  
  /**
   * 提取转录文本
   * @param result 转录结果
   */
  const extractTranscriptionText = async (result: any) => {
    try {
      // 处理通义听悟返回的JSON URL
      if (result.transcription && typeof result.transcription === 'string' && result.transcription.startsWith('http')) {
        try {
          // 获取JSON文件内容
          const jsonData = await tingwuService.fetchTranscriptionJson(result.transcription);
          console.log('获取到的JSON数据:', jsonData);
          
          // 处理通义听悟特定的转录结果格式
          if (jsonData.Transcription && jsonData.Transcription.Paragraphs && Array.isArray(jsonData.Transcription.Paragraphs)) {
            console.log('检测到通义听悟特定的转录结果格式');
            // 处理通义听悟的段落和单词结构
            const paragraphs = jsonData.Transcription.Paragraphs.map((paragraph: any) => {
              if (paragraph.Words && Array.isArray(paragraph.Words)) {
                // 将每个段落中的单词组合成文本
                return paragraph.Words.map((word: any) => word.Text).join('');
              }
              return '';
            });
            
            // 将所有段落组合成完整文本
            transcriptionText.value = paragraphs.join('\n\n').trim();
            console.log('解析完成，文本长度:', transcriptionText.value.length);
          } 
          // 如果是嵌套在data属性中
          else if (jsonData.data && jsonData.data.Transcription && jsonData.data.Transcription.Paragraphs) {
            console.log('检测到嵌套在data属性中的通义听悟转录结果');
            const paragraphs = jsonData.data.Transcription.Paragraphs.map((paragraph: any) => {
              if (paragraph.Words && Array.isArray(paragraph.Words)) {
                return paragraph.Words.map((word: any) => word.Text).join('');
              }
              return '';
            });
            
            transcriptionText.value = paragraphs.join('\n\n').trim();
            console.log('解析完成，文本长度:', transcriptionText.value.length);
          }
          // 其他格式的处理
          else if (jsonData.sentences && Array.isArray(jsonData.sentences)) {
            // 合并所有句子
            transcriptionText.value = jsonData.sentences
              .map((sentence: any) => sentence.text)
              .join(' ')
              .trim();
          } else if (jsonData.text) {
            transcriptionText.value = jsonData.text;
          } else if (jsonData.Data && jsonData.Data.Result && jsonData.Data.Result.Text) {
            transcriptionText.value = jsonData.Data.Result.Text;
          } else if (jsonData.result && jsonData.result.text) {
            transcriptionText.value = jsonData.result.text;
          } else {
            // 尝试找到文本字段
            const textField = findTextFieldInObject(jsonData);
            if (textField) {
              transcriptionText.value = textField;
            } else {
              console.log('无法解析转录结果，返回JSON字符串');
              transcriptionText.value = JSON.stringify(jsonData);
            }
          }
          
          // 转录成功提示
          if (transcriptionText.value) {
            showToast({
              type: 'success',
              message: '转录完成'
            });
          }
        } catch (jsonError: any) {
          console.error('获取JSON文件内容失败:', jsonError);
          transcriptionError.value = `无法获取转写结果: ${jsonError.message}`;
          
          showToast({
            type: 'fail',
            message: transcriptionError.value
          });
        }
      } else if (result.sentences && Array.isArray(result.sentences)) {
        // 合并所有句子
        transcriptionText.value = result.sentences
          .map((sentence: any) => sentence.text)
          .join(' ')
          .trim();
      } else if (result.text) {
        transcriptionText.value = result.text;
      } else if (typeof result === 'string') {
        transcriptionText.value = result;
      } else {
        transcriptionText.value = JSON.stringify(result);
      }
    } catch (error: any) {
      console.error('提取转写文本失败:', error);
      transcriptionError.value = '无法解析转写结果';
      
      showToast({
        type: 'fail',
        message: transcriptionError.value
      });
    }
  };
  
  /**
   * 递归查找对象中的文本字段
   * @param obj 对象
   * @returns 找到的文本或null
   */
  const findTextFieldInObject = (obj: any): string | null => {
    // 如果是空值或非对象，返回null
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    
    // 先检查常见的文本字段名称
    const commonTextFields = ['text', 'Text', 'content', 'Content', 'transcript', 'Transcript', 'transcription', 'Transcription'];
    
    // 检查对象的直接属性
    for (const field of commonTextFields) {
      if (obj[field] && typeof obj[field] === 'string' && obj[field].length > 0) {
        return obj[field];
      }
    }
    
    // 检查嵌套对象
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        const result = findTextFieldInObject(obj[key]);
        if (result) {
          return result;
        }
      }
    }
    
    // 检查数组
    if (Array.isArray(obj) && obj.length > 0) {
      // 如果是句子数组，尝试合并
      if (obj.some(item => item.text || item.Text)) {
        return obj.map(item => item.text || item.Text).filter(Boolean).join(' ');
      }
      
      // 递归检查数组中的对象
      for (const item of obj) {
        const result = findTextFieldInObject(item);
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  };
  
  /**
   * 重置转录状态
   */
  const resetTranscription = () => {
    transcribing.value = false;
    transcriptionComplete.value = false;
    transcriptionProgress.value = 0;
    transcriptionText.value = '';
    transcriptionError.value = '';
    currentTaskId.value = '';
    
    // 清除定时器
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };
  
  /**
   * 清理资源
   * 在组件卸载时调用
   */
  const cleanup = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };
  
  return {
    // 状态
    transcribing,
    transcriptionComplete,
    transcriptionProgress,
    transcriptionText,
    transcriptionError,
    currentTaskId,
    statusText,
    
    // 方法
    uploadAndTranscribe,
    resetTranscription,
    cleanup
  };
}
