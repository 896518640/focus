<script setup lang="ts">
import { ref, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showSuccessToast, showFailToast } from 'vant';

// 导入工具函数和钩子
import { vibrate, getFileTypeInfo } from '@/utils/fileUtils';
import useAudioTranscription, { TranscriptionSettings as TranscriptionSettingsOptions } from '@/hooks/useAudioTranscription';
import useUploadSimulation from '@/hooks/useUploadSimulation';
import useShareAndCopy from '@/hooks/useShareAndCopy';

// 导入拆分的组件
import UploadArea from '@/common/components/upload/UploadArea.vue';
import UploadProgress from '@/common/components/upload/UploadProgress.vue';
import TranscriptionCard from '@/common/components/upload/TranscriptionCard.vue';
import RecentUploads from '@/common/components/upload/RecentUploads.vue';
import UsageTips from '@/common/components/upload/UsageTips.vue';
import TranscriptionSettings from '@/common/components/upload/TranscriptionSettings.vue';

const router = useRouter();

// 转录设置
const transcriptionSettings = ref<TranscriptionSettingsOptions>({
  input: {
    sourceLanguage: 'cn'
  },
  parameters: {
    transcription: {
      diarizationEnabled: false,
      diarization: {
        speakerCount: 1
      }
    }
  },
  type: 'offline'
});

// 使用音频转录hook
const {
  transcribing,
  transcriptionComplete,
  transcriptionProgress,
  transcriptionText,
  translationText, // 添加翻译文本
  transcriptionError,
  statusText,
  currentTaskId,
  uploadAndTranscribe,
  resetTranscription,
  cleanup
} = useAudioTranscription();

// 使用上传模拟hook
const {
  uploading,
  uploadProgress,
  uploadComplete,
  fileName,
  fileSize,
  totalSize,
  fileType,
  uploadEstimatedTime,
  uploadedFile,
  simulateUpload,
  cancelUpload,
  resetUpload: resetUploadState,
  completeUpload
} = useUploadSimulation();

// 使用分享和复制hook
const { copyText, shareText } = useShareAndCopy();

// 交互状态
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
    color: 'var(--accent-color, #FF2D55)'
  },
  {
    id: 3,
    title: '国际贸易.m4a',
    info: '8.5MB • 25分钟 • 3月18日上传',
    icon: 'fa-file-audio',
    color: 'var(--success-color, #4CD964)'
  }
]);

// 监听上传完成状态，自动开始转录
watch(uploadComplete, async (newVal, oldVal) => {
  if (newVal === true && oldVal === false) {
    console.log('上传完成，开始调用转录接口');
    await startTranscription();
  }
});

// 监听转录完成状态，自动滚动到结果卡片
watch(transcriptionComplete, (newVal, oldVal) => {
  if (newVal === true && oldVal === false) {
    const transcriptionCard = document.getElementById('transcription-card');
    if (transcriptionCard) {
      transcriptionCard.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// 更新转录设置
const updateTranscriptionSettings = (settings: TranscriptionSettingsOptions) => {
  transcriptionSettings.value = settings;
  console.log('转录设置已更新:', settings);
  
  // 添加设置成功提示
  showToast({
    message: '设置已更新',
    position: 'bottom'
  });
};

// 文件上传处理
const handleFileUpload = async (event: Event) => {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    uploadedFile.value = file;
    simulateUpload(file.name, file.size);
    vibrate(5);
  }
};

// 选择文件
const selectFile = () => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
    vibrate(5);
  }
};

// 开始录音
const recordNow = () => {
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);

  showToast({
    message: '录音功能即将上线',
    position: 'top'
  });

  vibrate([10, 20, 10]);
};

