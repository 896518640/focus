import { request } from '@/http/axios';
import requestStream, { StreamMessageHandler } from '@/utils/request-stream';
import { 
  AiSummaryParams,
  AiSummaryStreamMessage, 
  AiSummaryResponse
} from '@/types/api/translation';

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
      url: '/api/v1/translation/summarize',
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