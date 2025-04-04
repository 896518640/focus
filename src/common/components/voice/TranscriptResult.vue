<template>
  <div class="result-section">
    <van-field 
      :model-value="text"
      type="textarea" 
      rows="8" 
      :placeholder="placeholder" 
      auto-resize 
      class="transcript-area"
      :class="{ 'is-active': isRecording }"
      readonly 
    />
    
    <transition name="fade">
      <div class="listening-status" v-if="isRecording">
        <van-loading type="spinner" :color="statusColor" size="20px" />
        <span>正在识别 "{{ getLanguageLabel(language) }}" 语音...</span>
      </div>
    </transition>
    
    <div class="status-info" v-if="getErrorMessage(error)">
      <van-tag type="danger" size="medium">{{ getErrorMessage(error) }}</van-tag>
    </div>
    
    <div class="actions" v-if="text">
      <van-button size="small" class="action-button copy-button" @click="handleCopy">
        复制文本
      </van-button>
      <van-button size="small" class="action-button clear-button" @click="handleClear">
        清除
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from 'vant';

// 定义组件属性
const props = defineProps<{
  text: string;
  isRecording: boolean;
  error: any;
  language: string;
  placeholder?: string;
  statusColor?: string;
}>();

// 定义组件事件
const emit = defineEmits(['copy', 'clear']);

// 获取错误信息
const getErrorMessage = (error: any): string => {
  console.log('error', error);
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.msg) {
    return error.msg;
  }
  if (error?.toString) {
    const errStr = error.toString();
    return errStr === '[object Object]' ? '发生未知错误' : errStr;
  }
  return '发生未知错误';
};

// 获取语言显示标签
const getLanguageLabel = (lang: string): string => {
  const langMap: Record<string, string> = {
    'zh_cn': '中文（普通话）',
    'en_us': '英语（美国）',
    'ja_jp': '日语',
    'ko_kr': '韩语'
  };
  return langMap[lang] || lang;
};

// 处理复制文本
const handleCopy = () => {
  if (!props.text) return;
  
  navigator.clipboard.writeText(props.text)
    .then(() => {
      showToast('文本已复制到剪贴板');
      emit('copy');
    })
    .catch(() => {
      showToast('复制失败，请手动复制');
    });
};

// 处理清除文本
const handleClear = () => {
  emit('clear');
};
</script>

<style lang="less" scoped>
.result-section {
  position: relative;
  z-index: 2;
  animation: fadeInUp 1s ease-out;
}

.transcript-area {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  font-size: 17px;
  line-height: 1.6;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.07);
  color: #374151;
  transition: all 0.3s ease;
  height: auto;
  min-height: 200px;

  &.is-active {
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 0 6px 24px rgba(99, 102, 241, 0.2);
  }

  &:focus {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 6px 24px rgba(99, 102, 241, 0.15);
    transform: translateY(-2px);
  }

  &::placeholder {
    color: rgba(107, 114, 128, 0.7);
  }
}

:deep(.van-field__control) {
  color: #374151;
  font-weight: 500;
}

.status-info {
  margin-top: 10px;
  display: flex;
  justify-content: flex-start;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.action-button {
  border-radius: 8px;
  font-weight: 500;
  
  &.copy-button {
    background: linear-gradient(to right, #3b82f6, #60a5fa);
    border: none;
    color: white;
  }
  
  &.clear-button {
    background: transparent;
    border: 1px solid #d1d5db;
    color: #4b5563;
  }
}

.listening-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: #6366f1;
  font-size: 14px;
  font-weight: 500;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  .transcript-area {
    padding: 20px;
    font-size: 16px;
    min-height: 180px;
  }
  
  .actions {
    flex-direction: row;
    margin-top: 12px;
  }
  
  .action-button {
    flex: 1;
  }
}
</style> 