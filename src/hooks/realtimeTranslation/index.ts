import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '@/composables/useUserStore'
import { RealtimeTranslationOptions, RealtimeTranslationReturn } from './types'
import { useWebSocket } from './useWebSocket'
import { useAudioProcessor } from './useAudioProcessor'
import { useChapterManager } from './useChapterManager'
import { useSessionManager } from './useSessionManager'
import { useMessageHandler } from './useMessageHandler'
import { useApiService } from './useApiService'

/**
 * 实时翻译钩子函数
 * @param options 配置选项
 * @returns 翻译控制接口
 */
export function useRealtimeTranslation(options: RealtimeTranslationOptions = {}): RealtimeTranslationReturn {
  const userStore = useUserStore()
  
  // 默认参数
  const defaultOptions = {
    sourceLanguage: 'cn',
    targetLanguages: ['en'],
    audioFormat: 'pcm',
    sampleRate: 16000,
    autoStart: false
  }
  
  // 合并配置
  const config = { ...defaultOptions, ...options }
  
  // 反应式语言配置
  const sourceLanguage = ref(config.sourceLanguage)
  const targetLanguages = ref<string[]>(config.targetLanguages)
  
  // 监听源语言变化
  watch(() => options.sourceLanguage, (newValue) => {
    if (newValue) sourceLanguage.value = newValue
  }, { immediate: true })
  
  // 监听目标语言变化
  watch(() => options.targetLanguages, (newValue) => {
    if (newValue) targetLanguages.value = newValue
  }, { immediate: true })
  
  // 状态
  const isConnecting = ref(false)
  const isTranslating = ref(false)
  const audioInitialized = ref(false)  // 新增：标记音频处理器是否已初始化
  
  // 控制WebSocket正常关闭后是否保持任务活跃
  const keepTaskAliveOnNormalClose = ref(false)
  
  // 转写结果
  const transcriptionResult = ref('')
  const translationResult = ref('')
  
  // 上次语言设置，用于检测变化
  const lastSourceLang = ref(sourceLanguage.value)
  const lastTargetLangs = ref<string[]>([...targetLanguages.value])
  
  // 1. 初始化API服务
  const apiService = useApiService({
    sourceLanguage: sourceLanguage.value,
    targetLanguages: targetLanguages.value,
    audioFormat: config.audioFormat,
    sampleRate: config.sampleRate,
    onError: (error) => {
      if (options.onError) options.onError(error)
    }
  })
  
  // 2. 初始化会话管理器
  const sessionManager = useSessionManager()
  
  // 3. 初始化章节管理器
  const chapterManager = useChapterManager()
  
  // 4. 初始化音频处理器
  const audioProcessor = useAudioProcessor({
    sampleRate: config.sampleRate,
    onAudioData: (data) => {
      // 当收到音频数据时，发送到WebSocket
      webSocket.sendBinaryData(data)
    },
    onError: (error) => {
      if (options.onError) options.onError(error)
    }
  })
  
  // 5. 初始化消息处理器
  const messageHandler = useMessageHandler({
    updateSentence: sessionManager.updateSentence,
    updateTranslation: sessionManager.updateTranslation,
    buildTranscriptionResult: sessionManager.buildTranscriptionResult,
    buildTranslationResult: sessionManager.buildTranslationResult,
    onTranscriptionResult: (text) => {
      transcriptionResult.value = text;
      if (options.onTranscriptionResult) {
        options.onTranscriptionResult(text);
      }
    },
    onTranslationResult: (text) => {
      translationResult.value = text;
      if (options.onTranslationResult) {
        options.onTranslationResult(text);
      }
    },
    // 会话边界检测回调
    onSessionDetected: handleSessionDetected,
    // 添加转写完成回调
    onTranscriptionCompleted: handleTranscriptionCompleted
  });
  
  // 监听源语言变化
  watch(sourceLanguage, (newSource) => {
    if (newSource !== lastSourceLang.value) {
      handleLanguageChange();
      lastSourceLang.value = newSource;
    }
  });
  
  // 监听目标语言变化
  watch(targetLanguages, (newTargets) => {
    if (JSON.stringify(newTargets) !== JSON.stringify(lastTargetLangs.value)) {
      handleLanguageChange();
      lastTargetLangs.value = [...newTargets];
    }
  });
  
  // 处理语言变化的函数
  async function handleLanguageChange() {
    console.log(`语言设置已更新: 源=${sourceLanguage.value}, 目标=${targetLanguages.value.join(',')}`);
    
    // 如果正在翻译，需要重启任务
    if (isTranslating.value) {
      console.log('正在翻译中，需要重启任务以应用新的语言设置');
      
      // 保存当前结果
      if (transcriptionResult.value || translationResult.value) {
        sessionManager.setPreservedHistory(transcriptionResult.value, translationResult.value);
        chapterManager.addChapterHistory(transcriptionResult.value, translationResult.value);
      }
      
      // 重启任务，使用新的语言设置
      try {
        // 停止现有转写和音频采集
        if (webSocket.isConnected.value) {
          console.log('断开当前WebSocket连接');
          webSocket.disconnect(1000, "语言切换重建任务");
        }
        
        // 清理音频资源
        audioProcessor.cleanupAudio();
        audioInitialized.value = false;
        
        // 设置为非翻译状态
        isTranslating.value = false;
        
        // 更新API服务的语言设置
        apiService.updateLanguageSettings(sourceLanguage.value, targetLanguages.value);
        
        // 使用新添加的方法重新创建任务
        await apiService.recreateTask();
        
        // 延迟一点时间再重启，确保资源被正确释放
        setTimeout(() => {
          startTranslation();
        }, 1000);
      } catch (error) {
        console.error('重启翻译任务失败:', error);
      }
    } else {
      // 不在翻译中，更新API服务的语言设置并重建任务（如果已存在）
      apiService.updateLanguageSettings(sourceLanguage.value, targetLanguages.value);
      
      // 如果已经初始化了任务，重新创建以应用新设置
      if (apiService.isInitialized.value) {
        console.log('重新创建任务以应用新的语言设置');
        try {
          await apiService.recreateTask();
        } catch (error) {
          console.error('重新创建任务失败:', error);
        }
      }
    }
  }
  
  // 6. 初始化WebSocket
  const webSocket = useWebSocket({
    onOpen: handleWebSocketOpen,
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      if (options.onError) options.onError(error)
    },
    onClose: handleWebSocketClose
  })
  
  // 转写暂停标志
  const isPausing = ref(false);
  
  // 会话边界检测回调
  function handleSessionDetected(segmentIndex: number, beginTime: number) {
    console.log(`检测到会话边界: 索引=${segmentIndex}, 时间=${beginTime}ms`);
    
    // 如果是初始会话（首次连接），不需要特殊处理
    if (sessionManager.sessionCounter.value === 0) {
      console.log('首次会话，不需要重置');
      return;
    }
    
    // 保存当前状态，确保不丢失已有内容
    sessionManager.setPreservedHistory(transcriptionResult.value, translationResult.value);
    
    // 记录新会话的起始时间点
    const newSessionTimestamp = Date.now();
    console.log(`新会话开始于: ${new Date(newSessionTimestamp).toISOString()}`);
    
    // 准备新会话 - 彻底清理状态但保留历史内容
    const { hasHistory } = sessionManager.prepareNewSession();
    
    // 重新构建结果，但确保不重复添加历史内容
    const transcriptionResultObj = sessionManager.buildTranscriptionResult();
    transcriptionResult.value = transcriptionResultObj.text;
    translationResult.value = sessionManager.buildTranslationResult();
    
    // 通知UI更新
    if (options.onTranscriptionResult) {
      options.onTranscriptionResult(transcriptionResult.value);
    }
    
    if (options.onTranslationResult) {
      options.onTranslationResult(translationResult.value);
    }
    
    console.log('会话边界处理完成，状态已重置，准备处理新会话内容');
  }
  
  // 处理转写完成事件
  function handleTranscriptionCompleted() {
    console.log('接收到TranscriptionCompleted事件，处理最终结果');
    
    // 如果是暂停流程中，现在才是保存历史的正确时机
    if (isPausing.value) {
      console.log('暂停流程中接收到最终结果，等待所有翻译处理完成');
      
      // 延迟处理，给翻译结果一些时间完成处理
      setTimeout(() => {
        console.log('暂停流程中延迟处理最终结果，保存到历史记录');
        
        // 将当前内容添加到章节历史
        chapterManager.addChapterHistory(transcriptionResult.value, translationResult.value);
        
        // 更新为保存的历史内容
        sessionManager.setPreservedHistory(transcriptionResult.value, translationResult.value);
        
        // 重置暂停标志
        isPausing.value = false;
        
        // 重置转写状态
        isTranslating.value = false;
      }, 800); // 延迟800毫秒，确保翻译消息都已处理
    }
  }

  
  // 处理WebSocket打开事件
  async function handleWebSocketOpen() {
    console.log('WebSocket连接已打开，进行初始化...');

    // 保存当前状态，确保不丢失已有内容
    if (transcriptionResult.value || translationResult.value) {
      sessionManager.setPreservedHistory(transcriptionResult.value, translationResult.value);
    }

    // 每次WebSocket连接打开时，彻底重置会话状态
    const { hasHistory, hasPreviousSession } = sessionManager.prepareNewSession();
    
    // 如果没有历史或之前的会话，不需要恢复内容
    if (!hasHistory && !hasPreviousSession) {
      console.log('没有历史内容或之前的会话，从空白开始');
      transcriptionResult.value = '';
      translationResult.value = '';
    } else {
      // 检查并恢复缓存内容
      const { restoredTranscription, restoredTranslation, hasRestored } = 
        chapterManager.checkAndRestoreCache(transcriptionResult.value, translationResult.value);
      
      // 如果恢复了内容，更新结果
      if (hasRestored) {
        transcriptionResult.value = restoredTranscription;
        translationResult.value = restoredTranslation;
        
        // 保存为历史内容，确保它不会在新会话中被重复
        sessionManager.setPreservedHistory(restoredTranscription, restoredTranslation);
        
        // 通知UI更新
        if (options.onTranscriptionResult) {
          options.onTranscriptionResult(transcriptionResult.value);
        }
        
        if (options.onTranslationResult) {
          options.onTranslationResult(translationResult.value);
        }
        
        console.log('已恢复缓存内容');
      }
    }
    
    // 设置心跳检测
    webSocket.setupHeartbeat(5000, messageHandler.createHeartbeatMessage());
    
    // 发送开始转写命令
    sendStartTranscription();
    
    // 如果处于转写状态且音频未初始化，才初始化音频录制
    if (isTranslating.value && !audioInitialized.value && !audioProcessor.isRecording.value) {
      console.log('WebSocket连接成功，初始化音频录制');
      await audioProcessor.initAudioRecording();
      audioInitialized.value = true;
    } else if (audioProcessor.isRecording.value) {
      console.log('音频录制已在进行中，无需重新初始化');
    }
  }
  
  // 处理WebSocket消息
  function handleWebSocketMessage(event: MessageEvent) {
    messageHandler.processWebSocketMessage(event)
  }
  
  // 处理WebSocket关闭
  function handleWebSocketClose(event: CloseEvent) {
    // 如果处于暂停过程中，记录这个情况
    if (isPausing.value) {
      console.log(`WebSocket连接断开，但处于暂停过程中: code=${event.code}, reason=${event.reason}`);
      
      // 如果是因为暂停而断开，不需要触发暂停流程，因为已经触发了
      if (event.code === 1000 && event.reason === "正常关闭" && keepTaskAliveOnNormalClose.value) {
        // 执行一些额外的暂停清理工作
        isPausing.value = false;
        isTranslating.value = false;
        console.log('暂停过程中WebSocket正常关闭，清理状态完成');
        return;
      }
    }

    // 使用更彻底的会话重置方式，而不仅仅是增加会话计数
    sessionManager.prepareNewSession()
    
    // 记录关闭原因
    console.log(`WebSocket连接断开: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`)
    
    // 会话结束时的清理和重连逻辑
    if (isTranslating.value) {
      // 确保清理音频资源，避免持续采集但无法发送的情况
      if (audioProcessor.isRecording.value) {
        console.log('WebSocket断开，停止音频采集')
        audioProcessor.cleanupAudio()
        audioInitialized.value = false  // 确保音频状态标记重置
      }
      
      // 如果仍处于翻译状态，尝试自动重连
      console.log('WebSocket连接断开，但仍处于翻译状态，将尝试重新连接...')
      
      // 如果连接意外关闭，并且仍在翻译中，尝试重新连接
      if (
        event.code !== 1000 && // 正常关闭
        event.code !== 1001 && // 离开页面
        apiService.taskId.value && 
        isTranslating.value
      ) {
        // 延迟重连，避免立即重连可能遇到的服务端问题
        setTimeout(async () => {
          try {
            // 仅在仍处于翻译状态时重连
            if (isTranslating.value) {
              console.log('开始尝试重连WebSocket...')
              
              // 先尝试使用现有的meetingUrl重连
              try {
                await connectWebSocket()
                
                if (webSocket.isConnected.value) {
                  console.log('重连成功，重新发送开始转写命令')
                  sendStartTranscription()
                  await audioProcessor.initAudioRecording()
                  audioInitialized.value = true  // 显式设置音频状态标记
                  return
                }
              } catch (connectError) {
                console.error('使用现有URL重连失败，尝试重新初始化任务:', connectError)
              }
              
              // 如果直接重连失败，尝试重新初始化任务
              try {
                await apiService.initializeTask(true)
                await connectWebSocket()
                
                if (webSocket.isConnected.value) {
                  console.log('任务重新初始化成功，发送开始转写命令')
                  sendStartTranscription()
                  await audioProcessor.initAudioRecording()
                  audioInitialized.value = true  // 显式设置音频状态标记
                }
              } catch (initError) {
                console.error('重新初始化任务失败:', initError)
                apiService.isError.value = true
                apiService.errorMessage.value = '重连失败，请手动重试'
                isTranslating.value = false
                audioInitialized.value = false  // 确保音频状态标记重置
                if (options.onError) options.onError(new Error('重连失败'))
              }
            }
          } catch (error) {
            console.error('重连WebSocket失败:', error)
            apiService.isError.value = true
            apiService.errorMessage.value = '重连失败，请手动重试'
            isTranslating.value = false
            audioInitialized.value = false  // 确保音频状态标记重置
            if (options.onError) options.onError(new Error('重连失败'))
          }
        }, 2000) // 延迟2秒重连
      } else if (event.code === 1000 && keepTaskAliveOnNormalClose.value) {
        // 正常关闭但需要保持任务活跃，将状态设置为暂停
        console.log('WebSocket正常关闭，暂停翻译状态')
        isTranslating.value = false
      } else {
        // 正常关闭或其他情况下，设置为非翻译状态
        console.log('WebSocket正常关闭或用户手动停止，结束翻译状态')
        isTranslating.value = false
      }
    } else {
      // 如果不再处于翻译状态，则清理相关资源
      console.log('WebSocket连接断开，不再处于翻译状态，不会自动重连')
      audioProcessor.cleanupAudio()
      audioInitialized.value = false  // 确保音频状态标记重置
    }
  }
  
  // 更新发送开始转写命令，使用最新的语言设置
  function sendStartTranscription() {
    const startMessage = messageHandler.createStartTranscriptionMessage({
      sourceLanguage: sourceLanguage.value,
      audioFormat: config.audioFormat,
      sampleRate: config.sampleRate
    })
    
    webSocket.sendMessage(startMessage)
    isTranslating.value = true
    console.log(`已发送开始转写命令，源语言: ${sourceLanguage.value}`)
  }
  
  // 发送停止转写命令
  function sendStopTranscription() {
    const stopMessage = messageHandler.createStopTranscriptionMessage()
    webSocket.sendMessage(stopMessage)
    console.log('已发送停止转写命令，WebSocket连接保持活跃')
  }
  
  // 连接WebSocket
  async function connectWebSocket() {
    if (!apiService.isInitialized.value || !apiService.meetingUrl.value) {
      console.log('任务未初始化或缺少URL，无法建立WebSocket连接')
      throw new Error('任务未初始化或缺少WebSocket URL')
    }
    
    try {
      isConnecting.value = true
      
      // 重置错误状态
      apiService.isError.value = false
      apiService.errorMessage.value = ''
      
      // 先检查是否有现有的连接需要关闭
      if (webSocket.wsConnection.value) {
        console.log('关闭现有WebSocket连接')
        webSocket.disconnect(1000, "在重新连接前清理")
      }
      
      // 创建WebSocket连接
      console.log('尝试连接WebSocket:', apiService.meetingUrl.value)
      await webSocket.connect(apiService.meetingUrl.value)
      
      if (!webSocket.isConnected.value) {
        throw new Error('WebSocket连接失败')
      }
      
      console.log('WebSocket连接成功')
      return true
      
    } catch (error) {
      apiService.isError.value = true
      apiService.errorMessage.value = error instanceof Error ? error.message : '未知错误'
      if (options.onError) options.onError(error instanceof Error ? error : new Error('未知错误'))
      console.error('连接WebSocket失败:', error)
      
      isConnecting.value = false
      throw error
    } finally {
      isConnecting.value = false
    }
  }
  
  // 初始化任务
  const initializeTask = async (useExistingTask: boolean = false) => {
    if ((apiService.isInitialized.value || isConnecting.value) && !useExistingTask) return
    
    try {
      isConnecting.value = true
      
      // 初始化API任务
      await apiService.initializeTask(useExistingTask)
      
      // 如果设置了自动开始，则自动连接WebSocket
      if (config.autoStart) {
        await connectWebSocket()
      }
      
    } catch (error) {
      if (options.onError) options.onError(error instanceof Error ? error : new Error('初始化任务失败'))
      console.error('初始化实时翻译任务失败:', error)
    } finally {
      isConnecting.value = false
    }
  }
  
  // 开始翻译
  const startTranslation = async () => {
    try {
      // 防止重复启动
      if (isTranslating.value) {
        console.log('翻译已在进行中，无需重复启动')
        return
      }
      
      console.log('开始新的翻译会话')
      
      // 重置WebSocket关闭行为
      keepTaskAliveOnNormalClose.value = false
      
      // 检查是否有历史内容但UI为空，需要恢复显示
      const historyIsEmpty = chapterManager.chapterHistory.value.length === 0
      const currentDisplayEmpty = !transcriptionResult.value && !translationResult.value
      
      if (!historyIsEmpty && currentDisplayEmpty) {
        // 从历史记录恢复内容
        const { restoredTranscription, restoredTranslation } = chapterManager.restoreFromHistory()
        
        transcriptionResult.value = restoredTranscription
        translationResult.value = restoredTranslation
        
        // 通知UI更新
        if (options.onTranscriptionResult) {
          options.onTranscriptionResult(transcriptionResult.value)
        }
        
        if (options.onTranslationResult) {
          options.onTranslationResult(translationResult.value)
        }
      }
      
      // 保存当前的历史内容，防止新转写结果覆盖
      if (transcriptionResult.value || translationResult.value) {
        sessionManager.setPreservedHistory(transcriptionResult.value, translationResult.value)
        console.log('已保存当前内容作为历史内容')
      }
      
      // 不添加章节标记，保持内容紧凑
      console.log('新会话开始，不添加章节标记')
      
      // 使用新的会话准备函数，完全重置会话状态，保证每次会话处理逻辑一致
      const { hasHistory, hasPreviousSession } = sessionManager.prepareNewSession()
      console.log(`新会话准备: 有历史=${hasHistory}, 有前序会话=${hasPreviousSession}`)
      
      // 设置状态
      isTranslating.value = true
      apiService.isError.value = false
      apiService.errorMessage.value = ''
      
      // 初始化任务
      if (!apiService.isInitialized.value) {
        console.log('尚未初始化任务，先初始化任务')
        await initializeTask()
      }
      
      // 连接WebSocket
      if (!webSocket.isConnected.value) {
        console.log('WebSocket未连接，建立连接')
        await connectWebSocket()
      } else {
        console.log('WebSocket已连接，直接发送开始命令和初始化音频')
        sendStartTranscription()
        await audioProcessor.initAudioRecording()
        audioInitialized.value = true
      }
      
    } catch (error) {
      console.error('启动翻译失败:', error)
      apiService.isError.value = true
      isTranslating.value = false
      apiService.errorMessage.value = '启动翻译失败'
      if (options.onError) options.onError(error instanceof Error ? error : new Error('启动翻译失败'))
    }
  }
  
  // 暂停翻译
  const pauseTranslation = async () => {
    // 只有在连接和转写状态下才有效
    if (webSocket.isConnected.value && isTranslating.value) {
      console.log('暂停翻译，保持WebSocket连接');
      
      // 设置正常关闭时保持任务活跃
      keepTaskAliveOnNormalClose.value = true;
      
      // 设置暂停标志，等待TranscriptionCompleted事件
      isPausing.value = true;
      
      // 发送停止转写命令但保持连接
      sendStopTranscription();
      
      // 注意：不再在此处立即保存历史记录
      // 而是等待TranscriptionCompleted事件触发后再保存
      console.log('已发送停止命令，等待最终结果后再保存历史');
      
      // 清理音频资源，但保持WebSocket连接活跃
      audioProcessor.cleanupAudio();
      audioInitialized.value = false;  // 标记音频已清理
      
      // 设置超时保护，防止TranscriptionCompleted事件丢失
      const timeoutId = setTimeout(() => {
        if (isPausing.value) {
          console.log('等待最终结果超时，直接保存当前历史');
          
          // 将当前内容添加到章节历史
          chapterManager.addChapterHistory(transcriptionResult.value, translationResult.value);
          
          // 更新为保存的历史内容
          sessionManager.setPreservedHistory(transcriptionResult.value, translationResult.value);
          
          // 重置暂停标志
          isPausing.value = false;
          
          // 重置转写状态
          isTranslating.value = false;
        }
      }, 5000);  // 5秒超时保护
    } else {
      console.log('WebSocket未连接或未在转写状态，无法暂停');
      
      // 如果WebSocket已断开但仍处于翻译状态，重置状态
      if (!webSocket.isConnected.value && isTranslating.value) {
        isTranslating.value = false;
        audioProcessor.cleanupAudio();
        audioInitialized.value = false;
      }
    }
  }
  
  // 恢复翻译
  const resumeTranslation = async () => {
    try {
      // 防止在已经转写状态下重复启动
      if (isTranslating.value) {
        console.log('翻译已在进行中，无需恢复')
        return
      }
      
      console.log('恢复翻译会话')
      
      // 确保我们有恢复所需的所有状态
      if (!apiService.taskId.value) {
        console.log('没有活跃的任务，无法恢复，将重新启动翻译')
        await startTranslation()
        return
      }
      
      // 保存当前历史内容，确保恢复后内容不会重复
      if (transcriptionResult.value || translationResult.value) {
        sessionManager.setPreservedHistory(transcriptionResult.value, translationResult.value)
        console.log('恢复前保存当前内容作为历史')
      }
      
      // 重新准备会话状态，确保在恢复后是干净的状态
      const { hasHistory, hasPreviousSession } = sessionManager.prepareNewSession()
      console.log(`恢复准备: 有历史=${hasHistory}, 有前序会话=${hasPreviousSession}`)
      
      // 重置WebSocket关闭行为
      keepTaskAliveOnNormalClose.value = false
      
      // 设置状态
      isTranslating.value = true
      apiService.isError.value = false
      apiService.errorMessage.value = ''
      
      // 检查WebSocket连接
      if (!webSocket.isConnected.value) {
        console.log('恢复前建立WebSocket连接')
        await connectWebSocket()
      } else {
        console.log('WebSocket已连接，发送开始命令')
        
        // 重新发送开始转写命令
        sendStartTranscription()
        
        // 初始化音频录制
        if (!audioProcessor.isRecording.value) {
          await audioProcessor.initAudioRecording()
          audioInitialized.value = true
        }
      }
      
      console.log('翻译已恢复')
      
    } catch (error) {
      console.error('恢复翻译失败:', error)
      apiService.isError.value = true
      isTranslating.value = false
      apiService.errorMessage.value = '恢复翻译失败'
      if (options.onError) options.onError(error instanceof Error ? error : new Error('恢复翻译失败'))
    }
  }
  
  // 停止翻译并结束任务
  const stopTranslation = async (keepTaskAlive: boolean = false) => {
    // 在停止前，检查是否处于暂停过程中
    if (isPausing.value) {
      console.log('停止操作发生在暂停过程中，取消等待最终结果的逻辑');
      isPausing.value = false;
    }

    // 在停止前，保存当前历史到章节系统
    if (transcriptionResult.value || translationResult.value) {
      chapterManager.addChapterHistory(transcriptionResult.value, translationResult.value);
    }
    
    // 如果正在翻译，先发送停止转写命令
    if (webSocket.isConnected.value && isTranslating.value) {
      console.log('发送停止转写命令')
      sendStopTranscription()
      
      // 更新状态
      isTranslating.value = false
    }
    
    // 清理音频资源
    audioProcessor.cleanupAudio()
    audioInitialized.value = false  // 标记音频已清理
    
    // 如果不需要保持任务活跃，则完全清理资源并关闭任务
    if (!keepTaskAlive) {
      console.log('不保留任务，完全关闭资源')
      
      // 重置会话状态
      sessionManager.resetAllSessions()
      
      // 关闭WebSocket连接
      webSocket.disconnect(1000, "用户完全停止任务")
      
      // 结束API任务
      if (apiService.taskId.value) {
        try {
          await apiService.stopTask()
        } catch (error) {
          console.error('结束实时翻译任务失败:', error)
        }
      }
    } else {
      console.log('临时暂停转写，保持任务活跃')
      // 当keepTaskAlive为true时，不关闭连接和清理任务
    }
  }
  
  // 清空翻译结果
  const clearResults = () => {
    transcriptionResult.value = ''
    translationResult.value = ''
    
    // 重置会话状态
    sessionManager.resetAllSessions()
    
    // 清空章节历史
    chapterManager.clearHistory()
    
    console.log('已清空转写和翻译结果，并重置会话状态和章节计数')
  }
  
  // 设置源语言
  const setSourceLanguage = (lang: string) => {
    sourceLanguage.value = lang
    console.log(`已设置源语言为: ${lang}`)
    // handleLanguageChange 会通过 watch 自动触发
  }
  
  // 设置目标语言
  const setTargetLanguages = (langs: string[]) => {
    targetLanguages.value = langs
    console.log(`已设置目标语言为: ${langs.join(',')}`)
    // handleLanguageChange 会通过 watch 自动触发
  }
  
  // 自动初始化
  onMounted(() => {
    if (config.autoStart) {
      initializeTask()
    }
  })
  
  // 在组件卸载时清理资源
  onUnmounted(() => {
    stopTranslation()
  })
  
  // 导出钩子函数和状态
  return {
    // 状态
    isInitialized: apiService.isInitialized,
    isConnecting,
    isConnected: webSocket.isConnected,
    isTranslating,
    isError: apiService.isError,
    errorMessage: apiService.errorMessage,
    transcriptionResult,
    translationResult,
    sourceLanguage,
    targetLanguages,
    apiTaskId: apiService.taskId,
    
    // API
    initializeTask,
    startTranslation,
    pauseTranslation,
    resumeTranslation,
    stopTranslation,
    clearResults,
    setSourceLanguage,
    setTargetLanguages
  }
}

// 导出类型（使用export type解决隔离模块问题）
export type { RealtimeTranslationOptions } from './types' 