import { ref, computed } from 'vue';

export interface SpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeechToText() {
  const isSpeaking = ref(false);
  const isPaused = ref(false);
  const currentText = ref('');
  const error = ref<string | null>(null);
  
  const isSupported = computed(() => {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  });
  
  // 获取可用的语音
  function getVoices(): SpeechSynthesisVoice[] {
    if (!isSupported.value) return [];
    return window.speechSynthesis.getVoices();
  }
  
  // 根据语言代码获取最佳语音
  function getBestVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    if (!isSupported.value) return null;
    
    // 标准化语言代码
    const normalizedLangCode = langCode.replace('_', '-').toLowerCase();
    const allVoices = getVoices();
    
    // 首先尝试精确匹配
    let matchedVoice = allVoices.find(voice => 
      voice.lang.toLowerCase() === normalizedLangCode
    );
    
    // 如果没有精确匹配，尝试匹配语言部分
    if (!matchedVoice) {
      const langPrefix = normalizedLangCode.split('-')[0];
      matchedVoice = allVoices.find(voice => 
        voice.lang.toLowerCase().startsWith(langPrefix)
      );
    }
    
    return matchedVoice || null;
  }
  
  // 将语言代码转换为Web Speech API支持的格式
  function convertLanguageCode(langCode: string): string {
    // 将格式从 zh_cn 转换为 zh-CN 格式
    const [lang, region] = langCode.split('_');
    return `${lang}-${region?.toUpperCase() || ''}`;
  }
  
  // 朗读文本
  function speak(text: string, langCode: string, options: SpeechSynthesisOptions = {}) {
    if (!isSupported.value) {
      error.value = '您的浏览器不支持语音合成';
      return;
    }
    
    try {
      // 取消之前的朗读
      stop();
      
      currentText.value = text;
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置语言
      const webSpeechLangCode = convertLanguageCode(langCode);
      utterance.lang = webSpeechLangCode;
      
      // 尝试获取合适的语音
      const voice = getBestVoiceForLanguage(webSpeechLangCode);
      if (voice) {
        utterance.voice = voice;
      }
      
      // 设置选项
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      
      // 设置事件处理
      utterance.onstart = () => {
        isSpeaking.value = true;
        isPaused.value = false;
      };
      
      utterance.onend = () => {
        isSpeaking.value = false;
        isPaused.value = false;
        currentText.value = '';
      };
      
      utterance.onerror = (event) => {
        error.value = `语音合成出错: ${event.error}`;
        isSpeaking.value = false;
        isPaused.value = false;
      };
      
      // 开始朗读
      window.speechSynthesis.speak(utterance);
      
    } catch (err) {
      error.value = `语音合成初始化失败: ${err}`;
      console.error('Text-to-speech error:', err);
    }
  }
  
  // 暂停朗读
  function pause() {
    if (!isSupported.value || !isSpeaking.value) return;
    
    window.speechSynthesis.pause();
    isPaused.value = true;
  }
  
  // 恢复朗读
  function resume() {
    if (!isSupported.value || !isPaused.value) return;
    
    window.speechSynthesis.resume();
    isPaused.value = false;
  }
  
  // 停止朗读
  function stop() {
    if (!isSupported.value) return;
    
    window.speechSynthesis.cancel();
    isSpeaking.value = false;
    isPaused.value = false;
    currentText.value = '';
  }
  
  return {
    isSpeaking,
    isPaused,
    currentText,
    error,
    isSupported,
    speak,
    pause,
    resume,
    stop,
    getVoices,
    getBestVoiceForLanguage
  };
} 