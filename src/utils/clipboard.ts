/**
 * 将文本复制到剪贴板
 * @param text 要复制的文本
 * @returns Promise，成功时解析为true，失败时拒绝
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 现代浏览器API
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 回退方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('复制操作失败');
      }
      
      return true;
    }
  } catch (err) {
    console.error('复制失败:', err);
    throw err;
  }
}

export default {
  copyText
}; 