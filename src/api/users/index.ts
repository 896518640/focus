import type * as Users from "./type"
import { request } from "@/http/axios"

/** 获取当前登录用户基本信息 */
export function getCurrentUserApi() {
  return request<Users.CurrentUserResponseData>({
    url: "user/me",
    method: "get"
  })
}

/** 获取用户详细资料 */
export function getUserProfileApi() {
  return request<Users.UserProfileResponseData>({
    url: "user/profile",
    method: "get"
  })
}

/** 更新用户资料 */
export function updateUserProfileApi(data: Users.UpdateProfileParams) {
  return request<Users.UpdateProfileResponseData>({
    url: "user/profile",
    method: "put",
    data
  })
}
