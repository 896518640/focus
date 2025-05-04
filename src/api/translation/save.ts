import request from '@/utils/request';

/**
 * 保存翻译记录接口参数
 */
export interface SaveTranslationParams {
  /** 任务ID（可选） */
  taskId?: string | null;
  /** 标题 */
  title: string;
  /** 源语言 */
  sourceLanguage: string;
  /** 目标语言 */
  targetLanguage: string;
  /** 原文内容 */
  originalText: string;
  /** 翻译内容 */
  translatedText: string;
  /** 录音时长（秒） */
  duration: number;
  /** 时间戳 */
  timestamp: number;
  /** 任务状态 */
  taskStatus?: string;
  /** 输出MP3文件路径 */
  outputMp3Path?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 标签（可选） */
  tags?: string[];
}

/**
 * 保存翻译记录响应
 */
export interface SaveTranslationResponse {
  /** 记录ID */
  id: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 记录状态 */
  status: 'success' | 'processing' | 'failed';
}

/**
 * 保存翻译记录
 * @param params 保存参数
 * @returns 保存结果
 */
export function saveTranslation(params: SaveTranslationParams) {
  return request<SaveTranslationResponse>({
    url: '/api/translation/save',
    method: 'POST',
    data: params
  });
}

/**
 * 获取翻译记录列表
 * @param page 页码
 * @param pageSize 每页条数
 * @returns 翻译记录列表
 */
export function getTranslationList(page: number = 1, pageSize: number = 10) {
  return request<{
    total: number;
    list: Array<SaveTranslationResponse & SaveTranslationParams>;
  }>({
    url: '/api/translation/list',
    method: 'GET',
    params: { page, pageSize }
  });
}

/**
 * 获取翻译记录详情
 * @param id 记录ID
 * @returns 翻译记录详情
 */
export function getTranslationDetail(id: string) {
  return request<SaveTranslationResponse & SaveTranslationParams>({
    url: `/api/translation/detail/${id}`,
    method: 'GET'
  });
}

/**
 * 删除翻译记录
 * @param id 记录ID
 * @returns 操作结果
 */
export function deleteTranslation(id: string) {
  return request<{ success: boolean }>({
    url: `/api/translation/delete/${id}`,
    method: 'DELETE'
  });
} 