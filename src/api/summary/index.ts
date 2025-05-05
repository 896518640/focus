import { request } from "@/http/axios";

/**
 * 内容总结相关API接口
 */

export interface SummaryParams {
  content: string;
  detailLevel: string;
}

export interface SaveSummaryParams {
  content: string;
  summary: string;
  title: string;
}

export interface SummaryResult {
  id: string;
  summary: string;
  title: string;
  createdAt: string;
}

/**
 * 生成内容摘要
 * @param data 摘要参数
 * @returns 摘要结果
 */
export function generateSummary(data: SummaryParams) {
  return request<{ summary: string }>({
    url: "/summary/generate",
    method: "post",
    data
  });
}

/**
 * 保存摘要
 * @param data 保存参数
 * @returns 保存结果
 */
export function saveSummary(data: SaveSummaryParams) {
  return request<SummaryResult>({
    url: "/summary/save",
    method: "post",
    data
  });
} 