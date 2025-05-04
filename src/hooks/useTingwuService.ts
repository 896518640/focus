import { ref, computed, watch } from 'vue';
import { uploadAudioFile, createTingwuTask, getTingwuTaskInfo, pollTaskUntilComplete, TingwuTaskStatus } from '@/services/tingwuService';

interface UseTingwuOptions {
  autoStart?: boolean;
  onResult?: (text: string, sentences: any[]) => void;
  onError?: (error: string) => void;
  pollingInterval?: number;
  maxPollingAttempts?: number;
}

export default function useTingwuService(options: UseTingwuOptions = {}) {
  // 状态
  const isProcessing = ref(false);
  const currentFile = ref<File | null>(null);
  const currentTaskId = ref<string | null>(null);
  const processingStatus = ref<TingwuTaskStatus | null>(null);
  const processingProgress = ref(0);
  const resultText = ref('');
  const sentences = ref<any[]>([]);
  const error = ref<string | null>(null);

  // 计算属性
  const hasResult = computed(() => resultText.value.length > 0);
  const canProcess = computed(() => !isProcessing.value);

  // 设置默认选项
  const defaultOptions = {
    autoStart: false,
    pollingInterval: 3000,
    maxPollingAttempts: 60
  };
  
  const mergedOptions = { ...defaultOptions, ...options };

  /**
   * 上传音频文件并创建转写任务
   * @param file 音频文件
   */
  const processAudioFile = async (file: File) => {
    if (isProcessing.value) {
      throw new Error('已有正在处理的任务，请等待完成或取消');
    }

    try {
      isProcessing.value = true;
      currentFile.value = file;
      processingStatus.value = TingwuTaskStatus.PENDING;
      error.value = null;
      resultText.value = '';
      sentences.value = [];
      processingProgress.value = 10;

      // 1. 上传文件获取URL
      const fileUrl = await uploadAudioFile(file);
      processingProgress.value = 30;

      // 2. 创建识别任务
      const taskKey = `tingwu_${Date.now()}`;
      const createResult = await createTingwuTask(fileUrl, taskKey);
      currentTaskId.value = createResult.taskId;
      processingProgress.value = 50;
      processingStatus.value = TingwuTaskStatus.RUNNING;

      // 3. 轮询任务状态直到完成
      const taskResult = await pollTaskUntilComplete(
        createResult.taskId
      );

      // 4. 设置结果
      processingStatus.value = TingwuTaskStatus.SUCCESS;
      processingProgress.value = 100;
      
      if (taskResult.result) {
        resultText.value = taskResult.result.text;
        sentences.value = taskResult.result.sentences;
        
        // 如果有回调，调用它
        if (mergedOptions.onResult) {
          mergedOptions.onResult(taskResult.result.text, taskResult.result.sentences);
        }
      }

      return {
        text: resultText.value,
        sentences: sentences.value
      };
    } catch (err: any) {
      processingStatus.value = TingwuTaskStatus.FAILED;
      error.value = err.message || '处理音频文件失败';
      
      // 如果有错误回调，调用它
      if (mergedOptions.onError) {
        mergedOptions.onError(error.value);
      }
      
      throw err;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * 检查任务状态
   */
  const checkTaskStatus = async () => {
    if (!currentTaskId.value) return null;

    try {
      const result = await getTingwuTaskInfo(currentTaskId.value);
      processingStatus.value = result.status as TingwuTaskStatus;
      return result;
    } catch (err: any) {
      error.value = err.message || '获取任务状态失败';
      
      // 如果有错误回调，调用它
      if (mergedOptions.onError) {
        mergedOptions.onError(error.value);
      }
      
      return null;
    }
  };

  /**
   * 重置状态
   */
  const reset = () => {
    isProcessing.value = false;
    currentFile.value = null;
    currentTaskId.value = null;
    processingStatus.value = null;
    processingProgress.value = 0;
    resultText.value = '';
    sentences.value = [];
    error.value = null;
  };

  return {
    // 状态
    isProcessing,
    currentFile,
    currentTaskId,
    processingStatus,
    processingProgress,
    resultText,
    sentences,
    error,

    // 计算属性
    hasResult,
    canProcess,

    // 方法
    processAudioFile,
    checkTaskStatus,
    reset
  };
} 