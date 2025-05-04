<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import 'animate.css';
import { useRealtimeTranslation, type RealtimeTranslationOptions } from '../../hooks/useRealtimeTranslation';
import PageHeader from './components/PageHeader.vue';
import TranslationCard from './components/TranslationCard.vue';
import RecordingWaveform from './components/RecordingWaveform.vue';
import UsageTips from './components/UsageTips.vue';
import BottomNavigation from './components/BottomNavigation.vue';
import TranslationSettings from './components/TranslationSettings.vue';

const router = useRouter();

// 创建相关状态
const recordingDuration = ref(0);
const liveText = ref('');
const liveTranslation = ref('');

// 使用实时翻译Hook
const {
  isInitialized,
  isConnecting,
  isConnected,
  isTranslating,
  isError,
  errorMessage,
  transcriptionResult,
  translationResult,
  sourceLanguage,
  targetLanguages,
  initializeTask,
  startTranslation,
  pauseTranslation,
  resumeTranslation,
  stopTranslation,
  clearResults,
  setSourceLanguage,
  setTargetLanguages
} = useRealtimeTranslation({
  sourceLanguage: 'cn',
  targetLanguages: ['en'],
  autoStart: false,
  onTranscriptionResult: (text: string) => {
    liveText.value = text;
  },
  onTranslationResult: (text: string) => {
    liveTranslation.value = text;
  }
} as RealtimeTranslationOptions);

// 页面状态
const isPageLeaving = ref(false);
const isLoading = ref(false);
const isPaused = ref(false);
const showSettings = ref(false);

// 绑定语言选择到hooks中的值
const localSourceLanguage = computed({
  get: () => sourceLanguage.value,
  set: (value) => handleSourceLanguageChange(value)
});

const localTargetLanguage = computed({
  get: () => targetLanguages.value[0] || 'en',
  set: (value) => handleTargetLanguageChange(value)
});

// 监听翻译结果变化
watch(transcriptionResult, (newVal) => {
  if (typeof newVal === 'string') {
    liveText.value = newVal;
    // 延迟一帧，确保DOM更新后再滚动
    requestAnimationFrame(() => {
      const textElements = document.querySelectorAll('.source-text, .translated-text');
      textElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.scrollTop = el.scrollHeight;
        }
      });
    });
  }
});

watch(translationResult, (newVal) => {
  if (typeof newVal === 'string') {
    liveTranslation.value = newVal;
    // 延迟一帧，确保DOM更新后再滚动
    requestAnimationFrame(() => {
      const textElements = document.querySelectorAll('.translated-text');
      textElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.scrollTop = el.scrollHeight;
        }
      });
    });
  }
});

// 计时器相关
let durationInterval: number | null = null;

// 开始计时器
const startTimer = () => {
  if (durationInterval) clearInterval(durationInterval);
  
  durationInterval = window.setInterval(() => {
    recordingDuration.value++;
  }, 1000);
};

// 停止计时器
const stopTimer = () => {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
};

// 重置计时器
const resetTimer = () => {
  stopTimer();
  recordingDuration.value = 0;
};

// 音频波形相关
const showFallbackWaveform = ref(true);
const waveformHeights = ref<number[]>(Array(15).fill(0).map(() => Math.floor(Math.random() * 25) + 5));
let waveformInterval: number | null = null;

// 视觉状态
const isButtonPressing = ref(false);
const isPauseButtonActive = ref(false);
const showTips = ref(false);

