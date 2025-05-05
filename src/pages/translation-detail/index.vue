<template>
  <div class="translation-detail-page" :class="{ 'page-leave-active': isPageLeaving }">
    <!-- 顶部标题栏 -->
    <div class="header animate__animated animate__fadeInDown page-element">
      <button class="back-button" @click="goBack">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="header-title">预览</div>
      <button class="ai-button" @click="navigateToAiSummary">
        <i class="fas fa-robot"></i>
        <span>AI总结</span>
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <template v-else>
      <!-- 翻译标题和时间信息 -->
      <div class="title-section animate__animated animate__fadeIn page-element" style="animation-delay: 0.1s;">
        <h1 class="translation-title">{{ translationData.title || '未命名 ' + (translationIndex || '') }}</h1>
        <div class="translation-meta">
          <span class="date-info">
            <i class="far fa-calendar"></i> {{ formatDate(translationData.createdAt) }}
          </span>
          <span class="time-info">
            <i class="far fa-clock"></i> {{ formatDuration(translationData.duration) }}
          </span>
        </div>
      </div>
      
      <!-- 进度条区域 -->
      <div class="progress-section animate__animated animate__fadeIn page-element" style="animation-delay: 0.2s;">
        <div class="time-display">
          <span class="current-time">{{ currentTimeDisplay }}</span>
          <span class="total-time">{{ totalTimeDisplay }}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" @click="updateProgress">
            <div class="progress-filled" :style="{ width: progressPercentage + '%' }"></div>
            <div class="progress-thumb" :style="{ left: progressPercentage + '%' }"></div>
          </div>
        </div>
      </div>
      
      <!-- 翻译内容区域 -->
      <div class="translation-content animate__animated animate__fadeIn page-element" style="animation-delay: 0.3s;">
        <div v-if="translationSegments.length === 0" class="empty-content">
          <i class="fas fa-file-alt"></i>
          <p>无翻译内容</p>
        </div>
        <div v-for="(segment, index) in translationSegments" :key="index" class="translation-segment">
          <div class="segment-time">{{ formatSegmentTime(segment.startTime) }}</div>
          <div class="segment-container">
            <div class="segment-original">
              <div class="language-label">原文</div>
              <div class="segment-text">{{ segment.originalText }}</div>
            </div>
            <div class="segment-translated">
              <div class="language-label">译文</div>
              <div class="segment-text">{{ segment.translatedText }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部控制栏 -->
      <div class="control-bar animate__animated animate__fadeIn page-element" style="animation-delay: 0.4s;">
        <button class="control-button rewind-button" @click="rewind">
          <i class="fas fa-backward"></i>
        </button>
        <button class="control-button play-button" @click="togglePlay">
          <i :class="['fas', isPlaying ? 'fa-pause' : 'fa-play']"></i>
        </button>
        <button class="control-button forward-button" @click="fastForward">
          <i class="fas fa-forward"></i>
        </button>
        <div class="playback-rate" @click="changePlaybackRate">
          <span>{{ playbackRate }}x</span>
        </div>
        <button class="control-button share-button" @click="shareTranslation">
          <i class="fas fa-share-alt"></i>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { getTranslationDetail } from '@/api/translation/save';
import 'animate.css';

const route = useRoute();
const router = useRouter();

// 页面状态
const isPageLeaving = ref(false);
const isLoading = ref(true);
const isPlaying = ref(false);
const currentTime = ref(0);
const playbackRate = ref(1.0);
const translationData = ref<any>({});
const translationIndex = ref<number | null>(null);
const audioPlayer = ref<HTMLAudioElement | null>(null);

// 计算属性
const totalDuration = computed(() => translationData.value?.duration || 0);

const currentTimeDisplay = computed(() => {
  return formatTime(currentTime.value);
});

const totalTimeDisplay = computed(() => {
  return formatTime(totalDuration.value);
});

const progressPercentage = computed(() => {
  if (!totalDuration.value) return 0;
  return (currentTime.value / totalDuration.value) * 100;
});

// 模拟的翻译片段数据
const translationSegments = computed(() => {
  if (!translationData.value || !translationData.value.originalText) {
    return [];
  }
  
  // 以下逻辑处理API返回的数据，将其分割为片段
  // 实际应用中，如果API直接返回分段数据，则直接使用即可
  const segments = [];
  
  // 假设我们有API返回的原文和译文，需要将其按照时间点分割
  // 这里我们根据句号、问号、感叹号等标点符号分割文本
  const originalText = translationData.value.originalText || '';
  const translatedText = translationData.value.translatedText || '';
  
  // 简单的分段处理示例
  // 在实际应用中，API可能会返回更结构化的数据
  const originalSentences = originalText.split(/(?<=[。？！.?!])/);
  const translatedSentences = translatedText.split(/(?<=[.?!])/);
  
  // 计算每个片段的起始时间
  // 这里简单地假设整个翻译时长平均分配到每个句子
  const totalDuration = translationData.value.duration || 0;
  const segmentCount = Math.max(originalSentences.length, translatedSentences.length);
  const timePerSegment = segmentCount > 0 ? totalDuration / segmentCount : 0;
  
  for (let i = 0; i < segmentCount; i++) {
    const startTime = Math.round(i * timePerSegment);
    segments.push({
      startTime,
      originalText: originalSentences[i] || '',
      translatedText: translatedSentences[i] || ''
    });
  }
  
  return segments;
});

// 方法
const goBack = () => {
  isPageLeaving.value = true;
  
  // 在返回前停止音频播放并清理资源
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    // 重要：移除事件监听器，防止返回时触发错误
    audioPlayer.value.removeEventListener('timeupdate', handleTimeUpdate);
    audioPlayer.value.removeEventListener('ended', handleAudioEnded);
    audioPlayer.value.removeEventListener('error', handleAudioError);
    audioPlayer.value.removeEventListener('canplay', handleCanPlay);
    // 清空音频源
    audioPlayer.value.src = '';
  }
  
  setTimeout(() => {
    router.back();
  }, 300);
};

