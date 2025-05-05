import { request } from "@/http/axios"


// API接口
export interface CreateTaskParams {
  type: 'offline' | 'realtime';
  operation?: 'start' | 'stop';
  input: {
    sourceLanguage: string;
    format?: string;
    sampleRate?: number;
    fileUrl?: string;
    taskId?: string;
  };
  parameters: {
    translationEnabled: boolean;
    translation?: {
      targetLanguages: string[];
      outputLevel: number;
    };
    transcription: {
      audioEventDetectionEnabled: boolean;
      diarization?: {
        speakerCount: number;
      };
      outputLevel: number;
    };
    transcoding?: {
      targetAudioFormat: string;
    };
    autoChaptersEnabled: boolean;
    meetingAssistanceEnabled: boolean;
    meetingAssistance?: {
      types: string[];
    };
    summarizationEnabled: boolean;
    summarization?: {
      types: string[];
    };
  };
}

export interface TaskInfoResponse {
    taskId: string;
    taskStatus: string;
    requestId: string;
    outputMp3Path?: string;
    result?: {
      transcription?: string;
      translation?: string;
      autoChapters?: string;
    };
}

export interface createTaskResponse {
  taskId: string;
  taskStatus: string;
  requestId: string;
  meetingJoinUrl?: string;
}

/**
 * 创建任务
 * @param params 任务参数
 * @returns 任务响应
 */
export const createTask = async (params: CreateTaskParams) => {
  return request<createTaskResponse>({
    url: "tingwu/tasks",
    method: "post",
    data: params
  })
};

/**
 * 获取任务状态
 * @param taskId 任务ID
 * @returns 任务响应
 */
export const getTaskInfo = async (taskId: string) => {
  return request<TaskInfoResponse>({
    url: `tingwu/tasks/${taskId}`,
    method: "get"
  });
};