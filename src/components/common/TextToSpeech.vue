<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

// 定义props
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  lang: {
    type: String,
    default: 'zh-CN'  // 默认为中文
  },
  autoSpeak: {
    type: Boolean,
    default: false  // 是否自动朗读
  },
  rate: {
    type: Number,
    default: 1.0  // 语速，范围0.1-10.0
  },
  pitch: {
    type: Number,
    default: 1.0  // 音调，范围0.0-2.0
  },
  volume: {
    type: Number,
    default: 1.0  // 音量，范围0.0-1.0
  }
});

// 定义事件
const emit = defineEmits(['start', 'end', 'pause', 'resume', 'error']);

// 状态
const isSpeaking = ref(false);
const isPaused = ref(false);
const isAvailable = ref(false);
const availableVoices = ref<SpeechSynthesisVoice[]>([]);
const selectedVoice = ref<SpeechSynthesisVoice | null>(null);
const errorMessage = ref('');

// 语言映射表（语言代码到SpeechSynthesis支持的语言代码）
const langMapping: Record<string, string> = {
  'cn': 'zh-CN',   // 中文
  'en': 'en-US',   // 英语
  'ja': 'ja-JP',   // 日语
  'ko': 'ko-KR',   // 韩语
  'de': 'de-DE',   // 德语
  'fr': 'fr-FR',   // 法语
  'ru': 'ru-RU',   // 俄语
  'es': 'es-ES',   // 西班牙语
  'it': 'it-IT',   // 意大利语
  'pt': 'pt-BR'    // 葡萄牙语
};

// 检查浏览器是否支持语音合成
onMounted(() => {
  if ('speechSynthesis' in window) {
    isAvailable.value = true;
    
    // 获取可用的声音
    loadVoices();
    
    // 为声音列表加载添加事件监听
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // 如果设置了自动朗读，则在组件挂载后开始朗读
    if (props.autoSpeak && props.text) {
      setTimeout(() => speak(), 100);
    }
  } else {
    isAvailable.value = false;
    errorMessage.value = '您的浏览器不支持语音合成功能';
    emit('error', errorMessage.value);
  }
});

// 卸载前清理资源
onBeforeUnmount(() => {
  if (isAvailable.value) {
    // 停止所有朗读
    window.speechSynthesis.cancel();
  }
});

// 监听文本变化，如果设置了自动朗读，则自动开始朗读
watch(() => props.text, (newText) => {
  if (props.autoSpeak && newText && isAvailable.value) {
    speak();
  }
});

// 监听语言变化，更新使用的声音
watch(() => props.lang, () => {
  selectAppropriateVoice();
});

// 加载可用的声音
const loadVoices = () => {
  try {
    availableVoices.value = window.speechSynthesis.getVoices();
    selectAppropriateVoice();
  } catch (error) {
    console.error('加载语音失败:', error);
    errorMessage.value = '加载语音失败';
    emit('error', errorMessage.value);
  }
};

// 为当前语言选择合适的声音
const selectAppropriateVoice = () => {
  // 转换语言代码（如果需要）
  const langCode = langMapping[props.lang] || props.lang;
  
  // 如果有可用声音
  if (availableVoices.value.length > 0) {
    // 尝试找到匹配当前语言的声音
    const matchedVoice = availableVoices.value.find(voice => 
      voice.lang.toLowerCase().includes(langCode.toLowerCase())
    );
    
    // 如果找到了匹配的声音
    if (matchedVoice) {
      selectedVoice.value = matchedVoice;
    } else {
      // 如果没有找到匹配的声音，使用默认声音
      selectedVoice.value = availableVoices.value[0];
    }
  }
};

// 开始朗读文本
const speak = () => {
  if (!isAvailable.value) {
    errorMessage.value = '语音合成不可用';
    emit('error', errorMessage.value);
    return;
  }
  
  // 如果正在朗读，先停止
  if (isSpeaking.value) {
    window.speechSynthesis.cancel();
  }
  
  // 创建语音实例
  const utterance = new SpeechSynthesisUtterance(props.text);
  
  // 设置语音属性
  utterance.rate = props.rate;
  utterance.pitch = props.pitch;
  utterance.volume = props.volume;
  
  // 设置语言和声音
  const langCode = langMapping[props.lang] || props.lang;
  utterance.lang = langCode;
  
  // 如果有选定的声音，则使用该声音
  if (selectedVoice.value) {
    utterance.voice = selectedVoice.value;
  }
  
  // 设置事件处理函数
  utterance.onstart = () => {
    isSpeaking.value = true;
    isPaused.value = false;
    emit('start');
  };
  
  utterance.onend = () => {
    isSpeaking.value = false;
    isPaused.value = false;
    emit('end');
  };
  
  utterance.onerror = (event) => {
    isSpeaking.value = false;
    isPaused.value = false;
    errorMessage.value = `朗读错误: ${event.error}`;
    emit('error', errorMessage.value);
  };
  
  // 开始朗读
  window.speechSynthesis.speak(utterance);
};

// 暂停朗读
const pause = () => {
  if (isSpeaking.value && !isPaused.value) {
    window.speechSynthesis.pause();
    isPaused.value = true;
    emit('pause');
  }
};

// 恢复朗读
const resume = () => {
  if (isSpeaking.value && isPaused.value) {
    window.speechSynthesis.resume();
    isPaused.value = false;
    emit('resume');
  }
};

// 停止朗读
const stop = () => {
  window.speechSynthesis.cancel();
  isSpeaking.value = false;
  isPaused.value = false;
  emit('end');
};

// 暴露方法和状态
defineExpose({
  speak,
  pause,
  resume,
  stop,
  isSpeaking,
  isPaused,
  isAvailable,
  errorMessage
});
</script>

<template>
  <div class="text-to-speech">
    <slot 
      :speak="speak" 
      :pause="pause" 
      :resume="resume" 
      :stop="stop" 
      :is-speaking="isSpeaking" 
      :is-paused="isPaused"
      :is-available="isAvailable"
      :error-message="errorMessage"
    >
      <!-- 默认UI，如果没有提供自定义UI -->
      <button 
        v-if="isAvailable" 
        class="tts-button"
        :class="{ 
          'speaking': isSpeaking && !isPaused,
          'paused': isPaused
        }"
        @click="isSpeaking ? (isPaused ? resume() : pause()) : speak()"
        :disabled="!text || text.length === 0"
        :title="isSpeaking ? (isPaused ? '继续朗读' : '暂停朗读') : '朗读文本'"
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
      <div v-if="errorMessage" class="tts-error">{{ errorMessage }}</div>
    </slot>
  </div>
</template>

<style scoped>
.text-to-speech {
  display: inline-block;
}

/* 默认按钮样式 */
.tts-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f0f0;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.tts-button:hover {
  background-color: #e0e0e0;
}

.tts-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tts-button.speaking {
  background-color: #007AFF;
  color: white;
  animation: pulse 2s infinite;
}

.tts-button.paused {
  background-color: #FF9500;
  color: white;
}

/* 错误消息样式 */
.tts-error {
  color: #FF3B30;
  font-size: 12px;
  margin-top: 4px;
}

/* 脉动动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(0, 122, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .tts-button {
    background-color: #2C2C2E;
    color: #FFFFFF;
  }
  
  .tts-button:hover {
    background-color: #3A3A3C;
  }
}
</style> 