const togglePlay = () => {
  if (!audioPlayer.value) return;
  
  isPlaying.value = !isPlaying.value;
  
  if (isPlaying.value) {
    // 如果没有音频源但有MP3路径，设置音频源
    if (!audioPlayer.value.src && translationData.value?.outputMp3Path) {
      audioPlayer.value.src = translationData.value.outputMp3Path;
      audioPlayer.value.playbackRate = playbackRate.value;
    }
    
    // 播放音频
    audioPlayer.value.play().catch(err => {
      console.error('播放失败:', err);
      isPlaying.value = false;
      showToast('播放失败，请重试');
    });
  } else {
    // 暂停音频
    audioPlayer.value.pause();
  }
};

// 获取翻译详情数据
const fetchTranslationDetail = async () => {
  const id = route.query.id as string;
  
  if (!id) {
    showToast('缺少翻译记录ID');
    goBack();
    return;
  }
  
  try {
    isLoading.value = true;
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    });
    
    // 调用API获取翻译详情
    const response = await getTranslationDetail(id);
    
      translationData.value = response;
      console.log('获取到翻译详情:', translationData.value);
      
      // 设置总时长等信息
      // 如果没有时长，设置默认值
      if (!translationData.value.duration) {
        translationData.value.duration = 30; // 默认30秒
      }
      
      // 设置索引编号（如果标题为空）
      if (!translationData.value.title) {
        const randomIndex = Math.floor(Math.random() * 10) + 1;
        translationIndex.value = randomIndex;
      }
      
      // 设置当前播放时间为0
      currentTime.value = 0;
      
      // 处理音频URL（如果有）
      if (translationData.value.outputMp3Path) {
        // 可以在这里处理音频相关逻辑
        console.log('音频路径:', translationData.value.outputMp3Path);
      }
  } catch (error) {
    console.error('获取翻译详情失败:', error);
    showToast('网络错误，请稍后重试');
    setTimeout(goBack, 1500);
  } finally {
    closeToast();
    isLoading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 格式化持续时间
const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// 格式化片段时间
const formatSegmentTime = (seconds: number) => {
  return formatDuration(seconds);
};

// 格式化时间（用于进度条显示）
const formatTime = (seconds: number) => {
  return formatDuration(seconds);
};

// 组件挂载时
onMounted(() => {
  // 创建音频播放器
  audioPlayer.value = new Audio();
  
  // 音频播放器事件处理
  audioPlayer.value.addEventListener('timeupdate', handleTimeUpdate);
  audioPlayer.value.addEventListener('ended', handleAudioEnded);
  audioPlayer.value.addEventListener('canplay', handleCanPlay);
  audioPlayer.value.addEventListener('error', handleAudioError);
  
  // 获取翻译详情
  fetchTranslationDetail();
  
  // 添加iOS样式类
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
  
  // 页面进入动画
  setTimeout(() => {
    const contentElements = document.querySelectorAll('.translation-detail-page > .page-element');
    contentElements.forEach((el, index) => {
      setTimeout(() => {
        (el as HTMLElement).classList.add('content-visible');
      }, index * 100);
    });
  }, 300);
});

// 组件卸载时
onUnmounted(() => {
  // 清理音频播放器
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.removeEventListener('timeupdate', handleTimeUpdate);
    audioPlayer.value.removeEventListener('ended', handleAudioEnded);
    audioPlayer.value.removeEventListener('canplay', handleCanPlay);
    audioPlayer.value.removeEventListener('error', handleAudioError);
    // 避免后续事件触发
    audioPlayer.value.src = '';
    audioPlayer.value.load(); // 强制清除缓冲区
    audioPlayer.value = null;
  }
  
  // 移除iOS样式类
  document.body.classList.remove('iOS-style');
});

