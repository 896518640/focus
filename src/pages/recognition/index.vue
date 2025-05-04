<template>
  <!-- 顶部标题栏 -->
  <div class="header animate__animated animate__fadeInDown">
    <div class="back-button" @click="goBack">
      <i class="fas fa-chevron-left"></i>
    </div>
    <div class="header-title">实时语音识别</div>
    <div class="header-actions">
      <i class="fas fa-sliders-h" @click="toggleAdvancedSettings"></i>
    </div>
  </div>
  
  <!-- 主要内容区 -->
  <div class="main-content">
    <!-- 语言选择区域 -->
    <div class="language-selector-container animate__animated animate__fadeIn" style="animation-delay: 0.1s;">
      <div class="language-row">
        <div class="language-column source">
          <div class="language-label">源语言</div>
          <div class="language-select" @click="showSourceLanguagePopup = true" style="position: relative; z-index: 10;">
            <span>{{ sourceLanguage }}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        <div class="language-switch" @click="switchLanguages" :class="{ 'rotating': isRotating }">
          <i class="fas fa-exchange-alt"></i>
        </div>
        <div class="language-column target">
          <div class="language-label">目标语言</div>
          <div class="language-select" @click="showTargetLanguagePopup = true" style="position: relative; z-index: 10;">
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
    <div class="transcript-container animate__animated animate__fadeIn" style="animation-delay: 0.3s;" v-if="transcriptSegments.length > 0">
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
      
      <!-- 摘要和章节内容，当轮询完成时显示 -->
      <div v-if="resultPollingComplete && hasAnySummaryContent" class="summary-container">
        <div class="summary-header">
          <i class="fas fa-lightbulb summary-icon"></i>
          <span class="summary-title">内容摘要</span>
          <button class="refresh-summary-btn" @click="handleRefreshSummary">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
        
        <!-- 段落摘要 -->
        <div v-if="summaryResult.paragraphs?.length" class="summary-section">
          <div class="summary-type-title">摘要概述</div>
          <div v-for="(paragraph, index) in summaryResult.paragraphs" :key="'p'+index" class="summary-paragraph">
            {{ paragraph }}
          </div>
        </div>
        
        <!-- 章节速览 -->
        <div v-if="processedChapters.length" class="summary-section">
          <div class="summary-type-title">章节速览</div>
          <div class="chapters-list">
            <div v-for="(chapter, index) in processedChapters" :key="'c'+index" class="chapter-item">
              <div class="chapter-number">{{ index + 1 }}</div>
              <div class="chapter-content">
                <div class="chapter-title">{{ chapter.title || `章节 ${index + 1}` }}</div>
                <div class="chapter-summary">{{ chapter.summary || chapter }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 问答摘要 -->
        <div v-if="summaryResult.questionsAnswering?.length" class="summary-section">
          <div class="summary-type-title">问答摘要</div>
          <div class="qa-list">
            <div v-for="(qa, index) in summaryResult.questionsAnswering" :key="'qa'+index" class="qa-item">
              <div class="qa-question">Q: {{ qa.question || '问题' }}</div>
              <div class="qa-answer">A: {{ qa.answer || qa }}</div>
            </div>
          </div>
        </div>
        
        <!-- 对话摘要 -->
        <div v-if="summaryResult.conversations?.length" class="summary-section">
          <div class="summary-type-title">对话摘要</div>
          <div class="conversation-list">
            <div v-for="(conv, index) in summaryResult.conversations" :key="'conv'+index" class="conversation-item">
              {{ conv }}
            </div>
          </div>
        </div>
        
        <!-- 文本润色 -->
        <div v-if="processedTextPolish.length" class="summary-section">
          <div class="summary-type-title">润色文本</div>
          <div class="text-polish">
            <div v-for="(polish, index) in processedTextPolish" :key="'polish'+index" class="polish-item">
              {{ polish }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 正在获取摘要结果的提示 -->
      <div v-if="isPollingResult && !resultPollingComplete" class="polling-indicator">
        <div class="polling-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div class="polling-text">正在生成摘要...</div>
      </div>
      
      <div class="transcript-content">
        <div v-for="(segment, index) in transcriptSegments" :key="index" class="transcript-segment">
          <div class="segment-time">{{ formatTime(segment.timestamp) }}</div>
          <div class="source-text">{{ segment.text }}</div>
          <div class="divider"></div>
          <div class="translated-text">{{ segment.translation }}</div>
          <div class="segment-actions">
            <button class="segment-action-button" @click="copySegment(segment)">
              <i class="far fa-copy"></i> 复制
            </button>
            <button class="segment-action-button" @click="speakSegment(segment)">
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
  <div class="custom-popup-overlay" v-show="showSourceLanguagePopup" @click="showSourceLanguagePopup = false"></div>
  <div class="custom-popup" v-show="showSourceLanguagePopup">
    <div class="custom-popup-header">
      <div class="custom-popup-title">选择源语言</div>
      <div class="custom-popup-close" @click="showSourceLanguagePopup = false">
        <i class="fas fa-times"></i>
      </div>
    </div>
    <div class="custom-popup-content">
      <div 
        v-for="lang in languageOptions" 
        :key="lang" 
        class="custom-popup-item"
        @click="selectSourceLanguage(lang)"
      >
        {{ lang }}
      </div>
    </div>
  </div>
  
  <div class="custom-popup-overlay" v-show="showTargetLanguagePopup" @click="showTargetLanguagePopup = false"></div>
  <div class="custom-popup" v-show="showTargetLanguagePopup">
    <div class="custom-popup-header">
      <div class="custom-popup-title">选择目标语言</div>
      <div class="custom-popup-close" @click="showTargetLanguagePopup = false">
        <i class="fas fa-times"></i>
      </div>
    </div>
    <div class="custom-popup-content">
      <div 
        v-for="lang in languageOptions" 
        :key="lang" 
        class="custom-popup-item"
        @click="selectTargetLanguage(lang)"
      >
        {{ lang }}
      </div>
    </div>
  </div>
  
  <!-- 高级设置弹出层 -->
  <van-popup v-model:show="showAdvancedSettings" position="right" round :style="{ width: '85%', height: '100%' }">
    <div class="advanced-settings-container">
      <div class="advanced-settings-header">
        <div class="advanced-settings-title">高级设置</div>
        <div class="advanced-settings-close" @click="showAdvancedSettings = false">
          <i class="fas fa-times"></i>
        </div>
      </div>
      
      <div class="advanced-settings-content">
        <!-- 转录设置部分 -->
        <div class="settings-section">
          <div class="settings-section-title">转录设置</div>
          
          <!-- 多语种设置 (仅当源语言选择多语种时显示) -->
          <div class="settings-item" v-if="sourceLanguage === '多语种'">
            <div class="settings-item-label">多语种提示</div>
            <div class="settings-item-desc">选择希望系统识别的语言种类</div>
            <van-checkbox-group v-model="advancedSettings.languageHints">
              <van-checkbox v-for="lang in languageHintOptions" :key="lang.value" :name="lang.value" shape="square">
                {{ lang.text }}
              </van-checkbox>
            </van-checkbox-group>
          </div>
          
          <!-- 说话人分离功能 -->
          <div class="settings-item">
            <div class="settings-item-label">说话人分离</div>
            <div class="settings-item-desc">用于多人对话场景，自动分离不同说话人</div>
            <van-switch v-model="advancedSettings.diarizationEnabled" size="24px" />
          </div>
          
          <!-- 说话人数量 (仅当开启说话人分离时显示) -->
          <div class="settings-item" v-if="advancedSettings.diarizationEnabled">
            <div class="settings-item-label">说话人数量</div>
            <div class="settings-item-desc">设置对话中的参与人数</div>
            <van-stepper v-model="advancedSettings.speakerCount" min="2" max="10" theme="round" />
          </div>
          
          <!-- 结果输出等级 -->
          <div class="settings-item">
            <div class="settings-item-label">转录结果等级</div>
            <div class="settings-item-desc">设置识别结果的实时性</div>
            <van-radio-group v-model="advancedSettings.transcriptionOutputLevel" direction="horizontal">
              <van-radio name="1">仅完整句子</van-radio>
              <van-radio name="2">包含中间结果</van-radio>
            </van-radio-group>
          </div>
        </div>
        
        <!-- 翻译设置部分 -->
        <div class="settings-section">
          <div class="settings-section-title">翻译设置</div>
          
          <!-- 是否启用翻译 -->
          <div class="settings-item">
            <div class="settings-item-label">启用翻译</div>
            <div class="settings-item-desc">开启实时翻译功能</div>
            <van-switch v-model="advancedSettings.translationEnabled" size="24px" />
          </div>
          
          <!-- 翻译结果等级 (仅当启用翻译时显示) -->
          <div class="settings-item" v-if="advancedSettings.translationEnabled">
            <div class="settings-item-label">翻译结果等级</div>
            <div class="settings-item-desc">设置翻译结果的实时性</div>
            <van-radio-group v-model="advancedSettings.translationOutputLevel" direction="horizontal">
              <van-radio name="1">仅完整句子</van-radio>
              <van-radio name="2">包含中间结果</van-radio>
            </van-radio-group>
          </div>
        </div>
        
        <!-- 增强功能部分 -->
        <div class="settings-section">
          <div class="settings-section-title">增强功能</div>
          
          <!-- 章节速览 -->
          <div class="settings-item">
            <div class="settings-item-label">章节速览</div>
            <div class="settings-item-desc">自动生成段落标题和概要</div>
            <van-switch v-model="advancedSettings.autoChaptersEnabled" size="24px" />
          </div>
          
          <!-- 摘要总结 -->
          <div class="settings-item">
            <div class="settings-item-label">摘要总结</div>
            <div class="settings-item-desc">自动生成内容摘要</div>
            <van-switch v-model="advancedSettings.summarizationEnabled" size="24px" />
          </div>
          
          <!-- 摘要类型 (仅当开启摘要总结时显示) -->
          <div class="settings-item" v-if="advancedSettings.summarizationEnabled">
            <div class="settings-item-label">摘要类型</div>
            <div class="settings-item-desc">选择摘要生成方式</div>
            <van-checkbox-group v-model="advancedSettings.summarizationTypes" direction="horizontal" class="summarization-types">
              <van-checkbox shape="square" name="Paragraph" class="summarization-type">段落摘要</van-checkbox>
              <van-checkbox shape="square" name="Conversational" class="summarization-type">对话摘要</van-checkbox>
              <van-checkbox shape="square" name="QuestionsAnswering" class="summarization-type">问答摘要</van-checkbox>
              <van-checkbox shape="square" name="MindMap" class="summarization-type">思维导图</van-checkbox>
            </van-checkbox-group>
          </div>
          
          <!-- 口语书面化 -->
          <div class="settings-item">
            <div class="settings-item-label">口语书面化</div>
            <div class="settings-item-desc">将口语表达优化为书面语</div>
            <van-switch v-model="advancedSettings.textPolishEnabled" size="24px" />
          </div>
        </div>
      </div>
      
      <div class="advanced-settings-footer">
        <van-button type="primary" block @click="saveAdvancedSettings">保存设置</van-button>
      </div>
    </div>
  </van-popup>
  
  <!-- 操作成功提示 -->
  <van-toast id="van-toast" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import axios from 'axios';

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
const languageOptions = ['英语', '中文', '日语', '韩语', '法语', '德语', '西班牙语', '俄语', '粤语', '多语种'];
const isRotating = ref(false);

// 映射显示语言到API语言代码
const languageCodeMap = {
  '英语': 'en',
  '中文': 'cn',
  '日语': 'ja',
  '韩语': 'ko',
  '法语': 'fr',
  '德语': 'de',
  '俄语': 'ru',
  '西班牙语': 'es',
  '粤语': 'yue',
  '多语种': 'multilingual'
};

// 语言提示选项（多语种模式使用）
const languageHintOptions = [
  { text: '中文', value: 'cn' },
  { text: '英语', value: 'en' },
  { text: '日语', value: 'ja' },
  { text: '韩语', value: 'ko' }
];

// 录音状态
const isRecording = ref(false);
const recordingTime = ref(0);
const isLongPress = ref(false);
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);

// 存储所有识别的句子段落
interface TranscriptSegment {
  index: number;
  text: string;
  translation: string;
  timestamp: number;
}
const transcriptSegments = ref<TranscriptSegment[]>([]);
// 当前正在处理的句子索引
const currentSegmentIndex = ref<number | null>(null);

// 摘要相关状态
const summaryResult = ref<{
  paragraphs?: string[];
  conversations?: string[];
  questionsAnswering?: { question: string, answer: string }[];
  mindMap?: any;
  chapters?: any;
  textPolish?: any;
}>({});
const isPollingResult = ref(false);
const resultPollingComplete = ref(false);

// 处理后的章节数据
const processedChapters = computed(() => {
  if (summaryResult.value.chapters && summaryResult.value.chapters.AutoChapters) {
    return summaryResult.value.chapters.AutoChapters;
  } else if (Array.isArray(summaryResult.value.chapters)) {
    return summaryResult.value.chapters;
  } else if (summaryResult.value.chapters && typeof summaryResult.value.chapters === 'object') {
    return Object.values(summaryResult.value.chapters);
  } else {
    return [];
  }
});

// 处理后的文本润色数据
const processedTextPolish = computed(() => {
  if (summaryResult.value.textPolish && summaryResult.value.textPolish.TextPolish) {
    return summaryResult.value.textPolish.TextPolish.map(item => item.FormalParagraphText);
  } else if (Array.isArray(summaryResult.value.textPolish)) {
    return summaryResult.value.textPolish;
  } else if (summaryResult.value.textPolish && typeof summaryResult.value.textPolish === 'object') {
    return Object.values(summaryResult.value.textPolish);
  } else {
    return [];
  }
});

// 是否有任何摘要内容
const hasAnySummaryContent = computed(() => {
  return !!(
    (summaryResult.value.paragraphs && summaryResult.value.paragraphs.length > 0) ||
    (processedChapters.value.length > 0) ||
    (summaryResult.value.questionsAnswering && summaryResult.value.questionsAnswering.length > 0) ||
    (summaryResult.value.conversations && summaryResult.value.conversations.length > 0) ||
    processedTextPolish.value.length
  );
});

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

// WebSocket相关
const socket = ref<WebSocket | null>(null);
const socketConnected = ref(false);
const currentTaskId = ref<string | null>(null);
const audioProcessor = ref<ScriptProcessorNode | null>(null);
const audioChunks = ref<Blob[]>([]);
const processorBufferSize = 1024; // 减小缓冲区大小为1024
let pingInterval: ReturnType<typeof setInterval> | null = null; // 心跳定时器
const audioData = ref({
  size: 0,                  // 录音文件长度
  buffer: [] as Float32Array[], // 录音缓存
  inputSampleRate: 48000,   // 输入采样率; 一般为本机浏览器默认采样率
  inputSampleBits: 16,      // 输入采样数位
  outputSampleRate: 16000,  // 输出采样率
  outputSampleBits: 16,     // 输出采样位
  clear() {
    this.buffer = [];
    this.size = 0;
  },
  input(data: Float32Array) {
    this.buffer.push(new Float32Array(data));
    this.size += data.length;
  },
  compress() {
    // 对数据进行合并压缩
    const data = new Float32Array(this.size);
    let offset = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      data.set(this.buffer[i], offset);
      offset += this.buffer[i].length;
    }

    const compression = parseInt(
      (this.inputSampleRate / this.outputSampleRate).toString()
    );
    const length = data.length / compression;
    const result = new Float32Array(length);
    let index = 0, j = 0;
    while (index < length) {
      result[index] = data[j];
      j += compression;
      index++;
    }
    return result;
  },
  encodePCM() {
    const sampleRate = Math.min(
      this.inputSampleRate,
      this.outputSampleRate
    );
    const sampleBits = Math.min(this.inputSampleBits, this.outputSampleBits);
    const bytes = this.compress();
    const dataLength = bytes.length * (sampleBits / 8);
    const buffer = new ArrayBuffer(dataLength);
    const data = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < bytes.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, bytes[i]));
      data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    // 直接返回ArrayBuffer而不是Blob，这样可以使用byteLength属性
    return buffer;
  }
});

