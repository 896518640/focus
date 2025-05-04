// 基础配置选项
export interface RealtimeTranslationOptions {
  sourceLanguage?: string
  targetLanguages?: string[]
  audioFormat?: string
  sampleRate?: number
  autoStart?: boolean
  onTranscriptionResult?: (text: string) => void
  onTranslationResult?: (text: string) => void
  onError?: (error: Error) => void
}

// 单词数据结构
export interface Word {
  startTime: number;
  text: string;
  endTime: number;
  punc?: string;
  fixed?: boolean;
}

// 钩子函数返回值
export interface RealtimeTranslationReturn {
  // 状态
  isInitialized: Ref<boolean>
  isConnecting: Ref<boolean>
  isConnected: Ref<boolean>
  isTranslating: Ref<boolean>
  isError: Ref<boolean>
  errorMessage: Ref<string>
  transcriptionResult: Ref<string>
  translationResult: Ref<string>
  // 新增：语言配置
  sourceLanguage: Ref<string>
  targetLanguages: Ref<string[]>
  // 新增：API任务ID
  apiTaskId: Ref<string | null>
  
  // API方法
  initializeTask: (useExistingTask?: boolean) => Promise<void>
  startTranslation: () => Promise<void>
  pauseTranslation: () => Promise<void>
  resumeTranslation: () => Promise<void>
  stopTranslation: (keepTaskAlive?: boolean) => Promise<void>
  clearResults: () => void
  // 新增：语言控制方法
  setSourceLanguage: (lang: string) => void
  setTargetLanguages: (langs: string[]) => void
}

// 句子状态数据结构
export interface SentenceData {
  words: Word[];
  startTime?: number;
  endTime?: number;
  lastUpdated: number;
  sentenceIndex?: number;
  sessionIndex?: number;
}

// 转写结果数据结构
export interface TranscriptionResult {
  text: string;
  sentences: SentenceState[];
}

// 句子状态增强数据结构
export interface SentenceState {
  sentenceIndex: number;
  sessionIndex: number;
  words: Word[];
  startTime: number;
  endTime: number;
}

// 翻译状态数据结构
export interface TranslationData {
  text: string,
  index: number,
  beginTime?: number,
  endTime?: number,
  lastUpdated: number
}

// 章节标记数据结构
export interface ChapterMarkers {
  lastCompletedAt: number;  // 上次章节完成的时间戳
  chapters: number;         // 已完成的章节数
}

// 章节历史数据结构
export interface ChapterHistory {
  transcription: string;  // 原文结果
  translation: string;    // 翻译结果
  chapterId: number;      // 章节ID
  timestamp: number;      // 创建时间戳
}

// WebSocket消息类型
export interface WebSocketMessage {
  cmd: string;
  payload?: any;
}

// 用于从Vue的ref中导入类型
import { Ref } from 'vue' 