// 格式化时间显示
const timeDisplay = computed(() => {
  const minutes = Math.floor(recordingDuration.value / 60);
  const seconds = recordingDuration.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

// 切换提示显示
const toggleTips = () => {
  showTips.value = !showTips.value;
};

// 切换设置弹窗
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// 返回首页
const goBack = () => {
  isPageLeaving.value = true;
  setTimeout(() => {
    router.push('/');
  }, 300);
};

// 切换录音状态
const toggleRecording = () => {
  // 按钮按压效果
  isButtonPressing.value = true;
  setTimeout(() => {
    isButtonPressing.value = false;
  }, 200);
  
  // 添加触觉反馈 (如果设备支持)
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
  
  if (isTranslating.value) {
    // 正在录音，点击后暂停
    pauseRecording();
    isPaused.value = true;
  } else if (isInitialized.value) {
    // 已初始化但未录音(可能是暂停后)，恢复录音
    resumeRecording();
    isPaused.value = false;
  } else {
    // 未初始化，开始新的录音
    startRecording();
    isPaused.value = false;
  }
};

// 开始新的录音
const startRecording = async () => {
  try {
    await startTranslation();
    startTimer();
    startFallbackWaveform();
  } catch (error) {
    console.error('开始录音失败:', error);
  }
};

// 暂停录音
const pauseRecording = () => {
  try {
    pauseTranslation();
    stopTimer();
    stopFallbackWaveform();
  } catch (error) {
    console.error('暂停录音失败:', error);
  }
};

// 恢复录音
const resumeRecording = async () => {
  try {
    await resumeTranslation();
    startTimer();
    startFallbackWaveform();
  } catch (error) {
    console.error('恢复录音失败:', error);
  }
};

// 开始波形动画
const startFallbackWaveform = () => {
  if (waveformInterval) clearInterval(waveformInterval);
  
  waveformInterval = window.setInterval(() => {
    waveformHeights.value = waveformHeights.value.map(() => 
      Math.floor(Math.random() * 25) + 5
    );
  }, 100);
};

// 停止波形动画
const stopFallbackWaveform = () => {
  if (waveformInterval) {
    clearInterval(waveformInterval);
    waveformInterval = null;
  }
};

// 麦克风按钮文本显示
const micButtonLabel = computed(() => {
  if (isTranslating.value) {
    return '录音中';
  } else if (isInitialized.value && isConnected.value) {
    return '已暂停';
  } else {
    return '开始录音';
  }
});

// 清理函数
const cleanup = () => {
  // 停止翻译服务
  stopTranslation();
  
  // 停止计时器
  stopTimer();
  
  // 清理界面资源
  if (waveformInterval) {
    clearInterval(waveformInterval);
    waveformInterval = null;
  }
};

// 组件加载时
onMounted(() => {
  document.body.classList.add('iOS-style');
  
  // 预加载字体图标
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(link);
  
  // 预加载动画库
  const animateCSS = document.createElement('link');
  animateCSS.rel = 'stylesheet';
  animateCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';
  document.head.appendChild(animateCSS);
  
  // 页面进入动画 - 修改为只选择带有page-element类的元素
  setTimeout(() => {
    const contentElements = document.querySelectorAll('.simultaneous-page > .page-element');
    contentElements.forEach((el, index) => {
      setTimeout(() => {
        (el as HTMLElement).classList.add('content-visible');
      }, index * 100);
    });
  }, 300);
});

// 监听录音状态变化
watch(isTranslating, (newValue) => {
  // 录音状态变化时添加波纹效果
  const rippleElements = document.querySelectorAll('.bottom-button');
  rippleElements.forEach((el) => {
    (el as HTMLElement).classList.add('ripple-active');
    setTimeout(() => {
      (el as HTMLElement).classList.remove('ripple-active');
    }, 500);
  });
});

// 组件卸载时清理计时器和录音资源
onUnmounted(() => {
  // 清理API资源和界面资源
  cleanup();
  
  document.body.classList.remove('iOS-style');
});

// 处理语言变化
const handleSourceLanguageChange = (newLang: string) => {
  setSourceLanguage(newLang);
};

const handleTargetLanguageChange = (newLang: string) => {
  setTargetLanguages([newLang]);
};
</script>

<template>
  <div class="simultaneous-page" :class="{ 'page-leave-active': isPageLeaving }">
    <!-- 顶部导航栏 -->
    <PageHeader 
      @go-back="goBack"
      :source-language="localSourceLanguage"
      :target-language="localTargetLanguage"
      @source-language-change="handleSourceLanguageChange"
      @target-language-change="handleTargetLanguageChange"
      class="animate__animated animate__fadeInDown page-element"
    />
    
    <!-- 计时器区域 -->
    <div class="timer animate__animated animate__fadeIn page-element" style="animation-delay: 0.2s;">
      <i class="far fa-clock"></i>
      <span class="time">{{ timeDisplay }}</span>
      <i class="fas fa-language"></i>
      <div class="info-button" @click="toggleTips">
        <i class="fas fa-info-circle"></i>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content-area animate__animated animate__fadeIn page-element" style="animation-delay: 0.3s;">
      <!-- 卡片容器 -->
      <TranslationCard 
        :is-recording="isTranslating"
        :source-text="liveText"
        :translated-text="liveTranslation"
      />
    </div>
    
    <!-- 使用提示 - 不需要加入page-element类，因为它默认是隐藏的 -->
    <UsageTips 
      :show-tips="showTips"
      @close="toggleTips"
    />
    
    <!-- 翻译设置弹窗 -->
    <TranslationSettings
      v-model:show="showSettings"
      :source-language="localSourceLanguage"
      :target-language="localTargetLanguage"
      @source-language-change="handleSourceLanguageChange"
      @target-language-change="handleTargetLanguageChange"
    />
    
    <!-- 波形可视化区域，固定在底部导航上方 -->
    <div class="waveform-container-wrapper" v-if="isTranslating || isPaused">
      <RecordingWaveform 
        :waveform-heights="waveformHeights"
        :is-paused="isPaused" 
      />
    </div>
    
    <!-- 底部导航 -->
    <BottomNavigation
      :is-recording="isTranslating"
      :is-button-pressing="isButtonPressing"
      :is-paused="isPaused"
      @toggle-recording="toggleRecording"
      @toggle-settings="toggleSettings"
      class="animate__animated animate__fadeIn page-element" 
      style="animation-delay: 0.5s;"
    />
  </div>
</template>

<style scoped>
.simultaneous-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F9FA;
  transition: opacity 0.3s, transform 0.3s;
  position: relative;
  overflow: hidden;
}

/* 修改选择器，只对page-element类进行动画 */
.simultaneous-page > .page-element {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.simultaneous-page > .page-element.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.page-leave-active {
  opacity: 0;
  transform: translateX(-20px);
}

/* 顶部导航栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #FFFFFF;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 20px;
  color: #4169E1;
  margin-right: 10px;
}

.logo-text {
  font-size: 12px;
  font-weight: 600;
  color: #000000;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  white-space: nowrap;
  font-family: 'Poppins', sans-serif;
}

.signal-indicator {
  display: flex;
}

.signal-indicator .bar {
  background-color: #4CD964;
  width: 3px;
  height: 15px;
  display: inline-block;
  margin-right: 2px;
  animation: pulse 1.5s infinite alternate;
}

.signal-indicator .bar:nth-child(1) {
  animation-delay: 0s;
}

.signal-indicator .bar:nth-child(2) {
  animation-delay: 0.3s;
}

.signal-indicator .bar:nth-child(3) {
  animation-delay: 0.6s;
}

/* 导航区域 */
.back-button {
  color: #4169E1;
  font-size: 18px;
  background: none;
  border: none;
  margin-right: 10px;
  cursor: pointer;
  border-radius: 50%;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.back-button:active {
  background-color: rgba(65, 105, 225, 0.1);
  transform: scale(0.95);
}

.language-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  font-weight: 500;
  font-size: 12px;
  transition: transform 0.2s ease;
  position: relative;
  padding: 10px;
  border-radius: 10px;
}

.language-selector:active {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(0.98);
}

.arrow {
  margin: 0 10px;
  color: #8E8E93;
  transition: transform 0.3s ease;
}

.language-selector:active .arrow {
  transform: rotate(180deg);
}

/* 计时器区域 */
.timer {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  gap: 10px;
  color: #8E8E93;
  font-size: 14px;
  background-color: #FFFFFF;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.timer .time {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
  font-weight: 500;
}

.timer i {
  transition: color 0.3s;
}

.settings-button {
  margin-left: auto;
  font-size: 16px;
  color: #4169E1;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.settings-button:active {
  transform: scale(0.9);
}

.info-button {
  margin-left: 10px;
  font-size: 16px;
  color: #4169E1;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.settings-button:active, .info-button:active {
  transform: scale(0.9);
}

/* 录音时计时器颜色变化 */
.timer:has(+ .content-area:has(.waveform-container)) .time,
.timer:has(+ .content-area:has(.waveform-container)) i:not(.info-button i) {
  color: #4169E1;
}

/* 内容区域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px 15px 0 15px;
  overflow-y: auto;
  background-color: #F8F9FA;
  transition: background-color 0.3s ease;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 80px; /* 为波形和底部导航留出空间 */
}

/* 波形容器包装器，固定在底部 */
.waveform-container-wrapper {
  padding: 5px 15px;
  /* background-color: rgba(248, 249, 250, 0.95); */
  position: fixed;
  bottom: 65px; /* 调整位置，确保在底部导航上方 */
  left: 0;
  right: 0;
  z-index: 2;
  /* backdrop-filter: blur(5px);  */
  /* -webkit-backdrop-filter: blur(5px); */
  /* border-top: 1px solid rgba(0, 0, 0, 0.05); */
  opacity: 1 !important; /* 强制设置波形容器为完全可见 */
}

.waveform-container {
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 12px;
  /* background-color: rgba(255, 255, 255, 0.8); */
  /* box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03); */
  padding: 5px 0;
}

/* 卡片样式 */
.translation-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
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
}