// 完整重置上传和转录状态
const resetUpload = () => {
  resetUploadState();
  resetTranscription();
  vibrate(5);

  // 添加重置动画效果
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

// 拖放文件处理
const handleDropFile = (file: File) => {
  uploadedFile.value = file;
  simulateUpload(file.name, file.size);
};

// 复制转录文本
const copyTranscriptionText = (text = transcriptionText.value) => {
  if (text) {
    copyText(text);
  }
};

// 分享转录文本
const shareTranscriptionText = (text = transcriptionText.value) => {
  if (text) {
    shareText(text);
  }
};

// 重试转录
const retryTranscription = async () => {
  if (uploadedFile.value) {
    try {
      resetTranscription();
      vibrate([10, 20, 10]);
      
      // 直接调用后端API上传并开始转录
      await uploadAndTranscribe(uploadedFile.value, transcriptionSettings.value);

      showToast({
        message: '重新转录中...',
        position: 'bottom'
      });
    } catch (error: any) {
      console.error('重试转录失败:', error);
      showFailToast({
        message: '重试失败: ' + (error.message || '未知错误'),
        position: 'top'
      });
    }
  } else {
    showToast({
      message: '没有可用的文件进行重试',
      position: 'bottom'
    });
  }
};

// 查看结果
const viewResult = () => {
  // 添加到最近上传
  addToRecentUploads();
  isAnimating.value = true;
  vibrate(10);

  setTimeout(() => {
    router.push('/history');
  }, 300);
};

// 添加到最近上传
const addToRecentUploads = () => {
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
  isAnimating.value = true;
  vibrate(5);
  
  setTimeout(() => {
    router.push('/history');
  }, 300);
};

// 文件操作菜单
const showFileActions = (id: number) => {
  showToast({
    message: '文件操作菜单即将上线',
    position: 'bottom'
  });
  vibrate(5);
};

// 上传完成后开始转录处理
const startTranscription = async () => {
  if (uploadedFile.value) {
    try {
      console.log('开始上传文件并转录:', uploadedFile.value.name);
      console.log('使用转录设置:', transcriptionSettings.value);
      resetTranscription();
      
      // 调用后端API上传并开始转录，传递转录设置
      const taskId = await uploadAndTranscribe(uploadedFile.value, transcriptionSettings.value);
      
      console.log('转录任务已创建，任务ID:', taskId);
      
      if (taskId) {
        showToast({
          message: '音频开始转录，请稍候...',
          position: 'bottom'
        });
      }
    } catch (error: any) {
      console.error('转录失败:', error);
      showFailToast({
        message: '转录失败: ' + (error.message || '未知错误'),
        position: 'top'
      });
    }
  } else {
    console.error('没有可用的文件进行转录');
  }
};

// 手动触发转录处理
const handleManualTranscription = async () => {
  if (!transcribing.value && !transcriptionComplete.value) {
    await startTranscription();
  }
};

// 页面卸载时清理资源
onUnmounted(() => {
  cleanup();
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
      <!-- 转录设置卡片 -->
      <div class="card settings-container">
        <TranscriptionSettings @update:settings="updateTranscriptionSettings" />
      </div>
      
      <!-- 上传区域卡片 -->
      <div class="card upload-container">
        <!-- 使用上传区域组件 -->
        <UploadArea 
          v-if="!uploading && !uploadComplete" 
          :isAnimating="isAnimating"
          @select-file="selectFile"
          @record-now="recordNow"
          @drop-file="handleDropFile"
          @file-selected="handleFileUpload"
        />

        <!-- 使用上传进度组件 -->
        <UploadProgress 
          v-if="uploading" 
          :fileName="fileName"
          :fileType="fileType"
          :fileSize="fileSize"
          :totalSize="totalSize"
          :progress="uploadProgress"
          :estimatedTime="uploadEstimatedTime"
          @cancel="cancelUpload"
        />

        <!-- 上传完成状态 -->
        <div v-if="uploadComplete" class="upload-complete">
          <div class="upload-success-container">
            <div class="success-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="success-info">
              <div class="success-title">上传成功</div>
              <div class="success-description">文件已上传，正在处理中</div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="button-row">
            <button class="compact-button primary-button" @click="resetUpload">
              <i class="fas fa-upload mr-2"></i>继续上传
            </button>
            <button class="compact-button secondary-button" @click="viewResult">
              <i class="fas fa-history mr-2"></i>查看历史
            </button>
          </div>
        </div>
      </div>
      
      <!-- 转录结果卡片 - 单独放在上传卡片下面 -->
      <TranscriptionCard
        id="transcription-card"
        v-if="uploadComplete || transcribing"
        :transcribing="transcribing"
        :transcriptionComplete="transcriptionComplete"
        :transcriptionProgress="transcriptionProgress"
        :transcriptionText="transcriptionText"
        :translationText="translationText"
        :transcriptionError="transcriptionError"
        :statusText="statusText"
        @copy="copyTranscriptionText"
        @share="shareTranscriptionText"
        @retry="retryTranscription"
      />

      <!-- 使用最近上传组件 -->
      <RecentUploads 
        :items="recentUploads"
        @view-all="viewAllHistory"
        @show-actions="showFileActions"
      />

      <!-- 使用提示组件 -->
      <UsageTips />
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

/* 卡片样式 */
.card {
  background-color: var(--background-light, #FFFFFF);
  border-radius: var(--border-radius-md, 14px);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--box-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
  animation: fadeIn 0.5s ease;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 设置容器 */
.settings-container {
  animation: slideIn 0.4s ease;
}

/* 上传容器 */
.upload-container {
  text-align: center;
}

.upload-container:active {
  transform: scale(0.99);
  box-shadow: var(--box-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.05));
}

/* 上传完成 */
.upload-complete {
  width: 100%;
  animation: bounceIn 0.5s ease;
  padding: 10px;
}

.upload-success-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.success-icon {
  font-size: 36px;
  color: var(--success-color, #4CD964);
  margin-right: 15px;
  animation: pulse 2s infinite;
}

.success-info {
  text-align: left;
  flex: 1;
}

.success-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary, #000000);
}

.success-description {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
}

.button-row {
  display: flex;
  width: 100%;
  gap: 10px;
  margin-top: 10px;
}

.compact-button {
  flex: 1;
  padding: 10px;
  font-size: 14px;
}

/* 操作按钮 */
.primary-button {
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.secondary-button:active {
  transform: scale(0.98);
  opacity: 0.9;
  background-color: rgba(0, 122, 255, 0.05);
}

.mr-2 {
  margin-right: 8px;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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
</style>
