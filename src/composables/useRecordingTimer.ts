import { ref, onUnmounted } from 'vue';

/**
 * 提供录音计时器功能的组合式函数
 */
export function useRecordingTimer() {
  // 记录秒数
  const seconds = ref(0);
  // 计时器引用
  let timerInterval: number | null = null;

  /**
   * 开始计时
   */
  const startTimer = () => {
    // 确保先停止之前的计时器
    stopTimer();
    
    // 重置秒数
    seconds.value = 0;
    
    // 开始新的计时器
    timerInterval = window.setInterval(() => {
      seconds.value++;
    }, 1000);
  };

  /**
   * 停止计时
   */
  const stopTimer = () => {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  /**
   * 重置计时器
   */
  const resetTimer = () => {
    stopTimer();
    seconds.value = 0;
  };

  /**
   * 格式化时间为 MM:SS 格式
   */
  const formattedTime = () => {
    const minutes = Math.floor(seconds.value / 60);
    const remainingSeconds = seconds.value % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 组件卸载时清理计时器
  onUnmounted(() => {
    stopTimer();
  });

  return {
    seconds,
    startTimer,
    stopTimer,
    resetTimer,
    formattedTime
  };
} 