<script setup lang="ts">
import { ref, computed } from 'vue';

// 组件Props定义
const props = defineProps<{
  transcribing: boolean;
  transcriptionComplete: boolean;
  transcriptionProgress: number;
  transcriptionText: string;
  transcriptionError: string | null;
  statusText: string;
}>();

// 组件事件
const emit = defineEmits(['retry', 'copy', 'share']);

// 复制转录文本
const copyTranscriptionText = () => {
  emit('copy');
};

// 分享转录文本
const shareTranscriptionText = () => {
  emit('share');
};

// 重试转录
const retryTranscription = () => {
  emit('retry');
};

// 计算截断后的文本预览（最多显示150个字符）
const previewText = computed(() => {
  if (props.transcriptionText.length > 150) {
    return props.transcriptionText.substring(0, 150) + '...';
  }
  return props.transcriptionText;
});

// 是否显示完整文本
const showFullText = ref(false);

// 切换显示完整文本
const toggleFullText = () => {
  showFullText.value = !showFullText.value;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(3);
  }
};

// 动画进度值
const animatedProgress = ref(0);

// 使用requestAnimationFrame来实现平滑进度条
function animateProgress() {
  if (animatedProgress.value < props.transcriptionProgress) {
    const diff = props.transcriptionProgress - animatedProgress.value;
    const increment = Math.min(1, diff / 10); // 平滑增量
    animatedProgress.value += increment;
    requestAnimationFrame(animateProgress);
  }
}

// 监听进度变化并进行动画
if (props.transcribing) {
  animateProgress();
}
</script>

<template>
  <div class="ios-transcription-wrapper">
    <!-- 转录中状态 - iOS风格 -->
    <div v-if="transcribing" class="ios-transcription-status">
      <div class="ios-card">
        <div class="ios-status-header">
          <div class="ios-status-icon-container">
            <div class="ios-status-icon">
              <i class="fas fa-waveform"></i>
            </div>
          </div>
          <div class="ios-status-text">
            <div class="ios-status-title">正在转录</div>
            <div class="ios-status-subtitle">正在处理您的音频</div>
          </div>
        </div>
        
        <div class="ios-progress-container">
          <div class="ios-progress-bar">
            <div class="ios-progress-value" :style="{ width: animatedProgress + '%' }"></div>
          </div>
          <div class="ios-progress-details">
            <div class="ios-progress-percentage">{{ Math.round(animatedProgress) }}%</div>
            <div class="ios-progress-status">请稍候片刻...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 转录结果 - iOS风格 -->
    <div v-if="transcriptionComplete && transcriptionText" class="ios-transcription-result">
      <div class="ios-card">
        <div class="ios-result-header">
          <div class="ios-result-icon-wrapper">
            <div class="ios-result-icon">
              <i class="fas fa-check"></i>
            </div>
          </div>
          <div class="ios-result-info">
            <div class="ios-result-title">转录完成</div>
            <div class="ios-result-badge">{{ statusText }}</div>
          </div>
        </div>
        
        <div class="ios-result-content">
          <div class="ios-result-text" :class="{ 'truncated': !showFullText && transcriptionText.length > 150 }">
            {{ showFullText ? transcriptionText : previewText }}
          </div>
          
          <div v-if="transcriptionText.length > 150" class="ios-result-expand" @click="toggleFullText">
            {{ showFullText ? '收起' : '显示更多' }}
          </div>
        </div>
        
        <div class="ios-result-actions">
          <button class="ios-action-button" @click="copyTranscriptionText">
            <div class="ios-action-icon">
              <i class="fas fa-copy"></i>
            </div>
            <span>复制</span>
          </button>
          <div class="ios-action-divider"></div>
          <button class="ios-action-button" @click="shareTranscriptionText">
            <div class="ios-action-icon">
              <i class="fas fa-share-alt"></i>
            </div>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 转录错误 - iOS风格 -->
    <div v-if="transcriptionError" class="ios-transcription-error">
      <div class="ios-card">
        <div class="ios-error-header">
          <div class="ios-error-icon-wrapper">
            <div class="ios-error-icon">
              <i class="fas fa-exclamation"></i>
            </div>
          </div>
          <div class="ios-error-info">
            <div class="ios-error-title">转录失败</div>
            <div class="ios-error-subtitle">处理您的音频时出现问题</div>
          </div>
        </div>
        
        <div class="ios-error-content">
          <div class="ios-error-message">{{ transcriptionError }}</div>
        </div>
        
        <div class="ios-error-actions">
          <button class="ios-retry-button" @click="retryTranscription">
            <i class="fas fa-redo-alt"></i>
            <span>重试</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ios-transcription-wrapper {
  padding: 8px 0;
}

