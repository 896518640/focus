import { RealtimeTranslationOptions, TranscriptionResult, Word } from './types'

export function useMessageHandler(options: {
  onTranscriptionResult?: (text: string) => void,
  onTranslationResult?: (text: string) => void,
  onError?: (error: Error) => void,
  onTranscriptionCompleted?: () => void,
  onSessionDetected?: (segmentIndex: number, beginTime: number) => void,
  updateSentence: (segmentIndex: number, words: Word[]) => void,
  updateTranslation: (segmentIndex: number, text: string, beginTime?: number, endTime?: number) => void,
  buildTranscriptionResult: () => TranscriptionResult,
  buildTranslationResult: () => string
}) {
  // 处理转写结果变更消息
  const handleTranscriptionResultChanged = (payload: any) => {
    if (!payload) return;
    
    const segmentIndex = payload.index !== undefined ? payload.index : 0;
    const text = payload.result || '';
    const beginTime = payload.begin_time !== undefined ? payload.begin_time : 0;
    const endTime = payload.time !== undefined ? payload.time : 0;
    const words = payload.words || [];  // 单词级别的时间戳信息
    const status = payload.status !== undefined ? payload.status : 0;
    
    // 调试日志 - 仅在开发环境输出或限制频率
    if (process.env.NODE_ENV === 'development' || Math.random() < 0.05) {
      console.log(`处理转写结果: 索引=${segmentIndex}, 文本="${text.substring(0, 20)}${text.length > 20 ? '...' : ''}", 单词数=${words.length}, 时间范围=[${beginTime}-${endTime}]`);
    }
    
    // 会话边界检测 - 使用更可靠的方法检测会话边界
    if (segmentIndex === 0 && beginTime > 0 && options.onSessionDetected) {
      // 防止重复会话检测
      const isNewSession = isSignificantTimeDifference(beginTime) && !isLikelyRepeatContent(text);
      
      if (isNewSession) {
        console.log(`检测到可能的会话边界: 索引=${segmentIndex}, 时间=${beginTime}ms, 文本="${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`);
        
        // 延迟处理会话边界，允许收集更多信息
        setTimeout(() => {
          console.log(`确认会话边界: 索引=${segmentIndex}, 时间=${beginTime}ms`);
          options.onSessionDetected!(segmentIndex, beginTime);
          
          // 会话边界已处理，接着处理当前转写结果
          setTimeout(() => {
            // 延迟执行以确保会话状态已重置
            continueProcessing();
          }, 50);
          
          // 提前返回，等待setTimeout回调处理
          return;
        }, 100);
        
        // 提前返回，等待setTimeout回调处理
        return;
      }
    }
    
    // 直接处理转写结果
    continueProcessing();
    
    // 提取处理逻辑为内部函数，便于延迟执行
    function continueProcessing() {
      // 检查是否是有效的转写结果
      if (text.trim() === '' && words.length === 0) {
        console.log(`跳过空的转写结果: 索引=${segmentIndex}`);
        return;
      }
      
      // 处理单词数组
      let processedWords = words;
      
      // 如果单词数组为空但有文本，尝试从文本中构建单词
      if (words.length === 0 && text.trim()) {
        processedWords = [{
          startTime: beginTime,
          text: text,
          endTime: endTime,
          fixed: true
        }];
        if (process.env.NODE_ENV === 'development') {
          console.log(`为空单词数组创建了替代单词: "${text}"`);
        }
      }
      
      // 如果单词时间有问题，进行修正
      if (processedWords.length > 0) {
        // 检查并修正单词时间范围
        processedWords = processedWords.map((word: any) => {
          // 确保每个单词都有有效的开始和结束时间
          const processed = {
            ...word,
            startTime: word.startTime !== undefined ? word.startTime : beginTime,
            endTime: word.endTime !== undefined ? word.endTime : endTime,
            text: word.text || '',
            punc: word.punc || ''  // 保留标点符号
          };
          
          // 确保结束时间不早于开始时间
          if (processed.endTime < processed.startTime) {
            processed.endTime = processed.startTime + 500; // 假设至少持续500ms
          }
          
          return processed;
        });
      }
      
      // 处理当前句子 - 确保传递有效的时间信息
      if (processedWords.length > 0) {
        options.updateSentence(segmentIndex, processedWords);
      }
      
      // 构建并通知最新的转写结果
      const transcriptionResult = options.buildTranscriptionResult();
      if (options.onTranscriptionResult) {
        options.onTranscriptionResult(transcriptionResult.text);
      }
    }
    
    return {
      segmentIndex,
      text,
      beginTime,
      endTime,
      status
    };
  }
  
  // 检查是否存在显著的时间差，判断可能的会话边界
  const isSignificantTimeDifference = (beginTime: number) => {
    // 通常，新会话会从较大的时间值开始（超过5秒）
    return beginTime > 5000;
  }
  
  // 检查是否可能是重复的内容
  const isLikelyRepeatContent = (text: string) => {
    // 重复检测的最小文本长度阈值
    const MIN_LENGTH = 10;
    
    // 文本太短，不可靠，不认为是重复
    if (text.length < MIN_LENGTH) {
      return false;
    }
    
    // 这里可以添加更复杂的重复内容检测逻辑
    // 例如检查常见的开场白模式、特殊标记等
    
    // 当前简单实现：对于长度超过阈值的文本，假定不是重复内容
    return false;
  }
  
  // 处理翻译结果消息
  const handleResultTranslated = (payload: any) => {
    console.log('handleResultTranslated', payload);
    if (!payload || !payload.translate_result) return;
    
    console.log('收到翻译结果消息:', payload ? `有${payload.translate_result?.length || 0}项翻译` : '无数据');
    const translations = payload.translate_result;
    const sourceLang = payload.source_lang;
    const targetLang = payload.target_lang;
    
    // 防止空数组引起的错误
    if (!Array.isArray(translations) || translations.length === 0) {
      console.warn('翻译结果数组为空或非数组格式');
      return;
    }
    
    // 调试日志 - 仅在开发环境或限制频率
    if (process.env.NODE_ENV === 'development' || Math.random() < 0.05) {
      const firstTranslation = translations[0]?.text || '';
      const beginTime = translations[0]?.beginTime || translations[0]?.begin_time || 0;
      const endTime = translations[0]?.endTime || translations[0]?.end_time || 0;
      console.log(`处理翻译结果: 数量=${translations.length}, 时间段=[${beginTime}-${endTime}], 第一个="${firstTranslation.substring(0, 20)}${firstTranslation.length > 20 ? '...' : ''}"`);
    }
    
    // 过滤处理所有翻译条目
    const processedTranslations: Array<{
      index: number,
      text: string,
      beginTime: number,
      endTime: number,
      partial: boolean
    } | null> = [];
    
    // 跟踪是否存在部分结果标记
    let hasPartialResults = false;
    
    // 预处理所有翻译条目，标准化字段
    for (const translation of translations) {
      const segmentIndex = translation.index ?? 0;
      const text = translation.text || "";
      // 处理beginTime和endTime，可能为undefined
      const beginTime = translation.beginTime ?? translation.begin_time ?? 0;
      const endTime = translation.endTime ?? translation.end_time ?? (beginTime > 0 ? beginTime + 1000 : 0);
      const isPartial = translation.partial === true;
      
      // 记录是否包含部分结果
      if (isPartial) {
        hasPartialResults = true;
      }
      
      // 跳过空文本，但如果是partial标记的结果，即使为空也保留
      if (!text.trim() && !isPartial) {
        continue;
      }
      
      // 为partial结果设置合理的时间范围
      let processedBeginTime = beginTime;
      let processedEndTime = endTime;
      
      // 如果是partial结果且缺少时间信息，尝试使用前一个结果的时间信息
      if (isPartial && (beginTime === 0 || endTime === 0)) {
        // 查找前一个有时间信息的结果
        for (let i = processedTranslations.length - 1; i >= 0; i--) {
          const prev = processedTranslations[i];
          if (prev && prev.endTime > 0) {
            processedBeginTime = prev.endTime;
            processedEndTime = prev.endTime + 1000; // 添加一个估计的持续时间
            break;
          }
        }
      }
      
      // 确保结束时间不早于开始时间
      if (processedBeginTime >= processedEndTime && processedEndTime > 0) {
        processedEndTime = processedBeginTime + 1000; // 假设至少持续1秒
      }
      
      processedTranslations.push({
        index: segmentIndex,
        text,
        beginTime: processedBeginTime,
        endTime: processedEndTime,
        partial: isPartial
      });
    }
    
    // 按时间和索引排序
    processedTranslations.sort((a, b) => {
      if (!a || !b) return 0; // 处理null值
      
      // 优先按索引排序，确保顺序一致
      if (a.index !== b.index) {
        return a.index - b.index;
      }
      
      // 其次按时间段开始排序
      if (a.beginTime !== b.beginTime) {
        return a.beginTime - b.beginTime;
      }
      
      // 最后，partial结果排在非partial结果后面
      if (a.partial !== b.partial) {
        return a.partial ? 1 : -1;
      }
      
      return 0;
    });
    
    // 检查并合并重叠的时间段，特别处理partial结果
    for (let i = 0; i < processedTranslations.length; i++) {
      const current = processedTranslations[i];
      
      // 跳过已标记为无效的条目
      if (!current) continue;
      
      for (let j = i + 1; j < processedTranslations.length; j++) {
        const next = processedTranslations[j];
        
        // 跳过已标记为无效的条目
        if (!next) continue;
        
        // 如果索引相同，且当前不是partial但下一个是partial，保留非partial的结果
        if (current.index === next.index) {
          if (!current.partial && next.partial) {
            processedTranslations[j] = null;
            continue;
          } else if (current.partial && !next.partial) {
            processedTranslations[i] = null;
            break; // 当前条目无效，退出内层循环
          }
        }
        
        // 检查时间段重叠
        const hasOverlap = (current.beginTime < next.endTime && current.endTime > next.beginTime);
        
        if (hasOverlap) {
          // 计算重叠比例
          const overlapStart = Math.max(current.beginTime, next.beginTime);
          const overlapEnd = Math.min(current.endTime, next.endTime);
          const overlapDuration = Math.max(0, overlapEnd - overlapStart);
          
          const currentDuration = current.endTime - current.beginTime;
          const nextDuration = next.endTime - next.beginTime;
          
          const overlapRatioCurrent = currentDuration > 0 ? overlapDuration / currentDuration : 0;
          const overlapRatioNext = nextDuration > 0 ? overlapDuration / nextDuration : 0;
          
          // 检查文本重叠
          const currentIncludesNext = current.text.includes(next.text);
          const nextIncludesCurrent = next.text.includes(current.text);
          
          // 处理重叠情况的判断逻辑
          // 1. 优先考虑非partial结果
          if (current.partial && !next.partial) {
            processedTranslations[i] = null;
            break;
          } else if (!current.partial && next.partial) {
            processedTranslations[j] = null;
            continue;
          } 
          // 2. 如果partial状态相同，考虑文本包含关系
          else if (currentIncludesNext && current.text.length >= next.text.length) {
            // 当前文本包含下一个且更长，标记下一个为无效
            processedTranslations[j] = null;
          } else if (nextIncludesCurrent && next.text.length > current.text.length) {
            // 下一个文本包含当前且更长，标记当前为无效，保留下一个
            processedTranslations[i] = null;
            break; // 退出内层循环，因为当前条目已无效
          } 
          // 3. 对于时间严重重叠(>70%)但文本不同的情况，保留更完整的版本
          else if ((overlapRatioCurrent > 0.7 || overlapRatioNext > 0.7) && 
                   !currentIncludesNext && !nextIncludesCurrent) {
            // 如果两者内容差异较大，但有严重时间重叠，保留更长的版本
            if (current.text.length > next.text.length) {
              processedTranslations[j] = null;
            } else {
              processedTranslations[i] = null;
              break;
            }
          }
        }
      }
    }
    
    // 过滤掉标记为null的条目
    const uniqueTranslations = processedTranslations.filter(Boolean) as Array<{
      index: number,
      text: string,
      beginTime: number,
      endTime: number,
      partial: boolean
    }>;
    
    // 更新翻译状态 - 确保正确传递时间信息
    for (const translation of uniqueTranslations) {
      // 如果是partial结果，添加标记以便UI展示可能处于更新中
      const finalText = translation.partial ? `${translation.text}` : translation.text;
      
      options.updateTranslation(
        translation.index,
        finalText,
        translation.beginTime,
        translation.endTime
      );
    }
    
    // 构建并通知最新的翻译结果
    const translationResult = options.buildTranslationResult();
    if (options.onTranslationResult) {
      options.onTranslationResult(translationResult);
    }
    
    // 如果收到包含partial标记的结果，且没有其他非partial结果，可能表示翻译尚未完成
    // 这对于调试和状态跟踪很有用
    if (hasPartialResults) {
      console.log('注意: 收到包含partial标记的翻译结果，翻译可能尚未完成');
    }
    
    return {
      sourceLang,
      targetLang,
      translations: uniqueTranslations,
      hasPartialResults
    };
  }
  
  // 处理转写完成消息
  const handleTranscriptionCompleted = (payload: any) => {
    console.log('收到转写完成事件:', payload);
    
    // 检查是否有待处理的翻译结果 - 延迟回调以确保所有翻译结果都处理完成
    setTimeout(() => {
      // 再次构建最终结果，确保包含所有最新的翻译
      const finalTranscriptionResult = options.buildTranscriptionResult();
      const finalTranslationResult = options.buildTranslationResult();
      
      // 最后一次通知结果更新
      if (options.onTranscriptionResult) {
        options.onTranscriptionResult(finalTranscriptionResult.text);
      }
      
      if (options.onTranslationResult) {
        options.onTranslationResult(finalTranslationResult);
      }
      
      console.log('转写完成后最终结果已更新');
      
      // 调用转写完成回调
      if (options.onTranscriptionCompleted) {
        options.onTranscriptionCompleted();
      }
    }, 500); // 延迟500毫秒，给翻译结果处理留出时间
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
  
  // 处理WebSocket消息
  const processWebSocketMessage = (event: MessageEvent) => {
    try {
      if (event.data instanceof Blob) {
        // 二进制数据通常是音频返回，在这个上下文中忽略
        return;
      }
      
      // 解析JSON消息
      const message = JSON.parse(event.data);
      
      // 获取消息头部信息
      const header = message?.header;
      if (!header) {
        console.error('WebSocket消息缺少header:', message);
        return;
      }
      
      // 获取消息名称和命名空间
      const name = header.name;
      const namespace = header.namespace;
      
      // 检查消息格式
      if (!name || !namespace) {
        console.error('WebSocket消息缺少name或namespace:', header);
        return;
      }
      
      // 获取载荷
      const payload = message.payload;
      
      // 根据消息类型进行处理
      if (namespace === 'SpeechTranscriber') {
        if (name === 'TranscriptionResultChanged') {
          // 句中识别结果变化事件
          handleTranscriptionResultChanged(payload);
        } else if (name === 'ResultTranslated') {
          // 识别结果翻译事件
          handleResultTranslated(payload);
        }  else if (name === 'TranscriptionCompleted') {
          // 表示此次推流识别完成
          handleTranscriptionCompleted(payload);
        } else if(name === 'SentenceBegin') {
          // 句子开始事件
          console.log('句子开始');
        } else if (name === 'SentenceEnd') {
          // 句子结束事件
          console.log('句子结束');
        } else if (name === 'TaskFailed') {
          // 表示此次推流识别异常中断。
          handleTaskFailed(payload);
        } else {
          // 其他消息类型
          console.log(`未处理的SpeechTranscriber消息: ${name}`);
        }
      }
    } catch (error) {
      // 处理解析或处理过程中的错误
      console.error('处理WebSocket消息出错:', error);
      
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