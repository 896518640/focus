import { request } from "@/http/axios";
import { ApiResponse } from "./save";

/**
 * 翻译相关API接口
 */

export interface TranslateParams {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface TranslateResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  detectedLang?: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

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