// 高级设置
const showAdvancedSettings = ref(false);
const advancedSettings = ref({
  diarizationEnabled: false,
  speakerCount: 2,
  transcriptionOutputLevel: '1',
  translationEnabled: true,
  translationOutputLevel: '1',
  autoChaptersEnabled: false,
  summarizationEnabled: false,
  summarizationTypes: ['Paragraph'],
  textPolishEnabled: false,
  languageHints: []
});

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

// 组件卸载时清理资源
onUnmounted(() => {
  cleanupResources();
  closeWebSocketConnection();
});

// 清理所有资源
const cleanupResources = () => {
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
  
  if (audioStream.value) {
    audioStream.value.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  }
  
  if (audioContext.value && audioContext.value.state !== 'closed') {
    audioContext.value.close();
  }
  
  if (audioProcessor.value) {
    audioProcessor.value.disconnect();
  }
};

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
const selectSourceLanguage = (value: string) => {
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
const selectTargetLanguage = (value: string) => {
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
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
  }
  
  longPressTimer.value = setTimeout(() => {
    isLongPress.value = true;
    startRecording();
  }, 500) as ReturnType<typeof setTimeout>;
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

// 开始音频流
const startAudioStream = async () => {
  try {
    // 请求麦克风权限
    audioStream.value = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 创建音频上下文
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
    analyser.value = audioContext.value.createAnalyser();
    const source = audioContext.value.createMediaStreamSource(audioStream.value);
    
    // 创建音频处理节点 - 使用较小的缓冲区减少每帧数据大小
    audioProcessor.value = audioContext.value.createScriptProcessor(processorBufferSize, 1, 1); // 减小缓冲区大小为1024
    
    // 连接音频节点
    source.connect(analyser.value);
    analyser.value.connect(audioProcessor.value);
    audioProcessor.value.connect(audioContext.value.destination);
    
    // 获取分析器数据
    analyser.value.fftSize = 256;
    dataArray.value = new Uint8Array(analyser.value.frequencyBinCount);
    
    // 重置音频数据对象
    audioData.value.clear();
    audioData.value.inputSampleRate = audioContext.value.sampleRate;
    
    // 处理音频数据
    audioProcessor.value.onaudioprocess = (e) => {
      if (!isRecording.value) return;
      
      // 获取音频数据
      const inputData = e.inputBuffer.getChannelData(0);
      
      // 处理音频数据
      audioData.value.input(inputData);
      
      // 分块发送到WebSocket，确保每次不超过16KB (远小于65KB限制)
      if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        const audioBlob = audioData.value.encodePCM();
        
        // 对于ArrayBuffer类型，使用byteLength属性
        if (audioBlob.byteLength > 16384) { // 16KB
          const chunks = Math.ceil(audioBlob.byteLength / 16384);
          for (let i = 0; i < chunks; i++) {
            const start = i * 16384;
            const end = Math.min(start + 16384, audioBlob.byteLength);
            const chunk = audioBlob.slice(start, end);
            socket.value.send(chunk);
          }
          console.log(`音频数据分为${chunks}块发送，总大小: ${audioBlob.byteLength}字节`);
        } else {
          socket.value.send(audioBlob);
        }
        
        // 发送后清空缓冲区，避免缓冲区数据累积
        audioData.value.clear();
      }
    };
  } catch (error) {
    console.error('获取麦克风权限失败:', error);
    showToast({
      message: '无法访问麦克风，请确保已授予权限',
      icon: 'fail',
      position: 'bottom'
    });
  }
};

