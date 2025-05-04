<script setup lang="ts">
import { ref, watch } from 'vue';

// 组件Props定义
const props = defineProps<{
  fileName: string;
  fileType: string;
  fileSize: string;
  totalSize: string;
  progress: number;
  estimatedTime: string;
}>();

// 组件事件
const emit = defineEmits(['cancel']);

// 取消上传
const cancelUpload = () => {
  emit('cancel');
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 5, 10]);
  }
};

// 进度条动画效果
const animatedProgress = ref(0);

// 监控进度变化，平滑动画效果
watch(() => props.progress, (newProgress) => {
  // 使用requestAnimationFrame实现平滑动画
  const animate = () => {
    if (animatedProgress.value < newProgress) {
      animatedProgress.value += Math.min(2, newProgress - animatedProgress.value);
      requestAnimationFrame(animate);
    }
  };
  animate();
}, { immediate: true });
</script>

<template>
  <div class="upload-progress">
    <div class="progress-header">
      <div class="progress-title">上传中</div>
      <button class="file-action-btn" @click="cancelUpload">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="progress-item">
      <div class="progress-icon">
        <i class="fas fa-file-audio"></i>
      </div>
      <div class="progress-content">
        <div class="progress-info">
          <div class="progress-file">{{ fileName }}</div>
          <div class="progress-type">{{ fileType }}</div>
        </div>
        <div class="progress-details">
          <div class="progress-status">{{ fileSize }}</div>
          <div class="progress-time" v-if="estimatedTime">剩余时间: {{ estimatedTime }}</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: animatedProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-progress {
  width: 100%;
  animation: slideIn 0.3s ease;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.file-action-btn {
  color: var(--text-secondary, #8E8E93);
  background: none;
  border: none;
  font-size: 16px;
  padding: 5px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-action-btn:active {
  transform: scale(0.9);
  opacity: 0.7;
  background-color: rgba(142, 142, 147, 0.1);
}

.progress-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  animation: fadeInUp 0.5s ease;
}

.progress-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 18px;
  color: white;
  background-color: var(--primary-color, #007AFF);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.progress-content {
  flex: 1;
}

.progress-info {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.progress-file {
  font-size: 16px;
  margin-right: 10px;
  color: var(--text-primary, #000000);
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-type {
  font-size: 12px;
  color: var(--text-secondary, #8E8E93);
  background-color: var(--background-color, #F2F2F7);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.progress-details {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.progress-status {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
  margin-right: 10px;
}

.progress-time {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
  background-color: var(--background-color, #F2F2F7);
  padding: 2px 6px;
  border-radius: 4px;
  animation: fadeIn 0.5s ease;
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background-color: var(--background-color, #F2F2F7);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background: linear-gradient(to right, var(--primary-color, #007AFF), #5AC8FA);
  border-radius: 3px;
  transition: width 0.2s linear;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
