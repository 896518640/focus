<script setup lang="ts">
/**
 * 转录结果卡片组件
 * 基于iOS设计规范的独立转录结果展示卡片
 */
import { computed, ref, watch } from 'vue';
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
  translationText: {
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

// 显示模式：原文或翻译
const showTranslation = ref(false); // 默认显示原文，只有当检测到翻译文本时才切换

// 计算属性：是否有翻译可用
const hasTranslation = computed(() => {
  console.log('翻译文本:', props.translationText);
  const hasTranslationText = typeof props.translationText === 'string' && props.translationText !== '';
  console.log('是否有翻译可用:', hasTranslationText);
  return hasTranslationText;
});

// 监听翻译文本变化，如果有翻译文本，则自动切换到翻译模式
watch(() => props.translationText, (newVal) => {
  console.log('翻译文本变化:', newVal);
  if (typeof newVal === 'string' && newVal !== '') {
    console.log('检测到翻译文本，切换到翻译模式');
    showTranslation.value = true;
  }
}, { immediate: true });

// 计算属性：当前显示的文本
const displayText = computed(() => {
  // 如果选择显示翻译且有翻译文本，则显示翻译
  if (showTranslation.value && hasTranslation.value) {
    console.log('显示翻译文本');
    return props.translationText;
  }
  // 否则显示原文
  console.log('显示原文文本');
  return props.transcriptionText;
});

// 切换显示模式
const toggleDisplayMode = () => {
  showTranslation.value = !showTranslation.value;
  console.log('切换显示模式:', showTranslation.value ? '翻译' : '原文');
  vibrate(3);
};

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
  // 复制当前显示的文本（原文或翻译）
  emit('copy', displayText.value);
};

// 分享文本
const handleShare = () => {
  vibrate(5);
  // 分享当前显示的文本（原文或翻译）
  emit('share', displayText.value);
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

    <!-- 翻译/原文切换按钮 -->
    <div v-if="transcriptionComplete && hasTranslation" class="translation-toggle-container">
      <div class="translation-status">
        <span v-if="showTranslation" class="translation-badge">
          <i class="fas fa-language"></i> 翻译模式
        </span>
        <span v-else class="original-badge">
          <i class="fas fa-file-alt"></i> 原文模式
        </span>
      </div>
      <div class="translation-toggle">
        <button 
          class="toggle-button" 
          :class="{ active: !showTranslation }" 
          @click="toggleDisplayMode"
        >
          原文
        </button>
        <button 
          class="toggle-button" 
          :class="{ active: showTranslation }" 
          @click="toggleDisplayMode"
        >
          翻译
        </button>
      </div>
    </div>

    <!-- 转录/翻译内容 -->
    <div v-if="transcriptionComplete && displayText" class="transcription-content">
      <div class="text-content" :class="{ 'fade-in': transcriptionComplete }">{{ displayText }}</div>
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

/* 翻译/原文切换按钮 */
.translation-toggle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0;
}

.translation-status {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
}

.translation-badge, .original-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.translation-badge {
  background-color: rgba(0, 122, 255, 0.1);
  color: var(--primary-color, #007AFF);
}

.original-badge {
  background-color: rgba(142, 142, 147, 0.1);
  color: var(--text-secondary, #8E8E93);
}

.translation-badge i, .original-badge i {
  margin-right: 4px;
  font-size: 11px;
}

.translation-toggle {
  display: flex;
  justify-content: center;
  background-color: var(--background-secondary, #F2F2F7);
  border-radius: 16px;
  padding: 2px;
  width: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toggle-button {
  border: none;
  background: transparent;
  padding: 6px 16px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #8E8E93);
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 70px;
  position: relative;
  overflow: hidden;
}

.toggle-button.active {
  background-color: white;
  color: var(--primary-color, #007AFF);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-button.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(0, 122, 255, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

.toggle-button:active {
  transform: scale(0.95);
}

.transcription-content {
  background-color: var(--background-secondary, #F2F2F7);
  border-radius: 10px;
  padding: 16px;
  margin: 12px 0;
  max-height: 200px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transition: all 0.3s ease;
}

.text-content {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary, #000000);
  white-space: pre-wrap;
  transition: opacity 0.2s ease;
}

.text-content.fade-in {
  animation: fadeIn 0.5s ease;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
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
  
  .toggle-button {
    padding: 5px 12px;
    font-size: 12px;
    min-width: 60px;
  }
  
  .translation-badge, .original-badge {
    font-size: 11px;
    padding: 3px 6px;
  }
}
</style>
