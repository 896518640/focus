import { ref } from 'vue';
import axios from 'axios';

// 支持的语言
export const supportedLanguages = [
  { code: 'zh_cn', label: '中文' },
  { code: 'en_us', label: 'English' },
  { code: 'ja_jp', label: '日本語' },
  { code: 'ko_kr', label: '한국어' },
  { code: 'fr_fr', label: 'Français' },
  { code: 'es_es', label: 'Español' },
  { code: 'ru_ru', label: 'Русский' },
];

export function useTranslationService() {
  // 翻译状态
  const isTranslating = ref(false);
  const translatedText = ref('');
  const translationError = ref<string | null>(null);
  
  // 翻译文本
  async function translateText(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ) {
    if (!text || sourceLanguage === targetLanguage) {
      translatedText.value = text;
      return text;
    }
    
    isTranslating.value = true;
    translationError.value = null;
    
    try {
      // 这里可以集成实际的翻译API，如Google Translate或DeepL
      // 示例中使用模拟API调用
      const response = await axios.post(
        import.meta.env.VITE_TRANSLATION_API_URL || 'http://localhost:3000/translate',
        {
          text,
          sourceLanguage,
          targetLanguage
        }
      );
      
      translatedText.value = response.data.translatedText;
      return translatedText.value;
    } catch (error) {
      console.error('Translation error:', error);
      translationError.value = '翻译服务出错，请稍后再试';
      return '';
    } finally {
      isTranslating.value = false;
    }
  }
  
  // 获取语言名称
  function getLanguageLabel(code: string): string {
    const language = supportedLanguages.find(lang => lang.code === code);
    return language ? language.label : code;
  }
  
  return {
    isTranslating,
    translatedText,
    translationError,
    translateText,
    supportedLanguages,
    getLanguageLabel
  };
} 