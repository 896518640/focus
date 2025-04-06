<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 定义组件的Props
defineProps<{
  isAnimating: boolean;
}>();

// 定义组件对外暴露的事件
const emit = defineEmits(['select-file', 'record-now', 'drag-over', 'drag-leave', 'drop-file']);

// 拖放状态
const isDragOver = ref(false);

// 选择文件处理函数
const selectFile = () => {
  emit('select-file');
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

// 开始录音
const recordNow = () => {
  emit('record-now');
  
  // 添加触觉反馈 - 录音模式
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 20, 10]);
  }
};

// 拖放事件处理
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
  emit('drag-over');
};

const handleDragLeave = () => {
  isDragOver.value = false;
  emit('drag-leave');
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  
  if (event.dataTransfer && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    emit('drop-file', file);
    
    // 添加触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate([5, 10, 5]);
    }
  }
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

// 页面卸载时清理资源
onUnmounted(() => {
  const dropArea = document.getElementById('drop-area');
  if (dropArea) {
    dropArea.removeEventListener('dragover', handleDragOver);
    dropArea.removeEventListener('dragleave', handleDragLeave);
    dropArea.removeEventListener('drop', handleDrop);
    dropArea.removeEventListener('click', selectFile);
  }
});
</script>

<template>
  <div>
    <div class="upload-area" id="drop-area" :class="{ 'dragover': isDragOver, 'btn-pressed': isAnimating }">
      <div class="upload-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </div>
      <div class="upload-title">上传您的录音文件</div>
      <div class="upload-description">拖放文件到此处，或点击选择文件</div>
      <div class="file-types">支持的格式: MP3, WAV, M4A, AAC, FLAC</div>
    </div>

    <div class="upload-buttons">
      <button class="upload-btn" @click="selectFile" :class="{ 'btn-pressed': isAnimating }">
        <i class="fas fa-folder-open"></i>
        选择文件
      </button>
      <button class="record-btn" @click="recordNow" :class="{ 'btn-pressed': isAnimating }">
        <i class="fas fa-microphone"></i>
        现在录音
      </button>
      <input type="file" id="file-input" accept="audio/*" class="file-input" @change="$emit('file-selected', $event)">
    </div>
  </div>
</template>

<style scoped>
.upload-area {
  border: 2px dashed var(--border-color, #D1D1D6);
  border-radius: 12px;
  padding: 30px 20px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  position: relative;
  overflow: hidden;
  background-color: var(--background-light, white);
}

.upload-area:hover, .upload-area.dragover {
  border-color: var(--primary-color, #007AFF);
  background-color: rgba(0, 122, 255, 0.05);
  transform: scale(1.02);
}

.upload-area:active, .upload-area.btn-pressed {
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

/* 动画效果 */
@keyframes floatIcon {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}

@keyframes pulsate {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}

@keyframes resetBounce {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}
</style>
