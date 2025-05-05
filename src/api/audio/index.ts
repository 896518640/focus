import { request } from "@/http/axios";

/**
 * 音频识别相关API接口
 */

export interface AudioResult {
  id: string;
  status: string;
  text: string;
  createdAt: string;
  duration: number;
  metadata?: {
    [key: string]: any;
  };
}

export interface AudioListResponse {
  items: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    duration: number;
  }>;
  total: number;
  page: number;
  limit: number;
}

/**
 * 上传音频文件
 * @param formData 包含音频文件的表单数据
 * @returns 上传结果
 */
export function uploadAudio(formData: FormData) {
  return request<{ id: string; url: string }>({
    url: "/audio/upload",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

/**
 * 获取音频识别结果
 * @param audioId 音频ID
 * @returns 识别结果
 */
export function getAudioResult(audioId: string) {
  return request<AudioResult>({
    url: `/audio/${audioId}/result`,
    method: "get"
  });
}

/**
 * 获取用户的音频列表
 * @param page 页码
 * @param limit 每页条数
 * @returns 音频列表
 */
export function getUserAudios(page = 1, limit = 10) {
  return request<AudioListResponse>({
    url: "/audio/list",
    method: "get",
    params: {
      page,
      limit
    }
  });
} 