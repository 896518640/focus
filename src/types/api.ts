/**
 * API 相关类型定义
 */

import type { AxiosRequestConfig } from 'axios';

/**
 * 流式消息处理器接口
 */
export interface StreamMessageHandler<T> {
  /** 处理单条消息 */
  onMessage: (message: T) => void;
  /** 完成回调 */
  onComplete?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 进度回调 */
  onProgress?: (progress: number) => void;
}

/**
 * 标准 API 响应格式
 */
export interface ApiResponse<T> {
  /** 状态码，0 表示成功 */
  code: number;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message: string;
}

/**
 * 带 success 字段的 API 响应格式
 */
export interface SuccessApiResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 分页响应格式
 */
export interface PaginationResponse<T> {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页记录数 */
  pageSize: number;
  /** 数据列表 */
  list: T[];
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 页码 */
  page?: number;
  /** 每页记录数 */
  pageSize?: number;
}

/**
 * 请求函数类型
 */
export type RequestFunction = <T>(config: AxiosRequestConfig) => Promise<T>;

/**
 * 流式请求函数类型
 */
export type StreamRequestFunction = <T>(
  config: AxiosRequestConfig,
  handler: StreamMessageHandler<T>
) => () => void; 