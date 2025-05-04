import { ref, reactive } from 'vue'
import { ChapterHistory, ChapterMarkers } from './types'

export function useChapterManager() {
  // 章节管理
  const chapterMarkers = reactive<ChapterMarkers>({
    lastCompletedAt: 0,
    chapters: 0
  })
  
  // 历史内容管理（保存不同章节的内容）
  const chapterHistory = ref<ChapterHistory[]>([])
  
  // 历史内容缓存，确保内容不会丢失
  const cachedTranscription = ref('')
  const cachedTranslation = ref('')
  
  // 获取下一个可用的章节ID
  const getNextChapterId = () => {
    if (chapterHistory.value.length === 0) {
      return 1; // 首个章节从1开始
    }
    
    // 找出当前最大章节ID并加1
    const maxChapterId = Math.max(...chapterHistory.value.map(ch => ch.chapterId));
    return maxChapterId + 1;
  }
  
  // 添加章节历史
  const addChapterHistory = (transcription: string, translation: string, chapterId?: number) => {
    if (!transcription && !translation) {
      console.log('内容为空，不添加到历史记录');
      return;
    }
    
    // 检查是否已存在相同内容的历史记录
    const contentExists = chapterHistory.value.some(ch => 
      ch.transcription === transcription && 
      ch.translation === translation
    );
    
    if (contentExists) {
      console.log('当前内容已存在于历史记录中，不重复添加');
      return;
    }
    
    // 如果未指定章节ID，使用下一个可用ID
    const useChapterId = chapterId ?? getNextChapterId();
    
    // 更新缓存
    cachedTranscription.value = transcription;
    cachedTranslation.value = translation;
    
    // 存入历史记录
    chapterHistory.value.push({
      transcription,
      translation,
      chapterId: useChapterId,
      timestamp: Date.now()
    });
    
    console.log(`已将第 ${useChapterId} 章内容保存到历史记录中`);
    console.log(`历史记录现有 ${chapterHistory.value.length} 个章节`);
    
    // 更新章节标记
    chapterMarkers.lastCompletedAt = Date.now();
    chapterMarkers.chapters = getNextChapterId();
    
    return useChapterId;
  }
  
  // 从历史记录恢复内容
  const restoreFromHistory = () => {
    if (chapterHistory.value.length === 0) {
      console.log('没有可用的历史内容');
      return {
        restoredTranscription: '',
        restoredTranslation: ''
      };
    }
    
    console.log(`尝试从历史记录中恢复内容，共有 ${chapterHistory.value.length} 个历史记录`);
    
    // 按章节ID排序
    const sortedHistory = [...chapterHistory.value].sort((a, b) => a.chapterId - b.chapterId);
    
    // 确保章节ID唯一连续
    let lastChapterId = 0;
    const processedHistory = sortedHistory.map(history => {
      if (history.chapterId <= lastChapterId) {
        // 如果章节ID重复或倒退，纠正为递增值
        history = {...history, chapterId: lastChapterId + 1};
      }
      lastChapterId = history.chapterId;
      return history;
    });
    
    // 组合所有历史内容
    let restoredTranscription = '';
    let restoredTranslation = '';
    
    // 遍历每个历史章节
    for (const history of processedHistory) {
      // 添加内容，中间用换行符分隔，但不添加章节标题
      if (restoredTranscription) {
        restoredTranscription += '\n\n';
      }
      restoredTranscription += history.transcription;
      
      if (restoredTranslation) {
        restoredTranslation += '\n\n';
      }
      restoredTranslation += history.translation;
    }
    
    return {
      restoredTranscription,
      restoredTranslation
    };
  }
  
  // 检查并恢复缓存
  const checkAndRestoreCache = (currentTranscription: string, currentTranslation: string) => {
    let restoredTranscription = currentTranscription;
    let restoredTranslation = currentTranslation;
    let hasRestored = false;
    
    // 只有在当前没有内容时才从缓存恢复
    if (!currentTranscription && cachedTranscription.value) {
      console.log('当前转写内容为空，从缓存恢复');
      restoredTranscription = cachedTranscription.value;
      hasRestored = true;
    } else if (currentTranscription && cachedTranscription.value) {
      // 如果当前有内容，但与缓存不同，可能是缓存包含更完整的历史
      if (cachedTranscription.value.length > currentTranscription.length &&
          !currentTranscription.includes(cachedTranscription.value)) {
        console.log('发现更完整的缓存转写内容，进行合并');
        
        // 保存当前工作内容(如果不包含在缓存中)
        const currentOnlyContent = !cachedTranscription.value.includes(currentTranscription) 
          ? currentTranscription
          : '';
          
        // 恢复缓存内容  
        restoredTranscription = cachedTranscription.value;
        
        // 如果有不在缓存中的当前内容，追加它
        if (currentOnlyContent) {
          if (!restoredTranscription.endsWith('\n\n')) {
            restoredTranscription += '\n\n';  
          }
          restoredTranscription += currentOnlyContent;
        }
        
        hasRestored = true;
      }
    }
    
    // 翻译内容同理
    if (!currentTranslation && cachedTranslation.value) {
      console.log('当前翻译内容为空，从缓存恢复');
      restoredTranslation = cachedTranslation.value;
      hasRestored = true;
    } else if (currentTranslation && cachedTranslation.value) {
      // 如果当前有内容，但与缓存不同，可能是缓存包含更完整的历史
      if (cachedTranslation.value.length > currentTranslation.length &&
          !currentTranslation.includes(cachedTranslation.value)) {
        console.log('发现更完整的缓存翻译内容，进行合并');
        
        // 保存当前工作内容(如果不包含在缓存中)
        const currentOnlyContent = !cachedTranslation.value.includes(currentTranslation) 
          ? currentTranslation
          : '';
          
        // 恢复缓存内容  
        restoredTranslation = cachedTranslation.value;
        
        // 如果有不在缓存中的当前内容，追加它
        if (currentOnlyContent) {
          if (!restoredTranslation.endsWith('\n\n')) {
            restoredTranslation += '\n\n';  
          }
          restoredTranslation += currentOnlyContent;
        }
        
        hasRestored = true;
      }
    }
    
    return {
      restoredTranscription,
      restoredTranslation,
      hasRestored
    };
  }
  
  // 追加章节标记
  const appendChapterMarker = (transcription: string, translation: string) => {
    const nextChapterId = getNextChapterId();
    let updatedTranscription = transcription;
    let updatedTranslation = translation;
    
    // 添加分隔符但不添加章节标题
    if (updatedTranscription) {
      // 确保有足够的空行
      if (!updatedTranscription.endsWith('\n\n')) {
        updatedTranscription += '\n\n';
      }
    }
    
    // 翻译部分添加分隔符但不添加章节标题
    if (updatedTranslation) {
      // 确保有足够的空行
      if (!updatedTranslation.endsWith('\n\n')) {
        updatedTranslation += '\n\n';
      }
    }
    
    return {
      updatedTranscription,
      updatedTranslation,
      chapterId: nextChapterId
    };
  }
  
  // 清空历史记录
  const clearHistory = () => {
    chapterHistory.value = [];
    cachedTranscription.value = '';
    cachedTranslation.value = '';
    chapterMarkers.lastCompletedAt = 0;
    chapterMarkers.chapters = 0;
    
    console.log('已清空章节历史记录和缓存');
  }
  
  return {
    chapterMarkers,
    chapterHistory,
    cachedTranscription,
    cachedTranslation,
    getNextChapterId,
    addChapterHistory,
    restoreFromHistory,
    checkAndRestoreCache,
    appendChapterMarker,
    clearHistory
  }
} 