.ios-card {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  margin-bottom: 16px;
  animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: center bottom;
}

/* 转录中状态样式 */
.ios-transcription-status {
  margin: 16px 0;
}

.ios-status-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

.ios-status-icon-container {
  position: relative;
  margin-right: 12px;
}

.ios-status-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34C759, #30D158);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
  position: relative;
  z-index: 1;
  animation: pulse 2s infinite;
}

.ios-status-icon::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: rgba(52, 199, 89, 0.15);
  border-radius: 50%;
  z-index: -1;
  animation: ripple 2s infinite;
}

.ios-status-text {
  flex: 1;
}

.ios-status-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 2px;
}

.ios-status-subtitle {
  font-size: 14px;
  color: #8E8E93;
}

.ios-progress-container {
  padding: 0 16px 16px;
}

.ios-progress-bar {
  height: 6px;
  background-color: #E9E9EB;
  border-radius: 3px;
  overflow: hidden;
  margin: 12px 0;
}

.ios-progress-value {
  height: 100%;
  background: linear-gradient(to right, #34C759, #30D158);
  border-radius: 3px;
  transition: width 0.2s linear;
  position: relative;
}

.ios-progress-value::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(255,255,255,0) 0%, 
    rgba(255,255,255,0.4) 50%, 
    rgba(255,255,255,0) 100%);
  animation: shimmer 1.5s infinite;
}

.ios-progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ios-progress-percentage {
  font-size: 14px;
  font-weight: 500;
  color: #34C759;
}

.ios-progress-status {
  font-size: 14px;
  color: #8E8E93;
}

/* 转录结果样式 */
.ios-transcription-result {
  margin: 16px 0;
}

.ios-result-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

.ios-result-icon-wrapper {
  position: relative;
  margin-right: 12px;
}

.ios-result-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34C759, #30D158);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.2);
}

.ios-result-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ios-result-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.ios-result-badge {
  font-size: 12px;
  color: #34C759;
  background-color: rgba(52, 199, 89, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.ios-result-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.ios-result-text {
  font-size: 15px;
  line-height: 1.5;
  color: #000000;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.ios-result-text.truncated {
  position: relative;
}

.ios-result-text.truncated::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1));
  pointer-events: none;
}

.ios-result-expand {
  font-size: 14px;
  color: #007AFF;
  padding: 4px 0;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  transition: opacity 0.2s;
}

.ios-result-expand:active {
  opacity: 0.7;
}

.ios-result-actions {
  display: flex;
  border-top: 0.5px solid rgba(0, 0, 0, 0.05);
  height: 50px;
}

.ios-action-button {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ios-action-divider {
  width: 0.5px;
  height: 60%;
  background-color: rgba(0, 0, 0, 0.05);
  align-self: center;
}

.ios-action-button:active {
  background-color: rgba(0, 122, 255, 0.05);
}

.ios-action-icon {
  margin-right: 6px;
  font-size: 14px;
}

/* 转录错误样式 */
.ios-transcription-error {
  margin: 16px 0;
}

.ios-error-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 0.5px solid rgba(255, 59, 48, 0.1);
}

.ios-error-icon-wrapper {
  position: relative;
  margin-right: 12px;
}

.ios-error-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF3B30, #FF453A);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
}

.ios-error-info {
  flex: 1;
}

.ios-error-title {
  font-size: 17px;
  font-weight: 600;
  color: #FF3B30;
  margin-bottom: 2px;
}

.ios-error-subtitle {
  font-size: 14px;
  color: #8E8E93;
}

.ios-error-content {
  padding: 16px;
}

.ios-error-message {
  font-size: 15px;
  line-height: 1.5;
  color: #000000;
  margin-bottom: 16px;
}

.ios-error-actions {
  padding: 0 16px 16px;
  display: flex;
  justify-content: center;
}

.ios-retry-button {
  background-color: #FF3B30;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
}

.ios-retry-button:active {
  transform: scale(0.96);
  opacity: 0.9;
  box-shadow: 0 1px 4px rgba(255, 59, 48, 0.2);
}

.ios-retry-button i {
  margin-right: 6px;
  font-size: 14px;
}

/* 动画 */
@keyframes slideUp {
  0% { 
    opacity: 0; 
    transform: translateY(20px) scale(0.98);
  }
  100% { 
    opacity: 1; 
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
