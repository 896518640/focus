<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';

const props = defineProps({
  isRecording: {
    type: Boolean,
    default: false
  },
  sourceText: {
    type: String,
    default: ''
  },
  translatedText: {
    type: String,
    default: ''
  }
});

// 计算是否为空状态
const isEmpty = computed(() => !props.sourceText && !props.translatedText);

// 引用元素，用于自动滚动
const sourceTextRef = ref<HTMLElement | null>(null);
const translatedTextRef = ref<HTMLElement | null>(null);

// 监听文本变化，自动滚动到底部
watch(() => props.sourceText, async () => {
  if (props.sourceText && sourceTextRef.value) {
    await nextTick();
    scrollToBottom(sourceTextRef.value);
  }
}, { immediate: true });

watch(() => props.translatedText, async () => {
  if (props.translatedText && translatedTextRef.value) {
    await nextTick();
    scrollToBottom(translatedTextRef.value);
  }
}, { immediate: true });

// 滚动到底部的方法
const scrollToBottom = (element: HTMLElement) => {
  element.scrollTop = element.scrollHeight;
};
</script>

<template>
  <div class="translation-card" :class="{ 'recording': isRecording }">
    <div class="card-header">
      <div class="translation-status" :class="{ 'active': isRecording }">
        <i class="fas fa-circle"></i> {{ isRecording ? '翻译中...' : '已暂停' }}
      </div>
    </div>
    
    <div v-if="!isEmpty" class="text-container">
      <div class="source-text-wrapper">
        <div ref="sourceTextRef" class="source-text">
          <pre>{{ sourceText }}</pre>
        </div>
      </div>
    </div>
    
    <div v-if="isEmpty" class="empty-state">
      <i class="fas fa-language empty-icon animate__animated animate__fadeIn" style="animation-delay: 0.5s;"></i>
      <div class="empty-text animate__animated animate__fadeIn" style="animation-delay: 0.6s;">尚未开始翻译</div>
      <div class="empty-subtext animate__animated animate__fadeIn" style="animation-delay: 0.7s;">点击下方按钮开始实时翻译</div>
    </div>
    
    <div v-if="!isEmpty" class="card-divider"></div>
    
    <div v-if="!isEmpty" class="text-container">
      <div class="translated-text-wrapper">
        <div ref="translatedTextRef" class="translated-text">
          <pre>{{ translatedText }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translation-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 220px); /* 固定高度，减去其他UI元素的高度 */
  max-height: 600px;
}

.translation-card:active {
  transform: scale(0.99);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.text-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 非常重要，确保flex子项不会溢出 */
}

.source-label, .target-label {
  font-size: 13px;
  font-weight: 600;
  color: #4169E1;
  padding: 14px 18px 8px 18px;
  flex-shrink: 0;
}

.source-text-wrapper, .translated-text-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.source-text, .translated-text {
  font-size: 16px;
  line-height: 1.6;
  padding: 0 18px 18px 18px;
  overflow-y: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-overflow-scrolling: touch; /* 提升iOS滚动体验 */
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: inherit;
}

.translation-status {
  font-size: 12px;
  color: #8E8E93;
  display: flex;
  align-items: center;
  gap: 6px;
}

.translation-status i {
  font-size: 8px;
}

.translation-status.active {
  color: #4CD964;
}

.translation-status.active i {
  animation: blink 1s infinite;
}

.card-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
  margin: 0;
  flex-shrink: 0;
}

.source-text {
  color: #000000;
}

.translated-text {
  color: #000000;
}

.translation-card.recording {
  box-shadow: 0 4px 20px rgba(65, 105, 225, 0.1);
  animation: card-glow 2s infinite alternate;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  padding: 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #C7C7CC;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  color: #8E8E93;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: #AEAEB2;
  max-width: 240px;
  line-height: 1.4;
}

@keyframes card-glow {
  0% {
    box-shadow: 0 2px 12px rgba(65, 105, 225, 0.05);
  }
  100% {
    box-shadow: 0 4px 20px rgba(65, 105, 225, 0.15);
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style> 