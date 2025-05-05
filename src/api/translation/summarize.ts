import request from '@/utils/request';
import axios from 'axios';
import { ApiResponse } from './save';
import { getToken } from '@/utils/cache/cookies';
import requestStream, { StreamMessageHandler } from '@/utils/request-stream';

/**
 * AI总结请求参数
 */
export interface AiSummaryParams {
  /** 待总结的文本 */
  text: string;
  /** 语言 */
  language: string;
}

/**
 * AI总结流式响应消息
 */
export interface AiSummaryStreamMessage {
  /** 文本片段 */
  content: string;
}

/**
 * AI总结响应
 */
export interface AiSummaryResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 响应数据 */
  data: string;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 获取AI总结（流式输出）
 * @param params 总结参数
 * @param onMessage 接收消息回调函数
 * @param onComplete 完成回调
 * @param onError 错误回调
 * @returns 清理函数
 */
export function getStreamSummary(
  params: AiSummaryParams,
  onMessage: (message: AiSummaryStreamMessage) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): () => void {
  // 创建消息处理器
  const messageHandler: StreamMessageHandler<AiSummaryStreamMessage> = {
    onMessage,
    onComplete,
    onError
  };
  
  // 使用request-stream发起请求
  return requestStream<AiSummaryStreamMessage>(
    {
      url: 'api/v1/translation/summarize',
      method: 'POST',
      data: params
    },
    messageHandler
  );
}

/**
 * 获取AI总结
 * @param params 总结参数
 * @returns 总结结果
 */
export function getSummary(params: AiSummaryParams) {
  return request<AiSummaryResponse>({
    url: '/api/v1/translation/summarize',
    method: 'POST',
    data: params
  });
} 