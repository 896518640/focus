<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showSuccessToast, showFailToast } from 'vant';

const router = useRouter();

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

// 拖放状态
const isDragOver = ref(false);
const isAnimating = ref(false);

// 最近上传列表
const recentUploads = ref([
  {
    id: 1,
    title: '经济学原理.mp3',
    info: '10.8MB • 45分钟 • 3月22日上传',
    icon: 'fa-file-audio',
    color: 'var(--secondary-color, #5AC8FA)'
  },
  {
    id: 2,
    title: '市场营销讲座.wav',
    info: '15.2MB • 30分钟 • 3月20日上传',
    icon: 'fa-file-audio',
    color: 'var(--secondary-color, #5AC8FA)'
  },
  {
    id: 3,
    title: '国际贸易.m4a',
    info: '8.5MB • 25分钟 • 3月18日上传',
    icon: 'fa-file-audio',
    color: 'var(--secondary-color, #5AC8FA)'
  }
]);

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取文件类型图标和颜色
const getFileTypeInfo = (filename: string) => {
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
const isValidAudioFile = (filename: string): boolean => {
  const validExtensions = ['mp3', 'wav', 'm4a', 'aac', 'flac'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return validExtensions.includes(ext);
};

// 模拟上传进度
const simulateUpload = (name = '未命名文件.mp3', size = 0) => {
  // 验证文件类型
  if (!isValidAudioFile(name)) {
    showFailToast({
      message: '不支持的文件格式',
      position: 'top'
    });
    
    // 添加触觉反馈 - 错误模式
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
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
  if ('vibrate' in navigator) {
    navigator.vibrate(15);
  }
  
  const interval = setInterval(() => {
    if (uploadProgress.value < 100) {
      // 计算上传速度和剩余时间
      const elapsedTime = (Date.now() - uploadStartTime.value) / 1000;
      const progressRate = uploadProgress.value / 100;
      const totalEstimatedTime = elapsedTime / progressRate;
      const remainingTime = totalEstimatedTime - elapsedTime;
      
      if (remainingTime > 0) {
        uploadEstimatedTime.value = remainingTime > 60 
          ? `约${Math.ceil(remainingTime / 60)}分钟` 
          : `约${Math.ceil(remainingTime)}秒`;
      }
      
      // 非线性进度，模拟真实上传
      const increment = Math.max(0.5, Math.random() * 3 * (1 - uploadProgress.value / 100));
      uploadProgress.value = Math.min(99, uploadProgress.value + increment);
      
      // 更新当前上传大小
      const current = Math.round(total * (uploadProgress.value / 100));
      fileSize.value = `${formatFileSize(current)} / ${formatFileSize(total)}`;
      
      // 在特定进度点添加触觉反馈
      if (Math.floor(uploadProgress.value) % 25 === 0) {
        if ('vibrate' in navigator) {
          navigator.vibrate(5);
        }
      }
    } else {
      clearInterval(interval);
      
      // 延迟显示完成状态
      setTimeout(() => {
        uploadProgress.value = 100;
        
        // 更新最终文件大小
        fileSize.value = `${totalSize.value} / ${totalSize.value}`;
        
        // 延迟显示完成动画
        setTimeout(() => {
          uploading.value = false;
          uploadComplete.value = true;
          
          // 添加触觉反馈 - 完成模式
          if ('vibrate' in navigator) {
            navigator.vibrate([10, 30, 10]);
          }
          
          showSuccessToast({
            message: '上传成功',
            position: 'top'
          });
        }, 500);
      }, 300);
    }
  }, 100);
};

// 文件上传处理
const handleFileUpload = (event: Event) => {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    simulateUpload(file.name, file.size);
    
    // 添加触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  } else {
    simulateUpload();
  }
};

// 选择文件
const selectFile = () => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
    
    // 添加触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }
};

// 开始录音
const recordNow = () => {
  // 动画效果
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);
  
  showToast({
    message: '录音功能即将上线',
    position: 'top'
  });
  
  // 添加触觉反馈 - 录音模式
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 20, 10]);
  }
};

// 重置上传状态
const resetUpload = () => {
  uploading.value = false;
  uploadProgress.value = 0;
  uploadComplete.value = false;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  
  // 动画效果
  nextTick(() => {
    const dropArea = document.getElementById('drop-area');
    if (dropArea) {
      dropArea.classList.add('reset-animation');
      setTimeout(() => {
        dropArea.classList.remove('reset-animation');
      }, 500);
    }
  });
};

