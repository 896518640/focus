// tingwuService.ts
// 通义听悟API服务

import { TranscriptionSettings } from '@/hooks/useAudioTranscription';
import request from '../../common/utils/request';

// 应用Key，实际应用中应从环境变量或配置中获取
const TINGWU_APP_KEY = 'ZuTDHhX19DqHnIut';

/**
 * 转录任务状态枚举
 */
export enum TingwuTaskStatus {
  PENDING = 'PENDING', // 等待中
  RUNNING = 'RUNNING', // 运行中
  COMPLETED = 'COMPLETED', // 已完成（后端可能返回的另一种形式）
  FAILED = 'FAILED' // 失败
}

/**
 * 通义听悟任务信息
 */
export interface TingwuTaskInfo {
  taskId: string;
  taskKey?: string;
  status: TingwuTaskStatus;
  result?: {
    transcription?: string;
    translation?: string;
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
  options?: TranscriptionSettings
): Promise<{taskId: string, fileUrl: string}> {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    // 添加转录选项
    if (options?.input?.sourceLanguage) {
      formData.append('sourceLanguage', options.input.sourceLanguage);
    }

    if (options?.type) {
      formData.append('type', options.type);
    }

    // 需要把整个options 加进来
    if (options?.input) {
      formData.append('input', JSON.stringify(options.input));
    }

    if(options?.parameters) {
      formData.append('parameters', JSON.stringify(options.parameters));
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

    console.log('获取任务信息:', taskInfo);
    
    // 格式化结果 - 确保正确获取 translation 和 transcription URL
    const result: TingwuTaskInfo = {
      taskId: taskInfo.taskId,
      status: taskInfo.taskStatus,
      result: {
        // 检查多种可能的路径
        translation: taskInfo?.result?.translation || taskInfo?.translation,
        transcription: taskInfo?.result?.transcription || taskInfo?.transcription
      },
      errorMessage: taskInfo.errorMessage
    };
    
    console.log('格式化后的任务信息:', result);
    return result;
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
      const result = response.data.data;
      // 格式化结果
      return {
        taskId: result.taskId,
        status: result.taskStatus,
        result: {
          transcription: result.result?.transcription || '',
          translation: result.result?.translation || ''
        },
        errorMessage: result.errorMessage
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
        console.log('客户端轮询获取到的任务状态:', taskInfo.status);

        if (taskInfo.status === TingwuTaskStatus.COMPLETED) {
          console.log('任务已完成，停止轮询');
          resolve(taskInfo);
          return;
        }

        if (taskInfo.status === TingwuTaskStatus.FAILED) {
          console.log('任务失败，停止轮询');
          reject(new Error(`任务失败: ${taskInfo.errorMessage || '未知错误'}`));
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          console.log('任务轮询超时，停止轮询');
          reject(new Error('任务轮询超时'));
          return;
        }

        console.log(`任务仍在进行中，${interval/1000}秒后继续轮询，当前尝试次数: ${attempts}`);
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
