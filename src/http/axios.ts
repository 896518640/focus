import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { useUserStore } from "@/pinia/stores/user"
import { getToken } from "@/utils/cache/cookies"
import axios from "axios"
import { get } from "lodash-es"
import { showErrorMessage, showSuccessMessage } from '@/utils/toast';

/** 退出登录并强制刷新页面（会重定向到登录页） */
function logout() {
  useUserStore().resetToken()
  location.reload()
}

/**
 * 获取API基础URL
 * @returns API基础URL
 */
export function getBaseUrl(): string {
  // 根据环境变量获取基础URL
  const env = import.meta.env.MODE;
  const configuredBaseUrl = import.meta.env.VITE_BASE_API || '/api/v1';

  if (env === 'development') {
    // 开发环境使用代理配置或配置的baseURL
    return configuredBaseUrl;
  } else if (env === 'production') {
    // 生产环境可以使用配置的baseURL或当前域名
    return configuredBaseUrl || window.location.origin;
  } else {
    return configuredBaseUrl;
  }
}

/**
 * 创建统一的请求实例
 * @param customConfig 自定义配置
 * @returns axios实例
 */
function createInstance(customConfig: AxiosRequestConfig = {}) {
  // 默认配置
  const defaultConfig: AxiosRequestConfig = {
    baseURL: getBaseUrl(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // 合并默认配置和自定义配置
  const config = { ...defaultConfig, ...customConfig };
  
  // 创建一个 axios 实例
  const instance = axios.create(config);
  
  // 请求拦截器
  instance.interceptors.request.use(
    // 发送之前
    config => {
      // 检查是否是通义听悟API请求，如果是则不添加Token
      const isTingwuApi = config.url && (
        config.url.includes('/tingwu/tasks') || 
        config.url.includes('/tingwu/upload')
      );
      
      if (!isTingwuApi) {
        // 从 cookie 获取 token
        const token = getToken();
        // 如果有 token 则添加到请求头
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    // 发送失败
    error => Promise.reject(error)
  );
  
  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      // apiData 是 api 返回的数据
      const apiData = response.data;
      // 二进制数据则直接返回
      const responseType = response.request?.responseType;
      if (responseType === "blob" || responseType === "arraybuffer") return apiData;
      
      // 判断是否是标准API响应格式
      if (apiData && 'code' in apiData) {
        // 处理包含 code 的 API 响应
        switch (apiData.code) {
          case 0:
            // 本系统采用 code === 0 来表示没有业务错误
            return apiData;
          case 401:
            // 登录过期，但在登录页不触发登出
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
              logout();
            }
            showErrorMessage(apiData.message || "登录过期");
            return Promise.reject(new Error(apiData.message || "登录过期"));
          default:
            // 不是正确的 code，显示错误提示
            showErrorMessage(apiData.message || "请求失败");
            return Promise.reject(new Error(apiData.message || "Error"));
        }
      } else if (apiData && 'success' in apiData) {
        // 处理包含 success 字段的API响应格式
        if (apiData.success === false) {
          showErrorMessage(apiData.message || "请求失败");
          return Promise.reject(new Error(apiData.message || "Error"));
        }
        return response;
      }
      
      // 其他标准 RESTful API 响应
      return {
        code: 0,
        data: apiData,
        message: "Success"
      };
    },
    (error) => {
      // status 是 HTTP 状态码
      const status = get(error, "response.status");
      const message = get(error, "response.data.message");
      let errorMsg = "";
      
      switch (status) {
        case 400:
          errorMsg = message || "请求错误";
          break;
        case 401:
          // 登录过期，但在登录页不触发登出
          errorMsg = message || "登录过期";
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            logout();
          }
          break;
        case 403:
          errorMsg = message || "拒绝访问";
          break;
        case 404:
          errorMsg = "请求地址出错";
          break;
        case 408:
          errorMsg = "请求超时";
          break;
        case 500:
          errorMsg = message || "服务器内部错误";
          break;
        case 501:
          errorMsg = "服务未实现";
          break;
        case 502:
          errorMsg = "网关错误";
          break;
        case 503:
          errorMsg = "服务不可用";
          break;
        case 504:
          errorMsg = "网关超时";
          break;
        case 505:
          errorMsg = "HTTP版本不受支持";
          break;
        default:
          errorMsg = message || error.message || "未知错误";
      }
      
      // 显示错误提示
      if (errorMsg) {
        console.error('响应错误:', errorMsg);
        showErrorMessage(errorMsg);
      }
      
      error.message = errorMsg;
      return Promise.reject(error);
    }
  );
  
  return instance;
}

/** 创建用于全局请求的实例 */
const service = createInstance();

/** 
 * 用于请求的通用方法 
 * @param config 请求配置
 * @returns Promise
 */
export const request = function <T>(config: AxiosRequestConfig): Promise<T> {
  return new Promise((resolve, reject) => {
    service(config)
      .then((res: any) => {
        // 只在开发环境下输出日志
        if (import.meta.env.DEV) {
          console.log('请求成功:', config.url);
        }
        
        // 处理response.data与data.data的兼容性
        if (res && res.data) {
          resolve(res.data as T);
        } else {
          resolve(res as T);
        }
      })
      .catch((error) => {
        // 只在开发环境下输出请求错误详情
        if (import.meta.env.DEV) {
          console.error('请求失败:', config.url, error);
        }
        reject(error);
      });
  });
};

/**
 * 创建特定类型的请求实例（兼容旧版用法）
 * @param config 自定义配置
 * @returns { AxiosInstance } axios实例
 */
