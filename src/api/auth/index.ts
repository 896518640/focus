import { request } from "@/http/axios";
import { 
  LoginParams, 
  RegisterParams, 
  AuthResponse, 
  UserInfo 
} from '@/types/api/auth';

/**
 * 认证相关API接口
 */

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns 登录结果
 */
export function login(username: string, password: string) {
  return request<AuthResponse>({
    url: '/user/auth/login',
    method: 'post',
    data: {
      username,
      password
    }
  });
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
  return request<UserInfo>({
    url: "/user/auth/me",
    method: "get"
  });
} 