<template>
  <!-- 顶部标题栏 -->
  <div class="header animate__animated animate__fadeInDown">
    <div class="back-button" @click="goBack">
      <i class="fas fa-chevron-left"></i>
    </div>
    <div class="header-title">实时语音识别</div>
    <div class="header-actions">
      <i class="fas fa-ellipsis-h"></i>
    </div>
  </div>
  
  <!-- 主要内容区 -->
  <div class="main-content">
    <!-- 语言选择区域 -->
    <div class="language-selector-container animate__animated animate__fadeIn" style="animation-delay: 0.1s;">
      <div class="language-row">
        <div class="language-column source">
          <div class="language-label">源语言</div>
          <div class="language-select" @click="showSourceLanguagePopup = true">
            <span>{{ sourceLanguage }}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        <div class="language-switch" @click="switchLanguages" :class="{ 'rotating': isRotating }">
          <i class="fas fa-exchange-alt"></i>
        </div>
        <div class="language-column target">
          <div class="language-label">目标语言</div>
          <div class="language-select" @click="showTargetLanguagePopup = true">
            <span>{{ targetLanguage }}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 语音识别区域 -->
    <div class="recognition-container animate__animated animate__fadeIn" style="animation-delay: 0.2s;">
      <div 
        :class="['mic-button', { 'recording': isRecording }]" 
        @click="toggleRecording"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <i class="fas" :class="isRecording ? 'fa-stop' : 'fa-microphone'"></i>
      </div>
      <div class="recording-status">
        {{ isRecording ? `录音中 ${formatTime(recordingTime)}` : '点击开始录音' }}
      </div>
      
      <!-- 音频可视化区域 -->
      <div v-if="isRecording" class="waveform-container">
        <canvas id="audioVisualizer" width="200" height="50" class="audio-visualizer"></canvas>
        
        <!-- 备用波形显示 -->
        <div v-if="showFallbackWaveform" class="waveform active">
          <div v-for="(height, index) in waveformHeights" :key="index" 
               class="wave-bar" 
               :style="{ height: height + 'px' }"></div>
        </div>
      </div>
    </div>
    
    <!-- 识别结果区域 -->
    <div class="transcript-container animate__animated animate__fadeIn" style="animation-delay: 0.3s;" v-if="recognizedText || translatedText">
      <div class="transcript-header">
        <div class="transcript-title">转录内容</div>
        <div class="transcript-actions">
          <button class="action-button" @click="copyTranscript" :class="{ 'action-success': copySuccess }">
            <i class="far" :class="copySuccess ? 'fa-check' : 'fa-copy'"></i>
          </button>
          <button class="action-button" @click="downloadTranscript" :class="{ 'action-loading': downloadLoading, 'action-success': downloadSuccess }">
            <i class="fas" :class="downloadLoading ? 'fa-spinner fa-spin' : downloadSuccess ? 'fa-check' : 'fa-download'"></i>
          </button>
          <button class="action-button" @click="clearTranscript">
            <i class="far fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <div class="transcript-content">
        <div class="transcript-segment">
          <div class="segment-time">{{ formatTime(recordingTime) }}</div>
          <div class="source-text">{{ recognizedText }}</div>
          <div class="divider"></div>
          <div class="translated-text">{{ translatedText }}</div>
          <div class="segment-actions">
            <button class="segment-action-button" @click="copySegment">
              <i class="far fa-copy"></i> 复制
            </button>
            <button class="segment-action-button" @click="speakSegment">
              <i class="fas fa-volume-up"></i> 朗读
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div class="transcript-container animate__animated animate__fadeIn" style="animation-delay: 0.3s;" v-else>
      <div class="transcript-header">
        <div class="transcript-title">转录内容</div>
        <div class="transcript-actions">
          <button class="action-button" disabled style="opacity: 0.5;">
            <i class="far fa-copy"></i>
          </button>
          <button class="action-button" disabled style="opacity: 0.5;">
            <i class="fas fa-download"></i>
          </button>
          <button class="action-button" disabled style="opacity: 0.5;">
            <i class="far fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <div class="transcript-empty">
        <i class="fas fa-microphone-slash empty-icon animate__animated animate__fadeIn" style="animation-delay: 0.5s;"></i>
        <div class="empty-text animate__animated animate__fadeIn" style="animation-delay: 0.6s;">尚未录制内容</div>
        <div class="empty-subtext animate__animated animate__fadeIn" style="animation-delay: 0.7s;">点击上方麦克风按钮开始录音</div>
      </div>
    </div>
    
    <!-- 使用提示 -->
    <div class="usage-tips animate__animated animate__fadeIn" style="animation-delay: 0.4s;">
      <i class="fas fa-info-circle tips-icon"></i>
      <div class="tips-content">
        <div class="tips-title">使用提示</div>
        <div class="tips-text">
          请将手机放在靠近声音源的位置<br>
          保持环境安静以获得更好的识别效果<br>
          识别结果会实时显示在屏幕上<br>
          可以随时停止录音并保存结果
        </div>
      </div>
    </div>
  </div>
  
  <!-- 语言选择弹出层 -->
  <van-popup v-model:show="showSourceLanguagePopup" position="bottom" round>
    <van-picker
      title="选择源语言"
      :columns="languageOptions"
      @confirm="onSourceLanguageConfirm"
      @cancel="showSourceLanguagePopup = false"
      show-toolbar
    />
  </van-popup>
  
  <van-popup v-model:show="showTargetLanguagePopup" position="bottom" round>
    <van-picker
      title="选择目标语言"
      :columns="languageOptions"
      @confirm="onTargetLanguageConfirm"
      @cancel="showTargetLanguagePopup = false"
      show-toolbar
    />
  </van-popup>
  
  <!-- 操作成功提示 -->
  <van-toast id="van-toast" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';

