<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import 'animate.css';
import PageHeader from './components/PageHeader.vue';
import TranslationCard from './components/TranslationCard.vue';
import RecordingWaveform from './components/RecordingWaveform.vue';
import UsageTips from './components/UsageTips.vue';
import BottomNavigation from './components/BottomNavigation.vue';
import TranslationSettings from '@/components/common/TranslationSettings.vue';
import AiSummaryPopup from './components/AiSummaryPopup.vue';
import { useSimultaneousTranslation, useAiSummary } from './composables';

const router = useRouter();

// 使用统一的组合式函数
const {
  // 状态
  liveText,
  liveTranslation,
  isPageLeaving,
  isTranslating,
  isPaused,
  isSaving,
  isButtonPressing,
  showSettings,
  showTips,
  
  // 数据
  waveformHeights,
  timeDisplay,
  localSourceLanguage,
  localTargetLanguage,
  
  // 打字机效果数据
  displayedSource,
  displayedTranslation,
  
  // 方法
  toggleRecording,
  toggleTips,
  toggleSettings,
  saveTranslation,
  cleanup,
  handleSourceLanguageChange,
  handleTargetLanguageChange
} = useSimultaneousTranslation({
  sourceLanguage: 'cn',
  targetLanguages: ['en'],
  autoStart: false
});

// 使用AI总结
const {
  showSummary,
  loading: isSummarizing,
  summaryContent,
  error: summaryError,
  displayedContent,
  toggleSummary,
  getSummaryContent,
  copySummary,
  isStreamComplete,
  progressPercentage,
  stopGeneratingSummary,
  simulateStreamResponse
} = useAiSummary({
  translationText: liveTranslation,
  targetLanguage: localTargetLanguage,
  // useMockData: import.meta.env.DEV // 开发环境下启用模拟数据备用
});

// 返回首页
const goBack = () => {
  isPageLeaving.value = true;
  setTimeout(() => {
    router.push('/');
  }, 300);
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

// 组件卸载时清理计时器和录音资源
onUnmounted(() => {
  // 清理API资源和界面资源
  cleanup();
  
  document.body.classList.remove('iOS-style');
});

// 生成模拟摘要
const generateMockSummary = () => {
  console.log('生成模拟摘要被调用');
  
  if (!liveTranslation.value) {
    showToast('没有可用的翻译内容');
    return;
  }
  
  const mockText = 
    `这是一段模拟的AI总结内容，用于在开发环境中测试流式输出和打字机效果。
    
该翻译内容主要包含以下几个关键点：
1. 技术实现的可行性分析和挑战
2. 用户场景与需求分析
3. 市场竞争情况概述
4. 潜在投资回报评估

总体来说，该内容提出了一个有价值的解决方案框架，值得进一步深入研究和开发。`;

  console.log('开始模拟流式响应');
  simulateStreamResponse(mockText);
};

// 在script setup部分添加handleSkipAnimation方法
const handleSkipAnimation = () => {
  // 对于跳过动画功能，我们需要确保summaryContent立即显示
  if (typeof displayedContent === 'object' && displayedContent.value) {
    displayedContent.value = summaryContent.value;
  }
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
        :source-text="displayedSource"
        :translated-text="displayedTranslation"
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
    
    <!-- AI总结弹窗 -->
    <AiSummaryPopup
      v-model:show="showSummary"
      :loading="isSummarizing"
      :content="summaryContent"
      :displayed-content="displayedContent"
      :error="summaryError"
      :is-stream-complete="isStreamComplete"
      :progress-percentage="progressPercentage"
      @get-summary="getSummaryContent"
      @copy-summary="copySummary"
      @stop-stream="stopGeneratingSummary"
      @get-mock="generateMockSummary"
      @skip-animation="handleSkipAnimation"
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
      :is-saving="isSaving"
      @toggle-recording="toggleRecording"
      @toggle-settings="toggleSettings"
      @save-translation="saveTranslation"
      @toggle-ai-summary="toggleSummary"
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
  transform: translateY(20px);
}

.timer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  font-weight: 700;
  color: #333;
  background-color: #fff;
  margin: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  position: relative;
}

.timer .far.fa-clock {
  margin-right: 8px;
  color: #666;
}

.timer .time {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

.timer .fas.fa-language {
  margin-left: 16px;
  color: #4a89dc;
  opacity: 0.8;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  overflow: hidden;
}

.info-button {
  position: absolute;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a89dc;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.3s, transform 0.2s;
}

.info-button:active {
  transform: scale(0.95);
  background-color: rgba(74, 137, 220, 0.1);
}

.waveform-container-wrapper {
  padding: 0 16px;
  margin-bottom: 8px;
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* 为iOS设备添加的样式 */
.iOS-style {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
</style> 