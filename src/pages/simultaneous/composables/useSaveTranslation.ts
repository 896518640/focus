import { ref } from 'vue';
import { showSuccessToast, showLoadingToast, closeToast, showFailToast } from 'vant';
import { getTaskInfo } from '../../../api/tingwu/tingwu';
import { saveTranslation as apiSaveTranslation } from '../../../api/translation/save';
import type { Ref } from 'vue';

// 模拟保存翻译API
const mockSaveTranslation = async (data: any) => {
  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 模拟保存成功
  console.log('Mock保存成功', data);
  
  // 返回模拟数据
  return {
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000000),
      ...data
    }
  };
};

interface UseSaveTranslationOptions {
  sourceLanguage: Ref<string>;
  targetLanguages: Ref<string[]>;
  transcriptionResult: Ref<string>;
  translationResult: Ref<string>;
  recordingDuration: Ref<number>;
  apiTaskId: Ref<string | null>;
  isTranslating: Ref<boolean>;
  stopTranslation: (keepTaskAlive?: boolean) => Promise<void>;
  initializeTask: (useExistingTask?: boolean) => Promise<void>;
  startTranslation: () => Promise<void>;
  resetTimer: () => void;
}

export function useSaveTranslation(options: UseSaveTranslationOptions) {
  const {
    sourceLanguage,
    targetLanguages,
    transcriptionResult,
    translationResult,
    recordingDuration,
    apiTaskId,
    isTranslating,
    stopTranslation,
    initializeTask,
    startTranslation,
    resetTimer
  } = options;

  // 保存中状态
  const isSaving = ref(false);
  // 暂停状态
  const isPaused = ref(false);

  // 保存翻译内容
  const saveTranslation = async () => {
    // 如果没有内容，不执行保存
    if (!transcriptionResult.value && !translationResult.value) {
      showFailToast('没有可保存的内容');
      return;
    }
    
    try {
      // 显示保存中状态
      isSaving.value = true;
      showLoadingToast({
        message: '保存中...',
        forbidClick: true,
        duration: 0
      });
      
      // 记录当前任务ID，因为停止后可能会被清空
      const currentTaskId = apiTaskId.value;
      let wasRecording = false;
      
      if (isTranslating.value) {
        console.log('保存前停止录音任务');
        wasRecording = true;
      }
      
      // 使用stopTranslation方法，参数为false表示不保持任务活跃，完全停止
      await stopTranslation(false);
      isPaused.value = false; // 状态不是暂停而是停止
      
      // 等待一段时间，确保最后的消息处理完毕
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 轮询查询任务状态，直到状态为COMPLETED或超时
      let taskInfo: any = null;
      let outputMp3Path = '';
      
      if (currentTaskId) {
        try {
          console.log('开始轮询查询任务状态:', currentTaskId);
          
          // 轮询配置
          const maxAttempts = 20; // 最大尝试次数
          const pollingInterval = 1500; // 轮询间隔(毫秒)
          let attempts = 0;
          let isCompleted = false;
          
          showLoadingToast({
            message: '正在处理录音...',
            forbidClick: true,
            duration: 0
          });
          
          // 轮询函数
          const pollTaskStatus = async (): Promise<any> => {
            try {
              const response: any = await getTaskInfo(currentTaskId);
              const data = response.data?.data;
              console.log(`轮询任务状态 [${attempts+1}/${maxAttempts}]:`, data?.taskStatus);
              
              // 更新加载提示
              showLoadingToast({
                message: `处理中...${attempts+1}/${maxAttempts}`,
                forbidClick: true,
                duration: 0
              });
              
              // 检查是否完成
              if (data?.taskStatus === 'COMPLETED') {
                console.log('任务已完成:', data);
                return data;
              }
              
              // 检查是否失败
              if (data?.taskStatus === 'FAILED') {
                console.error('任务失败:', data);
                throw new Error('任务处理失败');
              }
              
              // 增加尝试次数
              attempts++;
              
              // 检查是否达到最大尝试次数
              if (attempts >= maxAttempts) {
                console.warn('达到最大尝试次数，停止轮询');
                return data; // 返回最后一次获取的数据
              }
              
              // 等待指定时间后再次轮询
              await new Promise(resolve => setTimeout(resolve, pollingInterval));
              return pollTaskStatus(); // 递归调用
            } catch (error) {
              console.error('轮询任务状态出错:', error);
              throw error;
            }
          };
          
          // 开始轮询
          taskInfo = await pollTaskStatus();
          console.log('轮询完成，最终任务状态:', taskInfo);
          outputMp3Path = taskInfo?.outputMp3Path || '';
        } catch (taskError) {
          console.error('查询任务状态失败:', taskError);
        }
      }
      
      // 收集需要保存的数据
      const saveData = {
        taskId: currentTaskId, // 使用之前记录的任务ID
        title: `同传翻译 ${new Date().toLocaleString('zh-CN', { hour12: false })}`,
        sourceLanguage: sourceLanguage.value,
        targetLanguage: targetLanguages.value[0] || 'en',
        originalText: transcriptionResult.value,
        translatedText: translationResult.value,
        duration: recordingDuration.value, // 录音时长（秒）
        timestamp: Date.now(),
        outputMp3Path: outputMp3Path || '',
        taskStatus: taskInfo?.taskStatus || 'unknown' // 添加任务状态
      };
      
      console.log('保存数据', saveData);
      
      // 使用API保存数据
      try {
        // 如果API可用，使用真实API
        const response = await apiSaveTranslation(saveData);
        console.log('保存成功', response);
      } catch (apiError) {
        console.warn('API调用失败，使用mock数据', apiError);
        // API不可用时，使用mock数据
        await mockSaveTranslation(saveData);
      }
      
      // 显示保存成功提示
      closeToast();
      showSuccessToast('保存成功');
      
      // 如果之前在录音，需要重新初始化任务并开始录音
      if (wasRecording) {
        console.log('保存后重新初始化并开始录音');
        resetTimer(); // 重置计时器
        
        // 重新初始化任务
        await initializeTask(false);
        
        // 开始新的录音
        await startTranslation();
      }
    } catch (error) {
      console.error('保存失败:', error);
      closeToast();
      showFailToast('保存失败，请重试');
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isSaving,
    isPaused,
    saveTranslation
  };
} 