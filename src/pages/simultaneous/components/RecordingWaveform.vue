<script setup lang="ts">
defineProps({
  waveformHeights: {
    type: Array as () => number[],
    default: () => []
  },
  isPaused: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div class="waveform-container" :class="{ 'paused': isPaused }">
    <div class="waveform" :class="{ 'active': !isPaused }">
      <div 
        v-for="(height, index) in waveformHeights" 
        :key="index" 
        class="wave-bar" 
        :style="{ height: height + 'px' }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.waveform-container {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  opacity: 1; /* 确保波形容器显示 */
}

.waveform {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 60px;
  width: 200px;
}

.waveform.active .wave-bar {
  animation: wave-pulse 1.2s infinite ease-in-out;
}

.wave-bar {
  width: 4px;
  background-color: #4169E1;
  border-radius: 2px;
  transition: height 0.1s ease, opacity 0.3s ease;
}

.waveform-container.paused .wave-bar {
  opacity: 0.5;
  animation: none !important;
}

@keyframes wave-pulse {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.85);
  }
}

/* 让每个波形条有不同的动画延迟 */
.wave-bar:nth-child(2n) {
  animation-delay: 0.2s !important;
}

.wave-bar:nth-child(3n) {
  animation-delay: 0.4s !important;
}

.wave-bar:nth-child(4n) {
  animation-delay: 0.6s !important;
}

.wave-bar:nth-child(5n) {
  animation-delay: 0.8s !important;
}
</style> 