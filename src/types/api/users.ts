/**
 * 用户相关类型定义
 */
import { ApiResponse } from '@/types/api';

/**
 * 当前用户响应数据
 */
export interface CurrentUserResponseData { 
  /** 用户ID */
  id: string; 
  /** 用户名 */
  username: string; 
  /** 显示名称 */
  displayName: string;
  /** 邮箱 */
  email: string;
  /** 角色 */
  role: string;
  /** 角色列表 */
  roles?: string[]; 
  /** 是否激活 */
  isActive?: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 最近登录时间 */
  lastLoginAt?: string;
}

/**
 * 用户统计信息
 */
export interface UserStats {
  /** 用户ID */
  id: string;
  /** 学习时间（小时） */
  studyHours: number;
  /** 识别数量 */
  recognitionCount: number;
  /** 文件数量 */
  fileCount: number;
  /** 翻译数量 */
  translationCount: number;
  /** 摘要数量 */
  summaryCount: number;
  /** 用户ID */
  userId: string;
}

/**
 * 用户资料响应数据
 */
export interface UserProfileData {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName: string;
  /** 邮箱 */
  email: string;
  /** 头像URL */
  avatar?: string;
  /** 角色 */
  role: string;
  /** 创建时间 */
  createdAt: string;
  /** 最近登录时间 */
  lastLoginAt?: string;
  /** 用户设置 */
  settings?: any;
  /** 使用统计 */
  usageStats?: UserStats;
}

/**
 * 用户资料响应
 */
export type UserProfileResponseData = UserProfileData;

/**
 * 更新用户资料参数
 */
export interface UpdateProfileParams {
  /** 用户名 */
  username?: string;
  /** 头像URL */
  avatar?: string;
  /** 邮箱 */
  email?: string;
}

/**
 * 更新用户资料响应数据
 */
export interface UpdateProfileResponseData {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 头像URL */
  avatar?: string;
}

/**
 * 修改密码参数
 */
export interface ChangePasswordParams {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
}

/**
 * 用户设置
 */
export interface UserSettings {
  /** 默认语言 */
  defaultLanguage?: string;
  /** 主题 */
  theme?: string;
  /** 其他设置 */
  [key: string]: any;
}

/**
 * 用户活动记录
 */
export interface UserActivity {
  /** 活动ID */
  id: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 类型 */
  type: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 用户活动列表响应
 */
export interface UserActivityListResponse {
  /** 活动列表 */
  items: UserActivity[];
  /** 总数 */
  total: number;
  /** 页码 */
  page: number;
  /** 每页数量 */
  limit: number;
}

/**
 * 用户统计信息
 */
export interface UserStats {
  /** 音频总数 */
  totalAudios: number;
  /** 翻译总数 */
  totalTranslations: number;
  /** 摘要总数 */
  totalSummaries: number;
  /** 使用时间（小时） */
  usageHours: number;
  /** 最近活动时间 */
  lastActivity?: string;
} 