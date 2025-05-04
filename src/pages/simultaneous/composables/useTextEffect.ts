import { ref, watch } from 'vue';
import type { Ref } from 'vue';

interface UseTextEffectOptions {
  sourceText: Ref<string>;
  translatedText: Ref<string>;
  speed?: number; // 打字速度（毫秒/字符）
  minSpeed?: number; // 最小打字速度
  maxSpeed?: number; // 最大打字速度
  characterVariation?: boolean; // 是否启用字符变化的随机速度
}

export function useTextEffect(options: UseTextEffectOptions) {
  const { 
    sourceText, 
    translatedText, 
    speed = 15,
    minSpeed = 10,
    maxSpeed = 25,
    characterVariation = true
  } = options;
  
  // 显示的文本（带有打字机效果）
  const displayedSource = ref('');
  const displayedTranslation = ref('');
  
  // 当前正在动画的文本
  let currentTypingSource = '';
  let currentTypingTranslation = '';
  
  // 动画相关变量
  let sourceTypingIndex = 0;
  let translationTypingIndex = 0;
  let sourceTypingTimer: number | null = null;
  let translationTypingTimer: number | null = null;
  
  // 生成随机打字速度
  const getRandomSpeed = () => {
    if (!characterVariation) return speed;
    return Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed;
  };
  
  // 中文字符需要额外考虑
  const isChineseChar = (char: string) => {
    const code = char.charCodeAt(0);
    return code >= 0x4E00 && code <= 0x9FFF;
  };
  
  // 根据字符类型调整速度
  const getCharacterSpeed = (char: string) => {
    if (!characterVariation) return speed;
    
    // 中文字符稍慢一些
    if (isChineseChar(char)) {
      return getRandomSpeed() * 1.5;
    }
    
    // 标点符号快一些
    if (/[,.!?;:\s]/.test(char)) {
      return getRandomSpeed() * 0.5;
    }
    
    return getRandomSpeed();
  };
  
  // 监听源文本变化
  watch(sourceText, (newText, oldText) => {
    if (!newText) {
      displayedSource.value = '';
      currentTypingSource = '';
      return;
    }
    
    // 如果完全是新文本，重置动画
    if (!oldText) {
      stopSourceTyping();
      typeSourceText(newText, 0);
      currentTypingSource = newText;
      return;
    }
    
    // 找出公共前缀
    let commonPrefixLength = 0;
    const minLength = Math.min(newText.length, oldText.length);
    
    while (commonPrefixLength < minLength && 
           newText[commonPrefixLength] === oldText[commonPrefixLength]) {
      commonPrefixLength++;
    }
    
    // 如果新文本更短，则直接更新（可能是删除了一部分）
    if (newText.length < oldText.length) {
      displayedSource.value = newText;
      currentTypingSource = newText;
      return;
    }
    
    // 只对新增部分应用打字效果
    if (commonPrefixLength > 0 && commonPrefixLength < newText.length) {
      const additionalText = newText.slice(commonPrefixLength);
      // 保留已显示部分，对新部分进行打字效果
      stopSourceTyping();
      displayedSource.value = newText.slice(0, commonPrefixLength);
      typeSourceText(additionalText, commonPrefixLength);
      currentTypingSource = newText;
    } else if (newText !== currentTypingSource) {
      // 完全不同的文本，从头开始动画
      stopSourceTyping();
      typeSourceText(newText, 0);
      currentTypingSource = newText;
    }
  });
  
  // 监听翻译文本变化
  watch(translatedText, (newText, oldText) => {
    if (!newText) {
      displayedTranslation.value = '';
      currentTypingTranslation = '';
      return;
    }
    
    // 如果完全是新文本，重置动画
    if (!oldText) {
      stopTranslationTyping();
      typeTranslationText(newText, 0);
      currentTypingTranslation = newText;
      return;
    }
    
    // 找出公共前缀
    let commonPrefixLength = 0;
    const minLength = Math.min(newText.length, oldText.length);
    
    while (commonPrefixLength < minLength && 
           newText[commonPrefixLength] === oldText[commonPrefixLength]) {
      commonPrefixLength++;
    }
    
    // 如果新文本更短，则直接更新（可能是删除了一部分）
    if (newText.length < oldText.length) {
      displayedTranslation.value = newText;
      currentTypingTranslation = newText;
      return;
    }
    
    // 只对新增部分应用打字效果
    if (commonPrefixLength > 0 && commonPrefixLength < newText.length) {
      const additionalText = newText.slice(commonPrefixLength);
      // 保留已显示部分，对新部分进行打字效果
      stopTranslationTyping();
      displayedTranslation.value = newText.slice(0, commonPrefixLength);
      typeTranslationText(additionalText, commonPrefixLength);
      currentTypingTranslation = newText;
    } else if (newText !== currentTypingTranslation) {
      // 完全不同的文本，从头开始动画
      stopTranslationTyping();
      typeTranslationText(newText, 0);
      currentTypingTranslation = newText;
    }
  });
  
  // 源文本打字效果
  function typeSourceText(text: string, startIndex: number) {
    stopSourceTyping();
    
    sourceTypingIndex = 0;
    
    function typeNextCharSource() {
      if (sourceTypingIndex < text.length) {
        // 保留已有内容，仅添加新字符
        displayedSource.value = displayedSource.value + text[sourceTypingIndex];
        sourceTypingIndex++;
        
        // 使用基于字符的动态速度
        const nextChar = sourceTypingIndex < text.length ? text[sourceTypingIndex] : '';
        const typingSpeed = getCharacterSpeed(nextChar);
        
        sourceTypingTimer = window.setTimeout(typeNextCharSource, typingSpeed);
      }
    }
    
    typeNextCharSource();
  }
  
  // 翻译文本打字效果
  function typeTranslationText(text: string, startIndex: number) {
    stopTranslationTyping();
    
    translationTypingIndex = 0;
    
    function typeNextCharTranslation() {
      if (translationTypingIndex < text.length) {
        // 保留已有内容，仅添加新字符
        displayedTranslation.value = displayedTranslation.value + text[translationTypingIndex];
        translationTypingIndex++;
        
        // 使用基于字符的动态速度
        const nextChar = translationTypingIndex < text.length ? text[translationTypingIndex] : '';
        const typingSpeed = getCharacterSpeed(nextChar);
        
        translationTypingTimer = window.setTimeout(typeNextCharTranslation, typingSpeed);
      }
    }
    
    typeNextCharTranslation();
  }
  
  // 停止源文本打字效果
  function stopSourceTyping() {
    if (sourceTypingTimer) {
      clearTimeout(sourceTypingTimer);
      sourceTypingTimer = null;
    }
  }
  
  // 停止翻译文本打字效果
  function stopTranslationTyping() {
    if (translationTypingTimer) {
      clearTimeout(translationTypingTimer);
      translationTypingTimer = null;
    }
  }
  
  // 立即显示完整文本（用于紧急情况或用户手动跳过动画）
  function showFullText() {
    stopSourceTyping();
    stopTranslationTyping();
    displayedSource.value = sourceText.value;
    displayedTranslation.value = translatedText.value;
  }
  
  // 清理函数
  function cleanup() {
    stopSourceTyping();
    stopTranslationTyping();
  }
  
  return {
    displayedSource,
    displayedTranslation,
    showFullText,
    cleanup
  };
} 