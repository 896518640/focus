import { request } from '@/http/axios'
import axios from 'axios'

// 环境变量配置
const TINGWU_APP_KEY = import.meta.env.VITE_TINGWU_APP_KEY || 'ZuTDHhX19DqHnIut'
const ACCESS_KEY_ID = import.meta.env.VITE_ALIBABA_CLOUD_ACCESS_KEY_ID
const ACCESS_KEY_SECRET = import.meta.env.VITE_ALIBABA_CLOUD_ACCESS_KEY_SECRET

/**
 * 通义听悟任务状态
 */
export enum TingwuTaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

// 定义API响应类型
interface ApiResponse {
  code: number;
  data: any;
  message?: string;
  success?: boolean;
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
    text: string;
  };
  errorMessage?: string;
}

/**
 * 创建通义听悟任务 - 直接传入文件URL方式
 * @param fileUrl 音频文件URL
 * @param taskKey 任务标识
 * @param sourceLanguage 源语言，默认中文
 * @returns Promise<{taskId: string}>
 */
export async function createTingwuTask(fileUrl: string, taskKey: string, sourceLanguage: string = 'cn'): Promise<{taskId: string}> {
  try {
    // 本地服务端代理实现
    const response = await request<ApiResponse>({
      url: '/api/v1/tingwu/tasks',
      method: 'post',
      data: {
        fileUrl,
        taskKey,
        sourceLanguage,
        type: 'offline' // 设置任务类型为离线转写
      }
    });
    
    // 确保响应包含所需数据
    if (response && response.data && (response.data.taskId || (response.data.data && response.data.data.taskId))) {
      const taskId = response.data.taskId || response.data.data.taskId;
      return { taskId };
    } else {
      throw new Error('创建听悟任务失败: 无效的响应格式');
    }
  } catch (error: any) {
    console.error('创建听悟任务失败:', error.message);
    throw new Error(`创建听悟任务失败: ${error.message}`);
  }
}

/**
 * 创建通义听悟任务 - OSS方式
 * @param ossObjectKey OSS对象键
 * @param ossBucket OSS存储桶
 * @param name 任务名称（可选）
 * @param vocabularyId 热词表ID（可选）
 * @returns Promise<{taskId: string}>
 */
export async function createTingwuTaskWithOSS(
  ossObjectKey: string, 
  ossBucket: string, 
  name?: string, 
  vocabularyId?: string
): Promise<{taskId: string}> {
  try {
    const response = await request<ApiResponse>({
      url: '/api/v1/tingwu/tasks',
      method: 'post',
      data: {
        ossObjectKey,
        ossBucket,
        name,
        vocabularyId,
        type: 'offline' // 设置任务类型为离线转写
      }
    });
    
    if (response && response.data && (response.data.taskId || (response.data.data && response.data.data.taskId))) {
      const taskId = response.data.taskId || response.data.data.taskId;
      return { taskId };
    } else {
      throw new Error('创建听悟任务失败: 无效的响应格式');
    }
  } catch (error: any) {
    console.error('创建听悟任务失败:', error.message);
    throw new Error(`创建听悟任务失败: ${error.message}`);
  }
}

/**
 * 获取通义听悟任务信息
 * @param taskId 任务ID
 * @returns Promise<TingwuTaskInfo>
 */
export async function getTingwuTaskInfo(taskId: string): Promise<TingwuTaskInfo> {
  try {
    // 本地服务端代理实现
    const response = await request<ApiResponse>({
      url: `/api/v1/tingwu/tasks/${taskId}`,
      method: 'get',
    });
    
    // 提取任务信息数据
    let taskInfo: any = null;
    
    if (response && response.data) {
      // 处理不同的响应结构
      if (response.data.status) {
        // 直接使用响应数据
        taskInfo = response.data;
      } else if (response.data.data && response.data.data.status) {
        // 使用嵌套的数据结构
        taskInfo = response.data.data;
      }
    }
    
    if (taskInfo && taskInfo.taskId && taskInfo.status) {
      return taskInfo as TingwuTaskInfo;
    } else {
      throw new Error('获取听悟任务信息失败: 无效的响应格式');
    }
  } catch (error: any) {
    console.error('获取听悟任务信息失败:', error.message);
    throw new Error(`获取听悟任务信息失败: ${error.message}`);
  }
}

/**
 * 上传文件到服务器并获取URL
 * @param file 文件对象
 * @returns Promise<string> 返回文件URL
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
    
    // 提取文件URL
    let fileUrl: string | null = null;
    
    if (response && response.data) {
      if (response.data.data && response.data.data.fileUrl) {
        fileUrl = response.data.data.fileUrl;
      } else if (response.data.fileUrl) {
        fileUrl = response.data.fileUrl;
      }
    }
    
    if (fileUrl) {
      return fileUrl;
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
 * @returns Promise<{taskId: string, fileUrl: string}> 返回任务ID和文件URL
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
      url: '/api/v1/tingwu/tasks',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response && response.data && response.data.data) {
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
 * 轮询任务状态直到完成
 * @param taskId 任务ID
 * @param maxAttempts 最大尝试次数
 * @param interval 轮询间隔(毫秒)
 * @returns Promise<TingwuTaskInfo>
 */
export async function pollTaskUntilComplete(
  taskId: string, 
  maxAttempts: number = 60, 
  interval: number = 3000
): Promise<TingwuTaskInfo> {
  // 使用后端轮询API
  try {
    const response = await request<ApiResponse>({
      url: `/api/v1/tingwu/tasks/${taskId}/poll`,
      method: 'get',
      params: {
        maxAttempts,
        interval
      }
    });
    
    if (response && response.data && response.data.data) {
      const result = response.data.data.Data || response.data.data;
      
      // 将后端返回结果转换为前端需要的格式
      return {
        taskId: result.TaskId || taskId,
        status: result.TaskStatus === 'SUCCESS' ? TingwuTaskStatus.SUCCESS : 
                result.TaskStatus === 'FAILED' ? TingwuTaskStatus.FAILED : 
                TingwuTaskStatus.RUNNING,
        result: result.Result ? {
          sentences: result.Result.Sentences?.map((s: any) => ({
            text: s.Text,
            startTime: s.BeginTime,
            endTime: s.EndTime
          })) || [],
          text: result.Result.Text || ''
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
 * @returns Promise<TingwuTaskInfo>
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