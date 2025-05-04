import { ref } from 'vue'
import { createTask, getTaskInfo, type CreateTaskParams } from '@/api/tingwu/tingwu'
import { RealtimeTranslationOptions } from './types'
import { showFailToast } from 'vant'

export function useApiService(options: RealtimeTranslationOptions = {}) {
  // 任务信息
  const taskId = ref<string | null>(null)
  const meetingUrl = ref('')
  const isInitialized = ref(false)
  const isError = ref(false)
  const errorMessage = ref('')
  
  // 默认参数
  const defaultOptions = {
    sourceLanguage: 'cn',
    targetLanguages: ['en'],
    audioFormat: 'pcm',
    sampleRate: 16000
  }
  
  // 合并配置
  const config = { ...defaultOptions, ...options }
  
  // 语言设置
  const sourceLanguage = ref(config.sourceLanguage)
  const targetLanguages = ref<string[]>(config.targetLanguages || [])
  
  // 更新语言设置的方法
  const updateLanguageSettings = (newSource: string, newTargets: string[]) => {
    console.log(`API服务更新语言设置: 源=${newSource}, 目标=${newTargets.join(',')}`)
    sourceLanguage.value = newSource
    targetLanguages.value = newTargets
    // 注意：这里只更新配置，不会重新创建任务
    // 任务的重新创建应由调用方负责
  }
  
  // 初始化任务
  const initializeTask = async (useExistingTask: boolean = false) => {
    if (isInitialized.value && !useExistingTask) return
    
    try {
      isError.value = false
      errorMessage.value = ''
      
      // 创建实时任务或使用现有任务
      let response: any
      let res: any
      
      if (useExistingTask && taskId.value) {
        // 如果指定使用现有任务，并且有taskId，则获取任务信息
        console.log('使用现有任务ID:', taskId.value)
        
        response = await getTaskInfo(taskId.value)
        res = response.data
        
        if (!res.success || !res.data.meetingJoinUrl) {
          console.warn('获取现有任务信息失败，将创建新任务')
          // 如果获取失败，回退到创建新任务
          useExistingTask = false
        } else {
          // 使用现有任务的meetingUrl
          meetingUrl.value = res.data.meetingJoinUrl
          isInitialized.value = true
          console.log('成功获取现有任务信息:', res)
        }
      }
      
      // 如果不使用现有任务或获取现有任务失败，则创建新任务
      if (!useExistingTask || !isInitialized.value) {
        // 创建实时任务
        const params: CreateTaskParams = {
          type: 'realtime',
          operation: 'start',
          input: {
            sourceLanguage: sourceLanguage.value, // 使用最新的语言设置
            format: config.audioFormat,
            sampleRate: config.sampleRate
          },
          parameters: {
            translationEnabled: targetLanguages.value.length > 0,
            translation: targetLanguages.value.length > 0 ? {
              targetLanguages: targetLanguages.value, // 使用最新的目标语言设置
              outputLevel: 2 // 返回中间结果
            } : undefined,
            transcription: {
              audioEventDetectionEnabled: true,
              outputLevel: 2, // 返回中间结果
              diarization: {
                speakerCount: 2
              }
            },
            autoChaptersEnabled: false,
            meetingAssistanceEnabled: false,
            summarizationEnabled: false
          }
        }
        
        response = await createTask(params)
        res = response.data

        console.log('创建实时翻译任务成功', res)

        if (!res.success || !res.data.meetingJoinUrl) {
          throw new Error(res.message || '创建实时翻译任务失败')
        }
        
        taskId.value = res.data.taskId
        meetingUrl.value = res.data.meetingJoinUrl!
        isInitialized.value = true
      }
      
      return {
        taskId: taskId.value,
        meetingUrl: meetingUrl.value
      }
      
    } catch (error) {
      isError.value = true
      errorMessage.value = error instanceof Error ? error.message : '未知错误'
      if (options.onError) options.onError(error instanceof Error ? error : new Error('未知错误'))
      console.error('初始化实时翻译任务失败:', error)
      showFailToast('初始化实时翻译任务失败')
      throw error
    }
  }
  
  // 结束任务
  const stopTask = async () => {
    if (!taskId.value) {
      console.log('没有活跃的任务，无需结束')
      return
    }
    
    try {
      console.log('结束实时翻译任务:', taskId.value)
      const params: CreateTaskParams = {
        type: 'realtime',
        operation: 'stop',
        input: {
          taskId: taskId.value,
          sourceLanguage: sourceLanguage.value // 使用最新的源语言设置
        },
        parameters: {
          translationEnabled: false,
          transcription: {
            audioEventDetectionEnabled: false,
            outputLevel: 1
          },
          autoChaptersEnabled: false,
          meetingAssistanceEnabled: false,
          summarizationEnabled: false
        }
      }
      
      const response = await createTask(params)
      console.log('成功结束实时翻译任务')
      
      // 清除任务相关数据
      taskId.value = null
      meetingUrl.value = ''
      isInitialized.value = false
      
      return true
    } catch (error) {
      console.error('结束实时翻译任务失败:', error)
      throw error
    }
  }
  
  return {
    taskId,
    meetingUrl,
    isInitialized,
    isError,
    errorMessage,
    sourceLanguage,
    targetLanguages,
    initializeTask,
    stopTask,
    updateLanguageSettings
  }
} 