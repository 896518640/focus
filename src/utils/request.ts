// request.ts
// 请求工具函数 - 兼容层，转发请求到统一的axios实例

import type { AxiosRequestConfig } from 'axios';
import defaultInstance from '@/http/axios';

/**
 * 这是一个兼容层，用于确保使用 @/utils/request 的代码可以继续工作
 * 所有请求会被转发到统一的axios实例
 */
const request = {
  get: <T>(url: string, config?: AxiosRequestConfig) => {
    return defaultInstance.get<T>(url, config);
  },
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return defaultInstance.post<T>(url, data, config);
  },
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return defaultInstance.put<T>(url, data, config);
  },
  delete: <T>(url: string, config?: AxiosRequestConfig) => {
    return defaultInstance.delete<T>(url, config);
  },
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return defaultInstance.patch<T>(url, data, config);
  },
  request: <T>(config: AxiosRequestConfig) => {
    return defaultInstance.request<T>(config);
  }
};

// 通用请求函数，支持泛型
export default function<T>(config: AxiosRequestConfig) {
  return defaultInstance<T>(config);
}

// 导出请求方法
export { request };
