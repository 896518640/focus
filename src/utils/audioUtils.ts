// 音频工具类

/**
 * 音频录制器类 - 用于获取麦克风音频流并进行处理
 */
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onAudioProcess: (audioData: Float32Array) => void;
  private isRecording: boolean = false;

  /**
   * 构造函数
   * @param onAudioProcess 处理音频数据的回调函数
   */
  constructor(onAudioProcess: (audioData: Float32Array) => void) {
    this.onAudioProcess = onAudioProcess;
  }

  /**
   * 开始录音
   */
  async startRecording() {
    if (this.isRecording) return;

    try {
      // 请求麦克风访问权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 创建音频上下文
      this.audioContext = new AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive'
      });

      // 创建音频源
      const source = this.audioContext.createMediaStreamSource(this.stream);

      // 创建音频处理节点
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioProcess(inputData);
      };

      // 连接节点
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isRecording = true;
      
      console.log('开始录音');
    } catch (error) {
      console.error('录音初始化失败:', error);
      throw error;
    }
  }

  /**
   * 停止录音
   */
  stopRecording() {
    if (!this.isRecording) return;

    // 断开处理节点
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    // 停止媒体流
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRecording = false;
    
    console.log('停止录音');
  }

  /**
   * 检查是否正在录音
   */
  isActive(): boolean {
    return this.isRecording;
  }
}

/**
 * 将Float32Array转换为PCM格式的Int16Array
 * @param float32Array 原始Float32音频数据
 * @returns PCM格式的Int16Array
 */
export const convertFloat32ToInt16 = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    // 将-1.0~1.0的float32值转换为-32768~32767的int16值
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  return int16Array;
};

/**
 * 将Int16Array转换为发送到服务器的ArrayBuffer
 * @param int16Array PCM格式的Int16音频数据
 * @returns 可以直接发送的ArrayBuffer
 */
export const convertInt16ToArrayBuffer = (int16Array: Int16Array): ArrayBuffer => {
  return int16Array.buffer as ArrayBuffer;
};

/**
 * 检查浏览器是否支持音频录制功能
 * @returns 是否支持录音
 */
export const checkAudioSupport = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    // 尝试获取麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 获取成功后立即停止所有轨道
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (err) {
    console.error('音频支持检查失败:', err);
    return false;
  }
}; 