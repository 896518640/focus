/**
 * 分享和复制功能钩子
 */
import { showToast } from 'vant';
import { vibrate } from '@/utils/fileUtils';

export default function useShareAndCopy() {
  // 复制转录文本
  const copyText = (text: string) => {
    if (!text) return;
    
    // 使用剪贴板API复制文本
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast({
          message: '文本已复制到剪贴板',
          position: 'bottom'
        });

        // 添加触觉反馈
        vibrate(5);
      })
      .catch(err => {
        console.error('复制失败:', err);
        showToast({
          message: '复制失败',
          position: 'bottom'
        });
      });
  };

  // 分享转录文本
  const shareText = (text: string, title = '转录结果') => {
    if (!text) return;
    
    // 判断是否支持Web Share API
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text
      })
      .then(() => {
        console.log('分享成功');
        vibrate(5);
      })
      .catch(err => {
        console.error('分享失败:', err);
        showToast({
          message: '分享失败',
          position: 'bottom'
        });
      });
    } else {
      // 如果不支持Web Share API，则复制到剪贴板
      copyText(text);
      showToast({
        message: '已复制到剪贴板，请手动分享',
        position: 'bottom'
      });
    }
  };

  return {
    copyText,
    shareText
  };
}
