import { ref } from 'vue';

export function useWaveform() {
  // 波形高度数据
  const waveformHeights = ref<number[]>(Array(15).fill(0).map(() => Math.floor(Math.random() * 25) + 5));
  let waveformInterval: number | null = null;

  // 开始波形动画
  const startFallbackWaveform = () => {
    if (waveformInterval) clearInterval(waveformInterval);
    
    waveformInterval = window.setInterval(() => {
      waveformHeights.value = waveformHeights.value.map(() => 
        Math.floor(Math.random() * 25) + 5
      );
    }, 100);
  };

  // 停止波形动画
  const stopFallbackWaveform = () => {
    if (waveformInterval) {
      clearInterval(waveformInterval);
      waveformInterval = null;
    }
  };

  // 清理资源
  const cleanupWaveform = () => {
    stopFallbackWaveform();
  };

  return {
    waveformHeights,
    startFallbackWaveform,
    stopFallbackWaveform,
    cleanupWaveform
  };
} 