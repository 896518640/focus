import { ref, onUnmounted, watch, Ref as VueRef } from 'vue';
import { io, Socket } from 'socket.io-client';
import { showToast } from 'vant';

// 语音服务类型与后端保持一致
export enum SpeechServiceType {
  IFLYTEK_STT = 'IFLYTEK_STT',
  RTASR = 'RTASR'
}

interface SpeechRecognitionOptions {
  sampleRate?: number;     // 采样率
  bufferSize?: number;     // 缓冲区大小
  serverUrl?: string;      // 服务器URL
  serviceType?: SpeechServiceType | VueRef<SpeechServiceType>; // 服务类型，可以是值或者响应式引用
  language?: string | VueRef<string>;       // 语言，可以是值或者响应式引用
  autoRestart?: boolean;   // 自动重启
  vadThreshold?: number;   // 静音检测阈值
  timeout?: number;        // 超时时间（毫秒）
}

// 辅助函数，检查一个值是否为ref
function isRef(obj: any): obj is VueRef<any> {
  return obj && typeof obj === 'object' && 'value' in obj;
}

/**
 * 语音识别Hook
 * @param options 配置选项
 */
export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  // 默认配置
  const defaultOptions: Omit<SpeechRecognitionOptions, 'serviceType'> = {
    sampleRate: 16000,
    bufferSize: 4096,
    serverUrl: 'http://localhost:3000',
    language: 'zh_cn',
    autoRestart: false,
    vadThreshold: 0.01,
    timeout: 10000, // 10秒
  };

  // 合并基本配置
  const config = {
    ...defaultOptions,
    ...options,
    // 不包含serviceType，将单独处理
  };

  // 服务类型处理
  let serviceTypeValue: SpeechServiceType;
  let serviceTypeRef: VueRef<SpeechServiceType> | undefined;

  if (isRef(options.serviceType)) {
    // 如果是响应式引用
    serviceTypeRef = options.serviceType as VueRef<SpeechServiceType>;
    serviceTypeValue = serviceTypeRef.value;
  } else if (options.serviceType !== undefined) {
    // 如果是普通值
    serviceTypeValue = options.serviceType as SpeechServiceType;
  } else {
    // 默认值
    serviceTypeValue = SpeechServiceType.RTASR;
  }

  // 当前使用的服务类型
  const currentServiceType = ref<SpeechServiceType>(serviceTypeValue);

  // 语言处理
  let languageValue: string;
  let languageRef: VueRef<string> | undefined;

  if (isRef(options.language)) {
    // 如果是响应式引用
    languageRef = options.language as VueRef<string>;
    languageValue = languageRef.value;
  } else if (options.language !== undefined) {
    // 如果是普通值
    languageValue = options.language as string;
  } else {
    // 默认值
    languageValue = 'zh_cn';
  }

  // 当前使用的语言
  const currentLanguage = ref<string>(languageValue);

  // 状态管理
  const isRecording = ref(false);
  const translatedText = ref('');
  const isConnected = ref(false);
  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  // Socket连接
  let socket: Socket | null = null;

  // 音频相关
  let audioContext: AudioContext | null = null;
  let mediaStream: MediaStream | null = null;
  let scriptProcessor: ScriptProcessorNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;

  // 静音检测
  let silenceStart: number | null = null;
  let isSilent = false;
  let lastAudioLevel = 0;

  // 超时处理
  let timeoutId: number | null = null;

  // 用于管理讯飞语音听写的历史结果
  let xfHistory: Array<{ sn: number, text: string }> = [];

  // 监听服务类型变化
  if (serviceTypeRef) {
    watch(serviceTypeRef, (newType) => {
      console.log('Service type changed to:', newType);
      currentServiceType.value = newType;
      // 如果正在录音，我们需要停止并重新开始
      if (isRecording.value) {
        console.log('Recording in progress, stopping due to service type change');
        stopRecording();
      }
    });
  }

  // 监听语言变化
  if (languageRef) {
    watch(languageRef, (newLanguage) => {
      console.log('Language changed to:', newLanguage);
      currentLanguage.value = newLanguage;
      // 如果正在录音，我们需要停止并重新开始
      if (isRecording.value) {
        console.log('Recording in progress, stopping due to language change');
        stopRecording();
      }
    });
  }

  /**
   * 初始化WebSocket连接
   */
  const initSocket = () => {
    if (socket) {
      socket.disconnect();
    }

    try {
      socket = io(config.serverUrl as string);

      socket.on('connect', () => {
        isConnected.value = true;
        console.log('Socket connected');
      });

      socket.on('disconnect', () => {
        isConnected.value = false;
        console.log('Socket disconnected');
      });

      socket.on('translation', (data) => {
        // 使用结果数据，根据不同服务类型处理
        handleTranscriptResult(data.original);
        resetTimeout();
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
        error.value = err.message || '识别服务发生错误';
        if (error.value) {
          showToast(error.value);
        }
      });

      socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        error.value = '无法连接到识别服务器';
        showToast(error.value);
      });
    } catch (err) {
      console.error('Failed to initialize socket:', err);
      error.value = '无法初始化识别服务';
      showToast(error.value);
    }
  };

  /**
   * 根据序号(sn)合并讯飞语音听写结果
   */
  const mergeXflyResults = (sn: number, text: string, pgs?: string, rg?: number[]) => {
    // 查找历史结果中是否有相同sn的记录
    const index = xfHistory.findIndex(item => item.sn === sn);

    if (index !== -1) {
      // 已存在此序号，更新内容
      xfHistory[index].text = text;
    } else {
      // 新序号，添加到历史
      xfHistory.push({ sn, text });

      // 确保历史按sn排序
      xfHistory.sort((a, b) => a.sn - b.sn);
    }

    // 处理动态修正
    if (pgs === 'rpl' && rg && rg.length === 2) {
      // 动态修正，替换范围内的结果
      const [start, end] = rg;

      // 移除需要替换的区间
      xfHistory = xfHistory.filter(item => item.sn < start || item.sn > end);
    }

    // 拼接所有结果
    return xfHistory.map(item => item.text).join('');
  };

  /**
   * 处理语音识别结果
   */
  const handleTranscriptResult = (data: any) => {
    console.log('收到识别结果:', data);

    // 根据不同的服务类型处理返回的数据格式
    if (currentServiceType.value === SpeechServiceType.RTASR) {
      // RTASR服务的返回格式处理
      const resultData = data.data;
      if (resultData?.result?.text) {
        if (resultData.result.isEnd) {
          // 最终结果
          translatedText.value += resultData.result.text;
        } else {
          // 中间结果，可以选择更新或保持当前文本
          // 这里我们用最新中间结果替换最后一段
          const parts = translatedText.value.split('。');
          if (parts.length > 1) {
            parts[parts.length - 1] = resultData.result.text;
            translatedText.value = parts.join('。');
          } else {
            translatedText.value = resultData.result.text;
          }
        }
      }
    } else if (currentServiceType.value === SpeechServiceType.IFLYTEK_STT) {
      // 科大讯飞语音听写返回格式处理
      // 参考：https://www.xfyun.cn/doc/asr/voicedictation/API.html

      // 检查返回码
      if (data.code !== 0) {
        console.error('讯飞语音听写错误:', data.message);
        error.value = `讯飞语音听写错误: ${data.message}`;
        return;
      }

      // 没有data时直接返回
      if (!data.data) {
        return;
      }

      // 解析结果
      const resultData = data.data;

      // 检查识别结果是否为空
      if (!resultData.result || !resultData.result.ws) {
        return;
      }

      // 提取文本结果
      let text = '';

      // 从中文分词数组中提取文字
      for (const word of resultData.result.ws) {
        for (const cw of word.cw) {
          text += cw.w;
        }
      }

      console.log('解析的文本:', text, '状态:', resultData.status, '序号:', resultData.result.sn);

      // 使用序号管理和合并结果
      const mergedText = mergeXflyResults(
        resultData.result.sn,
        text,
        resultData.result.pgs,
        resultData.result.rg
      );

      // 根据状态处理结果
      if (resultData.status === 2 || resultData.result.ls) {
        // 最后一块结果或标记为最后一片
        translatedText.value = mergedText;

        // 最终结果后，清空历史
        if (resultData.status === 2) {
          xfHistory = [];
        }
      } else {
        // 第一块或中间结果
        translatedText.value = mergedText;
      }
    }
  };

  /**
   * 获取特定语音服务类型的选项
   * @param serviceType 服务类型
   * @param language 语言
   * @returns 服务特定的选项对象
   */
  const getServiceOptions = (serviceType: SpeechServiceType, language: string): Record<string, any> => {
    // 基础选项，所有服务类型都需要的
    const baseOptions = {
      language
    };

    // 根据不同服务类型返回特定的选项
    switch (serviceType) {
      case SpeechServiceType.IFLYTEK_STT:
        return {
          ...baseOptions,
          dwa: 'wpgs', // 启用动态修正
          // 可以在这里添加其他讯飞特有的参数
        };
      case SpeechServiceType.RTASR:
        return {
          ...baseOptions,
          // 可以在这里添加RTASR特有的参数
        };
      default:
        return baseOptions;
    }
  };

  /**
   * 开始录音
   */
  const startRecording = async () => {
    if (isRecording.value) {
      console.warn('Already recording');
      return;
    }

    error.value = null;

    try {
      // 确保Socket已连接
      if (!socket || !socket.connected) {
        initSocket();
      }

      // 请求麦克风权限
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // 创建音频处理上下文
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: config.sampleRate,
      });

      // 创建音频源
      source = audioContext.createMediaStreamSource(mediaStream);

      // 创建脚本处理器
      scriptProcessor = audioContext.createScriptProcessor(
        config.bufferSize,
        1, // 单声道输入
        1  // 单声道输出
      );

      // 获取服务特定的选项
      const serviceOptions = getServiceOptions(
        currentServiceType.value,
        currentLanguage.value
      );

      // 通知服务器开始录音
      socket?.emit('start-recording', {
        serviceType: currentServiceType.value,
        options: serviceOptions
      });

      // 处理音频数据
      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        if (!isRecording.value) return;

        // 获取音频输入数据
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);

        // 检查音频级别（用于静音检测）
        const audioLevel = getAudioLevel(inputData);
        lastAudioLevel = audioLevel;

        // 静音检测
        if (config.vadThreshold && audioLevel < config.vadThreshold) {
          // 检测到静音
          if (!isSilent) {
            isSilent = true;
            silenceStart = Date.now();
          } else if (silenceStart && (Date.now() - silenceStart > 2000)) {
            // 静音超过2秒，可以考虑自动停止（如果设置了autoRestart为true）
            if (config.autoRestart) {
              console.log('Detected silence, automatically restarting...');
              stopRecording();
              setTimeout(() => startRecording(), 500);
              return;
            }
          }
        } else {
          // 检测到声音
          isSilent = false;
          silenceStart = null;
        }

        // 创建16位PCM数据用于发送
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // 将-1.0到1.0的浮点数转换为16位有符号整数
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }

        // 发送音频数据到服务器
        if (socket && socket.connected) {
          socket.emit('audio-chunk', pcmData);
          isProcessing.value = true;

          // 设置超时，如果长时间没有响应
          resetTimeout();
        }
      };

      // 连接音频节点
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      isRecording.value = true;

      console.log('Recording started with service type:', currentServiceType.value);
    } catch (err) {
      console.error('Error starting recording:', err);
      error.value = '无法启动录音：' + (err as Error).message;
      showToast(error.value);
      cleanup();
    }
  };

  /**
   * 停止录音
   */
  const stopRecording = () => {
    if (!isRecording.value) return;

    isRecording.value = false;
    isProcessing.value = false;

    // 通知服务器结束音频流
    if (socket && socket.connected) {
      socket.emit('audio-end');
    }

    // 清理资源
    cleanup();

    console.log('Recording stopped');
  };

  /**
   * 清空转写结果
   */
  const clearText = () => {
    translatedText.value = '';
  };

  /**
   * 清理资源
   */
  const cleanup = () => {
    // 停止并释放录音设备
    if (scriptProcessor) {
      scriptProcessor.disconnect();
      scriptProcessor = null;
    }

    if (source) {
      source.disconnect();
      source = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(console.error);
    }

    // 清除超时
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  /**
   * 计算音频级别（用于静音检测）
   */
  const getAudioLevel = (audioData: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += Math.abs(audioData[i]);
    }
    return sum / audioData.length;
  };

  /**
   * 重置超时计时器
   */
  const resetTimeout = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (config.timeout && config.timeout > 0) {
      timeoutId = window.setTimeout(() => {
        if (isProcessing.value) {
          console.warn('Recognition timeout');
          error.value = '识别超时，请重试';
          showToast(error.value);
          if (isRecording.value) {
            stopRecording();
          }
        }
      }, config.timeout);
    }
  };

  /**
   * 切换录音状态
   */
  const toggleRecording = () => {
    if (isRecording.value) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /**
   * 获取当前使用的服务类型
   */
  const getServiceType = (): SpeechServiceType => {
    return currentServiceType.value;
  };

  /**
   * 组件卸载时清理资源
   */
  onUnmounted(() => {
    stopRecording();
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  });

  return {
    isRecording,
    isConnected,
    isProcessing,
    translatedText,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    clearText,
    currentServiceType,
    currentLanguage,
    getServiceType
  };
}