import { request } from "@/http/axios";

/**
 * 历史记录相关API接口
 */

export interface HistoryItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface HistoryDetailResponse extends HistoryItem {
  content: string;
  result?: any;
}

/**
 * 获取用户历史记录
 * @param type 记录类型（可选）
 * @param page 页码
 * @param limit 每页条数
 * @returns 历史记录列表
 */
export function getUserHistory(type?: string, page = 1, limit = 10) {
  return request<HistoryListResponse>({
    url: "/history",
    method: "get",
    params: {
      type,
      page,
      limit
    }
  });
}

/**
 * 获取历史记录详情
 * @param id 记录ID
 * @returns 记录详情
 */
export function getHistoryDetail(id: string) {
  return request<HistoryDetailResponse>({
    url: `/history/${id}`,
    method: "get"
  });
}

/**
 * 删除历史记录
 * @param id 记录ID
 * @returns 删除结果
 */
export function deleteHistory(id: string) {
  return request<{ success: boolean }>({
    url: `/history/${id}`,
    method: "delete"
  });
} 