// request-stream.ts
// 流式请求处理工具

import axios, { AxiosRequestConfig } from 'axios';
import { getToken } from '@/utils/cache/cookies';

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
 * 创建支持SSE流式响应的请求
 * @param config Axios请求配置
 * @param messageHandler 消息处理器
 * @returns 取消请求的函数
 */
export function requestStream<T>(
  config: AxiosRequestConfig,
  messageHandler: StreamMessageHandler<T>
): () => void {
  // 创建取消令牌
  const controller = new AbortController();
  
  // 获取认证令牌
  const token = getToken();
  
  // 确保设置了正确的请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  };
  
  // 添加认证令牌
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 添加自定义头部
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (value !== null && value !== undefined) {
        headers[key] = String(value);
      }
    });
  }
  
  // 使用fetch API直接请求以支持流式响应
  const apiUrl = config.url || '';
  let fullUrl = '';
  
  // 处理URL，支持相对和绝对路径
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    // 绝对路径，直接使用
    fullUrl = apiUrl;
  } else {
    // 相对路径，添加基础URL
    const baseURL = axios.defaults.baseURL || '';
    fullUrl = baseURL ? `${baseURL}${apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`}` : apiUrl;
  }
  
  fetch(fullUrl, {
    method: config.method || 'GET',
    headers,
    body: config.data ? JSON.stringify(config.data) : undefined,
    signal: controller.signal
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('浏览器不支持可读流');
    }
    
    // 获取响应的读取器
    const reader = response.body.getReader();
    
    // 创建文本解码器
    const decoder = new TextDecoder();
    let buffer = '';
    let totalChunks = 0;
    let processedChunks = 0;
    
    // 处理数据块的函数
    function processChunk(): Promise<void> {
      return reader.read().then(({ done, value }) => {
        if (done) {
          // 处理可能在缓冲区中剩余的数据
          if (buffer.trim()) {
            try {
              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsedData = JSON.parse(data) as T;
                    messageHandler.onMessage(parsedData);
                  } catch (e) {
                    console.warn('解析剩余数据失败:', e);
                  }
                }
              }
            } catch (e) {
              console.warn('处理剩余数据时出错:', e);
            }
          }
          
          // 完成回调
          messageHandler.onComplete && messageHandler.onComplete();
          return;
        }
        
        // 解码当前数据块并添加到缓冲区
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 更新进度信息
        if (totalChunks === 0 && value.length > 0) {
          // 估算总块数
          totalChunks = Math.max(10, Math.ceil(value.length * 10)); // 假设平均会有10个块
        }
        processedChunks++;
        
        // 计算并报告进度
        if (messageHandler.onProgress && totalChunks > 0) {
          const progress = Math.min(
            95, // 最多报告到95%，留5%给最终处理
            Math.round((processedChunks / totalChunks) * 100)
          );
          messageHandler.onProgress(progress);
        }
        
        // 处理完整的SSE消息
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // 保留最后一个可能不完整的消息
        
        for (const message of messages) {
          // 解析消息中的数据行
          const lines = message.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                messageHandler.onComplete && messageHandler.onComplete();
                return;
              }
              
              try {
                const parsedData = JSON.parse(data) as T;
                messageHandler.onMessage(parsedData);
              } catch (e) {
                console.warn('解析消息失败:', line, e);
              }
            }
          }
        }
        
        // 继续处理下一个数据块
        return processChunk();
      }).catch(error => {
        if (error.name === 'AbortError') {
          console.log('请求已取消');
        } else {
          console.error('处理数据块出错:', error);
          messageHandler.onError && messageHandler.onError(error);
        }
      });
    }
    
    // 开始处理流
    processChunk();
  })
  .catch(error => {
    console.error('流式请求失败:', error);
    messageHandler.onError && messageHandler.onError(error);
  });
  
  // 返回取消函数
  return () => {
    controller.abort();
  };
}

export default requestStream; 