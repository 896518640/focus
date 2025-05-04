import { ref, computed } from 'vue';
import type { Ref } from 'vue';

interface UseRecordingControlOptions {
  isTranslating: Ref<boolean>;
  isInitialized: Ref<boolean>;
  isConnected: Ref<boolean>;
  startTranslation: () => Promise<void>;
  pauseTranslation: () => Promise<void>;
  resumeTranslation: () => Promise<void>;
  startTimer: () => void;
  stopTimer: () => void;
  startFallbackWaveform: () => void;
  stopFallbackWaveform: () => void;
}

export function useRecordingControl(options: UseRecordingControlOptions) {
  const {
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
  } = options;

  // 视觉状态
  const isButtonPressing = ref(false);
  const isPaused = ref(false);

  // 麦克风按钮文本显示
  const micButtonLabel = computed(() => {
    if (isTranslating.value) {
      return '录音中';
    } else if (isInitialized.value && isConnected.value) {
      return '已暂停';
    } else {
      return '开始录音';
    }
  });

  // 切换录音状态
  const toggleRecording = async () => {
    // 按钮按压效果
    isButtonPressing.value = true;
    setTimeout(() => {
      isButtonPressing.value = false;
    }, 200);
    
    // 添加触觉反馈 (如果设备支持)
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    if (isTranslating.value) {
      // 正在录音，点击后暂停
      await pauseRecording();
      isPaused.value = true;
    } else if (isInitialized.value) {
      // 已初始化但未录音(可能是暂停后)，恢复录音
      await resumeRecording();
      isPaused.value = false;
    } else {
      // 未初始化，开始新的录音
      await startRecording();
      isPaused.value = false;
    }
  };

  // 开始新的录音
  const startRecording = async () => {
    try {
      await startTranslation();
      startTimer();
      startFallbackWaveform();
    } catch (error) {
      console.error('开始录音失败:', error);
    }
  };

  // 暂停录音
  const pauseRecording = async () => {
    try {
      await pauseTranslation();
      stopTimer();
      stopFallbackWaveform();
    } catch (error) {
      console.error('暂停录音失败:', error);
    }
  };

  // 恢复录音
  const resumeRecording = async () => {
    try {
      await resumeTranslation();
      startTimer();
      startFallbackWaveform();
    } catch (error) {
      console.error('恢复录音失败:', error);
    }
  };

  return {
    isButtonPressing,
    isPaused,
    micButtonLabel,
    toggleRecording,
    startRecording,
    pauseRecording,
    resumeRecording
  };
} 