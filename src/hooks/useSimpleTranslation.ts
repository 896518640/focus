import { ref, computed, reactive } from 'vue'
import { createTask, type CreateTaskParams } from '@/api/tingwu/tingwu'
import { showFailToast } from 'vant'

export interface SimpleTranslationOptions {
  sourceLanguage?: string
  targetLanguage?: string
  autoTranslate?: boolean
}

export function useSimpleTranslation(options: SimpleTranslationOptions = {}) {
  // 默认配置
  const defaultOptions = {
    sourceLanguage: 'cn',
    targetLanguage: 'en',
    autoTranslate: true
  }
  
  const config = { ...defaultOptions, ...options }
  
  // 状态
  const isTranslating = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // 内容
  const sourceText = ref('')
  const translatedText = ref('')
  const history = reactive<{ source: string; translated: string; timestamp: number }[]>([])
  
  // 计算属性
  const canTranslate = computed(() => sourceText.value.trim().length > 0 && !isLoading.value)
  
  // 设置源文本
  const setSourceText = (text: string) => {
    sourceText.value = text
    
    // 如果设置了自动翻译，并且文本不为空，则自动开始翻译
    if (config.autoTranslate && text.trim() && !isTranslating.value) {
      translate()
    }
  }
  
  // 翻译方法
  const translate = async () => {
    if (!canTranslate.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      // 构建请求参数
      const params: CreateTaskParams = {
        type: 'offline', // 使用离线翻译模式，适合短文本
        input: {
          sourceLanguage: config.sourceLanguage,
          fileUrl: '', // 实际使用时，可能需要上传文本作为文件或使用其他方式
        },
        parameters: {
          translationEnabled: true,
          translation: {
            targetLanguages: [config.targetLanguage],
            outputLevel: 1
          },
          transcription: {
            audioEventDetectionEnabled: false,
            outputLevel: 1
          },
          autoChaptersEnabled: false,
          meetingAssistanceEnabled: false,
          summarizationEnabled: false
        }
      }
      
      // 发送翻译请求
      // 注意：这里是模拟实现，实际上通义听悟API不直接支持文本到文本的翻译
      // 你可能需要使用其他API或修改此逻辑以适应实际情况
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 处理翻译结果
      // 简单模拟翻译结果，实际项目中应替换为真实API调用
      if (config.sourceLanguage === 'cn' && config.targetLanguage === 'en') {
        translatedText.value = `[Translated] ${sourceText.value}`
      } else if (config.sourceLanguage === 'en' && config.targetLanguage === 'cn') {
        translatedText.value = `[已翻译] ${sourceText.value}`
      } else {
        translatedText.value = `[${config.targetLanguage}] ${sourceText.value}`
      }
      
      // 添加到历史记录
      history.push({
        source: sourceText.value,
        translated: translatedText.value,
        timestamp: Date.now()
      })
      
      // 最多保留最近20条记录
      if (history.length > 20) {
        history.shift()
      }
      
    } catch (err) {
      console.error('翻译失败:', err)
      error.value = err instanceof Error ? err.message : '翻译过程中发生未知错误'
      showFailToast('翻译失败')
    } finally {
      isLoading.value = false
    }
  }
  
  // 清空当前翻译
  const clear = () => {
    sourceText.value = ''
    translatedText.value = ''
  }
  
  // 切换源语言和目标语言
  const switchLanguages = () => {
    const temp = config.sourceLanguage
    config.sourceLanguage = config.targetLanguage
    config.targetLanguage = temp
    
    // 清空当前文本
    clear()
  }
  
  return {
    // 状态
    isLoading,
    isTranslating,
    error,
    canTranslate,
    
    // 内容
    sourceText,
    translatedText,
    history,
    
    // 配置
    sourceLanguage: computed(() => config.sourceLanguage),
    targetLanguage: computed(() => config.targetLanguage),
    
    // 方法
    setSourceText,
    translate,
    clear,
    switchLanguages
  }
} 