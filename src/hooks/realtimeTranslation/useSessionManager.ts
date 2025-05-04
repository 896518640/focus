import { ref, Ref } from 'vue'
import { SentenceData, TranslationData, Word, SentenceState, TranscriptionResult } from './types'

export function useSessionManager() {
  // 存储句子状态的Map，使用句子索引作为键
  // 修改为使用字符串作为键，以支持复合索引（会话+句子索引）
  const sentenceState = new Map<string, SentenceState>();

  // 存储翻译状态的Map，使用句子索引作为键
  const translationState = new Map<number, TranslationData>();

  // 会话计数器，每次开始新会话时增加
  const sessionCounter = ref(0);

  // 当前会话中处理过的句子数量
  const processedSentencesInSession = ref(0);

  // 最后处理的句子索引
  const lastSentenceIndex = ref(-1);

  // 保存的历史内容（当章节结束时）
  const preservedHistoryContent = ref('');

  // 保存的历史翻译（当章节结束时）
  const preservedHistoryTranslation = ref('');
  
  // 检测新会话
  const isNewSession = (segmentIndex: number, beginTime: number) => {
    return (
      (segmentIndex === 0 && processedSentencesInSession.value > 0 && beginTime < 1000 && sessionCounter.value > 1) || 
      (lastSentenceIndex.value > segmentIndex && segmentIndex === 0 && beginTime < 1000) ||
      (processedSentencesInSession.value > 1 && segmentIndex === 0 && beginTime < 1000)
    );
  }
  
  // 开始新会话
  const startNewSession = () => {
    // 增加会话计数，以区分新会话
    sessionCounter.value++;
    
    // 记录日志
    console.log(`开始新会话（会话计数: ${sessionCounter.value}，处理句子数: ${processedSentencesInSession.value}）`);
    
    // 重置状态变量
    clearSessionStates();
    
    return {
      sessionId: sessionCounter.value
    };
  }
  
  // 准备新会话，完全重置状态确保每次会话处理逻辑一致
  const prepareNewSession = () => {
    console.log('准备新会话，彻底重置状态...');
    
    // 保存现有历史内容（如果有）到备份变量
    const currentHistory = preservedHistoryContent.value;
    const currentTranslation = preservedHistoryTranslation.value;
    
    // 记录当前会话处理状态
    const currentSessionData = {
      hasProcessedData: sentenceState.size > 0 || translationState.size > 0,
      sentenceCount: sentenceState.size,
      translationCount: translationState.size
    };
    
    console.log(`当前会话状态：已处理数据=${currentSessionData.hasProcessedData}, 句子数=${currentSessionData.sentenceCount}, 翻译数=${currentSessionData.translationCount}`);
    
    // 先完全重置所有状态变量
    clearSessionStates();
    
    // 清空句子和翻译状态映射
    sentenceState.clear();
    translationState.clear();
    
    // 重置会话计数器（而不是增加）
    sessionCounter.value = 0;
    
    // 确保处理计数器重置
    processedSentencesInSession.value = 0;
    lastSentenceIndex.value = -1;
    
    // 设置一个标记，表示已经彻底重置过状态
    const resetTimestamp = Date.now();
    
    // 只有在历史内容存在时才恢复
    if (currentHistory) {
      preservedHistoryContent.value = currentHistory;
    }
    
    if (currentTranslation) {
      preservedHistoryTranslation.value = currentTranslation;
    }
    
    console.log('新会话准备完成，状态已完全重置');
    
    return {
      hasHistory: !!currentHistory,
      hasPreviousSession: currentSessionData.hasProcessedData,
      resetTimestamp
    };
  }
  
  // 清除会话状态
  const clearSessionStates = () => {
    // 彻底清除句子状态映射表
    sentenceState.clear();
    
    // 重置索引计数器
    lastSentenceIndex.value = -1;
    processedSentencesInSession.value = 0;
    
    console.log('会话状态已清除');
  }
  
  // 重置所有会话数据
  const resetAllSessions = () => {
    clearSessionStates();
    translationState.clear();
    sessionCounter.value = 0;
    // 清除历史保存的内容
    preservedHistoryContent.value = '';
    preservedHistoryTranslation.value = '';
  }
  
  // 更新句子状态
  const updateSentence = (segmentIndex: number, words: Word[]) => {
    // 判断会话边界
    const isNewSession = sessionCounter.value === 0;
    
    if (isNewSession) {
      console.log(`新会话的第一个句子: 索引=${segmentIndex}, 单词数=${words.length}`);
    }
    
    if (words.length === 0) {
      console.log(`跳过空单词的句子更新: 索引=${segmentIndex}`);
      return;
    }
    
    // 计算句子时间范围
    const startTime = Math.min(...words.map(word => word.startTime || 0));
    const endTime = Math.max(...words.map(word => word.endTime || 0));
    
    // 检查时间有效性
    if (startTime === 0 && endTime === 0) {
      console.log(`跳过无时间信息的句子: 索引=${segmentIndex}`);
      return;
    }
    
    // 使用Map存储和更新句子，确保句子按时间排序且不重复
    const sentenceKey = `${sessionCounter.value}-${segmentIndex}`;
    
    // 存储句子内容和时间信息
    sentenceState.set(sentenceKey, {
      sentenceIndex: segmentIndex,
      sessionIndex: sessionCounter.value,
      words: [...words], // 复制数组，避免引用问题
      startTime,
      endTime
    });
    
    // 调试输出
    if (process.env.NODE_ENV === 'development') {
      console.log(`更新句子: key=${sentenceKey}, 文本="${words.map((w: Word) => w.text).join('')}", 时间范围=${startTime}-${endTime}ms`);
    }
  };
  
  // 更新翻译状态
  const updateTranslation = (
    segmentIndex: number,
    text: string,
    beginTime?: number,
    endTime?: number
  ) => {
    if (!text.trim()) return;
    
    // 确保时间信息有效
    const validBeginTime = beginTime !== undefined ? beginTime : 0;
    const validEndTime = endTime !== undefined ? endTime : 0;
    
    // 检查时间是否有效（防止错误数据）
    if (validEndTime < validBeginTime) {
      console.warn(`翻译${segmentIndex}: 无效的时间范围 [${validBeginTime}-${validEndTime}]`);
      return;
    }
    
    // 检查是否已存在这个索引的翻译内容
    const existingTranslation = translationState.get(segmentIndex);
    
    // 如果已有内容，需要检查内容变化情况
    if (existingTranslation) {
      // 如果新内容与现有内容相同，直接跳过
      if (existingTranslation.text === text) {
        return;
      }
      
      // 检查时间区间是否相同或相似
      const existingBeginTime = existingTranslation.beginTime ?? 0;
      const existingEndTime = existingTranslation.endTime ?? 0;
      
      // 允许100毫秒的误差
      const isSameTimeRange = 
        Math.abs(existingBeginTime - validBeginTime) < 100 && 
        Math.abs(existingEndTime - validEndTime) < 100;
      
      // 内容不同但时间区间相同，说明是对同一句话的修正
      if (isSameTimeRange) {
        // 如果新文本更长，则认为是更完整的结果
        if (text.length > existingTranslation.text.length) {
          console.log(`翻译${segmentIndex}: 相同时间区间的更新内容，更新翻译`);
        } else {
          // 如果新文本更短或相同长度但内容不同，检查是否是部分结果
          if (text.endsWith('') && existingTranslation.text.length > text.length) {
            console.log(`翻译${segmentIndex}: 丢弃较短内容，保留现有翻译`);
            return;
          }
        }
      } else {
        // 允许500毫秒的重叠判定
        const hasOverlap = (
          validBeginTime < existingEndTime + 500 && 
          validEndTime > existingBeginTime - 500
        );
        
        // 有重叠的时间区间，需要特别处理
        if (hasOverlap) {
          // 如果新内容是旧内容的子集，可能是部分更新，保留旧内容
          if (existingTranslation.text.includes(text) && existingTranslation.text.length > text.length) {
            console.log(`翻译${segmentIndex}: 新内容是旧内容子集，保留旧内容`);
            return;
          }
          
          // 如果新内容包含旧内容且更长，则认为是更完整的结果
          if (text.includes(existingTranslation.text) && text.length > existingTranslation.text.length) {
            console.log(`翻译${segmentIndex}: 增量更新，旧(${existingTranslation.text.length}字符) -> 新(${text.length}字符)`);
          }
        }
      }
    }
    
    // 检查是否与其他索引的翻译时间段有重叠
    for (const [idx, data] of translationState.entries()) {
      // 跳过自身比较
      if (idx === segmentIndex) continue;
      
      // 检查时间区间是否有显著重叠 (超过70%)
      const dataBeginTime = data.beginTime ?? 0;
      const dataEndTime = data.endTime ?? 0;
      
      // 计算重叠部分
      const overlapStart = Math.max(validBeginTime, dataBeginTime);
      const overlapEnd = Math.min(validEndTime, dataEndTime);
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);
      
      // 计算重叠比例
      const currentDuration = validEndTime - validBeginTime;
      const existingDuration = dataEndTime - dataBeginTime;
      const overlapRatioCurrent = currentDuration > 0 ? overlapDuration / currentDuration : 0;
      const overlapRatioExisting = existingDuration > 0 ? overlapDuration / existingDuration : 0;
      
      // 如果重叠比例超过70%，认为是同一段内容的不同版本
      if (overlapRatioCurrent > 0.7 || overlapRatioExisting > 0.7) {
        // 检查内容相似度
        if (data.text.includes(text) || text.includes(data.text)) {
          // 保留更长/更完整的版本
          if (data.text.length >= text.length) {
            console.log(`翻译${segmentIndex}: 与索引${idx}时间重叠(${Math.round(Math.max(overlapRatioCurrent, overlapRatioExisting) * 100)}%)且现有更长，跳过更新`);
            return;
          } else {
            // 新内容更好，删除旧内容
            console.log(`翻译${segmentIndex}: 与索引${idx}时间重叠(${Math.round(Math.max(overlapRatioCurrent, overlapRatioExisting) * 100)}%)但更长，替换旧内容`);
            translationState.delete(idx);
          }
        }
      }
    }
    
    // 创建或更新翻译数据
    translationState.set(segmentIndex, {
      text,
      index: segmentIndex,
      beginTime: validBeginTime,
      endTime: validEndTime,
      lastUpdated: Date.now()
    });
  }
  
  // 构建完整的转写结果，包含保存的历史内容
  const buildTranscriptionResult = (): TranscriptionResult => {
    const currentSessionIndex = sessionCounter.value;
    console.log(`构建转写结果: 当前会话索引=${currentSessionIndex}, 句子数量=${sentenceState.size}`);
    
    // 获取保存的历史内容
    const historyContent = preservedHistoryContent.value || '';
    
    // 使用数组收集当前会话的句子，确保按时间顺序排序
    const currentSessionSentences: SentenceState[] = [];
    
    // 只收集当前会话的句子
    for (const [key, sentence] of sentenceState.entries()) {
      if (sentence.sessionIndex === currentSessionIndex) {
        currentSessionSentences.push(sentence);
      }
    }
    
    // 没有当前会话内容时，直接返回历史内容
    if (currentSessionSentences.length === 0) {
      return {
        text: historyContent,
        sentences: []
      };
    }
    
    // 按开始时间排序句子
    currentSessionSentences.sort((a, b) => a.startTime - b.startTime);
    
    // 使用时间重叠检测合并相似内容
    const mergedSentences: SentenceState[] = [];
    
    for (const sentence of currentSessionSentences) {
      // 检查是否应该合并到前一个句子
      const lastSentence = mergedSentences[mergedSentences.length - 1];
      
      if (lastSentence && 
          sentence.startTime <= lastSentence.endTime + 200) { // 200ms的重叠容差
        
        // 合并单词，确保不重复
        const existingWordTexts = new Set(lastSentence.words.map((w: Word) => w.text));
        const nonDuplicateWords = sentence.words.filter((w: Word) => !existingWordTexts.has(w.text));
        
        if (nonDuplicateWords.length > 0) {
          // 只添加非重复单词
          lastSentence.words.push(...nonDuplicateWords);
          // 更新结束时间
          lastSentence.endTime = Math.max(lastSentence.endTime, sentence.endTime);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`合并句子: 添加${nonDuplicateWords.length}个非重复单词`);
          }
        }
      } else {
        // 添加为新句子
        mergedSentences.push({...sentence, words: [...sentence.words]});
      }
    }
    
    // 构建当前会话文本
    let currentSessionText = '';
    
    if (mergedSentences.length > 0) {
      // 将所有单词按时间排序，再构建文本
      const allWords: Word[] = [];
      mergedSentences.forEach(sentence => {
        allWords.push(...sentence.words);
      });
      
      // 对所有单词按开始时间排序
      allWords.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
      
      // 删除重复单词
      const uniqueWords: Word[] = [];
      const wordTexts = new Set<string>();
      
      for (const word of allWords) {
        // 只添加不重复的单词
        if (!wordTexts.has(word.text)) {
          uniqueWords.push(word);
          wordTexts.add(word.text);
        }
      }
      
      // 构建最终文本
      currentSessionText = uniqueWords.map(word => word.text).join('');
    }
    
    // 检查当前会话文本是否已经包含在历史内容中
    if (historyContent && currentSessionText) {
      if (historyContent.includes(currentSessionText)) {
        console.log('当前会话文本已包含在历史内容中，避免重复');
        return {
          text: historyContent,
          sentences: mergedSentences
        };
      }
    }
    
    // 合并历史和当前会话文本，确保中间有适当的分隔
    const finalText = historyContent 
      ? `${historyContent}${historyContent.endsWith('\n') ? '' : '\n'}${currentSessionText}` 
      : currentSessionText;
    
    return {
      text: finalText,
      sentences: mergedSentences
    };
  };
  
  // 构建完整的翻译结果，包含保存的历史翻译
  const buildTranslationResult = () => {
    // 获取所有翻译数据并按时间顺序排序
    const allTranslationData = Array.from(translationState.values())
      .sort((a, b) => {
        // 优先按beginTime排序
        const aBeginTime = a.beginTime ?? 0;
        const bBeginTime = b.beginTime ?? 0;
        
        if (aBeginTime !== bBeginTime) {
          return aBeginTime - bBeginTime;
        }
        
        // 如果beginTime相同，按endTime排序
        const aEndTime = a.endTime ?? 0;
        const bEndTime = b.endTime ?? 0;
        return aEndTime - bEndTime;
      });
    
    // 如果没有当前会话的翻译数据，直接返回历史翻译
    if (allTranslationData.length === 0) {
      return preservedHistoryTranslation.value || '';
    }
    
    // 用于存储最终的翻译结果
    const processedSegments: {
      text: string;
      beginTime: number;
      endTime: number;
    }[] = [];
    
    // 按时间顺序处理，避免重复
    for (const data of allTranslationData) {
      const currentText = data.text.trim();
      if (!currentText) continue;
      
      const currentBeginTime = data.beginTime ?? 0;
      const currentEndTime = data.endTime ?? 0;
      
      // 检查是否与已处理的段落有时间重叠
      let shouldAdd = true;
      let indexToReplace = -1;
      
      for (let i = 0; i < processedSegments.length; i++) {
        const segment = processedSegments[i];
        
        // 检查时间重叠
        const hasTimeOverlap = (
          currentBeginTime < segment.endTime && 
          currentEndTime > segment.beginTime
        );
        
        // 完全相同的文本，跳过
        if (segment.text === currentText) {
          shouldAdd = false;
          break;
        }
        
        // 有时间重叠，检查内容
        if (hasTimeOverlap) {
          // 检查包含关系
          const isCurrentIncludesSegment = currentText.includes(segment.text);
          const isSegmentIncludesCurrent = segment.text.includes(currentText);
          
          // 当前文本包含已有段落且更长，替换
          if (isCurrentIncludesSegment && currentText.length > segment.text.length) {
            indexToReplace = i;
            shouldAdd = true;
            break;
          } 
          // 已有段落包含当前文本，跳过
          else if (isSegmentIncludesCurrent) {
            shouldAdd = false;
            break;
          }
        }
      }
      
      // 处理替换或添加
      if (shouldAdd) {
        if (indexToReplace >= 0) {
          // 替换重叠段落
          processedSegments[indexToReplace] = {
            text: currentText,
            beginTime: currentBeginTime,
            endTime: currentEndTime
          };
        } else {
          // 添加新段落
          processedSegments.push({
            text: currentText,
            beginTime: currentBeginTime,
            endTime: currentEndTime
          });
        }
      }
    }
    
    // 再次按时间顺序排序处理后的段落
    processedSegments.sort((a, b) => a.beginTime - b.beginTime);
    
    // 提取最终文本
    const allTranslations = processedSegments.map(segment => segment.text);
    
    // 构建当前会话的翻译文本
    const currentSessionTranslation = allTranslations.join('\n');
    
    // 获取历史翻译内容
    const historyTranslation = preservedHistoryTranslation.value || '';
    
    // 如果没有当前会话翻译，直接返回历史翻译
    if (!currentSessionTranslation) {
      return historyTranslation;
    }
    
    // 检查当前会话翻译是否已经包含在历史翻译中
    if (historyTranslation && historyTranslation.includes(currentSessionTranslation)) {
      console.log('当前会话翻译已包含在历史翻译中，避免重复');
      return historyTranslation;
    }
    
    // 合并历史翻译和当前会话翻译，确保中间有适当的分隔
    return historyTranslation
      ? `${historyTranslation}${historyTranslation.endsWith('\n') ? '' : '\n'}${currentSessionTranslation}`
      : currentSessionTranslation;
  };
  
  // 设置要保存的历史内容
  const setPreservedHistory = (transcription: string, translation: string) => {
    if (transcription) {
      preservedHistoryContent.value = transcription;
    }
    
    if (translation) {
      preservedHistoryTranslation.value = translation;
    }
    
    console.log('已保存历史内容，长度:', preservedHistoryContent.value.length);
  }
  
  // 保存当前会话内容到历史
  const saveToHistory = (transcription: string, translation: string) => {
    preservedHistoryContent.value = transcription;
    preservedHistoryTranslation.value = translation;
    
    // 清理会话相关的状态
    clearSessionStates();
    
    console.log('保存内容到历史成功');
  }
  
  // 获取历史内容
  const getHistory = () => {
    return {
      transcription: preservedHistoryContent.value,
      translation: preservedHistoryTranslation.value
    };
  }
  
  return {
    sessionCounter,
    lastSentenceIndex,
    processedSentencesInSession,
    sentenceState,
    translationState,
    isNewSession,
    startNewSession,
    prepareNewSession,
    clearSessionStates,
    resetAllSessions,
    updateSentence,
    updateTranslation,
    setPreservedHistory,
    buildTranscriptionResult,
    buildTranslationResult,
    saveToHistory,
    getHistory
  }
} 