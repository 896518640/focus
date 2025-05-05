<script setup lang="ts">
import { ref, watch } from 'vue';
import { showToast } from 'vant';

// 检查是否为开发环境
const isDev = import.meta.env.DEV;

// 定义属性
const props = defineProps({
  // 是否显示弹窗
  show: {
    type: Boolean,
    default: false
  },
  // 是否正在加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 流式显示内容（用于显示）
  displayedContent: {
    type: String,
    default: ''
  },
  // 完整内容（用于复制）
  content: {
    type: String,
    default: ''
  },
  // 错误信息
  error: {
    type: String,
    default: ''
  },
  // 是否完成流式输出
  isStreamComplete: {
    type: Boolean,
    default: false
  },
  // 进度百分比
  progressPercentage: {
    type: Number,
    default: 0
  }
});

// 定义事件
const emit = defineEmits([
  'update:show',
  'get-summary',
  'copy-summary',
  'close',
  'stop-stream',
  'get-mock',
  'skip-animation'
]);

// 监听show的变化，当弹窗打开时自动调用接口生成总结
watch(() => props.show, (newVal) => {
  if (newVal && !props.content && !props.loading) {
    // 当弹窗打开且没有内容和不在加载中时，自动生成总结
    emit('get-summary');
  }
});

// 处理关闭弹窗
const handleClose = () => {
  emit('update:show', false);
  emit('close');
};

// 复制内容
const copySummary = () => {
  emit('copy-summary');
};

// 点击重新生成总结
const handleRegenerateSummary = () => {
  emit('get-summary');
};

// 停止流式输出
const handleStopStream = () => {
  emit('stop-stream');
};

// 跳过打字机动画，直接显示全部内容
const skipAnimation = () => {
  emit('skip-animation');
};

// 计算圆形进度条样式
const getProgressStyle = () => {
  const circumference = 2 * Math.PI * 20; // 圆周长 = 2πr，r=20
  const percentage = Number(props.progressPercentage || 0);
  const offset = circumference - (percentage / 100) * circumference;
  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: offset
  };
};
</script>

<template>
  <div class="ai-summary-popup" :class="{ 'show': show }">
    <div class="popup-mask" @click="handleClose"></div>
    
    <div class="popup-content" :class="{ 'active': show }">
      <div class="popup-header">
        <div class="popup-title">
          <i class="fas fa-robot"></i>
          <span>AI总结</span>
        </div>
        <button class="close-button" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="popup-body">
        <!-- 加载状态 -->
        <!-- <div v-if="loading && !displayedContent" class="loading-state">
          <div class="spinner"></div>
          <p>AI正在总结中，请稍候...</p>
        </div> -->
        
        <!-- 流式加载进度指示器 -->
        <!-- <div v-if="loading && displayedContent && !isStreamComplete" class="stream-progress">
          <svg class="progress-circle" width="46" height="46" viewBox="0 0 46 46">
            <circle class="progress-circle-bg" cx="23" cy="23" r="20" />
            <circle class="progress-circle-path" cx="23" cy="23" r="20" 
              :style="getProgressStyle()" />
          </svg>
          <span v-if="progressPercentage">{{ progressPercentage }}%</span>
          <button class="stop-stream-button" @click="handleStopStream">
            <i class="fas fa-stop"></i>
          </button>
        </div> -->
        
        <!-- 错误状态 -->
        <div v-if="error" class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ error }}</p>
          <button class="retry-button" @click="handleRegenerateSummary">
            <i class="fas fa-redo-alt"></i>
            <span>重试</span>
          </button>
        </div>
        
        <!-- 内容状态 -->
        <div v-if="!error" class="summary-content" :class="{ 'stream-active': loading && !isStreamComplete }">
          <p class="summary-text" :class="{ 'placeholder-text': !displayedContent && !loading }">
            <span v-if="displayedContent">{{ displayedContent }}</span>
            <span class="cursor" v-if="loading && !isStreamComplete"></span>
            <span v-else-if="!displayedContent && !loading">准备生成总结...</span>
          </p>
          
          <!-- 跳过动画按钮 -->
          <div v-if="loading && displayedContent && !isStreamComplete" class="skip-animation-wrapper">
            <button class="skip-animation-button" @click="skipAnimation">
              <i class="fas fa-forward"></i>
              <span>显示全文</span>
            </button>
          </div>
          
          <div class="action-buttons">
            <button class="action-button" @click="copySummary" :disabled="!content">
              <i class="fas fa-copy"></i>
              <span>复制</span>
            </button>
            <button 
              class="action-button primary-button" 
              @click="loading && !isStreamComplete ? handleStopStream : handleRegenerateSummary"
            >
              <i :class="['fas', loading && !isStreamComplete ? 'fa-stop' : 'fa-sync-alt']"></i>
              <span>{{ loading && !isStreamComplete ? '停止生成' : '重新生成' }}</span>
            </button>
            <!-- 仅在开发环境显示mock按钮 -->
            <button v-if="isDev" class="action-button mock-button" @click="emit('get-mock')">
              <i class="fas fa-vial"></i>
              <span>测试模式</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 底部小横线 -->
      <div class="bottom-indicator"></div>
    </div>
  </div>