// 查看结果
const viewResult = () => {
  // 添加到最近上传
  addToRecentUploads();
  
  // 动画效果
  isAnimating.value = true;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
  
  // 延迟跳转，让动画有时间完成
  setTimeout(() => {
    // 跳转到历史记录
    router.push('/history');
  }, 300);
};

// 添加到最近上传
const addToRecentUploads = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // 获取文件类型信息
  const { icon, color } = getFileTypeInfo(fileName.value);
  
  recentUploads.value.unshift({
    id: Date.now(),
    title: fileName.value,
    info: `${totalSize.value} • 刚刚上传`,
    icon,
    color
  });
  
  // 保持列表最多显示5项
  if (recentUploads.value.length > 5) {
    recentUploads.value = recentUploads.value.slice(0, 5);
  }
};

// 查看全部历史
const viewAllHistory = () => {
  // 动画效果
  isAnimating.value = true;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  
  // 延迟跳转，让动画有时间完成
  setTimeout(() => {
    router.push('/history');
  }, 300);
};

// 拖放事件处理
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  
  if (event.dataTransfer && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    simulateUpload(file.name, file.size);
    
    // 添加触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate([5, 10, 5]);
    }
  }
};

// 文件操作菜单
const showFileActions = (id: number) => {
  showToast({
    message: '文件操作菜单即将上线',
    position: 'bottom'
  });
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

// 取消上传
const cancelUpload = () => {
  uploading.value = false;
  uploadProgress.value = 0;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 5, 10]);
  }
  
  showToast({
    message: '已取消上传',
    position: 'top'
  });
};

// 页面加载时设置拖放事件
onMounted(() => {
  const dropArea = document.getElementById('drop-area');
  if (dropArea) {
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    dropArea.addEventListener('click', selectFile);
  }
});
</script>

<template>
  <div class="upload-page" :class="{ 'animating': isAnimating }">
    <!-- 顶部标题栏 -->
    <div class="header">
      <div class="header-title">录音上传</div>
      <button class="header-button">
        <i class="fas fa-ellipsis-h"></i>
      </button>
    </div>
    
    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 上传区域 -->
      <div class="upload-container">
        <div v-if="!uploading && !uploadComplete" class="upload-area" id="drop-area" :class="{ 'dragover': isDragOver }">
          <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <div class="upload-title">上传您的录音文件</div>
          <div class="upload-description">拖放文件到此处，或点击选择文件</div>
          <div class="file-types">支持的格式: MP3, WAV, M4A, AAC, FLAC</div>
        </div>
        
        <div v-if="!uploading && !uploadComplete" class="upload-buttons">
          <button class="upload-btn" @click="selectFile" :class="{ 'btn-pressed': isAnimating }">
            <i class="fas fa-folder-open"></i>
            选择文件
          </button>
          <button class="record-btn" @click="recordNow" :class="{ 'btn-pressed': isAnimating }">
            <i class="fas fa-microphone"></i>
            现在录音
          </button>
          <input type="file" id="file-input" accept="audio/*" class="file-input" @change="handleFileUpload">
        </div>
        
        <!-- 上传进度 -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-header">
            <div class="progress-title">上传中</div>
            <button class="file-action-btn" @click="cancelUpload">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="progress-item">
            <div class="progress-icon">
              <i class="fas fa-file-audio"></i>
            </div>
            <div class="progress-content">
              <div class="progress-info">
                <div class="progress-file">{{ fileName }}</div>
                <div class="progress-type">{{ fileType }}</div>
              </div>
              <div class="progress-details">
                <div class="progress-status">{{ fileSize }}</div>
                <div class="progress-time" v-if="uploadEstimatedTime">剩余时间: {{ uploadEstimatedTime }}</div>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 上传完成 -->
        <div v-if="uploadComplete" class="upload-complete">
          <div class="complete-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="complete-title">上传成功</div>
          <div class="complete-description">文件已上传，正在处理中</div>
          <div class="button-group">
            <button class="primary-button" @click="resetUpload">
              继续上传
            </button>
            <button class="secondary-button" @click="viewResult">
              查看结果
            </button>
          </div>
        </div>
      </div>
      
      <!-- 最近上传 -->
      <div class="recent-section">
        <div class="section-header">
          <div class="section-title">最近上传</div>
          <div class="section-more" @click="viewAllHistory">查看全部</div>
        </div>
        
        <transition-group name="file-list" tag="div" class="file-list">
          <div v-for="item in recentUploads" :key="item.id" class="file-item">
            <div class="file-icon" :style="{ backgroundColor: item.color }">
              <i :class="['fas', item.icon]"></i>
            </div>
            <div class="file-content">
              <div class="file-title">{{ item.title }}</div>
              <div class="file-info">{{ item.info }}</div>
            </div>
            <div class="file-actions">
              <button class="file-action-btn" @click="showFileActions(item.id)">
                <i class="fas fa-ellipsis-v"></i>
              </button>
            </div>
          </div>
        </transition-group>
      </div>
      
      <!-- 使用提示 -->
      <div class="upload-tips">
        <div class="tips-title">
          <i class="fas fa-lightbulb"></i> 使用提示
        </div>
        <div class="tips-content">
          <ul>
            <li>上传的音频文件将被转换为文本</li>
            <li>转换后的文本可以进行翻译和摘要生成</li>
            <li>支持批量上传多个文件</li>
            <li>处理时间取决于文件大小和长度</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.upload-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background-color, #F2F2F7);
  overflow-x: hidden;
  transition: transform 0.3s ease;
}