// 创建实时翻译任务
const createRealtimeTask = async () => {
  try {
    // 获取源语言和目标语言代码
    const sourceCode = languageCodeMap[sourceLanguage.value as keyof typeof languageCodeMap] || 'en';
    const targetCode = languageCodeMap[targetLanguage.value as keyof typeof languageCodeMap] || 'cn';
    
    // 创建任务请求参数
    const taskParams: any = {
      sourceLanguage: sourceCode,
      format: 'pcm', // PCM格式
      sampleRate: '16000', // 16kHz采样率
      translationEnabled: advancedSettings.value.translationEnabled,
      targetLanguages: [targetCode],
      
      // 添加高级设置参数
      diarizationEnabled: advancedSettings.value.diarizationEnabled,
      speakerCount: advancedSettings.value.diarizationEnabled ? advancedSettings.value.speakerCount : undefined,
    };
    
    // 如果是多语种模式，添加语言提示
    if (sourceCode === 'multilingual' && advancedSettings.value.languageHints.length > 0) {
      taskParams.languageHints = advancedSettings.value.languageHints;
    }
    
    // 转录设置
    taskParams.transcription = {
      outputLevel: parseInt(advancedSettings.value.transcriptionOutputLevel)
    };
    
    // 翻译设置
    if (advancedSettings.value.translationEnabled) {
      taskParams.translation = {
        outputLevel: parseInt(advancedSettings.value.translationOutputLevel)
      };
    }
    
    // 增强功能
    if (advancedSettings.value.autoChaptersEnabled) {
      taskParams.autoChaptersEnabled = true;
    }
    
    if (advancedSettings.value.summarizationEnabled) {
      taskParams.summarizationEnabled = true;
      if (advancedSettings.value.summarizationTypes.length > 0) {
        taskParams.summarization = {
          types: advancedSettings.value.summarizationTypes
        };
      }
    }
    
    if (advancedSettings.value.textPolishEnabled) {
      taskParams.textPolishEnabled = true;
    }
    
    // 发送创建任务请求
    console.log('创建实时翻译任务参数:', taskParams);
    const response = await axios.post('/api/v1/tingwu/realtime/start', taskParams);
    
    if (response.data.success) {
      console.log('实时翻译任务已创建:', response.data);
      currentTaskId.value = response.data.data.taskId;
      
      // 使用返回的WebSocket URL建立连接
      if (response.data.data.meetingJoinUrl) {
        setupWebSocketConnection(response.data.data.meetingJoinUrl);
        return true;
      } else {
        throw new Error('服务未返回WebSocket连接URL');
      }
    } else {
      throw new Error(response.data.message || '创建实时翻译任务失败');
    }
  } catch (error: any) {
    console.error('创建实时翻译任务失败:', error);
    showToast({
      message: `创建任务失败: ${error.message || '未知错误'}`,
      icon: 'fail',
      position: 'bottom'
    });
    return false;
  }
};

