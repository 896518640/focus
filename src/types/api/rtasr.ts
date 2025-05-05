/**
 * 实时语音识别(RTASR)相关类型定义
 */

/**
 * 创建RTASR任务参数
 */
export interface CreateTaskParams {
  /** 任务类型 */
  type: 'realtime';
  /** 操作类型：start/stop/update */
  operation: 'start' | 'stop' | 'update';
  /** 输入参数 */
  input: {
    /** 任务ID，更新或停止时需要 */
    taskId?: string;
    /** 源语言 */
    sourceLanguage: string;
  };
  /** 任务参数 */
  parameters: {
    /** 是否启用翻译 */
    translationEnabled: boolean;
    /** 转写设置 */
    transcription: {
      /** 是否检测声音事件 */
      audioEventDetectionEnabled: boolean;
      /** 输出级别 */
      outputLevel: number;
    };
    /** 是否启用自动章节划分 */
    autoChaptersEnabled: boolean;
    /** 是否启用会议助手 */
    meetingAssistanceEnabled: boolean;
    /** 是否启用摘要 */
    summarizationEnabled: boolean;
  };
}

/**
 * RTASR任务响应
 */
export interface RTASRTaskResponse {
  /** 任务ID */
  taskId: string;
  /** WebSocket连接URL */
  meetingUrl: string;
  /** 创建时间 */
  createdAt: string;
  /** 状态 */
  status: string;
}

/**
 * WebSocket消息类型
 */
export enum MessageType {
  /** 心跳消息 */
  HEARTBEAT = 'heartbeat',
  /** 转写结果 */
  TRANSCRIPTION = 'transcription',
  /** 翻译结果 */
  TRANSLATION = 'translation',
  /** 错误消息 */
  ERROR = 'error',
  /** 状态变更 */
  STATUS = 'status'
}

/**
 * WebSocket基础消息
 */
export interface BaseWSMessage {
  /** 消息类型 */
  type: MessageType;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 心跳消息
 */
export interface HeartbeatMessage extends BaseWSMessage {
  type: MessageType.HEARTBEAT;
}

/**
 * 转写结果消息
 */
export interface TranscriptionMessage extends BaseWSMessage {
  type: MessageType.TRANSCRIPTION;
  /** 是否是最终结果 */
  isFinal: boolean;
  /** 转写文本 */
  text: string;
  /** 段落ID */
  paragraphId: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
}

/**
 * 翻译结果消息
 */
export interface TranslationMessage extends BaseWSMessage {
  type: MessageType.TRANSLATION;
  /** 原文 */
  sourceText: string;
  /** 译文 */
  targetText: string;
  /** 段落ID，对应转写结果 */
  paragraphId: string;
}

/**
 * 错误消息
 */
export interface ErrorMessage extends BaseWSMessage {
  type: MessageType.ERROR;
  /** 错误码 */
  code: string;
  /** 错误信息 */
  message: string;
}

/**
 * 状态消息
 */
export interface StatusMessage extends BaseWSMessage {
  type: MessageType.STATUS;
  /** 状态 */
  status: 'active' | 'paused' | 'ended';
  /** 状态描述 */
  message?: string;
}

/**
 * WebSocket消息联合类型
 */
export type WSMessage = 
  | HeartbeatMessage 
  | TranscriptionMessage 
  | TranslationMessage 
  | ErrorMessage 
  | StatusMessage; 