</template>

<style scoped>
.ai-summary-popup {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  visibility: hidden;
  pointer-events: none;
}

.ai-summary-popup.show {
  visibility: visible;
  pointer-events: all;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.3s ease;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

.ai-summary-popup.show .popup-mask {
  opacity: 1;
}

.popup-content {
  position: relative;
  width: 100%;
  max-height: 75vh;
  background-color: #FFFFFF;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1001;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.popup-content.active {
  transform: translateY(0);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.popup-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.05), rgba(0,0,0,0.01));
}

.popup-title {
  display: flex;
  align-items: center;
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.popup-title i {
  margin-right: 8px;
  color: #007AFF;
}

.close-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: none;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:active {
  background-color: rgba(142, 142, 147, 0.1);
  transform: scale(0.95);
}

.popup-body {
  padding: 20px;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.loading-state .spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-radius: 50%;
  border-top-color: #007AFF;
  animation: spin 1s infinite linear;
  margin-bottom: 16px;
}

/* 流式进度指示器 */
.stream-progress {
  position: fixed;
  bottom: 115px;
  right: 20px;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 23px;
  padding: 6px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.progress-circle {
  transform: rotate(-90deg);
  width: 46px;
  height: 46px;
}

.progress-circle-bg {
  fill: none;
  stroke: #E5E5EA;
  stroke-width: 3;
}

.progress-circle-path {
  fill: none;
  stroke: #007AFF;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.stream-progress span {
  position: absolute;
  font-size: 12px;
  color: #007AFF;
  font-variant-numeric: tabular-nums;
}

.stop-stream-button {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #FF3B30;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.3);
  transition: all 0.2s ease;
}

.stop-stream-button:active {
  transform: scale(0.95);
  box-shadow: 0 1px 3px rgba(255, 59, 48, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state i {
  font-size: 40px;
  color: #FF3B30;
  margin-bottom: 16px;
  opacity: 0.8;
}

.error-state p, .loading-state p {
  font-size: 15px;
  color: #8E8E93;
  margin-bottom: 16px;
  font-weight: 400;
}

.error-state .retry-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: rgba(0, 122, 255, 0.1);
  border: none;
  color: #007AFF;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-state .retry-button i {
  font-size: 14px;
  margin-right: 6px;
  color: #007AFF;
  margin-bottom: 0;
}

.error-state .retry-button:active {
  background-color: rgba(0, 122, 255, 0.2);
  transform: scale(0.98);
}

.summary-content {
  padding: 5px 0;
}

.summary-content.stream-active .summary-text {
  min-height: 200px;
}

.summary-text {
  font-size: 16px;
  line-height: 1.6;
  color: #000;
  background-color: #F2F2F7;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  font-weight: 400;
  position: relative;
  max-height: 400px !important;
  overflow-y: auto !important;
}

.placeholder-text {
  color: #8E8E93;
  font-style: italic;
}

/* 打字机光标 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #007AFF;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 跳过动画按钮 */
.skip-animation-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.skip-animation-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: rgba(0, 122, 255, 0.1);
  border: none;
  color: #007AFF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-animation-button i {
  margin-right: 4px;
  font-size: 12px;
}

.skip-animation-button:active {
  background-color: rgba(0, 122, 255, 0.2);
  transform: scale(0.95);
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  margin-top: 20px;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  border-radius: 10px;
  background-color: rgba(142, 142, 147, 0.1);
  border: none;
  color: #8E8E93;
  font-weight: 500;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.action-button i {
  font-size: 14px;
}

.action-button:active:not(:disabled) {
  transform: scale(0.98);
  opacity: 0.8;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary-button {
  background-color: #007AFF;
  color: white;
}

.action-button.mock-button {
  background-color: #34C759;
  color: white;
  flex: 0.8;
}

.bottom-indicator {
  height: 5px;
  width: 36px;
  border-radius: 2.5px;
  background-color: #D1D1D6;
  margin: 10px auto;
}
</style> 