// 声明WebKit AudioContext接口
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const router = useRouter();

// 语言选择
const sourceLanguage = ref('英语');
const targetLanguage = ref('中文');
const showSourceLanguagePopup = ref(false);
const showTargetLanguagePopup = ref(false);
const languageOptions = ['英语', '中文', '日语', '韩语', '法语', '德语', '西班牙语', '俄语'];
const isRotating = ref(false);

// 录音状态
const isRecording = ref(false);
const recordingTime = ref(0);
const recognizedText = ref('');
const translatedText = ref('');
const longPressTimer = ref<number | null>(null);
const isLongPress = ref(false);

// 音频可视化相关
const audioContext = ref<AudioContext | null>(null);
const analyser = ref<AnalyserNode | null>(null);
const dataArray = ref<Uint8Array | null>(null);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioStream = ref<MediaStream | null>(null);
const showFallbackWaveform = ref(false);
const waveformHeights = ref<number[]>(Array(15).fill(0).map(() => Math.floor(Math.random() * 25) + 5));
let waveformInterval: number | null = null;

// 操作状态
const copySuccess = ref(false);
const downloadLoading = ref(false);
const downloadSuccess = ref(false);

// 定时器
let timer: number | null = null;
let visualizerTimer: number | null = null;

// 页面加载动画
onMounted(() => {
  // 检查浏览器对AudioContext的支持
  if (window.AudioContext === undefined && window.webkitAudioContext === undefined) {
    showFallbackWaveform.value = true;
  }
  
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
});

// 返回上一页
const goBack = () => {
  // 添加页面退出动画
  const page = document.querySelector('.recognition-page');
  if (page) {
    page.classList.add('page-leave-active', 'page-leave-to');
    setTimeout(() => {
      router.back();
    }, 300);
  } else {
    router.back();
  }
};

// 切换语言
const switchLanguages = () => {
  const temp = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = temp;
  
  // 添加旋转动画
  isRotating.value = true;
  setTimeout(() => {
    isRotating.value = false;
  }, 500);
  
  // 添加切换动画效果
  const sourceEl = document.querySelector('.language-column.source .language-select');
  const targetEl = document.querySelector('.language-column.target .language-select');
  
  if (sourceEl && targetEl) {
    sourceEl.classList.add('switch-animation');
    targetEl.classList.add('switch-animation');
    
    setTimeout(() => {
      sourceEl.classList.remove('switch-animation');
      targetEl.classList.remove('switch-animation');
    }, 500);
  }
  
  // 显示切换成功提示
  showToast({
    message: '语言已切换',
    icon: 'success',
    position: 'bottom'
  });
};

// 确认源语言选择
const onSourceLanguageConfirm = (value: string) => {
  // 添加选择动画
  const sourceEl = document.querySelector('.language-column.source .language-select');
  if (sourceEl) {
    sourceEl.classList.add('select-animation');
    setTimeout(() => {
      sourceEl.classList.remove('select-animation');
    }, 300);
  }
  
  sourceLanguage.value = value;
  showSourceLanguagePopup.value = false;
};

