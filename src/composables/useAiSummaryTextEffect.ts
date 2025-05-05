import { ref, watch } from 'vue';
import type { Ref } from 'vue';

interface UseAiSummaryTextEffectOptions {
  summaryText: Ref<string>;
  speed?: number; // 打字速度（毫秒/字符）
  minSpeed?: number; // 最小打字速度
  maxSpeed?: number; // 最大打字速度
  characterVariation?: boolean; // 是否启用字符变化的随机速度
}

export function useAiSummaryTextEffect(options: UseAiSummaryTextEffectOptions) {
  const { 
    summaryText, 
    speed = 15,
    minSpeed = 10,
    maxSpeed = 25,
    characterVariation = true
  } = options;
  
  // 显示的文本（带有打字机效果）
  const displayedSummary = ref('');
  
  // 当前正在动画的文本
  let currentTypingSummary = '';
  
  // 动画相关变量
  let summaryTypingIndex = 0;
  let summaryTypingTimer: number | null = null;
  
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
    if (/[，。！？、；：""''（）【】《》…—,.!?;:()\[\]{}]/.test(char)) {
      return getRandomSpeed() * 0.5;
    }
    
    return getRandomSpeed();
  };
  
  // 监听总结文本变化
  watch(summaryText, (newText, oldText) => {
    if (!newText) {
      displayedSummary.value = '';
      currentTypingSummary = '';
      return;
    }
    
    // 如果完全是新文本，重置动画
    if (!oldText || oldText === '') {
      stopSummaryTyping();
      typeSummaryText(newText, 0);
      currentTypingSummary = newText;
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
      displayedSummary.value = newText;
      currentTypingSummary = newText;
      return;
    }
    
    // 只对新增部分应用打字效果
    if (commonPrefixLength > 0 && commonPrefixLength < newText.length) {
      const additionalText = newText.slice(commonPrefixLength);
      // 保留已显示部分，对新部分进行打字效果
      stopSummaryTyping();
      displayedSummary.value = newText.slice(0, commonPrefixLength);
      typeSummaryText(additionalText, commonPrefixLength);
      currentTypingSummary = newText;
    } else if (newText !== currentTypingSummary) {
      // 完全不同的文本，从头开始动画
      stopSummaryTyping();
      typeSummaryText(newText, 0);
      currentTypingSummary = newText;
    }
  });
  
  // 总结文本打字效果
  function typeSummaryText(text: string, startIndex: number) {
    stopSummaryTyping();
    
    summaryTypingIndex = 0;
    
    function typeNextChar() {
      if (summaryTypingIndex < text.length) {
        // 保留已有内容，仅添加新字符
        displayedSummary.value = displayedSummary.value + text[summaryTypingIndex];
        summaryTypingIndex++;
        
        // 使用基于字符的动态速度
        const nextChar = summaryTypingIndex < text.length ? text[summaryTypingIndex] : '';
        const typingSpeed = getCharacterSpeed(nextChar);
        
        summaryTypingTimer = window.setTimeout(typeNextChar, typingSpeed);
      }
    }
    
    typeNextChar();
  }
  
  // 停止打字效果
  function stopSummaryTyping() {
    if (summaryTypingTimer) {
      clearTimeout(summaryTypingTimer);
      summaryTypingTimer = null;
    }
  }
  
  // 立即显示完整文本（用于紧急情况或用户手动跳过动画）
  function showFullText() {
    stopSummaryTyping();
    displayedSummary.value = summaryText.value;
  }
  
  // 清理函数
  function cleanup() {
    stopSummaryTyping();
  }
  
  return {
    displayedSummary,
    showFullText,
    cleanup
  };
} 