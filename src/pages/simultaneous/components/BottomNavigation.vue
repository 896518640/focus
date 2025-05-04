<script setup lang="ts">
defineProps({
  isRecording: {
    type: Boolean,
    default: false
  },
  isButtonPressing: {
    type: Boolean,
    default: false
  },
  isPaused: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggleRecording', 'toggleSettings']);
</script>

<template>
  <div class="bottom-bar">
    <button class="bottom-button ripple-effect">
      <i class="fas fa-closed-captioning"></i>
      <span>悬浮字幕</span>
    </button>
    
    <button class="bottom-button ripple-effect">
      <i class="fas fa-save"></i>
      <span>保存</span>
    </button>
    
    <button 
      class="mic-button" 
      @click="$emit('toggleRecording')"
      :class="{ 
        'recording': isRecording, 
        'paused': isPaused && !isRecording,
        'pressing': isButtonPressing 
      }"
      :data-status="isRecording ? '录音中' : isPaused ? '已暂停' : '开始录音'"
    >
      <i :class="['fas', isRecording ? 'fa-microphone' : isPaused ? 'fa-play' : 'fa-microphone-slash']"></i>
    </button>
    
    <button class="bottom-button ripple-effect" @click="$emit('toggleSettings')">
      <i class="fas fa-cog"></i>
      <span>同传设置</span>
    </button>
    
    <button class="bottom-button ripple-effect">
      <i class="fas fa-magic"></i>
      <span>AI总结</span>
    </button>
  </div>
</template>

<style scoped>
.bottom-bar {
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
  background-color: #FFFFFF;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.bottom-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 12px;
  gap: 5px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}

.bottom-button i {
  font-size: 24px;
  transition: transform 0.2s ease, color 0.3s ease;
}

.bottom-button:active i {
  transform: scale(0.92);
}

.bottom-button:active {
  color: #4169E1;
}

.bottom-button.active {
  color: #4169E1;
}

/* 波纹效果 */
.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect::after {
  content: "";
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, #000 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform .3s, opacity .5s;
}

.ripple-effect:active::after {
  transform: scale(0, 0);
  opacity: 0.1;
  transition: 0s;
}

.mic-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #FF3B30;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  margin-top: -30px;
  position: relative;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

.mic-button::after {
  content: attr(data-status);
  position: absolute;
  bottom: -20px;
  font-size: 12px;
  color: #8E8E93;
  white-space: nowrap;
}

.mic-button:active, .mic-button.pressing {
  transform: scale(0.92);
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.2);
}

.mic-button.recording {
  animation: pulse 1.5s infinite;
}

.mic-button.paused {
  background-color: #4169E1;
  box-shadow: 0 4px 12px rgba(65, 105, 225, 0.3);
}

.mic-button.paused:active {
  box-shadow: 0 2px 6px rgba(65, 105, 225, 0.2);
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(255, 59, 48, 0.5);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
  }
}
</style> 