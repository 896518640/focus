import { ref, computed, watch } from 'vue';
import { showToast } from 'vant';
import { SpeechServiceType } from '@/common/hooks/useSpeechRecognition';

/**
 * 语音管理组合式函数
 * 管理语音服务类型和语言选择
 */
export function useSpeechManager() {
  // 服务类型选择
  const serviceType = ref(SpeechServiceType.RTASR);
  
  // 语言选择
  const language = ref('zh_cn');

  // 语言显示标签映射
  const languageMap = {
    'zh_cn': '中文（普通话）',
    'en_us': '英语（美国）',
    'ja_jp': '日语',
    'ko_kr': '韩语'
  };

  // 服务类型显示标签
  const serviceTypeLabel = computed(() => {
    return serviceType.value === SpeechServiceType.RTASR ? '实时语音转写' : '语音听写';
  });

  /**
   * 获取语言显示标签
   * @param lang 语言代码
   * @returns 显示标签
   */
  const getLanguageLabel = (lang: string) => {
    return languageMap[lang as keyof typeof languageMap] || lang;
  };

  /**
   * 语言标签列表，用于展示选项
   */
  const languageOptions = computed(() => {
    return Object.entries(languageMap).map(([value, label]) => ({
      value,
      label
    }));
  });

  /**
   * 服务类型列表，用于展示选项
   */
  const serviceTypeOptions = [
    { value: SpeechServiceType.RTASR, label: '科大讯飞实时语音转写' },
    { value: SpeechServiceType.IFLYTEK_STT, label: '科大讯飞语音听写' }
  ];

  /**
   * 设置服务类型并显示通知
   * @param type 服务类型
   * @param isRecording 是否正在录音
   */
  const setServiceType = (type: SpeechServiceType, isRecording: boolean = false) => {
    if (serviceType.value !== type) {
      serviceType.value = type;
      
      if (isRecording) {
        showToast(`已切换到${serviceTypeLabel.value}服务`);
      }
    }
  };

  /**
   * 设置语言并显示通知
   * @param lang 语言代码
   * @param isRecording 是否正在录音
   */
  const setLanguage = (lang: string, isRecording: boolean = false) => {
    if (language.value !== lang) {
      language.value = lang;
      
      if (isRecording) {
        showToast(`已切换到${getLanguageLabel(lang)}`);
      }
    }
  };

  return {
    serviceType,
    language,
    serviceTypeLabel,
    getLanguageLabel,
    languageOptions,
    serviceTypeOptions,
    setServiceType,
    setLanguage
  };
} 