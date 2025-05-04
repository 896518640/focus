import { ref, Ref } from 'vue'
import { showFailToast } from 'vant'

interface AudioProcessorOptions {
  sampleRate?: number
  onAudioData?: (data: ArrayBuffer) => void
  onError?: (error: Error) => void
}

export function useAudioProcessor(options: AudioProcessorOptions = {}) {
  const defaultOptions = {
    sampleRate: 16000
  }
  
  const config = { ...defaultOptions, ...options }
  
  // 音频处理相关变量
  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let scriptProcessor: ScriptProcessorNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  
  // 音频缓冲区
  let audioBuffer: ArrayBuffer[] = []
  
  // 状态
  const isRecording = ref(false)
  const isInitializing = ref(false)
  const errorMessage = ref('')
  
  // 初始化音频录制
  const initAudioRecording = async () => {
    if (isRecording.value) {
      console.log('音频录制已在进行，无需重新初始化')
      return
    }
    
    // 如果已经初始化了音频录制，先清理
    if (mediaStream || audioContext) {
      console.log('发现现有的音频资源，先清理后再初始化')
      await cleanupAudio()
      
      // 清理后添加短暂延迟，确保资源完全释放
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    try {
      isInitializing.value = true
      console.log('开始初始化麦克风...')
      
      // 获取麦克风权限
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // 检查确保mediaStream获取成功
      if (!mediaStream) {
        throw new Error('未能获取媒体流')
      }
      
      // 确保之前的AudioContext已关闭
      if (audioContext) {
        try {
          await audioContext.close()
        } catch (e) {
          console.warn('关闭旧的AudioContext失败:', e)
        }
        audioContext = null
      }
      
      // 创建音频上下文
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: config.sampleRate
      })
      
      // 创建音频源节点
      source = audioContext.createMediaStreamSource(mediaStream)
      
      // 创建处理节点 - 使用较小的缓冲区减少每帧数据大小
      scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1)
      
      // 处理音频数据
      scriptProcessor.onaudioprocess = handleAudioProcess
      
      // 连接节点
      source.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)
      
      isRecording.value = true
      console.log('音频录制已初始化完成，已连接到音频处理管道')
      
    } catch (error) {
      errorMessage.value = '无法访问麦克风'
      if (options.onError) options.onError(error instanceof Error ? error : new Error('无法访问麦克风'))
      console.error('初始化麦克风失败:', error)
      showFailToast('无法访问麦克风')
      
      // 发生错误时确保资源被清理
      await cleanupAudio()
    } finally {
      isInitializing.value = false
    }
  }
  
  // 处理音频数据
  const handleAudioProcess = (event: AudioProcessingEvent) => {
    if (!isRecording.value) {
      return
    }
    
    // 获取输入缓冲区
    const inputBuffer = event.inputBuffer
    const inputData = inputBuffer.getChannelData(0)
    
    // 检查是否有声音（简单静音检测）
    let sum = 0
    
    for (let i = 0; i < inputData.length; i++) {
      sum += Math.abs(inputData[i])
    }
    
    const average = sum / inputData.length
    const hasSound = average > 0.005 // 降低静音阈值，确保不会漏掉轻声
    
    // 不管有没有声音，都创建PCM数据
    // 转换为 16 位整数格式
    const pcmData = new Int16Array(inputData.length)
    for (let i = 0; i < inputData.length; i++) {
      // 将 -1.0 到 1.0 的浮点数转换为 16 位有符号整数
      pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF
    }
    
    // 将 pcmData 传递给回调
    if (options.onAudioData) {
      options.onAudioData(pcmData.buffer)
    } else {
      // 没有回调，添加到缓冲区
      addToBuffer(pcmData.buffer)
    }
    
    // 可以添加日志，但不要太频繁
    if (hasSound && Math.random() < 0.01) { // 仅记录1%的有声音帧
      console.log('处理音频数据，音量：', average.toFixed(5), '数据长度:', pcmData.length)
    }
  }
  
  // 将音频数据添加到缓冲区
  const addToBuffer = (data: ArrayBuffer) => {
    audioBuffer.push(data)
    
    // 控制缓冲区大小，避免内存溢出
    if (audioBuffer.length > 100) { // 限制最多缓存100个音频块
      console.warn(`音频缓冲区过大(${audioBuffer.length})，丢弃最早的数据`)
      audioBuffer = audioBuffer.slice(-50) // 只保留最后50个
    }
  }
  
  // 获取并清空缓冲区
  const getAndClearBuffer = () => {
    const buffer = [...audioBuffer]
    audioBuffer = []
    return buffer
  }
  
  // 清理音频资源
  const cleanupAudio = async () => {
    console.log('开始清理音频资源...')
    
    // 先设置录音状态为false，确保不再处理新的音频数据
    isRecording.value = false
    
    // 创建一个promise来管理清理过程
    return new Promise<void>((resolve) => {
      // 断开并清理音频处理节点
      if (scriptProcessor) {
        try {
          // 移除音频处理事件，确保不会有残留的回调
          scriptProcessor.onaudioprocess = null
          scriptProcessor.disconnect()
          console.log('成功断开scriptProcessor')
        } catch (e) {
          console.error('断开scriptProcessor出错:', e)
        }
        scriptProcessor = null
      }
      
      // 断开并清理音频源
      if (source) {
        try {
          source.disconnect()
          console.log('成功断开音频源')
        } catch (e) {
          console.error('断开source出错:', e)
        }
        source = null
      }
      
      // 停止所有音频轨道
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach(track => {
            track.stop()
            console.log('成功停止音频轨道:', track.kind)
          })
        } catch (e) {
          console.error('停止媒体轨道出错:', e)
        }
        mediaStream = null
      }
      
      // 关闭音频上下文
      if (audioContext && audioContext.state !== 'closed') {
        try {
          audioContext.close().then(() => {
            console.log('成功关闭音频上下文')
            audioContext = null
            // 清空音频缓冲区
            audioBuffer = []
            console.log('音频资源清理完成')
            resolve()
          }).catch(e => {
            console.error('关闭audioContext出错:', e)
            audioContext = null
            // 即使出错也要清空音频缓冲区
            audioBuffer = []
            console.log('音频资源清理完成，但关闭AudioContext出错')
            resolve()
          })
        } catch (e) {
          console.error('关闭audioContext出错:', e)
          audioContext = null
          // 异常情况也要清空音频缓冲区
          audioBuffer = []
          console.log('音频资源清理完成，但关闭AudioContext出现异常')
          resolve()
        }
      } else {
        // 没有活跃的audioContext需要关闭
        audioContext = null
        // 清空音频缓冲区
        audioBuffer = []
        console.log('音频资源清理完成')
        resolve()
      }
    })
  }
  
  return {
    isRecording,
    isInitializing,
    errorMessage,
    initAudioRecording,
    cleanupAudio,
    getAndClearBuffer,
    addToBuffer
  }
} 