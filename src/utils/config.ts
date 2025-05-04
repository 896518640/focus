/**
 * 应用配置文件
 */

// 通义听悟API配置
export const tingwuConfig = {
  // API基础URL
  baseUrl: 'https://tingwu.aliyun.com/api',
  
  // WebSocket基础URL (会根据任务创建响应动态获取)
  wsBaseUrl: 'wss://tingwu.aliyun.com/ws',
  
  // 默认请求头
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // 默认超时时间 (毫秒)
  timeout: 30000,
  
  // 重试次数
  maxRetries: 3,
  
  // 重试延迟 (毫秒)
  retryDelay: 1000
};

// 默认语言配置
export const defaultLanguageConfig = {
  // 默认源语言
  sourceLanguage: 'zh',
  
  // 默认目标语言
  targetLanguages: ['en'],
  
  // 支持的语言列表
  supportedLanguages: [
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英文' },
    { code: 'ja', name: '日文' },
    { code: 'ko', name: '韩文' }
  ]
};

// 音频配置
export const audioConfig = {
  // 音频采样率
  sampleRate: 16000,
  
  // 音频通道数 (1=单声道, 2=立体声)
  channels: 1,
  
  // PCM位数
  bitsPerSample: 16
};

// 导出默认配置
export default {
  tingwu: tingwuConfig,
  language: defaultLanguageConfig,
  audio: audioConfig
}; 