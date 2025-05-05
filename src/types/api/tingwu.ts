/**
 * 通义听悟API相关类型定义
 */

/**
 * 创建任务参数
 */
export interface TingwuCreateTaskParams {
  /** 任务类型: 离线处理或实时处理 */
  type: 'offline' | 'realtime';
  /** 操作类型: 开始或停止 */
  operation?: 'start' | 'stop';
  /** 输入参数 */
  input: {
    /** 源语言 */
    sourceLanguage: string;
    /** 音频格式 */
    format?: string;
    /** 采样率 */
    sampleRate?: number;
    /** 文件URL */
    fileUrl?: string;
    /** 任务ID，更新或停止时需要 */
    taskId?: string;
  };
  /** 任务参数 */
  parameters: {
    /** 是否启用翻译 */
    translationEnabled: boolean;
    /** 翻译参数 */
    translation?: {
      /** 目标语言列表 */
      targetLanguages: string[];
      /** 输出级别 */
      outputLevel: number;
    };
    /** 转写设置 */
    transcription: {
      /** 是否检测声音事件 */
      audioEventDetectionEnabled: boolean;
      /** 说话人分离 */
      diarization?: {
        /** 说话人数量 */
        speakerCount: number;
      };
      /** 输出级别 */
      outputLevel: number;
    };
    /** 转码参数 */
    transcoding?: {
      /** 目标音频格式 */
      targetAudioFormat: string;
    };
    /** 是否启用自动章节划分 */
    autoChaptersEnabled: boolean;
    /** 是否启用会议助手 */
    meetingAssistanceEnabled: boolean;
    /** 会议助手参数 */
    meetingAssistance?: {
      /** 会议助手类型 */
      types: string[];
    };
    /** 是否启用摘要 */
    summarizationEnabled: boolean;
    /** 摘要参数 */
    summarization?: {
      /** 摘要类型 */
      types: string[];
    };
  };
}

/**
 * 任务信息响应
 */
export interface TingwuTaskInfoResponse {
  /** 任务ID */
  taskId: string;
  /** 任务状态 */
  taskStatus: string;
  /** 请求ID */
  requestId: string;
  /** 输出MP3路径 */
  outputMp3Path?: string;
  /** 处理结果 */
  result?: {
    /** 转写文本 */
    transcription?: string;
    /** 翻译文本 */
    translation?: string;
    /** 自动章节 */
    autoChapters?: string;
  };
}

/**
 * 创建任务响应
 */
export interface TingwuCreateTaskResponse {
  /** 任务ID */
  taskId: string;
  /** 任务状态 */
  taskStatus: string;
  /** 请求ID */
  requestId: string;
  /** 会议加入URL，实时模式下有值 */
  meetingJoinUrl?: string;
} 