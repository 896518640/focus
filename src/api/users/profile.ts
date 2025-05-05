import { request } from "@/http/axios";
import { 
  UpdateProfileParams, 
  UpdateProfileResponseData,
  UserSettings,
  UserActivity,
  UserActivityListResponse,
  UserStats,
  ChangePasswordParams
} from '@/types/api/users';

/**
 * 用户信息相关API接口
 */

/**
 * 更新用户信息
 * @param data 更新参数
 * @returns 更新结果
 */
export function updateUserInfo(data: UpdateProfileParams) {
  return request<UpdateProfileResponseData>({
    url: "/user/profile",
    method: "put",
    data
  });
}

/**
 * 更改密码
 * @param data 密码参数
 * @returns 更改结果
 */
export function changePassword(data: ChangePasswordParams) {
  return request<{ success: boolean }>({
    url: "/user/password",
    method: "put",
    data
  });
}

/**
 * 获取用户统计信息
 * @returns 统计信息
 */
export function getUserStats() {
  return request<UserStats>({
    url: "/user/stats",
    method: "get"
  });
}

/**
 * 获取用户活动记录
 * @param page 页码
 * @param limit 每页条数
 * @returns 活动记录列表
 */
export function getUserActivities(page = 1, limit = 10) {
  return request<UserActivityListResponse>({
    url: "/user/activities",
    method: "get",
    params: { page, limit }
  });
}

/**
 * 记录用户活动
 * @param data 活动参数
 * @returns 记录结果
 */
export function recordActivity(data: {
  title: string;
  description: string;
  type: string;
}) {
  return request<UserActivity>({
    url: "/user/activities",
    method: "post",
    data
  });
}

/**
 * 更新用户设置
 * @param data 设置参数
 * @returns 更新结果
 */
export function updateUserSettings(data: UserSettings) {
  return request<{ settings: UserSettings }>({
    url: "/user/settings",
    method: "put",
    data
  });
} 