// 确认目标语言选择
const onTargetLanguageConfirm = (value: string) => {
  // 添加选择动画
  const targetEl = document.querySelector('.language-column.target .language-select');
  if (targetEl) {
    targetEl.classList.add('select-animation');
    setTimeout(() => {
      targetEl.classList.remove('select-animation');
    }, 300);
  }
  
  targetLanguage.value = value;
  showTargetLanguagePopup.value = false;
};

// 处理长按开始
const handleTouchStart = () => {
  // 长按开始录音
  longPressTimer.value = window.setTimeout(() => {
    isLongPress.value = true;
    startRecording();
    
    // 添加触觉反馈 (如果设备支持)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, 500);
};

// 处理长按结束
const handleTouchEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  
  if (isLongPress.value) {
    isLongPress.value = false;
    stopRecording();
    
    // 添加触觉反馈 (如果设备支持)
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
};

// 切换录音状态
const toggleRecording = () => {
  if (!isLongPress.value) {
    if (isRecording.value) {
      stopRecording();
    } else {
      startRecording();
    }
    
    // 添加触觉反馈 (如果设备支持)
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
};

// 开始录音
const startRecording = async () => {
  try {
    // 请求麦克风权限
    audioStream.value = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 创建音频上下文
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
    analyser.value = audioContext.value.createAnalyser();
    const source = audioContext.value.createMediaStreamSource(audioStream.value);
    source.connect(analyser.value);
    
    // 配置分析器
    analyser.value.fftSize = 256;
    const bufferLength = analyser.value.frequencyBinCount;
    dataArray.value = new Uint8Array(bufferLength);
    
    // 创建媒体录制器
    mediaRecorder.value = new MediaRecorder(audioStream.value);
    
    // 开始录制
    mediaRecorder.value.start();
    isRecording.value = true;
    recordingTime.value = 0;
    
    // 启动计时器
    timer = window.setInterval(() => {
      recordingTime.value++;
      
      // 模拟实时语音识别
      if (recordingTime.value % 3 === 0) {
        simulateRecognition();
      }
    }, 1000);
    
    // 启动可视化更新
    startVisualizer();
    
    // 启动备用波形动画
    if (showFallbackWaveform.value) {
      startFallbackWaveform();
    }
    
    // 显示录音开始提示
    showToast({
      message: '录音已开始',
      icon: 'success',
      position: 'bottom'
    });
    
  } catch (error) {
    console.error('获取麦克风权限失败:', error);
    showToast({
      message: '无法访问麦克风，请确保已授予权限',
      icon: 'fail',
      position: 'bottom'
    });
  }
};

// 停止录音
const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
    
    // 停止所有计时器
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    
    if (visualizerTimer) {
      cancelAnimationFrame(visualizerTimer);
      visualizerTimer = null;
    }
    
    if (waveformInterval) {
      clearInterval(waveformInterval);
      waveformInterval = null;
    }
    
    // 关闭音频流
    if (audioStream.value) {
      audioStream.value.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    
    // 关闭音频上下文
    if (audioContext.value) {
      audioContext.value.close();
    }
    
    // 显示保存成功提示
    if (recognizedText.value) {
      showToast({
        message: '录音已保存',
        icon: 'success',
        position: 'bottom'
      });
    }
  }
};

// 开始音频可视化
const startVisualizer = () => {
  const canvas = document.getElementById('audioVisualizer') as HTMLCanvasElement;
  if (!canvas || !analyser.value || !dataArray.value) return;
  
  const canvasCtx = canvas.getContext('2d');
  if (!canvasCtx) return;
  
  const updateVisualizer = () => {
    visualizerTimer = requestAnimationFrame(updateVisualizer);
    
    if (!analyser.value || !dataArray.value) return;
    
    analyser.value.getByteFrequencyData(dataArray.value);
    
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.value.length) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < dataArray.value.length; i++) {
      barHeight = dataArray.value[i] / 2;
      
      // 使用渐变色 - iOS风格
      const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, 'rgba(255, 59, 48, 0.7)');  // iOS红色
      gradient.addColorStop(1, 'rgba(255, 59, 48, 1)');
      
      canvasCtx.fillStyle = gradient;
      
      // 圆角柱状图
      canvasCtx.beginPath();
      canvasCtx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
      canvasCtx.fill();
      
      x += barWidth + 1;
    }
  };
  
  updateVisualizer();
};

// 启动备用波形动画
const startFallbackWaveform = () => {
  waveformInterval = window.setInterval(() => {
    for (let i = 0; i < waveformHeights.value.length; i++) {
      waveformHeights.value[i] = Math.floor(Math.random() * 25) + 5;
    }
  }, 100);
};

