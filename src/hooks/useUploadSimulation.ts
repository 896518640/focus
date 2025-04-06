/**
 * 上传模拟钩子函数
 * 管理文件上传模拟的状态和进度
 */
import { ref } from 'vue';
import { showToast, showSuccessToast, showFailToast } from 'vant';
import { formatFileSize, getFileTypeInfo, isValidAudioFile, vibrate } from '@/utils/fileUtils';

export default function useUploadSimulation() {
  // 上传状态
  const uploading = ref(false);
  const uploadProgress = ref(0);
  const uploadComplete = ref(false);
  const fileName = ref('');
  const fileSize = ref('');
  const totalSize = ref('');
  const fileType = ref('');
  const uploadStartTime = ref(0);
  const uploadEstimatedTime = ref('');
  const uploadedFile = ref<File | null>(null);

  // 优化后的模拟上传进度 - 更短的时间
  const simulateUpload = (name = '未命名文件.mp3', size = 0) => {
    // 验证文件类型
    if (!isValidAudioFile(name)) {
      showFailToast({
        message: '不支持的文件格式',
        position: 'top'
      });

      // 添加触觉反馈 - 错误模式
      vibrate([30, 50, 30]);
      return;
    }

    fileName.value = name;
    uploading.value = true;
    uploadProgress.value = 0;
    uploadComplete.value = false;
    uploadStartTime.value = Date.now();

    // 获取文件类型信息
    const { ext } = getFileTypeInfo(name);
    fileType.value = ext.toUpperCase();

    // 生成随机文件大小或使用实际大小
    const total = size > 0 ? size : Math.round(Math.random() * 10 + 5) * 1024 * 1024;
    totalSize.value = formatFileSize(total);

    // 添加触觉反馈 - 开始上传
    vibrate(15);

    console.log('开始上传:', name, totalSize.value);

    // 优化：更快地完成上传模拟
    // 根据文件大小动态调整上传时间，但最长不超过3秒
    const baseTime = Math.min(size > 0 ? size / (5 * 1024 * 1024) : 1, 3);
    const simulationTime = baseTime * 1000; // 最长3秒
    
    // 更新进度的间隔时间
    const updateInterval = 50; // 50ms更新一次
    const steps = simulationTime / updateInterval;
    let currentStep = 0;
    
    // 初始短暂延迟，给用户视觉反馈
    setTimeout(() => {
      const interval = setInterval(() => {
        currentStep++;
        
        // 使用非线性曲线使进度看起来更自然
        // 开始快，中间平稳，接近结束时变慢
        const progressPercentage = currentStep / steps;
        const adjustedProgress = Math.pow(progressPercentage, 0.7) * 100;
        
        uploadProgress.value = Math.min(99, adjustedProgress);
        
        // 更新文件大小显示
        const current = Math.round(total * (uploadProgress.value / 100));
        fileSize.value = `${formatFileSize(current)} / ${formatFileSize(total)}`;
        
        // 更新剩余时间
        const elapsed = (Date.now() - uploadStartTime.value) / 1000;
        const estimated = elapsed / (uploadProgress.value / 100);
        const remaining = Math.max(0, estimated - elapsed);
        
        if (remaining > 0) {
          uploadEstimatedTime.value = remaining > 60
            ? `约${Math.ceil(remaining / 60)}分钟`
            : `约${Math.ceil(remaining)}秒`;
        }
        
        // 完成上传
        if (currentStep >= steps) {
          uploadProgress.value = 100;
          clearInterval(interval);
          
          // 更新最终文件大小
          fileSize.value = `${totalSize.value} / ${totalSize.value}`;
          
          // 非常短的处理时间后完成上传
          setTimeout(() => {
            completeUpload();
          }, 300);
        }
      }, updateInterval);
    }, 200);
  };

  // 完成上传
  const completeUpload = () => {
    uploading.value = false;
    uploadComplete.value = true;

    // 添加触觉反馈 - 完成模式
    vibrate([10, 30, 10]);

    showSuccessToast({
      message: '上传成功',
      position: 'top'
    });
  };

  // 取消上传
  const cancelUpload = () => {
    uploading.value = false;
    uploadProgress.value = 0;
    
    // 添加触觉反馈
    vibrate([10, 5, 10]);

    showToast({
      message: '已取消上传',
      position: 'top'
    });
  };

  // 重置上传状态
  const resetUpload = () => {
    uploading.value = false;
    uploadProgress.value = 0;
    uploadComplete.value = false;
    uploadedFile.value = null;

    // 添加触觉反馈
    vibrate(5);
  };

  return {
    // 状态
    uploading,
    uploadProgress,
    uploadComplete,
    fileName,
    fileSize,
    totalSize, 
    fileType,
    uploadEstimatedTime,
    uploadedFile,
    
    // 方法
    simulateUpload,
    completeUpload,
    cancelUpload,
    resetUpload
  };
}