// 发送开始转写命令
const sendStartTranscriptionMessage = () => {
  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) return;
  
  const startParams = {
    header: {
      name: "StartTranscription",
      namespace: "SpeechTranscriber",
      appkey: languageCodeMap[sourceLanguage.value as keyof typeof languageCodeMap] || 'en'
    },
    payload: {
      format: "pcm",
      sample_rate: "16000",
      enable_intermediate_result: true,
      enable_punctuation_prediction: true,
      enable_inverse_text_normalization: true,
      // 添加心跳配置，以免断开连接
      max_speaking_length: 60000,
      speech_timeout: 60000,
      ping_interval: 8000, // 添加心跳间隔参数
      ping_timeout: 20000  // 添加心跳超时参数
    }
  };
  
  socket.value.send(JSON.stringify(startParams));
  console.log('已发送开始转写命令:', startParams);
};

// 发送停止转写命令
const sendStopTranscriptionMessage = () => {
  if (!socket.value || socket.value.readyState !== WebSocket.OPEN) return;
  
  const stopParams = {
    header: {
      name: "StopTranscription",
      namespace: "SpeechTranscriber",
    },
    payload: {},
  };
  
  socket.value.send(JSON.stringify(stopParams));
  console.log('已发送停止转写命令');
  
  // 延迟关闭连接
  setTimeout(() => {
    if (socket.value) {
      socket.value.close();
    }
  }, 3000);
};