// 模拟实时语音识别
const simulateRecognition = () => {
  const recognitionSamples = [
    "今天我们讨论国际贸易理论的基础概念。",
    "首先，我们需要理解比较优势原理。",
    "这个理论由大卫·李嘉图提出，是国际贸易的基础。",
    "比较优势指的是一个国家能够以相对较低的机会成本生产某种商品。",
    "即使一个国家在所有商品的生产上都处于绝对劣势，它仍然可以从贸易中获益。"
  ];
  
  const translationSamples = [
    "Today we will discuss the basic concepts of international trade theory.",
    "First, we need to understand the principle of comparative advantage.",
    "This theory was proposed by David Ricardo and is the foundation of international trade.",
    "Comparative advantage refers to a country's ability to produce a good at a relatively lower opportunity cost.",
    "Even if a country has an absolute disadvantage in all goods, it can still benefit from trade."
  ];
  
  const index = recordingTime.value % recognitionSamples.length;
  
  // 添加打字机效果
  const newText = recognitionSamples[index];
  const currentLength = recognizedText.value.length;
  const targetLength = newText.length;
  
  if (currentLength < targetLength) {
    // 逐字添加文本
    let i = currentLength;
    const typeInterval = setInterval(() => {
      recognizedText.value = newText.substring(0, i + 1);
      i++;
      if (i >= targetLength) {
        clearInterval(typeInterval);
        
        // 添加翻译文本的淡入效果
        setTimeout(() => {
          translatedText.value = translationSamples[index];
        }, 300);
      }
    }, 50);
  } else {
    recognizedText.value = newText;
    translatedText.value = translationSamples[index];
  }
};

// 复制转录内容
const copyTranscript = () => {
  const textToCopy = `${recognizedText.value}\n\n${translatedText.value}`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    // 显示复制成功状态
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
    
    showToast({
      message: '已复制到剪贴板',
      icon: 'success',
      position: 'bottom'
    });
  });
};

// 复制当前段落
const copySegment = () => {
  const textToCopy = `${recognizedText.value}\n\n${translatedText.value}`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast({
      message: '已复制当前段落',
      icon: 'success',
      position: 'bottom'
    });
  });
};

// 朗读当前段落
const speakSegment = () => {
  if ('speechSynthesis' in window) {
    // 使用浏览器的语音合成API
    const utterance = new SpeechSynthesisUtterance(translatedText.value);
    utterance.lang = sourceLanguage.value === '中文' ? 'zh-CN' : 'en-US';
    window.speechSynthesis.speak(utterance);
    
    showToast({
      message: '正在朗读...',
      position: 'bottom'
    });
  } else {
    showToast({
      message: '您的浏览器不支持语音合成',
      icon: 'fail',
      position: 'bottom'
    });
  }
};

