<script setup lang="ts">
import { ref, watch, nextTick, computed, onUnmounted } from 'vue';
import TextToSpeech from '@/components/common/TextToSpeech.vue';

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
    smoothScrollToBottom(sourceTextRef.value);
  }
}, { immediate: true });

watch(() => props.translatedText, async () => {
  if (props.translatedText && translatedTextRef.value) {
    await nextTick();
    smoothScrollToBottom(translatedTextRef.value);
  }
}, { immediate: true });

// 平滑滚动到底部的方法
const smoothScrollToBottom = (element: HTMLElement) => {
  // 检查是否需要滚动（内容高度大于容器高度）
  if (element.scrollHeight <= element.clientHeight) return;
  
  // 当前滚动位置与底部的距离
  const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
  
  // 如果已经很接近底部（小于100px），或者内容刚出现，使用平滑滚动
  if (distanceToBottom < 100) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  } else {
    // 如果距离较远，先快速滚动到接近底部的位置，然后再平滑滚动
    element.scrollTo({
      top: element.scrollHeight - 100,
      behavior: 'auto'
    });
    
    // 短暂延迟后平滑滚动到底部
    setTimeout(() => {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }, 10);
  }
};

// 添加光标闪烁效果
const showCursor = ref(false);
const cursorInterval = setInterval(() => {
  showCursor.value = !showCursor.value;
}, 500);

// 组件卸载时清理资源
onUnmounted(() => {
  clearInterval(cursorInterval);
});
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
          <span>{{ sourceText }}</span>
          <span v-if="isRecording && sourceText && showCursor" class="cursor">|</span>
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
          <span>{{ translatedText }}</span>
          <span v-if="isRecording && translatedText && showCursor" class="cursor">|</span>
        </div>
      </div>
    </div>
    
    <div class="translation-section">
      <div class="section-header">
        <div class="header-title">{{ targetLanguageLabel }}</div>
        <div class="tts-container">
          <TextToSpeech 
            :text="translatedText" 
            :lang="targetLanguageCode"
            v-slot="{ speak, pause, resume, stop, isSpeaking, isPaused, isAvailable }"
          >
            <button 
              v-if="isAvailable && translatedText" 
              class="tts-button"
              :class="{ 
                'speaking': isSpeaking && !isPaused,
                'paused': isPaused
              }"
              @click="isSpeaking ? (isPaused ? resume() : pause()) : speak()"
              :title="isSpeaking ? (isPaused ? '继续朗读' : '暂停朗读') : '朗读翻译'"
            >
              <i 
                class="fas" 
                :class="{
                  'fa-volume-up': !isSpeaking,
                  'fa-pause': isSpeaking && !isPaused,
                  'fa-play': isPaused
                }"
              ></i>
            </button>
          </TextToSpeech>
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
  scroll-behavior: smooth; /* 启用平滑滚动 */
  will-change: transform; /* 性能优化，让浏览器为滚动创建独立图层 */
  overflow-anchor: auto; /* 改进锚定滚动 */
  overscroll-behavior: contain; /* 防止滚动传播到父元素 */
  transform: translateZ(0); /* 触发硬件加速 */
  backface-visibility: hidden; /* 进一步优化性能 */
  perspective: 1000; /* 配合硬件加速 */
}

.source-text {
  color: #000000;
}

.translated-text {
  color: #000000;
}

/* 添加打字机光标效果 */
.cursor {
  display: inline-block;
  color: #4169E1;
  font-weight: bold;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
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

/* 为文本朗读按钮添加样式 */
.tts-container {
  margin-left: auto;
}

.tts-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  font-size: 14px;
}

.tts-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.tts-button.speaking {
  background-color: #007AFF;
  color: white;
}

.tts-button.paused {
  background-color: #FF9500;
  color: white;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .tts-button {
    background-color: rgba(255, 255, 255, 0.1);
    color: #CCC;
  }
  
  .tts-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}
</style> 