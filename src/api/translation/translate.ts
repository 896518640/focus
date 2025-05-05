import { request } from "@/http/axios";
import { ApiResponse } from '@/types/api';
import { 
  TranslateParams, 
  TranslateResult, 
  LanguageInfo 
} from '@/types/api/translation';

/**
 * 翻译相关API接口
 */

/**
 * 文本翻译
 * @param data 翻译参数
 * @returns 翻译结果
 */
export function translateText(data: TranslateParams) {
  return request<ApiResponse<TranslateResult>>({
    url: "/translate/text",
    method: "post",
    data
  });
}

/**
 * 获取支持的语言列表
 * @returns 语言列表
 */
export function getSupportedLanguages() {
  return request<ApiResponse<LanguageInfo[]>>({
    url: "/translate/languages",
    method: "get"
  });
} 