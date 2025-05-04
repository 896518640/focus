import type { AxiosInstance, AxiosRequestConfig } from "axios"
import { useUserStore } from "@/pinia/stores/user"
import { getToken } from "@/utils/cache/cookies"
import axios from "axios"
import { get } from "lodash-es"
import { showToast, closeToast } from 'vant';


/** 退出登录并强制刷新页面（会重定向到登录页） */
function logout() {
  useUserStore().resetToken()
  location.reload()
}

/**
 * 显示错误提示
 * @param message 错误信息
 */
export function showErrorMessage(message: string) {
  // 控制台记录错误
  console.error('API错误:', message)
  
  // 使用 Vant Toast 显示错误
  try {
    // 先关闭可能存在的 Toast
    closeToast();
    
    // 使用 iOS 风格配置
    showToast({
      message: message,
      type: 'fail',
      duration: 1500,
      position: 'middle',
      className: 'ios-style-toast',
      icon: 'close',
      iconSize: 20
    });
  } catch (e) {
    console.error('Toast 显示失败:', e);
    // 如果 Toast 失败，使用原生 alert 作为备选
    alert(`API错误: ${message}`);
  }
}

/**
 * 显示成功提示
 * @param message 成功信息
 */
export function showSuccessMessage(message: string) {
  try {
    // 先关闭可能存在的 Toast
    closeToast();
    
    // 使用 iOS 风格配置
    showToast({
      message: message,
      type: 'success',
      duration: 1500,
      position: 'middle',
      className: 'ios-style-toast',
      icon: 'success',
      overlay: false,
      forbidClick: false,
      iconSize: 20
    });
  } catch (e) {
    console.error('Toast 显示失败:', e);
  }
}

/** 创建请求实例 */
function createInstance() {
  // 创建一个 axios 实例命名为 instance
  const instance = axios.create({
    baseURL: import.meta.env.VITE_BASE_API || '/api/v1', // API基础URL
    timeout: 30000, // 请求超时时间
  })
  
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
        const token = getToken()
        // 如果有 token 则添加到请求头
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    // 发送失败
    error => Promise.reject(error)
  )
  
  // 响应拦截器（可根据具体业务作出相应的调整）
  instance.interceptors.response.use(
    (response) => {
      // apiData 是 api 返回的数据
      const apiData = response.data
      // 二进制数据则直接返回
      const responseType = response.request?.responseType
      if (responseType === "blob" || responseType === "arraybuffer") return apiData
      
      // 处理标准 RESTful API 响应（无 code 字段）
      if (apiData.code === undefined) {
        return {
          code: 0,
          data: apiData,
          message: "Success"
        }
      }
      
      // 处理包含 code 的 API 响应
      switch (apiData.code) {
        case 0:
          // 本系统采用 code === 0 来表示没有业务错误
          return apiData
        case 401:
          // 登录过期，但在登录页不触发登出
          const currentPath = window.location.pathname
          if (currentPath !== '/login') {
            logout()
          }
          showErrorMessage(apiData.message || "登录过期")
          return Promise.reject(new Error(apiData.message || "登录过期"))
        default:
          // 不是正确的 code，显示错误提示
          showErrorMessage(apiData.message || "请求失败")
          return Promise.reject(new Error(apiData.message || "Error"))
      }
    },
    (error) => {
      // status 是 HTTP 状态码
      const status = get(error, "response.status")
      const message = get(error, "response.data.message")
      let errorMsg = ""
      
      switch (status) {
        case 400:
          errorMsg = message || "请求错误"
          break
        case 401:
          // 登录过期，但在登录页不触发登出
          errorMsg = message || "登录过期"
          const currentPath = window.location.pathname
          if (currentPath !== '/login') {
            logout()
          }
          break
        case 403:
          errorMsg = message || "拒绝访问"
          break
        case 404:
          errorMsg = "请求地址出错"
          break
        case 408:
          errorMsg = "请求超时"
          break
        case 500:
          errorMsg = message || "服务器内部错误"
          break
        case 501:
          errorMsg = "服务未实现"
          break
        case 502:
          errorMsg = "网关错误"
          break
        case 503:
          errorMsg = "服务不可用"
          break
        case 504:
          errorMsg = "网关超时"
          break
        case 505:
          errorMsg = "HTTP版本不受支持"
          break
        default:
          errorMsg = message || error.message || "未知错误"
      }
      
      // 显示错误提示
      if (errorMsg) {
        console.log('错误信息:', errorMsg)
        showErrorMessage(errorMsg)
      }
      
      error.message = errorMsg
      return Promise.reject(error)
    }
  )
  
  // 配置通用请求头
  instance.defaults.headers.common["Content-Type"] = "application/json"
  
  return instance
}

