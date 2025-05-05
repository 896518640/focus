/**
 * 认证API相关类型定义
 */

/**
 * 登录参数
 */
export interface LoginParams {
  /** 用户名或邮箱 */
  username: string;
  /** 密码 */
  password: string;
}

/**
 * 注册参数
 */
export interface RegisterParams {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
}

/**
 * 认证响应
 */
export interface AuthResponse {
  /** 认证令牌 */
  token: string;
  /** 用户信息 */
  user: UserInfo;
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 头像地址 */
  avatar?: string;
} 