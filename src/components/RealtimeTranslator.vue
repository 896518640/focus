<template>
  <div class="realtime-translator">
    <div class="translator-header">
      <h3>实时语音翻译</h3>
      <div class="language-selector">
        <span>源语言:</span>
        <select v-model="sourceLanguage" :disabled="isTranslating">
          <option value="zh">中文</option>
          <option value="en">英文</option>
          <option value="ja">日文</option>
          <option value="ko">韩文</option>
        </select>
        
        <span class="ml-3">目标语言:</span>
        <select v-model="targetLanguage" :disabled="isTranslating">
          <option value="zh">中文</option>
          <option value="en">英文</option>
          <option value="ja">日文</option>
          <option value="ko">韩文</option>
        </select>
      </div>
    </div>
    
    <div class="translator-content">
      <!-- 状态指示器 -->
      <div class="status-indicator" :class="{ 'active': isTranslating, 'loading': isLoading }">
        <div v-if="isLoading" class="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <div v-else-if="isTranslating" class="pulse-icon">
          <i class="fas fa-microphone-alt"></i>
        </div>
        <div v-else class="status-icon">
          <i class="fas fa-microphone-slash"></i>
        </div>
        <div class="status-text">
          {{ statusText }}
        </div>
      </div>
      
      <!-- 录制时间 -->
      <div class="recording-time" v-if="isTranslating || recordingDuration > 0">
        {{ formatTime(recordingDuration) }}
      </div>
      
      <!-- 实时文本区域 -->
      <div class="text-display">
        <div class="text-section">
          <h4>原文</h4>
          <div class="text-content" :class="{ 'blinking-cursor': isTranslating && !liveText }">
            {{ liveText || (isTranslating ? '正在识别...' : '点击下方按钮开始录音') }}
          </div>
        </div>
        
        <div class="text-section">
          <h4>翻译</h4>
          <div class="text-content" :class="{ 'blinking-cursor': isTranslating && liveText && !liveTranslation }">
            {{ liveTranslation || (liveText && isTranslating ? '正在翻译...' : '翻译将在这里显示') }}
          </div>
        </div>
      </div>
      
      <!-- 错误信息 -->
      <div class="error-message" v-if="errorMessage">
        <i class="fas fa-exclamation-triangle"></i> {{ errorMessage }}
      </div>
    </div>
    
    <div class="translator-controls">
      <button 
        class="control-button" 
        :class="{ 'start': !isTranslating, 'stop': isTranslating, 'loading': isLoading }" 
        @click="toggleTranslation"
        :disabled="isLoading"
      >
        <i class="fas" :class="isTranslating ? 'fa-stop' : 'fa-play'"></i>
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useSimpleTranslation } from '@/hooks/useSimpleTranslation';

// 使用翻译Hook
const {
  isTranslating,
  isLoading,
  liveText,
  liveTranslation,
  recordingDuration,
  errorMessage,
  startTranslation,
  stopTranslation,
  cleanup,
  setSourceLanguage,
  setTargetLanguage
} = useSimpleTranslation();

// 语言选择
const sourceLanguage = ref('zh');
const targetLanguage = ref('en');

// 监听语言变化
watch(sourceLanguage, (newLang) => {
  setSourceLanguage(newLang);
});

watch(targetLanguage, (newLang) => {
  setTargetLanguage(newLang);
});

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 计算属性: 状态文本
const statusText = computed(() => {
  if (isLoading.value) {
    return '正在处理...';
  } else if (isTranslating.value) {
    return '正在录音和翻译';
  } else if (recordingDuration.value > 0) {
    return '录音已完成';
  } else {
    return '准备就绪';
  }
});

// 计算属性: 按钮文本
const buttonText = computed(() => {
  if (isLoading.value) {
    return '请稍候';
  } else if (isTranslating.value) {
    return '停止录音';
  } else {
    return '开始录音';
  }
});

// 切换翻译状态
const toggleTranslation = async () => {
  if (isLoading.value) return;
  
  if (isTranslating.value) {
    await stopTranslation();
  } else {
    await startTranslation();
  }
};

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.realtime-translator {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  max-width: 600px;
  margin: 0 auto;
}

.translator-header {
  background-color: #4169E1;
  color: white;
  padding: 16px;
}

.translator-header h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
}

.language-selector {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.language-selector select {
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
}

.ml-3 {
  margin-left: 12px;
}

.translator-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
}

.status-indicator.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-indicator.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-icon, .pulse-icon {
  margin-right: 8px;
  font-size: 16px;
}

.pulse-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.loading-dots {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: currentColor;
  border-radius: 50%;
  display: inline-block;
  animation: dots 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dots {
  0%, 80%, 100% { 
    transform: scale(0);
  } 
  40% { 
    transform: scale(1.0);
  }
}

.recording-time {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

.text-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-section {
  flex: 1;
}

.text-section h4 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.text-content {
  min-height: 80px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  font-size: 16px;
  line-height: 1.5;
}

.blinking-cursor::after {
  content: '|';
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  from, to { opacity: 1; }
  50% { opacity: 0; }
}

.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.translator-controls {
  padding: 16px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #eee;
}

.control-button {
  min-width: 120px;
  padding: 10px 16px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.control-button.start {
  background-color: #4169E1;
  color: white;
}

.control-button.stop {
  background-color: #f44336;
  color: white;
}

.control-button.loading {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

.control-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.control-button:active:not(:disabled) {
  transform: translateY(1px);
}

.control-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style> 