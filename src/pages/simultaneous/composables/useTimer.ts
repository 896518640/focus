import { ref, computed } from 'vue';
import type { Ref } from 'vue';

export function useTimer() {
  // 记录时长（秒）
  const recordingDuration = ref(0);
  let durationInterval: number | null = null;

  // 格式化时间显示
  const timeDisplay = computed(() => {
    const minutes = Math.floor(recordingDuration.value / 60);
    const seconds = recordingDuration.value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  // 开始计时器
  const startTimer = () => {
    if (durationInterval) clearInterval(durationInterval);
    
    durationInterval = window.setInterval(() => {
      recordingDuration.value++;
    }, 1000);
  };

  // 停止计时器
  const stopTimer = () => {
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  };

  // 重置计时器
  const resetTimer = () => {
    stopTimer();
    recordingDuration.value = 0;
  };

  // 清理资源
  const cleanupTimer = () => {
    stopTimer();
  };

  return {
    recordingDuration,
    timeDisplay,
    startTimer,
    stopTimer,
    resetTimer,
    cleanupTimer
  };
} 