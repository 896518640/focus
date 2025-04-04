// useSpeechTranslation.ts
import { ref, onUnmounted, ComputedRef } from 'vue';
import io from 'socket.io-client';

interface SpeechTranslationOptions {
  sampleRate?: number;
  bufferSize?: number;
}

interface TranslationResult {
  id: number;
  text: string;
}

interface UseSpeechTranslationReturnType {
  isRecording: Ref<boolean>;
  translatedText: ComputedRef<string>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  segments: ComputedRef<TranslationResult[]>;
}

export function useSpeechTranslation(options: SpeechTranslationOptions = {}): UseSpeechTranslationReturnType {
  const socket = io('ws://localhost:3000');
  console.log('socket:', socket);
  const isRecording = ref(false);
  const translatedText = ref('');
  const segments = ref<TranslationResult[]>([]);
  const audioUrl = ref('');

  // 音频处理相关状态
  let audioContext: AudioContext | null = null;
  let mediaStream: MediaStream | null = null;
  let scriptProcessor: ScriptProcessorNode | null = null;

  // 默认配置
  const SAMPLE_RATE = options.sampleRate || 16000;
  const BUFFER_SIZE = options.bufferSize || 4096;
  const CHANNELS = 1;

  // 音频转换工具函数
  const floatTo16BitPCM = (input: Float32Array): Int16Array => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  // 初始化录音
  const initRecording = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: CHANNELS,
          noiseSuppression: true,
          echoCancellation: false,
        },
      });

      audioContext = new (window.AudioContext)({
        sampleRate: SAMPLE_RATE,
      });

      const source = audioContext.createMediaStreamSource(mediaStream);
      scriptProcessor = audioContext.createScriptProcessor(
        BUFFER_SIZE,
        CHANNELS,
        CHANNELS
      );

      scriptProcessor.onaudioprocess = (e) => {
        console.time('audioProcess')
        const inputBuffer = e.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(channelData);
        console.log('pcm16:', pcm16.slice(0, 10));
        socket.emit('audio-chunk', pcm16.buffer);
        console.timeEnd('audioProcess')
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
    } catch (error) {
      console.error('录音初始化失败:', error);
      throw error;
    }
  };

  // 开始/停止录音控制
  const startRecording = async () => {
    if (!isRecording.value) {
      try {
        socket.emit('start-recording');
        await initRecording();
        isRecording.value = true;
      } catch (error) {
        console.error('启动录音失败:', error);
      }
    }
  };

  const stopRecording = () => {
    if (isRecording.value) {
      socket.emit('audio-end');
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (scriptProcessor) {
        scriptProcessor.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      isRecording.value = false;
    }
  };

  // 处理翻译结果
  const handleTranslation = (res: any) => {
    if (res.code) {
      console.error('翻译失败:', res.message);
      return;
    }

    const data = res.data;
    const result = data.result;
    const content: TranslationResult = {
      id: result.sn,
      text: result.ws.flatMap((ws: any) => 
        ws.cw.map((cw: any) => cw.w)
      ).join('')
    };

    // 处理动态修正
    if (result.pgs === 'rpl') {
      const [start, end] = result.rg;
      segments.value = segments.value.filter(
        (seg) => seg.id < start || seg.id > end
      );
    }

    segments.value.push(content);
    segments.value.sort((a, b) => a.id - b.id);

    translatedText.value = segments.value
      .map((seg) => seg.text)
      .join(' ');
  };

  const handleError = (error: any) => {
    console.error('翻译错误:', error);
    stopRecording();
};

  // 初始化WebSocket事件监听
  onMounted(() => {
    socket.on('translation', handleTranslation);
    socket.on('error', handleError)
  });

  onUnmounted(() => {
    socket.off('translation', handleTranslation);
    socket.off('error', handleError);
    if (socket.connected) {
      socket.disconnect();
    }
    // 清理音频资源
    stopRecording();
  });

  return {
    isRecording,
    translatedText: computed(() => translatedText.value),
    startRecording,
    stopRecording,
    segments: computed(() => segments.value),
  };
}