// 处理音频时间更新
const handleTimeUpdate = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime;
  }
};

// 处理音频播放结束
const handleAudioEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = 0;
  }
};

// 音频可以播放的处理函数
const handleCanPlay = () => {
  console.log('音频可以播放');
};

// 音频错误处理函数
const handleAudioError = (e: Event) => {
  // 如果组件已经卸载，不处理错误
  if (!audioPlayer.value) return;
  
  console.error('音频加载错误:', e);
  // 避免在页面离开过程中显示错误提示
  if (!isPageLeaving.value) {
    showToast('音频加载失败');
  }
};

// 更新播放进度
const updateProgress = (e: MouseEvent) => {
  if (!audioPlayer.value) return;
  
  const progressBar = e.currentTarget as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const width = rect.width;
  const percentage = offsetX / width;
  
  // 计算新的当前时间
  const newTime = percentage * totalDuration.value;
  currentTime.value = newTime;
  
  // 更新音频播放器的当前时间
  audioPlayer.value.currentTime = newTime;
};

// 改变播放速率
const changePlaybackRate = () => {
  if (!audioPlayer.value) return;
  
  // 循环切换播放速率: 1.0 -> 1.5 -> 2.0 -> 0.75 -> 1.0
  const rates = [1.0, 1.5, 2.0, 0.75];
  const currentIndex = rates.indexOf(playbackRate.value);
  const nextIndex = (currentIndex + 1) % rates.length;
  playbackRate.value = rates[nextIndex];
  
  // 更新音频播放器的播放速率
  audioPlayer.value.playbackRate = playbackRate.value;
};

// 快进
const fastForward = () => {
  if (!audioPlayer.value) return;
  
  const newTime = Math.min(audioPlayer.value.currentTime + 10, totalDuration.value);
  audioPlayer.value.currentTime = newTime;
};

// 快退
const rewind = () => {
  if (!audioPlayer.value) return;
  
  const newTime = Math.max(audioPlayer.value.currentTime - 10, 0);
  audioPlayer.value.currentTime = newTime;
};

