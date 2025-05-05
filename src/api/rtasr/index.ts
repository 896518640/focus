import { request } from "@/http/axios";

/**
 * 实时语音识别相关API接口
 */

export interface RtasrSession {
  sessionId: string;
  wsUrl: string;
  expiresAt: number;
}

export interface RtasrResult {
  sessionId: string;
  text: string;
  duration: number;
  createdAt: string;
  status: string;
}

/**
 * 启动实时识别会话
 * @returns 会话信息
 */
export function startSession() {
  return request<RtasrSession>({
    url: "/rtasr/session",
    method: "post"
  });
}

/**
 * 结束实时识别会话
 * @param sessionId 会话ID
 * @returns 结束结果
 */
export function endSession(sessionId: string) {
  return request<{ success: boolean }>({
    url: `/rtasr/${sessionId}/end`,
    method: "post"
  });
}

/**
 * 获取实时识别结果
 * @param sessionId 会话ID
 * @returns 识别结果
 */
export function getSessionResult(sessionId: string) {
  return request<RtasrResult>({
    url: `/rtasr/${sessionId}/result`,
    method: "get"
  });
} 