// 建立WebSocket连接
const setupWebSocketConnection = (url: string) => {
  // 关闭现有连接
  closeWebSocketConnection();
  
  try {
    console.log('连接WebSocket URL:', url);
    
    // 创建新的WebSocket连接
    socket.value = new WebSocket(url);
    socket.value.binaryType = "arraybuffer"; // 设置为ArrayBuffer类型，按照官方要求
    
    // 监听WebSocket事件
    socket.value.onopen = () => {
      console.log('WebSocket连接已建立');
      socketConnected.value = true;
      
      // 开始音频流
      startAudioStream();
      
      // 发送开始转写请求
      sendStartTranscriptionMessage();
      
      // 设置心跳机制，每8秒发送一次ping消息
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
          // 发送ping消息
          const pingMessage = {
            header: {
              name: "Ping",
              namespace: "SpeechTranscriber"
            },
            payload: {}
          };
          socket.value.send(JSON.stringify(pingMessage));
          console.log('发送Ping心跳消息...');
        }
      }, 8000);
      
      // 显示连接成功提示
      showToast({
        message: '实时转录连接已建立',
        icon: 'success',
        position: 'bottom'
      });
    };
    
    socket.value.onmessage = (event) => {
      handleSocketMessage(event);
    };
    
    socket.value.onerror = (error) => {
      console.error('WebSocket错误:', error);
      showToast({
        message: 'WebSocket连接出错',
        icon: 'fail',
        position: 'bottom'
      });
      socketConnected.value = false;
    };
    
    socket.value.onclose = (event) => {
      console.log('WebSocket连接已关闭，代码:', event.code, '原因:', event.reason);
      socketConnected.value = false;
      // 清除心跳
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      
      // 如果是在录音中意外断开，尝试重新连接
      if (isRecording.value) {
        console.log('录音过程中WebSocket断开，尝试重新连接...');
        showToast({
          message: '连接中断，正在重新连接...',
          icon: 'loading',
          position: 'bottom',
          duration: 0
        });
        
        // 延迟一点时间尝试重新创建任务
        setTimeout(() => {
          createRealtimeTask().then(success => {
            if (success) {
              showToast({
                message: '已重新连接',
                icon: 'success',
                position: 'bottom'
              });
            } else {
              // 如果重连失败，停止录音
              stopRecording();
              showToast({
                message: '重新连接失败，已停止录音',
                icon: 'fail',
                position: 'bottom'
              });
            }
          });
        }, 2000);
      }
    };
  } catch (error) {
    console.error('创建WebSocket连接失败:', error);
    showToast({
      message: `WebSocket连接失败: ${(error as Error).message || '未知错误'}`,
      icon: 'fail',
      position: 'bottom'
    });
  }
};

