<template>
  <transition name="fade">
    <div class="floating-controls" v-if="isRecording">
      <div class="recording-time">
        <van-circle 
          :current="seconds"
          :rate="100" 
          :speed="100" 
          :size="circleSize" 
          :stroke-width="3"
          :color="circleColor"
          layer-color="rgba(255, 255, 255, 0.2)"
        >
          {{ seconds }}s
        </van-circle>
      </div>
      <van-button round :type="buttonType" size="small" @click="handleStop">
        {{ buttonText }}
      </van-button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ButtonType } from 'vant';

// 定义组件属性
const props = defineProps({
  isRecording: {
    type: Boolean,
    required: true
  },
  seconds: {
    type: Number,
    required: true
  },
  circleSize: {
    type: String,
    default: '40px'
  },
  circleColor: {
    type: String,
    default: '#ef4444'
  },
  buttonType: {
    type: String as () => ButtonType,
    default: 'danger'
  },
  buttonText: {
    type: String,
    default: '停止录音'
  }
});

// 定义组件事件
const emit = defineEmits(['stop-recording']);

// 处理停止录音
const handleStop = () => {
  emit('stop-recording');
};
</script>

<style lang="less" scoped>
.floating-controls {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-radius: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.recording-time {
  font-size: 12px;
  color: #ef4444;
  font-weight: 600;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 480px) {
  .floating-controls {
    bottom: 16px;
    right: 16px;
    padding: 8px 12px;
  }
}
</style> 