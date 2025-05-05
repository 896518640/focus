export type CurrentUserResponseData = ApiResponseData<{ 
  id: string; 
  username: string; 
  displayName: string;
  email: string;
  role: string;
  roles?: string[]; 
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}>

export type UserProfileResponseData = ApiResponseData<{
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  settings?: any;
  usageStats?: {
    id: string;
    studyHours: number;
    recognitionCount: number;
    fileCount: number;
    translationCount: number;
    summaryCount: number;
    userId: string;
  }
}>

export interface UpdateProfileParams {
  username?: string;
  avatar?: string;
  email?: string;
}

export type UpdateProfileResponseData = ApiResponseData<{
  id: string;
  username: string;
  avatar?: string;
}>
