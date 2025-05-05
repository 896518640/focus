import { request } from '@/http/axios'

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns Promise
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
 * 获取当前用户信息
 * @returns Promise
 */
export function getCurrentUser() {
  return request({
    url: '/user/auth/me',
    method: 'get'
  })
}

/**
 * 用户注册
 * @param username 用户名
 * @param email 邮箱
 * @param password 密码
 * @returns Promise
 */
export function register(username: string, email: string, password: string) {
  return request({
    url: '/user/auth/register',
    method: 'post',
    data: {
      username,
      email,
      password
    }
  })
}
