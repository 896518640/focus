/**
 * 翻译API相关类型定义
 */

/**
 * 翻译参数
 */
export interface TranslationParams {
  /** 源文本 */
  text: string;
  /** 源语言 */
  sourceLanguage: string;
  /** 目标语言 */
  targetLanguage: string;
}

/**
 * 翻译请求参数
 */
export interface TranslateParams {
  /** 文本内容 */
  text: string;
  /** 源语言 */
  sourceLang: string;
  /** 目标语言 */
  targetLang: string;
}

/**
 * 翻译结果
 */
export interface TranslateResult {
  /** 原文 */
  originalText: string;
  /** 译文 */
  translatedText: string;
  /** 源语言 */
  sourceLang: string;
  /** 目标语言 */
  targetLang: string;
  /** 检测到的语言 */
  detectedLang?: string;
}

/**
 * 语言信息
 */
export interface LanguageInfo {
  /** 语言代码 */
  code: string;
  /** 语言名称 */
  name: string;
  /** 原生名称 */
  nativeName: string;
  /** 是否从右到左书写 */
  rtl: boolean;
}

/**
 * 翻译响应
 */
export interface TranslationResponse {
  /** 翻译后的文本 */
  text: string;
  /** 源语言 */
  sourceLanguage: string;
  /** 目标语言 */
  targetLanguage: string;
  /** 翻译时间 */
  timestamp: string;
}

/**
 * AI总结请求参数
 */
export interface AiSummaryParams {
  /** 待总结的文本 */
  text: string;
  /** 语言 */
  language: string;
}

/**
 * AI总结流式响应消息
 */
export interface AiSummaryStreamMessage {
  /** 文本片段 */
  content: string;
}

/**
 * AI总结响应
 */
export interface AiSummaryResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 响应数据 */
  data: string;
  /** 时间戳 */
  timestamp: string;
}

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
  status: string;
}

/**
 * 翻译记录列表响应
 */
export interface TranslationListResponse {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page?: number;
  /** 每页记录数 */
  pageSize?: number;
  /** 总页数 */
  totalPages?: number;
  /** 记录列表 */
  list: Array<SaveTranslationResponse & SaveTranslationParams>;
} 