/** 用于请求的实例 */
const service = createInstance()

/** 用于请求的方法 */
export const request = function <T>(config: AxiosRequestConfig): Promise<T> {
  return service(config)
}

// 用户认证相关API
export const authAPI = {
  // 用户登录
  login: (data: { email: string; password: string }) => {
    return service.post('/auth/login', data);
  },
  // 用户注册
  register: (data: { username: string; email: string; password: string }) => {
    return service.post('/auth/register', data);
  },
  // 获取当前用户信息
  getCurrentUser: () => {
    return service.get('/auth/me');
  },
};

// 语音识别相关API
export const audioAPI = {
  // 上传音频文件
  uploadAudio: (formData: FormData) => {
    return service.post('/audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // 获取音频识别结果
  getAudioResult: (audioId: string) => {
    return service.get(`/audio/${audioId}/result`);
  },
  // 获取用户的音频列表
  getUserAudios: (page = 1, limit = 10) => {
    return service.get('/audio/list', {
      params: {
        page,
        limit,
      },
    });
  },
  // 删除音频
  deleteAudio: (audioId: string) => {
    return service.delete(`/audio/${audioId}`);
  },
};

// 实时语音识别相关API
export const rtasrAPI = {
  // 启动实时识别会话
  startSession: () => {
    return service.post('/rtasr/session');
  },
  // 结束实时识别会话
  endSession: (sessionId: string) => {
    return service.post(`/rtasr/${sessionId}/end`);
  },
  // 获取实时识别结果
  getSessionResult: (sessionId: string) => {
    return service.get(`/rtasr/${sessionId}/result`);
  },
};

// 翻译相关API
export const translateAPI = {
  // 文本翻译
  translateText: (data: { text: string; sourceLang: string; targetLang: string }) => {
    return service.post('/translate/text', data);
  },
  // 获取支持的语言列表
  getSupportedLanguages: () => {
    return service.get('/translate/languages');
  },
};

// 内容总结相关API
export const summaryAPI = {
  // 生成内容摘要
  generateSummary: (data: { content: string; detailLevel: string }) => {
    return service.post('/summary/generate', data);
  },
  // 保存摘要
  saveSummary: (data: { content: string; summary: string; title: string }) => {
    return service.post('/summary/save', data);
  },
};

// 历史记录相关API
export const historyAPI = {
  // 获取用户历史记录
  getUserHistory: (type?: string, page = 1, limit = 10) => {
    return service.get('/history', {
      params: {
        type,
        page,
        limit,
      },
    });
  },
  // 获取历史记录详情
  getHistoryDetail: (id: string) => {
    return service.get(`/history/${id}`);
  },
  // 删除历史记录
  deleteHistory: (id: string) => {
    return service.delete(`/history/${id}`);
  },
};

// 用户相关API
export const userAPI = {
  // 更新用户信息
  updateUserInfo: (data: { username?: string; avatar?: string }) => {
    return service.put('/user/profile', data);
  },
  // 更改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) => {
    return service.put('/user/password', data);
  },
  // 获取用户统计信息
  getUserStats: () => {
    return service.get('/user/stats');
  },
  // 获取用户活动记录
  getUserActivities: (page = 1, limit = 10) => {
    return service.get('/user/activities', {
      params: { page, limit }
    });
  },
  // 记录用户活动
  recordActivity: (data: { title: string; description: string; type: string }) => {
    return service.post('/user/activities', data);
  },
  // 更新用户设置
  updateUserSettings: (data: { defaultLanguage?: string; theme?: string }) => {
    return service.put('/user/settings', data);
  },
};

export default service;
