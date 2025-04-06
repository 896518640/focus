\<script setup lang="ts">
/**
 * 转录结果卡片组件
 * 基于iOS设计规范的独立转录结果展示卡片
 */
import { computed } from 'vue';
import { vibrate } from '@/utils/fileUtils';

// 组件属性
const props = defineProps({
  transcribing: {
    type: Boolean,
    default: false
  },
  transcriptionComplete: {
    type: Boolean,
    default: false
  },
  transcriptionProgress: {
    type: Number,
    default: 0
  },
  transcriptionText: {
    type: String,
    default: ''
  },
  transcriptionError: {
    type: String,
    default: ''
  },
  statusText: {
    type: String,
    default: '准备转录...'
  }
});

// 组件事件
const emit = defineEmits(['retry', 'copy', 'share']);

// 计算属性
const statusClass = computed(() => {
  if (props.transcriptionError) return 'error';
  if (props.transcriptionComplete) return 'success';
  if (props.transcribing) return 'processing';
  return '';
});

// 状态图标
const statusIcon = computed(() => {
  if (props.transcriptionError) return 'fa-exclamation-circle';
  if (props.transcriptionComplete) return 'fa-check-circle';
  if (props.transcribing) return 'fa-circle-notch fa-spin';
  return 'fa-circle-notch';
});

// 复制文本
const handleCopy = () => {
  vibrate(5);
  emit('copy');
};

// 分享文本
const handleShare = () => {
  vibrate(5);
  emit('share');
};

// 重试转录
const handleRetry = () => {
  vibrate([10, 20, 10]);
  emit('retry');
};
</script>

<template>
  <div class="transcription-card" :class="statusClass">
    <!-- 转录状态头部 -->
    <div class="card-header">
      <div class="status-icon">
        <i :class="['fas', statusIcon]"></i>
      </div>
      <div class="status-info">
        <div class="status-title">
          {{ transcriptionComplete ? '转录完成' : transcriptionError ? '转录失败' : '转录中...' }}
        </div>
        <div class="status-desc">{{ statusText }}</div>
      </div>
      <div v-if="transcribing && !transcriptionComplete && !transcriptionError" class="progress-indicator">
        {{ Math.round(transcriptionProgress) }}%
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="transcribing && !transcriptionComplete && !transcriptionError" class="progress-bar-container">
      <div class="progress-bar" :style="{ width: `${transcriptionProgress}%` }"></div>
    </div>

    <!-- 转录内容 -->
    <div v-if="transcriptionComplete && transcriptionText" class="transcription-content">
      <div class="text-content">{{ transcriptionText }}</div>
    </div>

    <!-- 错误信息 -->
    <div v-if="transcriptionError" class="error-message">
      <div class="error-text">{{ transcriptionError }}</div>
    </div>

    <!-- 操作按钮区 -->
    <div class="action-buttons" v-if="transcriptionComplete || transcriptionError">
      <template v-if="transcriptionComplete">
        <button class="action-button copy-button" @click="handleCopy">
          <i class="fas fa-copy"></i>
          <span>复制</span>
        </button>
        <button class="action-button share-button" @click="handleShare">
          <i class="fas fa-share-alt"></i>
          <span>分享</span>
        </button>
      </template>
      <button v-if="transcriptionError" class="action-button retry-button" @click="handleRetry">
        <i class="fas fa-redo"></i>
        <span>重试</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.transcription-card {
  background-color: var(--background-light, #FFFFFF);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.3s ease;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.transcription-card.success {
  border-left: 4px solid var(--success-color, #4CD964);
}

.transcription-card.error {
  border-left: 4px solid var(--accent-color, #FF2D55);
}

.transcription-card.processing {
  border-left: 4px solid var(--primary-color, #007AFF);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.status-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
}

.success .status-icon {
  color: var(--success-color, #4CD964);
}

.error .status-icon {
  color: var(--accent-color, #FF2D55);
}

.processing .status-icon {
  color: var(--primary-color, #007AFF);
}

.status-info {
  flex: 1;
}

.status-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 2px;
  color: var(--text-primary, #000000);
}

.status-desc {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
}

.progress-indicator {
  font-weight: 600;
  font-size: 15px;
  color: var(--primary-color, #007AFF);
}

.progress-bar-container {
  height: 4px;
  background-color: var(--background-secondary, #F2F2F7);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background-color: var(--primary-color, #007AFF);
  transition: width 0.3s ease;
}

.transcription-content {
  background-color: var(--background-secondary, #F2F2F7);
  border-radius: 10px;
  padding: 16px;
  margin: 12px 0;
  max-height: 200px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.text-content {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary, #000000);
  white-space: pre-wrap;
}

.error-message {
  background-color: rgba(255, 45, 85, 0.1);
  border-radius: 10px;
  padding: 12px;
  margin: 12px 0;
}

.error-text {
  font-size: 14px;
  color: var(--accent-color, #FF2D55);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button i {
  margin-right: 6px;
  font-size: 14px;
}

.action-button:active {
  transform: scale(0.95);
}

.copy-button {
  background-color: var(--background-secondary, #F2F2F7);
  color: var(--text-primary, #000000);
}

.share-button {
  background-color: var(--primary-color, #007AFF);
  color: white;
}

.retry-button {
  background-color: var(--accent-color, #FF2D55);
  color: white;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 375px) {
  .transcription-card {
    padding: 14px;
  }
  
  .status-title {
    font-size: 15px;
  }
  
  .status-desc {
    font-size: 12px;
  }
}
</style>
