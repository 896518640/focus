import { RealtimeTranslationOptions, TranscriptionResult, Word } from './types'

export function useMessageHandler(options: {
  onTranscriptionResult?: (text: string) => void,
  onTranslationResult?: (text: string) => void,
  onError?: (error: Error) => void,
  onTranscriptionCompleted?: () => void,
  onSessionDetected?: (segmentIndex: number, beginTime: number) => void,
  onSentenceBegin?: (segmentIndex: number, beginTime: number) => void,
  onSentenceEnd?: (segmentIndex: number, endTime: number, text: string) => void,
  updateSentence: (segmentIndex: number, words: Word[], isComplete?: boolean) => void,
  updateTranslation: (segmentIndex: number, text: string, beginTime?: number, endTime?: number) => void,
  updateStashResult?: (segmentIndex: number, text: string, words: Word[]) => void,
  buildTranscriptionResult: () => TranscriptionResult,
  buildTranslationResult: () => string
}) {
  // 处理句子开始消息
  const handleSentenceBegin = (payload: any) => {
    if (!payload) return;
    
    const segmentIndex = payload.index !== undefined ? payload.index : 0;
    const beginTime = payload.time !== undefined ? payload.time : 0;
    
    if (process.env.NODE_ENV === 'development' || Math.random() < 0.05) {
      console.log(`句子开始: 索引=${segmentIndex}, 开始时间=${beginTime}ms`);
    }
    
    // 调用句子开始回调，允许外部创建新的字幕容器或执行其他操作
    if (options.onSentenceBegin) {
      options.onSentenceBegin(segmentIndex, beginTime);
    }
    
    return {
      segmentIndex,
      beginTime
    };
  }
  
  // 处理转写结果变更消息 (非最终结果)
  const handleTranscriptionResultChanged = (payload: any) => {
    if (!payload) return;
    
    const segmentIndex = payload.index !== undefined ? payload.index : 0;
    const text = payload.result || '';
    const beginTime = payload.begin_time !== undefined ? payload.begin_time : 0;
    const endTime = payload.time !== undefined ? payload.time : 0;
    const words = payload.words || [];  // 单词级别的时间戳信息
    const status = payload.status !== undefined ? payload.status : 0;
    
    // 只在开发环境或极低频率输出日志，减少性能开销
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
      console.log(`转写更新: 索引=${segmentIndex}, 单词数=${words.length}`);
    }
    
    // 会话边界检测 - 简化检测逻辑
    if (segmentIndex === 0 && beginTime > 5000 && options.onSessionDetected) {
      options.onSessionDetected(segmentIndex, beginTime);
      // 不要在这里立即处理，让下一个事件处理即可
      return;
    }
    
    // 快速处理中间结果 - 尽量减少处理步骤
    // 检查是否是有效的转写结果
    if (text.trim() === '' && words.length === 0) return;
    
    // 直接更新句子，传递原始words和isComplete=false
    options.updateSentence(segmentIndex, words, false);
    
    // 仅在必要时构建完整结果
    if (options.onTranscriptionResult) {
      const transcriptionResult = options.buildTranscriptionResult();
      options.onTranscriptionResult(transcriptionResult.text);
    }
    
    return {
      segmentIndex,
      text,
      beginTime,
      endTime,
      status
    };
  }
  
  // 处理句子结束消息 (最终结果)
  const handleSentenceEnd = (payload: any) => {
    if (!payload) return;
    
    const segmentIndex = payload.index !== undefined ? payload.index : 0;
    const finalText = payload.result || ''; // 使用最终的完整句子结果
    const beginTime = payload.begin_time !== undefined ? payload.begin_time : 0;
    const endTime = payload.time !== undefined ? payload.time : 0;
    const words = payload.words || [];
    
    // 极简日志，减少性能影响
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
      console.log(`句子结束: 索引=${segmentIndex}, 最终文本="${finalText.substring(0, 20)}${finalText.length > 20 ? '...' : ''}"`);
    }
    
    // 关键修复: 确保使用最终result文本而不仅依赖words
    // 1. 首先更新句子的完整words数组，传递isComplete=true
    options.updateSentence(segmentIndex, words, true);
    
    // 2. 如果需要，可以在这里强制更新文本
    // 创建一个专门用于包含finalText的词条，确保UI显示完整文本
    const completedWord = {
      startTime: beginTime,
      endTime: endTime,
      text: finalText,
      fixed: true,
      isComplete: true // 特殊标记，表示这是最终完整文本
    };
    
    // 更新最终文本 - 这确保即使单词级别时间戳不完整，也能显示正确的最终文本
    // 将此块注释掉如果你不需要额外的文本更新，并且你的UI层能够正确处理带isComplete标志的updateSentence调用
    options.updateSentence(segmentIndex, [completedWord], true);
    
    // 处理暂存句数据 - 这是"未完段"，下一句的预览
    if (payload.stash_result && options.updateStashResult) {
      const stashResult = payload.stash_result;
      const stashIndex = stashResult.index !== undefined ? stashResult.index : segmentIndex + 1;
      const stashText = stashResult.text || '';
      const stashWords = stashResult.words || [];
      
      if (stashText.trim() || stashWords.length > 0) {
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
          console.log(`暂存句: 索引=${stashIndex}, 文本="${stashText}"`);
        }
        
        // 更新暂存句，这将成为下一句的预览/开头部分
        options.updateStashResult(stashIndex, stashText, stashWords);
      }
    }
    
    // 回调通知
    if (options.onSentenceEnd) {
      options.onSentenceEnd(segmentIndex, endTime, finalText);
    }
    
    // 仅在必要时构建完整结果
    if (options.onTranscriptionResult) {
      const transcriptionResult = options.buildTranscriptionResult();
      options.onTranscriptionResult(transcriptionResult.text);
    }
    
    return {
      segmentIndex,
      text: finalText,
      beginTime,
      endTime,
      hasStashResult: !!payload.stash_result
    };
  }
  
  // 处理翻译结果消息 - 优化性能
  const handleResultTranslated = (payload: any) => {
    if (!payload || !payload.translate_result) return;
    
    // 减少日志输出
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
      console.log('收到翻译结果');
    }
    
    const translations = payload.translate_result;
    const sourceLang = payload.source_lang;
    const targetLang = payload.target_lang;
    
    // 防止空数组引起的错误
    if (!Array.isArray(translations) || translations.length === 0) return;
    
    // 过滤处理所有翻译条目 - 简化为一次遍历
    const validTranslations: Array<{
      index: number,
      text: string,
      beginTime: number,
      endTime: number,
      partial: boolean
    }> = [];
    
    // 跟踪是否存在部分结果标记
    let hasPartialResults = false;
    
    // 预处理所有翻译条目，只保留有效条目
    for (const translation of translations) {
      const segmentIndex = translation.index ?? 0;
      const text = translation.text || "";
      if (!text.trim()) continue; // 跳过空文本
      
      // 处理beginTime和endTime，可能为undefined
      const beginTime = translation.beginTime ?? translation.begin_time ?? 0;
      const endTime = translation.endTime ?? translation.end_time ?? (beginTime > 0 ? beginTime + 1000 : 0);
      const isPartial = translation.partial === true;
      
      // 记录是否包含部分结果
      if (isPartial) hasPartialResults = true;
      
      validTranslations.push({
        index: segmentIndex,
        text,
        beginTime,
        endTime: endTime < beginTime ? beginTime + 1000 : endTime,
        partial: isPartial
      });
    }
    
    // 快速更新翻译状态
    for (const translation of validTranslations) {
      options.updateTranslation(
        translation.index,
        translation.text,
        translation.beginTime,
        translation.endTime
      );
    }
    
    // 构建并通知最新的翻译结果
    if (options.onTranslationResult) {
      const translationResult = options.buildTranslationResult();
      options.onTranslationResult(translationResult);
    }
    
    return {
      sourceLang,
      targetLang,
      translations: validTranslations,
      hasPartialResults
    };
  }
  
  // 处理转写完成消息 - 简化版本
  const handleTranscriptionCompleted = (payload: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('转写完成');
    }
    
    // 回调通知完成
    if (options.onTranscriptionCompleted) {
      // 立即调用完成回调，不设置延迟
      options.onTranscriptionCompleted();
    }
  }
  
  // 处理任务失败消息
  const handleTaskFailed = (payload: any) => {
    console.error('任务失败:', payload);
    
    const errorMessage = payload?.message || '转写失败';
    
    if (options.onError) {
      options.onError(new Error(errorMessage));
    }
    
    return {
      errorMessage
    };
  }
  
  // 处理WebSocket消息 - 优化分发逻辑
  const processWebSocketMessage = (event: MessageEvent) => {
    try {
      if (event.data instanceof Blob) return; // 忽略二进制数据
      
      // 解析JSON消息
      const message = JSON.parse(event.data);
      const header = message?.header;
      if (!header) return;
      
      // 获取消息名称和命名空间
      const name = header.name;
      const namespace = header.namespace;
      
      // 检查消息格式
      if (!name || !namespace || namespace !== 'SpeechTranscriber') return;
      
      // 获取载荷
      const payload = message.payload;
      
      // 根据消息类型进行处理 - 使用对象映射优化分发
      const handlers: Record<string, (payload: any) => void> = {
        'SentenceBegin': handleSentenceBegin,
        'TranscriptionResultChanged': handleTranscriptionResultChanged,
        'SentenceEnd': handleSentenceEnd, 
        'ResultTranslated': handleResultTranslated,
        'TranscriptionCompleted': handleTranscriptionCompleted,
        'TaskFailed': handleTaskFailed
      };
      
      const handler = handlers[name];
      if (handler) {
        handler(payload);
      }
    } catch (error) {
      console.error('处理WebSocket消息出错');
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('处理WebSocket消息出错'));
      }
    }
  }
  
  // 创建心跳消息
  const createHeartbeatMessage = () => {
    return {
      header: {
        name: "Ping",
        namespace: "SpeechTranscriber"
      },
      payload: {}
    };
  }
  
  // 创建开始转写命令
  const createStartTranscriptionMessage = (config: {
    sourceLanguage: string,
    audioFormat: string,
    sampleRate: number
  }) => {
    return {
      header: {
        name: "StartTranscription",
        namespace: "SpeechTranscriber",
        appkey: ""  // appkey 应该由服务端负责
      },
      payload: {
        format: config.audioFormat,
        sample_rate: config.sampleRate.toString(),
        enable_intermediate_result: true,
        enable_punctuation_prediction: true,
        enable_inverse_text_normalization: true,
        source_language: config.sourceLanguage, // 正确地设置源语言
        max_speaking_length: 60000,
        speech_timeout: 60000,
        ping_interval: 8000, // 心跳间隔参数
        ping_timeout: 20000  // 心跳超时参数
      }
    };
  }
  
  // 创建停止转写命令
  const createStopTranscriptionMessage = () => {
    return {
      header: {
        name: "StopTranscription", 
        namespace: "SpeechTranscriber",
      },
      payload: {},
    };
  }
  
  return {
    processWebSocketMessage,
    createHeartbeatMessage,
    createStartTranscriptionMessage,
    createStopTranscriptionMessage
  }
} 