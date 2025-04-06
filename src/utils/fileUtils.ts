/**
 * 文件处理相关工具函数
 */

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取文件类型图标和颜色
export const getFileTypeInfo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  let icon = 'fa-file-audio';
  let color = 'var(--secondary-color, #5AC8FA)';

  switch (ext) {
    case 'mp3':
      icon = 'fa-file-audio';
      color = 'var(--secondary-color, #5AC8FA)';
      break;
    case 'wav':
      icon = 'fa-file-audio';
      color = 'var(--accent-color, #FF2D55)';
      break;
    case 'm4a':
    case 'aac':
      icon = 'fa-file-audio';
      color = 'var(--success-color, #4CD964)';
      break;
    case 'flac':
      icon = 'fa-file-audio';
      color = 'var(--warning-color, #FF9500)';
      break;
    default:
      icon = 'fa-file';
      color = 'var(--text-secondary, #8E8E93)';
  }

  return { icon, color, ext };
};

// 验证文件类型
export const isValidAudioFile = (filename: string): boolean => {
  const validExtensions = ['mp3', 'wav', 'm4a', 'aac', 'flac'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return validExtensions.includes(ext);
};

// 添加触觉反馈
export const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};