.source-label, .target-label {
  font-size: 13px;
  font-weight: 600;
  color: #4169E1;
  padding: 14px 18px 0 18px;
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
  margin: 14px 0;
}

.source-text, .translated-text {
  font-size: 16px;
  line-height: 1.6;
  padding: 0 18px 18px 18px;
}

.source-text {
  color: #000000;
}

.translated-text {
  color: #000000;
}

/* 使用提示 */
.usage-tips {
  position: fixed;
  top: 120px;
  left: 15px;
  right: 15px;
  z-index: 100;
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.usage-tips.show-tips {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.close-tips {
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 14px;
  cursor: pointer;
}

.tips-content {
  padding: 14px 18px;
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #4A4A4A;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item i {
  color: #4169E1;
  width: 24px;
  margin-right: 12px;
}

/* 底部导航 */
.bottom-bar {
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
  background-color: #FFFFFF;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
  position: fixed; /* 确保底部导航也是固定的 */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3; /* 确保底部导航在最顶层 */
}

.bottom-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 12px;
  gap: 5px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}

.bottom-button i {
  font-size: 24px;
  transition: transform 0.2s ease, color 0.3s ease;
}

.bottom-button:active i {
  transform: scale(0.92);
}

.bottom-button:active {
  color: #4169E1;
}

.bottom-button.active {
  color: #4169E1;
}

/* 波纹效果 */
.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect::after {
  content: "";
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, #000 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform .3s, opacity .5s;
}

.ripple-effect:active::after {
  transform: scale(0, 0);
  opacity: 0.1;
  transition: 0s;
}

.mic-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #FF3B30;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  margin-top: -30px;
  position: relative;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

.mic-button::after {
  content: attr(data-label);
  position: absolute;
  bottom: -20px;
  font-size: 12px;
  color: #8E8E93;
  white-space: nowrap;
}

.mic-button:active, .mic-button.pressing {
  transform: scale(0.92);
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.2);
}

.mic-button.recording {
  animation: pulse 1.5s infinite;
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(255, 59, 48, 0.5);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent; 
}
 
::-webkit-scrollbar-thumb {
  background: rgba(142, 142, 147, 0.3);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(142, 142, 147, 0.5); 
}

.iOS-style {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 当点击麦克风时，让整个页面有轻微的脉动效果 */
@keyframes page-pulse {
  0% {
    background-color: #F8F9FA;
  }
  50% {
    background-color: #F4F6FA;
  }
  100% {
    background-color: #F8F9FA;
  }
}

.translation-card:has(+ .waveform-container) {
  box-shadow: 0 4px 20px rgba(65, 105, 225, 0.1);
  animation: card-glow 2s infinite alternate;
}

@keyframes card-glow {
  0% {
    box-shadow: 0 2px 12px rgba(65, 105, 225, 0.05);
  }
  100% {
    box-shadow: 0 4px 20px rgba(65, 105, 225, 0.15);
  }
}
</style> 