export function createRequestInstance(config: AxiosRequestConfig = {}): AxiosInstance {
  return createInstance(config);
}

// 创建默认实例（用于兼容从@/utils/request引入的用法）
const defaultInstance = createRequestInstance();

// 导出默认实例
export default defaultInstance;


 
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


// /**
//  * 流式响应处理器接口
//  */
// export interface StreamMessageHandler<T> {
//   /** 接收消息回调 */
//   onMessage: (message: T) => void;
//   /** 完成回调 */
//   onComplete?: () => void;
//   /** 错误回调 */
//   onError?: (error: Error) => void;
//   /** 进度回调 */
//   onProgress?: (progress: number) => void;
// }

// /**
//  * 发起流式请求
//  * @param config Axios请求配置
//  * @param handler 流式消息处理器
//  * @returns 取消请求的函数
//  */
// export function requestStream<T>(
//   config: AxiosRequestConfig,
//   handler: StreamMessageHandler<T>
// ): () => void {
//   // 创建取消控制器
//   const controller = new AbortController();
  
//   // 获取认证令牌
//   const token = getToken();
  
//   // 确保设置了正确的请求头
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//     'Accept': 'text/event-stream',
//     'Cache-Control': 'no-cache',
//     'Connection': 'keep-alive'
//   };
  
//   // 添加认证令牌
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }
  
//   // 添加自定义头部
//   if (config.headers) {
//     Object.entries(config.headers).forEach(([key, value]) => {
//       if (typeof value === 'string') {
//         headers[key] = value;
//       } else if (value !== null && value !== undefined) {
//         headers[key] = String(value);
//       }
//     });
//   }
  
//   // 使用fetch API直接请求以支持流式响应
//   const apiUrl = config.url || '';
//   let fullUrl = '';
  
//   // 处理URL，支持相对和绝对路径
//   if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
//     // 绝对路径，直接使用
//     fullUrl = apiUrl;
//   } else {
//     // 相对路径，添加基础URL
//     const baseURL = config.baseURL || getBaseUrl();
//     fullUrl = baseURL ? `${baseURL}${apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`}` : apiUrl;
//   }
  
//   fetch(fullUrl, {
//     method: config.method || 'GET',
//     headers,
//     body: config.data ? JSON.stringify(config.data) : undefined,
//     signal: controller.signal
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`请求失败: ${response.status}`);
//     }
    
//     if (!response.body) {
//       throw new Error('浏览器不支持可读流');
//     }
    
//     // 获取响应的读取器
//     const reader = response.body.getReader();
    
//     // 创建文本解码器
//     const decoder = new TextDecoder();
//     let buffer = '';
//     let totalChunks = 0;
//     let processedChunks = 0;
    
//     // 处理数据块的函数
//     function processChunk(): Promise<void> {
//       return reader.read().then(({ done, value }) => {
//         if (done) {
//           // 处理可能在缓冲区中剩余的数据
//           if (buffer.trim()) {
//             try {
//               const lines = buffer.split('\n');
//               for (const line of lines) {
//                 if (line.startsWith('data: ')) {
//                   const data = line.slice(6);
//                   if (data === '[DONE]') continue;
                  
//                   try {
//                     const parsedData = JSON.parse(data) as T;
//                     handler.onMessage(parsedData);
//                   } catch (e) {
//                     console.warn('解析剩余数据失败:', e);
//                   }
//                 }
//               }
//             } catch (e) {
//               console.warn('处理剩余数据时出错:', e);
//             }
//           }
          
//           // 完成回调
//           handler.onComplete && handler.onComplete();
//           return;
//         }
        
//         // 解码当前数据块并添加到缓冲区
//         const chunk = decoder.decode(value, { stream: true });
//         buffer += chunk;
        
//         // 更新进度信息
//         if (totalChunks === 0 && value.length > 0) {
//           // 估算总块数
//           totalChunks = Math.max(10, Math.ceil(value.length * 10)); // 假设平均会有10个块
//         }
//         processedChunks++;
        
//         // 计算并报告进度
//         if (handler.onProgress && totalChunks > 0) {
//           const progress = Math.min(
//             95, // 最多报告到95%，留5%给最终处理
//             Math.round((processedChunks / totalChunks) * 100)
//           );
//           handler.onProgress(progress);
//         }
        
//         // 处理完整的SSE消息
//         const messages = buffer.split('\n\n');
//         buffer = messages.pop() || ''; // 保留最后一个可能不完整的消息
        
//         for (const message of messages) {
//           // 解析消息中的数据行
//           const lines = message.split('\n');
//           for (const line of lines) {
//             if (line.startsWith('data: ')) {
//               const data = line.slice(6);
//               if (data === '[DONE]') {
//                 handler.onComplete && handler.onComplete();
//                 return;
//               }
              
//               try {
//                 const parsedData = JSON.parse(data) as T;
//                 handler.onMessage(parsedData);
//               } catch (e) {
//                 console.warn('解析消息失败:', line, e);
//               }
//             }
//           }
//         }
        
//         // 继续处理下一个数据块
//         return processChunk();
//       }).catch(error => {
//         if (error.name === 'AbortError') {
//           console.log('请求已取消');
//         } else {
//           console.error('处理数据块出错:', error);
//           handler.onError && handler.onError(error);
//         }
//       });
//     }
    
//     // 开始处理流
//     processChunk();
//   })
//   .catch(error => {
//     console.error('流式请求失败:', error);
//     handler.onError && handler.onError(error);
//   });
  
//   // 返回取消函数
//   return () => {
//     controller.abort();
//   };
// }