.upload-page.animating {
  transform: scale(0.98);
}

/* 顶部标题栏 */
.header {
  background-color: var(--background-light, #FFFFFF);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color, #D1D1D6);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  flex: 1;
  text-align: center;
}

.header-button {
  color: var(--primary-color, #007AFF);
  background: none;
  border: none;
  font-size: 18px;
  padding: 5px;
  width: 40px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.header-button:active {
  transform: scale(0.9);
  opacity: 0.7;
}

/* 主要内容区 */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

/* 上传区域 */
.upload-container {
  background-color: var(--background-light, #FFFFFF);
  border-radius: var(--border-radius-md, 14px);
  padding: 25px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: var(--box-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
  animation: fadeIn 0.5s ease;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.upload-container:active {
  transform: scale(0.99);
  box-shadow: var(--box-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.05));
}

.upload-area {
  border: 2px dashed var(--border-color, #D1D1D6);
  border-radius: 12px;
  padding: 30px 20px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  position: relative;
  overflow: hidden;
}

.upload-area:hover, .upload-area.dragover {
  border-color: var(--primary-color, #007AFF);
  background-color: rgba(0, 122, 255, 0.05);
  transform: scale(1.02);
}

.upload-area:active {
  transform: scale(0.98);
}

.upload-area.reset-animation {
  animation: resetBounce 0.5s ease;
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(0, 122, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 0;
}

.upload-area.dragover::before {
  opacity: 1;
  animation: pulsate 2s infinite;
}

.upload-icon {
  font-size: 48px;
  color: var(--primary-color, #007AFF);
  margin-bottom: 15px;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.upload-area:hover .upload-icon, .upload-area.dragover .upload-icon {
  transform: translateY(-5px);
  animation: floatIcon 3s ease infinite;
}

.upload-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-primary, #000000);
  position: relative;
  z-index: 1;
}

.upload-description {
  font-size: 15px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.file-types {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
  position: relative;
  z-index: 1;
}

.upload-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}

.upload-btn {
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.upload-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.upload-btn:hover::after {
  transform: translateX(100%);
}

.upload-btn i {
  margin-right: 8px;
}

.upload-btn:active, .upload-btn.btn-pressed {
  transform: scale(0.95);
  opacity: 0.9;
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.2);
}

.record-btn {
  background-color: var(--accent-color, #FF2D55);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 45, 85, 0.3);
  position: relative;
  overflow: hidden;
}

.record-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.record-btn:hover::after {
  transform: translateX(100%);
}

.record-btn i {
  margin-right: 8px;
}

.record-btn:active, .record-btn.btn-pressed {
  transform: scale(0.95);
  opacity: 0.9;
  box-shadow: 0 1px 4px rgba(255, 45, 85, 0.2);
}

.file-input {
  display: none;
}

/* 上传进度 */
.upload-progress {
  width: 100%;
  animation: slideIn 0.3s ease;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.file-action-btn {
  color: var(--text-secondary, #8E8E93);
  background: none;
  border: none;
  font-size: 16px;
  padding: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
}

.file-action-btn:active {
  transform: scale(0.9);
  opacity: 0.7;
  background-color: rgba(142, 142, 147, 0.1);
}

.progress-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  animation: fadeInUp 0.5s ease;
}

.progress-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 18px;
  color: white;
  background-color: var(--primary-color, #007AFF);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.progress-icon:hover {
  transform: scale(1.05) rotate(5deg);
}

.progress-content {
  flex: 1;
}

.progress-info {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.progress-file {
  font-size: 16px;
  margin-right: 10px;
  color: var(--text-primary, #000000);
  font-weight: 500;
}

.progress-type {
  font-size: 12px;
  color: var(--text-secondary, #8E8E93);
  background-color: var(--background-color, #F2F2F7);
  padding: 2px 6px;
  border-radius: 4px;
}

.progress-details {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.progress-status {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
  margin-right: 10px;
}

.progress-time {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
  background-color: var(--background-color, #F2F2F7);
  padding: 2px 6px;
  border-radius: 4px;
  animation: fadeIn 0.5s ease;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: var(--background-color, #F2F2F7);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background-color: var(--primary-color, #007AFF);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: shimmer 2s infinite;
}

/* 上传完成 */
.upload-complete {
  width: 100%;
  animation: bounceIn 0.5s ease;
}

.complete-icon {
  font-size: 60px;
  color: var(--success-color, #4CD964);
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

.complete-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-primary, #000000);
}

.complete-description {
  font-size: 16px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  gap: 10px;
}

.primary-button {
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.primary-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.primary-button:hover::after {
  transform: translateX(100%);
}

.primary-button:active {
  transform: scale(0.98);
  opacity: 0.9;
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.2);
}

.secondary-button {
  background-color: var(--background-light, #FFFFFF);
  color: var(--primary-color, #007AFF);
  border: 1px solid var(--primary-color, #007AFF);
  border-radius: 20px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-button:active {
  transform: scale(0.98);
  opacity: 0.9;
  background-color: rgba(0, 122, 255, 0.05);
}

/* 最近上传 */
.recent-section {
  background-color: var(--background-light, #FFFFFF);
  border-radius: var(--border-radius-md, 14px);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--box-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
  animation: fadeIn 0.5s ease 0.2s backwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.recent-section:active {
  transform: scale(0.99);
  box-shadow: var(--box-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.05));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #000000);
}

.section-more {
  color: var(--primary-color, #007AFF);
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  padding: 5px 10px;
  border-radius: 15px;
}

.section-more:active {
  opacity: 0.7;
  background-color: rgba(0, 122, 255, 0.1);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 10px;
  background-color: var(--background-color, #F2F2F7);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.file-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.file-item:hover::after {
  transform: translateX(100%);
}

.file-item:active {
  transform: scale(0.98);
  background-color: var(--background-dark, #E5E5EA);
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 18px;
  color: white;
  background-color: var(--secondary-color, #5AC8FA);
  box-shadow: 0 2px 6px rgba(90, 200, 250, 0.2);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.file-icon:hover {
  transform: scale(1.05) rotate(5deg);
}

.file-content {
  flex: 1;
  min-width: 0;
}

.file-title {
  font-size: 16px;
  margin-bottom: 5px;
  color: var(--text-primary, #000000);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-info {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
}

/* 使用提示 */
.upload-tips {
  background-color: var(--background-light, #FFFFFF);
  border-radius: var(--border-radius-md, 14px);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--box-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
  animation: fadeIn 0.5s ease 0.4s backwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.upload-tips:active {
  transform: scale(0.99);
  box-shadow: var(--box-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.05));
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--primary-color, #007AFF);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips-content {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
}

.tips-content ul {
  padding-left: 20px;
}

.tips-content li {
  margin-bottom: 8px;
  position: relative;
}

.tips-content li::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--primary-color, #007AFF);
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulsate {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}

@keyframes floatIcon {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes resetBounce {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

/* 过渡动画 */
.file-list-enter-active,
.file-list-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}

.file-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.file-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.file-list-move {
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
</style>
