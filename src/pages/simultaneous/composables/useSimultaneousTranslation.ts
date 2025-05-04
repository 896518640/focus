import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import { useRealtimeTranslation, type RealtimeTranslationOptions } from '../../../hooks/useRealtimeTranslation';
import { useTimer } from './useTimer';
import { useWaveform } from './useWaveform';
import { useRecordingControl } from './useRecordingControl';
import { useSaveTranslation } from './useSaveTranslation';
import { useTextEffect } from './useTextEffect';

interface UseSimultaneousTranslationOptions {
  sourceLanguage?: string;
  targetLanguages?: string[];
  autoStart?: boolean;
  typingSpeed?: number; // 打字速度（毫秒/字符）
  minTypingSpeed?: number; // 最小打字速度
  maxTypingSpeed?: number; // 最大打字速度
  characterVariation?: boolean; // 是否启用字符变化的随机速度
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
    },
    onTranslationResult: (text: string) => {
      liveTranslation.value = text;
    }
  } as RealtimeTranslationOptions);
  
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
    startTranslation: startTranslationOriginal,
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
    startTranslation: startTranslationOriginal,
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
    handleTargetLanguageChange
  };
} 