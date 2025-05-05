import { request } from '@/http/axios';
import type { 
  SaveTranslationParams as TSaveTranslationParams,
  SaveTranslationResponse as TSaveTranslationResponse,
  TranslationListResponse as TTranslationListResponse
} from '@/types/api/translation';

/**
 * 保存翻译记录
 * @param params 保存参数
 * @returns 保存结果
 */
export function saveTranslation(params: TSaveTranslationParams) {
  return request<TSaveTranslationResponse>({
    url: '/translation/save',
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
  return request<TTranslationListResponse>({
    url: '/translation/list',
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
  return request<TSaveTranslationResponse & TSaveTranslationParams>({
    url: `/translation/detail/${id}`,
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
    url: `/translation/delete/${id}`,
    method: 'DELETE'
  });
}

// 重新导出类型，以保持兼容性
export type {
  TSaveTranslationParams as SaveTranslationParams,
  TSaveTranslationResponse as SaveTranslationResponse,
  TTranslationListResponse as TranslationListResponse
}; 