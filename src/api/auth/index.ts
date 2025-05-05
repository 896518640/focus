import { request } from "@/http/axios";

/**
 * 认证相关API接口
 */

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns 登录结果
 */
export function login(username: string, password: string) {
    return request({
      url: '/user/auth/login',
      method: 'post',
      data: {
        username,
        password
      }
    })
  }

/**
 * 用户注册
 * @param data 注册参数
 * @returns 注册结果
 */
export function register(data: RegisterParams) {
  return request<AuthResponse>({
    url: "/user/auth/register",
    method: "post",
    data
  });
}

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export function getCurrentUser() {
  return request<AuthResponse['user']>({
    url: "/user/auth/me",
    method: "get"
  });
} 