import { request } from "@/http/axios"
import { 
  CurrentUserResponseData,
  UserProfileResponseData,
  UpdateProfileParams,
  UpdateProfileResponseData
} from '@/types/api/users';

/** 获取当前登录用户基本信息 */
export function getCurrentUserApi() {
  return request<CurrentUserResponseData>({
    url: "user/me",
    method: "get"
  })
}

/** 获取用户详细资料 */
export function getUserProfileApi() {
  return request<UserProfileResponseData>({
    url: "user/profile",
    method: "get"
  })
}

/** 更新用户资料 */
export function updateUserProfileApi(data: UpdateProfileParams) {
  return request<UpdateProfileResponseData>({
    url: "user/profile",
    method: "put",
    data
  })
}
