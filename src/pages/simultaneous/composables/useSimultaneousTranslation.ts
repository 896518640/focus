import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import { useRealtimeTranslation, type RealtimeTranslationOptions } from '../../../hooks/useRealtimeTranslation';
import { useTimer } from './useTimer';
import { useWaveform } from './useWaveform';
import { useRecordingControl } from './useRecordingControl';
import { useSaveTranslation } from './useSaveTranslation';
import { useTextEffect } from './useTextEffect';
import { showToast, type ToastType } from 'vant';

interface UseSimultaneousTranslationOptions {
  sourceLanguage?: string;
  targetLanguages?: string[];
  autoStart?: boolean;
  typingSpeed?: number; // 打字速度（毫秒/字符）
  minTypingSpeed?: number; // 最小打字速度
  maxTypingSpeed?: number; // 最大打字速度
  characterVariation?: boolean; // 是否启用字符变化的随机速度
  offlineMode?: boolean; // 是否启用离线模式
}

// 定义翻译映射接口
interface TranslationMap {
  [key: string]: string;
}

interface LanguagePhrasesMap {
  [key: string]: TranslationMap;
}

interface CommonPhrasesMap {
  [language: string]: LanguagePhrasesMap;
}

export function useSimultaneousTranslation(options?: UseSimultaneousTranslationOptions) {
  // 创建相关状态
  const liveText = ref('');
  const liveTranslation = ref('');
  
  // 页面状态
  const isPageLeaving = ref(false);
  const isLoading = ref(false);
  const showSettings = ref(false);
  const showTips = ref(false);
  
  // 网络状态
  const isOnline = ref(navigator.onLine);
  const isOfflineMode = ref(options?.offlineMode || false);
  const isNetworkError = ref(false);
  const lastNetworkStatus = ref(navigator.onLine);
  
  // 离线缓存
  const offlineCache = ref<{
    text: string;
    translation: string;
    timestamp: number;
  }[]>([]);
  
  // 监听网络状态变化
  const setupNetworkListeners = () => {
    const handleOnline = () => {
      isOnline.value = true;
      lastNetworkStatus.value = true;
      
      if (isNetworkError.value) {
        showToast({
          message: '网络已恢复，可以继续翻译',
          type: 'success' as ToastType,
          position: 'top'
        });
        isNetworkError.value = false;
      }
    };
    
    const handleOffline = () => {
      isOnline.value = false;
      lastNetworkStatus.value = false;
      
      // 如果正在翻译且不是离线模式，显示网络错误
      if (isTranslating.value && !isOfflineMode.value) {
        isNetworkError.value = true;
        showToast({
          message: '网络连接已断开，将尝试保存当前翻译',
          type: 'warning' as ToastType,
          position: 'top'
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };
  
  // 设置网络监听器
  const cleanupNetworkListeners = setupNetworkListeners();
  
  // 离线缓存相关函数
  const saveToOfflineCache = (text: string, translation: string) => {
    offlineCache.value.push({
      text,
      translation,
      timestamp: Date.now()
    });
    
    // 只保留最近的50条记录
    if (offlineCache.value.length > 50) {
      offlineCache.value = offlineCache.value.slice(-50);
    }
    
    // 保存到localStorage
    try {
      localStorage.setItem('offlineTranslationCache', JSON.stringify(offlineCache.value));
    } catch (error) {
      console.error('保存离线缓存失败:', error);
    }
  };
  
  const loadOfflineCache = () => {
    try {
      const cached = localStorage.getItem('offlineTranslationCache');
      if (cached) {
        offlineCache.value = JSON.parse(cached);
      }
    } catch (error) {
      console.error('加载离线缓存失败:', error);
    }
  };
  
  // 初始化加载离线缓存
  loadOfflineCache();
  
  // 初始化实时翻译Hook
  const {
    isInitialized,
    isConnecting,
    isConnected,
    isTranslating,
    isError,
    errorMessage,
    transcriptionResult,
    translationResult,
    sourceLanguage,
    targetLanguages,
    apiTaskId,
    initializeTask,
    startTranslation: startTranslationOriginal,
    pauseTranslation,
    resumeTranslation,
    stopTranslation,
    clearResults,
    setSourceLanguage,
    setTargetLanguages
  } = useRealtimeTranslation({
    sourceLanguage: options?.sourceLanguage || 'cn',
    targetLanguages: options?.targetLanguages || ['en'],
    autoStart: options?.autoStart || false,
    onTranscriptionResult: (text: string) => {
      liveText.value = text;
      
      // 离线模式下或网络异常时使用本地模拟翻译
      if (!isOnline.value || isOfflineMode.value) {
        // 简单的模拟翻译功能（实际场景可能需要更复杂的离线翻译逻辑或预先下载的翻译模型）
        const mockTranslation = simulateOfflineTranslation(text, sourceLanguage.value, targetLanguages.value[0]);
        liveTranslation.value = mockTranslation;
        
        // 保存到离线缓存
        saveToOfflineCache(text, mockTranslation);
      }
    },
    onTranslationResult: (text: string) => {
      liveTranslation.value = text;
      
      // 在线模式下，也保存到离线缓存以便稍后访问
      if (isOnline.value && !isOfflineMode.value && liveText.value) {
        saveToOfflineCache(liveText.value, text);
      }
    }
  } as RealtimeTranslationOptions);
  
  // 简易的离线模拟翻译函数（仅作示例，实际项目中应使用更复杂的逻辑）
  const simulateOfflineTranslation = (text: string, from: string, to: string): string => {
    if (!text) return '';
    
    // 非常简单的模拟，仅作示例
    // 实际项目中可以考虑:
    // 1. 使用预先下载的小型翻译模型
    // 2. 使用已缓存的翻译对来匹配相似文本
    // 3. 对常用词组预先翻译并存储
    
    const commonPhrases: CommonPhrasesMap = {
      'cn': {
        '你好': { 'en': 'Hello', 'ja': 'こんにちは', 'ko': '안녕하세요' },
        '谢谢': { 'en': 'Thank you', 'ja': 'ありがとう', 'ko': '감사합니다' },
        '再见': { 'en': 'Goodbye', 'ja': 'さようなら', 'ko': '안녕히 가세요' }
      },
      'en': {
        'Hello': { 'cn': '你好', 'ja': 'こんにちは', 'ko': '안녕하세요' },
        'Thank you': { 'cn': '谢谢', 'ja': 'ありがとう', 'ko': '감사합니다' },
        'Goodbye': { 'cn': '再见', 'ja': 'さようなら', 'ko': '안녕히 가세요' }
      }
    };
    
    // 检查是否有匹配的常用短语
    for (const phrase in commonPhrases[from]) {
      if (text.includes(phrase) && commonPhrases[from][phrase][to]) {
        return text.replace(phrase, commonPhrases[from][phrase][to]);
      }
    }
    
    // 没有匹配的短语时，添加离线模式提示
    return `[离线模式] ${text}`;
  };
  
  // 初始化文本特效
  const {
    displayedSource,
    displayedTranslation,
    showFullText,
    cleanup: cleanupTextEffect
  } = useTextEffect({
    sourceText: liveText,
    translatedText: liveTranslation,
    speed: options?.typingSpeed || 15, // 默认打字速度
    minSpeed: options?.minTypingSpeed || 10,
    maxSpeed: options?.maxTypingSpeed || 25,
    characterVariation: options?.characterVariation !== false // 默认启用字符变化的随机速度
  });
  
  // 初始化timer
  const {
    recordingDuration,
    timeDisplay,
    startTimer,
    stopTimer,
    resetTimer,
    cleanupTimer
  } = useTimer();
  
  // 初始化波形
  const {
    waveformHeights,
    startFallbackWaveform,
    stopFallbackWaveform,
    cleanupWaveform
  } = useWaveform();
  
  // 重写startTranslation以支持离线模式
  const startTranslation = async (): Promise<void> => {
    if (isOfflineMode.value || !isOnline.value) {
      // 离线模式下直接开始录音但不连接API
      console.log('以离线模式开始翻译');
      // 返回一个已解决的Promise，保持类型一致
      return Promise.resolve();
    } else {
      // 在线模式下使用原始函数
      return startTranslationOriginal();
    }
  };
  
  // 初始化录音控制
  const {
    isButtonPressing,
    isPaused,
    micButtonLabel,
    toggleRecording,
    startRecording,
    pauseRecording,
    resumeRecording
  } = useRecordingControl({
    isTranslating,
    isInitialized,
    isConnected,
    startTranslation,
    pauseTranslation,
    resumeTranslation,
    startTimer,
    stopTimer,
    startFallbackWaveform,
    stopFallbackWaveform
  });
  
  // 初始化保存翻译
  const {
    isSaving,
    saveTranslation
  } = useSaveTranslation({
    sourceLanguage,
    targetLanguages,
    transcriptionResult,
    translationResult,
    recordingDuration,
    apiTaskId,
    isTranslating,
    stopTranslation,
    initializeTask,
    startTranslation,
    resetTimer
  });
  
  // 语言选择计算属性
  const localSourceLanguage = computed({
    get: () => sourceLanguage.value,
    set: (value) => handleSourceLanguageChange(value)
  });
  
  const localTargetLanguage = computed({
    get: () => targetLanguages.value[0] || 'en',
    set: (value) => handleTargetLanguageChange(value)
  });
  
  // 监听翻译结果变化，自动滚动到底部
  watch(() => [displayedSource.value, displayedTranslation.value], () => {
    // 延迟一帧，确保DOM更新后再滚动
    requestAnimationFrame(() => {
      const textElements = document.querySelectorAll('.source-text, .translated-text');
      textElements.forEach(el => {
        if (el instanceof HTMLElement) {
          // 使用平滑滚动API
          el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    });
  }, { deep: true });
  
  // 处理语言变化
  const handleSourceLanguageChange = (newLang: string) => {
    setSourceLanguage(newLang);
  };
  
  const handleTargetLanguageChange = (newLang: string) => {
    setTargetLanguages([newLang]);
  };
  
  // 设置多目标语言
  const handleMultiTargetLanguagesChange = (languages: string[]) => {
    if (languages && languages.length > 0) {
      setTargetLanguages(languages);
    }
  };
  
  // 切换离线模式
  const toggleOfflineMode = (value?: boolean) => {
    isOfflineMode.value = value !== undefined ? value : !isOfflineMode.value;
    
    showToast({
      message: isOfflineMode.value ? '已启用离线模式' : '已切换为在线模式',
      position: 'bottom'
    });
    
    // 如果正在翻译，需要重新启动
    if (isTranslating.value) {
      stopTranslation();
      setTimeout(() => {
        startTranslation();
      }, 500);
    }
  };
  
  // 切换提示显示
  const toggleTips = () => {
    showTips.value = !showTips.value;
  };
  
  // 切换设置弹窗
  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
  };
  
  // 清理资源函数
  const cleanup = () => {
    // 停止翻译服务
    stopTranslation();
    
    // 清理定时器和波形资源
    cleanupTimer();
    cleanupWaveform();
    cleanupTextEffect();
    cleanupNetworkListeners();
  };
  
  return {
    // 状态
    liveText,
    liveTranslation,
    isPageLeaving,
    isLoading,
    showSettings,
    showTips,
    isTranslating,
    isInitialized,
    isConnecting,
    isConnected,
    isError,
    errorMessage,
    isPaused,
    isSaving,
    isButtonPressing,
    
    // 网络状态
    isOnline,
    isOfflineMode,
    isNetworkError,
    
    // 离线缓存
    offlineCache,
    
    // 数据
    waveformHeights,
    recordingDuration,
    timeDisplay,
    transcriptionResult,
    translationResult,
    micButtonLabel,
    localSourceLanguage,
    localTargetLanguage,
    
    // 打字机效果数据
    displayedSource,
    displayedTranslation,
    showFullText,
    
    // 方法
    toggleRecording,
    startRecording,
    pauseRecording,
    resumeRecording,
    toggleTips,
    toggleSettings,
    saveTranslation,
    cleanup,
    handleSourceLanguageChange,
    handleTargetLanguageChange,
    handleMultiTargetLanguagesChange,
    toggleOfflineMode,
    saveToOfflineCache,
    loadOfflineCache
  };
} 