// 关闭WebSocket连接
const closeWebSocketConnection = () => {
  // 清除心跳定时器
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  
  if (socket.value) {
    if (socket.value.readyState === WebSocket.OPEN) {
      // 尝试发送停止转写命令
      try {
        sendStopTranscriptionMessage();
      } catch (error) {
        console.error('发送停止转写命令失败:', error);
      }
    }
    
    // 关闭WebSocket连接
    try {
      socket.value.close();
    } catch (error) {
      console.error('关闭WebSocket连接失败:', error);
    }
    
    socket.value = null;
    socketConnected.value = false;
    console.log('WebSocket连接已关闭');
  }
};

// 停止实时翻译任务
const stopRealtimeTask = async () => {
  if (!currentTaskId.value) return;
  
  try {
    // 发送停止转写命令
    sendStopTranscriptionMessage();
    
    // 关闭WebSocket连接
    closeWebSocketConnection();
    
    // 通知后端停止任务
    const response = await axios.post(`/api/v1/tingwu/realtime/${currentTaskId.value}/stop`);
    
    if (response.data.success) {
      console.log('实时翻译任务已停止:', response.data);
      
      // 如果启用了摘要功能，开始轮询获取摘要结果
      if (advancedSettings.value.summarizationEnabled || 
          advancedSettings.value.autoChaptersEnabled || 
          advancedSettings.value.textPolishEnabled) {
        startPollingTaskResult();
      }
    } else {
      console.warn('停止实时翻译任务失败:', response.data.message);
    }
  } catch (error) {
    console.error('停止实时翻译任务出错:', error);
  }
};

// 处理WebSocket消息
const handleSocketMessage = (event: MessageEvent) => {
  try {
    // 处理字符串消息
    if (typeof event.data === "string") {
      console.log('收到原始WebSocket消息:', event.data);
      
      // 修复多个JSON对象连接在一起的问题
      // 尝试拆分多个JSON对象（可能连在一起没有分隔符）
      let dataString = event.data;
      let startIndex = 0;
      let jsonDepth = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString[i];
        
        // 处理字符串内的字符
        if (inString) {
          if (escapeNext) {
            escapeNext = false;
          } else if (char === '\\') {
            escapeNext = true;
          } else if (char === '"') {
            inString = false;
          }
          continue;
        }
        
        // 处理非字符串内的字符
        if (char === '"') {
          inString = true;
        } else if (char === '{') {
          jsonDepth++;
        } else if (char === '}') {
          jsonDepth--;
          
          // 如果找到了一个完整的JSON对象
          if (jsonDepth === 0) {
            try {
              const jsonStr = dataString.substring(startIndex, i + 1);
              const dataJson = JSON.parse(jsonStr);
              console.log('解析出单个JSON消息:', dataJson);
              
              // 处理不同类型的消息
              processWebSocketMessage(dataJson);
              
              // 更新下一个JSON开始的位置
              startIndex = i + 1;
            } catch (parseError) {
              console.error('解析JSON片段失败:', parseError);
            }
          }
        }
      }
      
      return; // 使用新的解析方法后，不再使用原来的解析逻辑
    }
  } catch (error) {
    console.error('解析WebSocket消息失败:', error);
  }
};

// 处理单个WebSocket消息
const processWebSocketMessage = (dataJson: any) => {
  // 安全检查：确保dataJson和header存在
  if (!dataJson || !dataJson.header) {
    console.warn('收到无效WebSocket消息格式:', dataJson);
    return;
  }
  
  // 处理不同类型的消息
  switch (dataJson.header.name) {
    case "SentenceBegin": {
      // 句子开始事件
      if (dataJson.payload && typeof dataJson.payload.index !== 'undefined') {
        console.log("句子", dataJson.payload.index, "开始");
        // 创建新的段落
        currentSegmentIndex.value = dataJson.payload.index;
        // 检查是否已存在该索引的段落
        const existingIndex = transcriptSegments.value.findIndex(s => s.index === dataJson.payload.index);
        if (existingIndex === -1) {
          // 添加新段落
          transcriptSegments.value.push({
            index: dataJson.payload.index,
            text: '',
            translation: '',
            timestamp: recordingTime.value
          });
        }
      }
      break;
    }
    case "TranscriptionResultChanged": {
      // 句中识别结果变化事件
      if (dataJson.payload && dataJson.payload.result) {
        const segmentIndex = dataJson.payload.index;
        console.log(
          "句子" + (segmentIndex || '未知') + "中间结果:",
          dataJson.payload.result
        );
        
        // 查找对应的段落
        const existingIndex = transcriptSegments.value.findIndex(s => s.index === segmentIndex);
        if (existingIndex !== -1) {
          // 更新已存在的段落
          transcriptSegments.value[existingIndex].text = dataJson.payload.result;
        } else {
          // 添加新段落
          transcriptSegments.value.push({
            index: segmentIndex,
            text: dataJson.payload.result,
            translation: '',
            timestamp: recordingTime.value
          });
        }
        currentSegmentIndex.value = segmentIndex;
      }
      break;
    }
    case "SentenceEnd": {
      // 句子结束事件
      if (dataJson.payload) {
        const segmentIndex = dataJson.payload.index;
        const finalResult = dataJson.payload.result + ((dataJson.payload.stash_result && dataJson.payload.stash_result.text) || "");
        console.log("句子" + (segmentIndex || '未知') + "结束:", finalResult);
        
        // 查找对应的段落
        const existingIndex = transcriptSegments.value.findIndex(s => s.index === segmentIndex);
        if (existingIndex !== -1) {
          // 更新已存在的段落
          transcriptSegments.value[existingIndex].text = finalResult;
        } else {
          // 添加新段落
          transcriptSegments.value.push({
            index: segmentIndex,
            text: finalResult,
            translation: '',
            timestamp: recordingTime.value
          });
        }
      }
      break;
    }
    case "ResultTranslated": {
      // 识别结果翻译事件
      if (dataJson.payload && dataJson.payload.translate_result) {
        console.log(
          "句子翻译结果",
          JSON.stringify(dataJson.payload.translate_result)
        );
        
        // 翻译结果中通常包含句子索引
        if (dataJson.payload.translate_result.length > 0) {
          const segmentIndex = dataJson.payload.index || (dataJson.payload.translate_result[0].index);
          const translationText = dataJson.payload.translate_result[0]?.text;
          
          if (translationText) {
            // 查找对应的段落
            const existingIndex = transcriptSegments.value.findIndex(s => s.index === segmentIndex);
            if (existingIndex !== -1) {
              // 更新已存在的段落
              transcriptSegments.value[existingIndex].translation = translationText;
            } else if (segmentIndex !== undefined) {
              // 添加新段落
              transcriptSegments.value.push({
                index: segmentIndex,
                text: '',
                translation: translationText,
                timestamp: recordingTime.value
              });
            }
          }
        }
      }
      break;
    }
    case "TaskFailed": {
      // 任务失败事件
      console.error("任务失败:", dataJson.payload);
      showToast({
        message: `任务失败: ${(dataJson.payload && dataJson.payload.message) || '未知错误'}`,
        icon: 'fail',
        position: 'bottom'
      });
      break;
    }
    case "Pong": {
      // 收到心跳响应
      console.log("收到Pong心跳响应");
      break;
    }
    default: {
      // 未知消息类型，记录但不处理
      console.log(`收到未处理的消息类型: ${dataJson.header.name}`, dataJson);
    }
  }
};