// 分享翻译内容
const shareTranslation = () => {
  if (!translationData.value) return;
  
  const shareText = `${translationData.value.title || '翻译记录'}\n` +
    `${translationData.value.sourceLanguage} → ${translationData.value.targetLanguage}\n` +
    `原文: ${translationData.value.originalText}\n` +
    `翻译: ${translationData.value.translatedText}`;
  
  // 复制到剪贴板
  navigator.clipboard.writeText(shareText)
    .then(() => showToast('已复制到剪贴板，可以分享给他人'))
    .catch(() => showToast('复制失败，请手动复制'));
};

// 跳转至AI总结页面
const navigateToAiSummary = () => {
  // 将当前翻译数据ID作为参数传递给AI总结页面
  const id = route.query.id as string;
  if (!id) {
    showToast('缺少翻译记录ID');
    return;
  }
  
  router.push({
    path: '/translation-ai-summary',
    query: { id }
  });
};
</script>

<style scoped>
.translation-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F9FA;
  transition: opacity 0.3s, transform 0.3s;
  position: relative;
  overflow: hidden;
}

/* 页面元素的基础动画样式 */
.translation-detail-page > .page-element {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.translation-detail-page > .page-element.content-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 页面离开动画 */
.page-leave-active {
  opacity: 0;
  transform: translateY(20px);
}

/* 加载状态 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 122, 255, 0.2);
  border-radius: 50%;
  border-top-color: #007AFF;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #8E8E93;
}

/* 空内容状态 */
.empty-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #8E8E93;
}

.empty-content i {
  font-size: 50px;
  margin-bottom: 16px;
}

.empty-content p {
  font-size: 16px;
}

/* 顶部标题栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 20px;
  background-color: #FFFFFF;
  position: relative;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 0 0 16px 16px;
  margin-bottom: 10px;
}

.back-button {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 18px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  transition: all 0.2s ease;
}

.back-button:active {
  transform: scale(0.95);
  background-color: rgba(0, 122, 255, 0.1);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  text-align: center;
  flex: 1;
}

.ai-button {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 16px;
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-button i {
  margin-right: 4px;
  font-size: 12px;
}

.ai-button:active {
  transform: scale(0.95);
  background-color: rgba(0, 122, 255, 0.2);
}

/* 标题部分 */
.title-section {
  padding: 16px 20px;
  background-color: #FFFFFF;
  margin: 0 12px 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.translation-title {
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 10px;
}

.translation-meta {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #8E8E93;
}

.date-info, .time-info {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.date-info i, .time-info i {
  margin-right: 6px;
}

/* 进度条区域 */
.progress-section {
  padding: 0 20px 16px;
  margin: 0 12px 16px;
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #8E8E93;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.progress-bar-container {
  padding: 0 2px;
}

.progress-bar {
  height: 4px;
  background-color: #E5E5EA;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}

.progress-filled {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: #007AFF;
  border-radius: 2px;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: #007AFF;
  border-radius: 50%;
  cursor: pointer;
}

/* 翻译内容区域 */
.translation-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
  -webkit-overflow-scrolling: touch;
}

.translation-segment {
  margin-bottom: 24px;
}

.segment-time {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.segment-container {
  background-color: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.segment-original, .segment-translated {
  padding: 16px;
}

.segment-original {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.language-label {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 8px;
  font-weight: 500;
}

.segment-text {
  font-size: 16px;
  line-height: 1.5;
  color: #000000;
}

.segment-translated .segment-text {
  color: #007AFF;
}

/* 底部控制栏 */
.control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background-color: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  margin-top: 10px;
}

.control-button {
  background: none;
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:active {
  transform: scale(0.95);
  background-color: rgba(0, 122, 255, 0.1);
}

.play-button {
  background-color: #007AFF;
  color: #FFFFFF;
  width: 54px;
  height: 54px;
  border-radius: 27px;
  box-shadow: 0 4px 10px rgba(0, 122, 255, 0.3);
}

.play-button:active {
  background-color: #0067DB;
  box-shadow: 0 2px 5px rgba(0, 122, 255, 0.3);
}

.playback-rate {
  font-size: 16px;
  font-weight: 600;
  color: #007AFF;
  cursor: pointer;
}

/* 为iOS设备添加的样式 */
:global(.iOS-style) {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
</style> 