// tingwuService.ts
// 通义听悟API服务

import request from '../../common/utils/request';

// 应用Key，实际应用中应从环境变量或配置中获取
const TINGWU_APP_KEY = 'ZuTDHhX19DqHnIut';

/**
 * 任务状态枚举
 */
export enum TingwuTaskStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED' // 添加COMPLETED状态
}

/**
 * 通义听悟任务信息
 */
export interface TingwuTaskInfo {
  taskId: string;
  taskKey?: string;
  status: TingwuTaskStatus;
  result?: {
    sentences: Array<{
      text: string;
      startTime: number;
      endTime: number;
    }>;
    transcription: string;
  };
  errorMessage?: string;
}

/**
 * API响应类型
 */
interface ApiResponse {
  code: number;
  message?: string;
  success?: boolean;
  data: any;
}

/**
 * 上传文件到服务器并获取URL
 * @param file 文件对象
 * @returns 文件URL
 */
export async function uploadAudioFile(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await request<ApiResponse>({
      url: '/api/v1/tingwu/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response?.data?.data?.fileUrl) {
      return response.data.data.fileUrl;
    } else if (response?.data?.fileUrl) {
      return response.data.fileUrl;
    } else {
      throw new Error('上传音频文件失败: 无效的响应格式');
    }
  } catch (error: any) {
    console.error('上传音频文件失败:', error.message);
    throw new Error(`上传音频文件失败: ${error.message}`);
  }
}

/**
 * 上传并转录音频
 * @param file 文件对象
 * @param options 转录选项
 * @returns 任务ID和文件URL
 */
export async function uploadAndTranscribe(
  file: File,
  options?: { sourceLanguage?: string, type?: string }
): Promise<{taskId: string, fileUrl: string}> {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    // 添加转录选项
    if (options?.sourceLanguage) {
      formData.append('sourceLanguage', options.sourceLanguage);
    }

    if (options?.type) {
      formData.append('type', options.type);
    }

    const response = await request<ApiResponse>({
      url: '/api/v1/tingwu/upload-and-transcribe',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response?.data?.data) {
      const result = response.data.data;
      return {
        taskId: result.taskId,
        fileUrl: result.fileUrl
      };
    } else {
      throw new Error('上传并转录音频失败: 无效的响应格式');
    }
  } catch (error: any) {
    console.error('上传并转录音频失败:', error.message);
    throw new Error(`上传并转录音频失败: ${error.message}`);
  }
}

/**
 * 创建转录任务
 * @param fileUrl 文件URL
 * @param taskKey 任务标识
 * @param sourceLanguage 源语言
 * @returns 任务ID
 */
export async function createTingwuTask(fileUrl: string, taskKey: string, sourceLanguage: string = 'cn'): Promise<{taskId: string}> {
  try {
    const response = await request<ApiResponse>({
      url: '/api/v1/tingwu/tasks',
      method: 'post',
      data: {
        fileUrl,
        taskKey,
        sourceLanguage,
        appKey: TINGWU_APP_KEY,
        type: 'offline'
      }
    });

    if (response?.data?.data?.TaskId) {
      return { taskId: response.data.data.TaskId };
    } else if (response?.data?.TaskId) {
      return { taskId: response.data.TaskId };
    } else {
      throw new Error('创建听悟任务失败: 无效的响应格式');
    }
  } catch (error: any) {
    console.error('创建听悟任务失败:', error.message);
    throw new Error(`创建听悟任务失败: ${error.message}`);
  }
}

/**
 * 获取任务状态和结果
 * @param taskId 任务ID
 * @returns 任务信息
 */