// 开始录音
const startRecording = async () => {
  try {
    // 清空之前的转录内容
    transcriptSegments.value = [];
    
    // 开始实时翻译任务
    const taskCreated = await createRealtimeTask();
    
    if (!taskCreated) {
      throw new Error('无法创建实时翻译任务');
    }
    
    // 开始录制
    isRecording.value = true;
    recordingTime.value = 0;
    
    // 启动计时器
    timer = window.setInterval(() => {
      recordingTime.value++;
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
  if (isRecording.value) {
    isRecording.value = false;
    
    // 停止实时翻译任务
    stopRealtimeTask();
    
    // 清理资源
    cleanupResources();
    
    // 显示保存成功提示
    if (transcriptSegments.value.length > 0) {
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

// 复制转录内容
const copyTranscript = () => {
  const textToCopy = transcriptSegments.value.map(segment => `${segment.text}\n\n${segment.translation}`).join('\n\n');
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
const copySegment = (segment: TranscriptSegment) => {
  const textToCopy = `${segment.text}\n\n${segment.translation}`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast({
      message: '已复制当前段落',
      icon: 'success',
      position: 'bottom'
    });
  });
};

// 朗读当前段落
const speakSegment = (segment: TranscriptSegment) => {
  if ('speechSynthesis' in window) {
    // 使用浏览器的语音合成API
    const utterance = new SpeechSynthesisUtterance(segment.translation);
    utterance.lang = targetLanguage.value === '中文' ? 'zh-CN' : 'en-US';
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
    const textToDownload = transcriptSegments.value.map(segment => `${segment.text}\n\n${segment.translation}`).join('\n\n');
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
      transcriptSegments.value = [];
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
    transcriptSegments.value = [];
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

// 切换高级设置
const toggleAdvancedSettings = () => {
  showAdvancedSettings.value = !showAdvancedSettings.value;
};

// 保存高级设置
const saveAdvancedSettings = () => {
  // 保存设置
  console.log('保存高级设置:', advancedSettings.value);
  
  // 关闭高级设置弹出层
  showAdvancedSettings.value = false;
};

// 开始轮询获取任务结果
const startPollingTaskResult = async () => {
  isPollingResult.value = true;
  resultPollingComplete.value = false;
  
  // 轮询计数，最多尝试10次（约30秒）
  let pollingCount = 0;
  const maxPollingCount = 10;
  
  // 显示开始获取摘要的提示
  showToast({
    message: '正在生成内容摘要...',
    position: 'bottom',
    duration: 2000
  });
  
  const pollingInterval = setInterval(async () => {
    if (!currentTaskId.value || pollingCount >= maxPollingCount) {
      clearInterval(pollingInterval);
      isPollingResult.value = false;
      
      // 如果未能获取到摘要，显示提示
      if (!resultPollingComplete.value && pollingCount >= maxPollingCount) {
        showToast({
          message: '摘要生成中，可能需要更长时间',
          position: 'bottom'
        });
      }
      return;
    }
    
    pollingCount++;
    
    try {
      const response = await axios.get(`/api/v1/tingwu/realtime/${currentTaskId.value}/result`);
      
      if (response.data.success) {
        const result = response.data.data;
        console.log('获取任务结果:', result);
        
        // 处理结果
        if (result.summary) {
          // 设置摘要结果
          summaryResult.value = result.summary;
          
          // 检查是否有任何摘要数据
          const hasSummary = 
            result.summary.paragraphs?.length > 0 || 
            processedChapters.value.length > 0 || 
            result.summary.questionsAnswering?.length > 0 || 
            result.summary.conversations?.length > 0 ||
            processedTextPolish.value.length;
          
          // 如果有摘要数据或状态为完成，则停止轮询
          if (hasSummary || result.status === 'completed') {
            clearInterval(pollingInterval);
            resultPollingComplete.value = true;
            isPollingResult.value = false;
            
            // 显示摘要生成完成的提示
            if (hasSummary) {
              showToast({
                message: '摘要生成完成',
                icon: 'success',
                position: 'bottom'
              });
            }
          }
        }
      } else {
        console.error('获取任务结果失败:', response.data.message);
      }
    } catch (error) {
      console.error('获取任务结果出错:', error);
    }
  }, 3000);
};

// 刷新摘要
const handleRefreshSummary = async () => {
  // 清空当前摘要结果
  summaryResult.value = {};
  resultPollingComplete.value = false;
  
  // 开始重新获取摘要结果
  startPollingTaskResult();
};
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
  position: relative;
  z-index: 10;
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
  transition: background-color 0.2s;
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

.summary-container {
  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.summary-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.summary-icon {
  font-size: 18px;
  color: #FF9500;
  margin-right: 8px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.refresh-summary-btn {
  font-size: 18px;
  color: #007AFF;
  margin-left: 16px;
  cursor: pointer;
}

.summary-section {
  margin-bottom: 24px;
}

.summary-type-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 12px;
}

.summary-paragraph {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 12px;
}

.chapters-list {
  padding: 0 16px;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color, #E5E5EA);
}

.chapter-number {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  width: 24px;
  text-align: center;
}

.chapter-content {
  flex: 1;
  padding-left: 12px;
}

.chapter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 4px;
}

.chapter-summary {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
}

.qa-list {
  padding: 0 16px;
}

.qa-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color, #E5E5EA);
}

.qa-question {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 4px;
}

.qa-answer {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
}

.conversation-list {
  padding: 0 16px;
}

.conversation-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color, #E5E5EA);
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
}

.polling-indicator {
  padding: 16px;
  text-align: center;
}

.polling-spinner {
  font-size: 24px;
  color: #8E8E93;
  margin-bottom: 8px;
}

.polling-text {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
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

/* 高级设置弹出层 */
.advanced-settings-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.advanced-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #E5E5EA);
}

.advanced-settings-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.advanced-settings-close {
  font-size: 18px;
  color: var(--text-secondary, #8E8E93);
  cursor: pointer;
}

.advanced-settings-content {
  padding: 16px 0;
  flex: 1;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 12px;
}

.settings-item {
  margin-bottom: 16px;
}

.settings-item-label {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 8px;
}

.settings-item-desc {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 8px;
}

.advanced-settings-footer {
  padding: 16px 0;
  border-top: 1px solid var(--border-color, #E5E5EA);
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

/* 自定义弹出层样式 */
.custom-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.custom-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  width: 80%;
  max-width: 400px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 1001;
}

.custom-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #E5E5EA);
}

.custom-popup-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.custom-popup-close {
  font-size: 18px;
  color: var(--text-secondary, #8E8E93);
  cursor: pointer;
}

.custom-popup-content {
  padding: 16px 0;
}

.custom-popup-item {
  padding: 12px 16px;
  font-size: 15px;
  color: var(--text-primary, #000000);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.custom-popup-item:active {
  background-color: #EBEBEB;
}

/* 摘要样式 */
.summary-container {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin: 20px 0;
  padding: 20px;
  transition: all 0.3s ease;
  animation: fade-in 0.5s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-header {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.summary-icon {
  color: #FF9500;
  font-size: 20px;
  margin-right: 10px;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.refresh-summary-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #007AFF;
  margin-left: auto;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.refresh-summary-btn:active {
  background-color: rgba(0, 122, 255, 0.1);
}

.summary-section {
  margin-bottom: 24px;
}

.summary-type-title {
  font-size: 16px;
  font-weight: 600;
  color: #8E8E93;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #E5E5EA;
}

.summary-paragraph {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary, #000000);
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #34C759;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background-color: #F2F2F7;
  transition: transform 0.2s;
}

.chapter-item:active {
  transform: scale(0.99);
}

.chapter-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background-color: #5856D6;
  border-radius: 50%;
}

.chapter-content {
  flex: 1;
}

.chapter-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary, #000000);
}

.chapter-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.qa-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qa-item {
  padding: 14px;
  border-radius: 12px;
  background-color: #F2F2F7;
  transition: all 0.2s;
}

.qa-question {
  font-size: 15px;
  font-weight: 600;
  color: #007AFF;
  margin-bottom: 10px;
}

.qa-answer {
  font-size: 14px;
  color: var(--text-primary, #000000);
  line-height: 1.5;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conversation-item {
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #E5F7FF;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary, #000000);
}

.text-polish {
  background-color: #F2F2F7;
  padding: 15px;
  border-radius: 12px;
}

.polish-item {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary, #000000);
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #E5E5EA;
}

.polish-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.summary-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  color: #8E8E93;
}

.summary-loading-icon {
  font-size: 24px;
  margin-bottom: 16px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