// 下载转录内容
const downloadTranscript = () => {
  // 显示加载状态
  downloadLoading.value = true;
  
  setTimeout(() => {
    const textToDownload = `${recognizedText.value}\n\n${translatedText.value}`;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `转录内容_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 显示下载成功状态
    downloadLoading.value = false;
    downloadSuccess.value = true;
    setTimeout(() => {
      downloadSuccess.value = false;
    }, 2000);
    
    showToast({
      message: '下载成功',
      icon: 'success',
      position: 'bottom'
    });
  }, 1000);
};

// 清除转录内容
const clearTranscript = () => {
  // 添加清除动画
  const content = document.querySelector('.transcript-content');
  if (content) {
    content.classList.add('animate__animated', 'animate__fadeOut');
    setTimeout(() => {
      recognizedText.value = '';
      translatedText.value = '';
      content.classList.remove('animate__animated', 'animate__fadeOut');
      
      // 添加空状态淡入动画
      setTimeout(() => {
        const empty = document.querySelector('.transcript-empty');
        if (empty) {
          empty.classList.add('animate__animated', 'animate__fadeIn');
          setTimeout(() => {
            empty.classList.remove('animate__animated', 'animate__fadeIn');
          }, 500);
        }
      }, 100);
    }, 300);
  } else {
    recognizedText.value = '';
    translatedText.value = '';
  }
  
  showToast({
    message: '已清除内容',
    icon: 'success',
    position: 'bottom'
  });
};

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 组件卸载时清理资源
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
  
  if (visualizerTimer) {
    cancelAnimationFrame(visualizerTimer);
  }
  
  if (waveformInterval) {
    clearInterval(waveformInterval);
  }
  
  if (audioStream.value) {
    audioStream.value.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  }
  
  if (audioContext.value) {
    audioContext.value.close();
  }
});
</script>

<style scoped>
/* 页面容器 */
.recognition-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-color, #F2F2F7);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 顶部标题栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background-color: var(--background-light, #FFFFFF);
  border-bottom: 1px solid var(--border-color, #E5E5EA);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  font-size: 18px;
  color: var(--primary-color, #007AFF);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition: opacity 0.2s ease;
}

.back-button:active {
  opacity: 0.7;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  flex: 1;
  text-align: center;
}

.header-actions {
  font-size: 18px;
  color: var(--primary-color, #007AFF);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  transition: opacity 0.2s ease;
}

.header-actions:active {
  opacity: 0.7;
}

.main-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
}

.language-selector-container {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  margin-bottom: 16px;
}

.language-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
}

.language-column {
  flex: 1;
}

.language-label {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 8px;
}

.language-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #F5F5F5;
  border-radius: 24px;
  padding: 12px 16px;
  font-size: 15px;
  color: var(--text-primary, #000000);
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-select:active {
  background-color: #EBEBEB;
  transform: scale(0.98);
}

.language-select.select-animation {
  animation: selectPulse 0.3s ease;
}

.language-select.switch-animation {
  animation: switchSlide 0.5s ease;
}

.language-select i {
  font-size: 12px;
  color: var(--text-secondary, #8E8E93);
}

.language-switch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: transform 0.3s ease, background-color 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.language-switch i {
  font-size: 14px;
  color: #007AFF;
  transition: transform 0.3s ease;
}

.language-switch:active {
  transform: translate(-50%, -50%) scale(0.95);
  background-color: #F5F5F5;
}

.language-switch.rotating i {
  animation: rotate360 0.5s ease;
}

.recognition-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  background-color: var(--background-light, #FFFFFF);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.mic-button {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #FF3B30;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 10px rgba(255, 59, 48, 0.3);
  -webkit-tap-highlight-color: transparent;
}

.mic-button i {
  font-size: 32px;
  color: #FFFFFF;
}

.mic-button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.2);
}

.mic-button.recording {
  animation: pulse 1.5s infinite;
}

.recording-status {
  font-size: 15px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 16px;
}

.waveform-container {
  width: 200px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.audio-visualizer {
  width: 200px;
  height: 50px;
}

.waveform {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 50px;
  width: 200px;
}

.wave-bar {
  width: 4px;
  background-color: #FF3B30;
  border-radius: 2px;
  transition: height 0.1s ease;
}

.transcript-container {
  background-color: var(--background-light, #FFFFFF);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.transcript-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #E5E5EA);
}

.transcript-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.transcript-actions {
  display: flex;
  gap: 16px;
}

.action-button {
  color: #007AFF;
  background: none;
  border: none;
  font-size: 18px;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.action-button:active {
  transform: scale(0.9);
  opacity: 0.7;
}

.action-success {
  color: #4CD964;
}

.action-loading {
  color: #8E8E93;
}

.transcript-content {
  padding: 16px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary, #000000);
  min-height: 100px;
}

.transcript-segment {
  position: relative;
}

.segment-time {
  font-size: 12px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 8px;
}

.source-text {
  margin-bottom: 10px;
  font-size: 15px;
  line-height: 1.5;
}

.divider {
  height: 1px;
  background-color: var(--border-color, #E5E5EA);
  margin: 10px 0;
}

.translated-text {
  color: var(--text-secondary, #8E8E93);
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.segment-actions {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.segment-action-button {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  -webkit-tap-highlight-color: transparent;
}

.segment-action-button:active {
  background-color: rgba(0, 122, 255, 0.1);
}

.segment-action-button i {
  font-size: 14px;
}

.transcript-empty {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}

.empty-icon {
  font-size: 48px;
  color: #C7C7CC;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #000000);
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
  text-align: center;
}

/* 使用提示 */
.usage-tips {
  background-color: var(--background-light, #FFFFFF);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.tips-icon {
  font-size: 18px;
  color: var(--warning-color, #FF9500);
  margin-right: 12px;
  margin-top: 2px;
}

.tips-content {
  flex: 1;
}

.tips-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 6px;
}

.tips-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary, #8E8E93);
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 59, 48, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0);
  }
}

@keyframes rotate360 {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes selectPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.98);
    background-color: #EBEBEB;
  }
  100% {
    transform: scale(1);
    background-color: #F5F5F5;
  }
}

@keyframes switchSlide {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  20% {
    transform: translateX(10px);
    opacity: 0;
  }
  80% {
    transform: translateX(-10px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* iOS风格滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