export async function getTingwuTaskInfo(taskId: string): Promise<TingwuTaskInfo> {
  try {
    const response = await request<ApiResponse>({
      url: `/api/v1/tingwu/tasks/${taskId}`,
      method: 'get',
      params: {
        appKey: TINGWU_APP_KEY
      }
    });

    let taskInfo: any = null;

    if (response?.data?.data) {
      taskInfo = response.data.data;
    } else if (response?.data) {
      taskInfo = response.data;
    }

    // 格式化结果
    return {
      taskId: taskInfo.taskId || taskInfo.TaskId || taskId,
      taskKey: taskInfo.taskKey || taskInfo.TaskKey,
      status: taskInfo.taskStatus === 'SUCCESS' || taskInfo.TaskStatus === 'SUCCESS' ? TingwuTaskStatus.SUCCESS :
              taskInfo.taskStatus === 'FAILED' || taskInfo.TaskStatus === 'FAILED' ? TingwuTaskStatus.FAILED :
              taskInfo.taskStatus === 'COMPLETED' || taskInfo.TaskStatus === 'COMPLETED' ? TingwuTaskStatus.COMPLETED :
              TingwuTaskStatus.RUNNING,
      result: taskInfo.transcription ? {
        transcription: taskInfo.transcription,
        sentences: []
      } : taskInfo.Result ? {
        sentences: taskInfo.Result.Sentences?.map((s: any) => ({
          text: s.Text,
          startTime: s.BeginTime,
          endTime: s.EndTime
        })) || [],
        transcription: taskInfo.Result.Text || ''
      } : undefined,
      errorMessage: taskInfo.errorMessage || taskInfo.ErrorMessage
    };
  } catch (error: any) {
    console.error('获取任务信息失败:', error.message);
    throw new Error(`获取任务信息失败: ${error.message}`);
  }
}

/**
 * 轮询任务状态直到完成
 * @param taskId 任务ID
 * @param maxAttempts 最大尝试次数
 * @param interval 轮询间隔(毫秒)
 * @returns 任务信息
 */
export async function pollTaskUntilComplete(
  taskId: string,
  maxAttempts: number = 60,
  interval: number = 3000
): Promise<TingwuTaskInfo> {
  try {
    const response = await request<ApiResponse>({
      url: `/api/v1/tingwu/tasks/${taskId}/poll`,
      method: 'get',
      params: {
        maxAttempts,
        interval
      }
    });

    if (response?.data?.data) {
      const result = response.data.data.Data || response.data.data;

      // 格式化结果
      return {
        taskId: result.TaskId || taskId,
        taskKey: result.TaskKey,
        status: result.TaskStatus === 'SUCCESS' ? TingwuTaskStatus.SUCCESS :
                result.TaskStatus === 'FAILED' ? TingwuTaskStatus.FAILED :
                TingwuTaskStatus.RUNNING,
        result: result.Result ? {
          sentences: result.Result.Sentences?.map((s: any) => ({
            text: s.Text,
            startTime: s.BeginTime,
            endTime: s.EndTime
          })) || [],
          transcription: result.Result.Transcription || ''
        } : undefined,
        errorMessage: result.ErrorMessage
      };
    } else {
      throw new Error('轮询任务失败: 无效的响应格式');
    }
  } catch (error: any) {
    // 如果后端轮询API失败，则回退到客户端轮询方式
    console.warn('使用后端轮询API失败，回退到客户端轮询方式:', error.message);
    return clientSidePollTask(taskId, maxAttempts, interval);
  }
}

/**
 * 客户端轮询任务状态（备用方法）
 * @param taskId 任务ID
 * @param maxAttempts 最大尝试次数
 * @param interval 轮询间隔(毫秒)
 * @returns 任务信息
 */
async function clientSidePollTask(
  taskId: string,
  maxAttempts: number = 60,
  interval: number = 3000
): Promise<TingwuTaskInfo> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const taskInfo = await getTingwuTaskInfo(taskId);

        if (taskInfo.status === TingwuTaskStatus.SUCCESS) {
          resolve(taskInfo);
          return;
        }

        if (taskInfo.status === TingwuTaskStatus.FAILED) {
          reject(new Error(`任务失败: ${taskInfo.errorMessage || '未知错误'}`));
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('任务轮询超时'));
          return;
        }

        setTimeout(checkStatus, interval);
      } catch (error) {
        reject(error);
      }
    };

    checkStatus();
  });
}

/**
 * 获取转录结果的JSON文件内容
 * @param url JSON文件的URL
 * @returns 转录结果数据
 */
export async function fetchTranscriptionJson(url: string): Promise<any> {
  try {
    // 使用代理请求获取JSON文件
    const response = await request<ApiResponse>({
      url: '/api/v1/tingwu/fetch-json',
      method: 'post',
      data: { url }
    });

    if (response?.data?.data) {
      return response.data.data;
    } else {
      throw new Error('获取转录结果JSON失败: 无效的响应格式');
    }
  } catch (error: any) {
    console.error('获取转录结果JSON失败:', error.message);
    throw new Error(`获取转录结果JSON失败: ${error.message}`);
  }
}

// 导出单例服务
export default {
  uploadAudioFile,
  uploadAndTranscribe,
  createTingwuTask,
  getTingwuTaskInfo,
  pollTaskUntilComplete,
  fetchTranscriptionJson
};
