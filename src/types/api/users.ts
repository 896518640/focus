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
 * 会员信息
 */
export interface MembershipInfo {
  /** 会员等级 */
  level: string;
  /** 下次重置时间 */
  next_reset_time: string;
  /** 总分钟数 */
  total_minutes: number;
  /** 已使用分钟数 */
  used_minutes: number;
  /** 剩余分钟数 */
  remaining_minutes: number;
}

/**
 * 功能特性启用状态
 */
export interface FeaturesStatus {
  /** 翻译功能是否启用 */
  translationEnabled: boolean;
}

/**
 * 用户使用情况
 */
export interface UserUsage {
  /** 已使用的转录分钟数 */
  transcribeMinutesUsed: number;
  /** 已使用的翻译分钟数 */
  translateMinutesUsed: number;
  /** 翻译次数 */
  translationCount: number;
}

/**
 * 用户设置
 */
export interface UserSettings {
  /** 设置ID */
  id: string;
  /** 源语言 */
  sourceLanguage: string;
  /** 目标语言 */
  targetLanguage: string;
  /** 是否启用翻译 */
  translationEnabled: boolean;
  /** 是否自动保存 */
  autoSave: boolean;
  /** 主题 */
  theme: string;
  /** 用户ID */
  userId: string;
}

/**
 * 最近翻译记录项
 */
export interface RecentTranslation {
  /** 翻译ID */
  id: string;
  /** 原文内容 */
  sourceText: string;
  /** 翻译内容 */
  translatedText: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 新的用户资料响应数据
 */
export interface UserProfileData {
  /** 用户ID */
  user_id: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName: string;
  /** 邮箱 */
  email: string;
  /** 头像URL */
  avatar: string | null;
  /** 角色 */
  role: string;
  /** 创建时间 */
  createdAt: string;
  /** 最近登录时间 */
  lastLoginAt: string;
  /** 会员信息 */
  membership: MembershipInfo;
  /** 功能特性状态 */
  features: FeaturesStatus;
  /** 使用情况 */
  usage: UserUsage;
  /** 用户设置 */
  settings: UserSettings;
  /** 最近翻译 */
  recent_translations: RecentTranslation[];
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