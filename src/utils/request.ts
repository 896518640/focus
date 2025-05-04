// request.ts
// 请求工具函数

import axios from 'axios';

/**
 * 获取API基础URL
 * @returns API基础URL
 */
export function getBaseUrl(): string {
  // 根据环境变量获取基础URL
  const env = import.meta.env.MODE;

  if (env === 'development') {
    // 开发环境使用代理配置，返回空字符串
    return '';
  } else if (env === 'production') {
    return window.location.origin;
  } else {
    return '';
  }
}

/**
 * 创建axios实例
 */
const request = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('响应错误:', error);

    // 处理401错误（未授权）
    if (error.response && error.response.status === 401) {
      // 清除token
      localStorage.removeItem('token');
      // 跳转到登录页
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default request;
