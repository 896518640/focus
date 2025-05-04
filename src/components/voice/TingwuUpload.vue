<template>
  <div class="tingwu-upload">
    <div class="upload-area" @click="triggerFileSelect" :class="{ 'is-processing': isProcessing }">
      <div v-if="!isProcessing && !currentFile" class="upload-default">
        <van-icon name="plus" class="upload-icon" />
        <div class="upload-text">
          <p class="primary-text">点击上传音频文件</p>
          <p class="secondary-text">支持mp3、wav、m4a等格式</p>
        </div>
      </div>
      
      <div v-if="currentFile && !isProcessing" class="upload-with-file">
        <van-icon name="music-o" class="file-icon" />
        <div class="file-info">
          <p class="file-name">{{ currentFile.name }}</p>
          <p class="file-size">{{ formatFileSize(currentFile.size) }}</p>
        </div>
        <van-button 
          type="primary" 
          size="small"
          @click.stop="startProcessing"
        >
          开始识别
        </van-button>
        <van-icon 
          name="close" 
          class="remove-icon" 
          @click.stop="removeFile" 
        />
      </div>
      
      <div v-if="isProcessing" class="upload-processing">
        <van-loading type="spinner" color="#4a84ef" size="24px" />
        <div class="processing-info">
          <p class="processing-text">
            {{ getStatusText() }}
          </p>
          <van-progress 
            :percentage="processingProgress" 
            :pivot-text="processingProgress + '%'" 
            color="#4a84ef"
          />
        </div>
        <van-button 
          plain 
          type="danger" 
          size="small"
          @click.stop="cancelProcessing"
        >
          取消
        </van-button>
      </div>
    </div>
    
    <div v-if="hasResult" class="result-area">
      <div class="result-header">
        <h3 class="result-title">识别结果</h3>
        <div class="result-actions">
          <van-button 
            type="primary" 
            size="small"
            icon="copy-o"
            @click="copyResult"
          >
            复制
          </van-button>
          <van-button 
            plain 
            type="default" 
            size="small"
            icon="delete-o"
            @click="clearResult"
          >
            清除
          </van-button>
        </div>
      </div>
      
      <div class="result-content">
        <p>{{ resultText }}</p>
      </div>
    </div>
    
    <div v-if="error" class="error-area">
      <van-icon name="warning-o" class="error-icon" />
      <p class="error-text">{{ error }}</p>
    </div>
    
    <input 
      ref="fileInput"
      type="file"
      accept="audio/*"
      style="display: none"
      @change="handleFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { showSuccessToast, showFailToast } from 'vant';
import useTingwuService from '@/hooks/useTingwuService';
import { TingwuTaskStatus } from '@/services/tingwuService';

// 定义组件属性
const props = defineProps({
  maxSize: {
    type: Number,
    default: 100 * 1024 * 1024 // 100MB
  },
  acceptedFormats: {
    type: Array,
    default: () => ['.mp3', '.wav', '.m4a', '.aac', '.flac']
  }
});

// 定义组件事件
const emit = defineEmits([
  'result',
  'error',
  'status-change',
  'processing'
]);

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null);

// 使用通义听悟服务
const {
  isProcessing,
  currentFile,
  processingStatus,
  processingProgress,
  resultText,
  sentences,
  error,
  hasResult,
  processAudioFile,
  reset
} = useTingwuService({
  onResult: (text, sentences) => {
    emit('result', { text, sentences });
  },
  onError: (errorMsg) => {
    emit('error', errorMsg);
  }
});

// 触发文件选择
const triggerFileSelect = () => {
  if (isProcessing.value) return;
  fileInput.value?.click();
};

// 处理文件选择
const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (!files || files.length === 0) return;
  
  const file = files[0];
  
  // 验证文件大小
  if (file.size > Number(props.maxSize)) {
    showFailToast(`文件过大，最大允许 ${formatFileSize(Number(props.maxSize))}`);
    return;
  }
  
  // 验证文件格式
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  // 使用Array.from转换props对象为真正的数组
  const acceptedFormats = Array.isArray(props.acceptedFormats) 
    ? props.acceptedFormats 
    : Array.from(props.acceptedFormats as unknown as ArrayLike<string>);
  
  if (!acceptedFormats.includes(fileExt)) {
    showFailToast(`不支持的文件格式，请上传 ${acceptedFormats.join(', ')} 格式的文件`);
    return;
  }
  
  currentFile.value = file;
  
  // 重置输入框，允许再次选择相同文件
  target.value = '';
};

// 开始处理文件
const startProcessing = async () => {
  if (!currentFile.value || isProcessing.value) return;
  
  emit('processing', true);
  
  try {
    await processAudioFile(currentFile.value);
    showSuccessToast('音频识别成功');
  } catch (err: any) {
    showFailToast(err.message || '处理失败');
  } finally {
    emit('processing', false);
  }
};

// 取消处理
const cancelProcessing = () => {
  // 目前只能在客户端取消，服务端任务会继续执行
  reset();
  showSuccessToast('已取消处理');
  emit('processing', false);
};

// 移除文件
const removeFile = () => {
  if (isProcessing.value) return;
  currentFile.value = null;
};

// 复制结果
const copyResult = () => {
  if (!resultText.value) return;
  
  navigator.clipboard.writeText(resultText.value)
    .then(() => {
      showSuccessToast('识别结果已复制');
    })
    .catch(() => {
      showFailToast('复制失败');
    });
};

// 清除结果
const clearResult = () => {
  reset();
};

// 获取当前状态文本
const getStatusText = () => {
  if (!isProcessing.value) return '';
  
  switch (processingStatus.value) {
    case TingwuTaskStatus.PENDING:
      return '正在准备...';
    case TingwuTaskStatus.RUNNING:
      return '正在识别音频...';
    case TingwuTaskStatus.SUCCESS:
      return '识别完成';
    case TingwuTaskStatus.FAILED:
      return '识别失败';
    default:
      return '处理中...';
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
</script>

<style lang="less" scoped>
.tingwu-upload {
  margin-bottom: 20px;
}

.upload-area {
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(100, 100, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: rgba(100, 100, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  &.is-processing {
    cursor: default;
  }
}

.upload-default {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  .upload-icon {
    font-size: 32px;
    color: #4a84ef;
    margin-bottom: 10px;
  }
  
  .upload-text {
    .primary-text {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 4px 0;
      color: #333;
    }
    
    .secondary-text {
      font-size: 14px;
      margin: 0;
      color: #666;
    }
  }
}

.upload-with-file {
  display: flex;
  width: 100%;
  align-items: center;
  
  .file-icon {
    font-size: 24px;
    color: #4a84ef;
    margin-right: 10px;
  }
  
  .file-info {
    flex: 1;
    
    .file-name {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .file-size {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
  }
  
  .remove-icon {
    font-size: 18px;
    color: #999;
    margin-left: 10px;
    
    &:hover {
      color: #f56c6c;
    }
  }
}

.upload-processing {
  display: flex;
  width: 100%;
  align-items: center;
  
  .processing-info {
    flex: 1;
    margin: 0 15px;
    
    .processing-text {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #333;
    }
  }
}

.result-area {
  margin-top: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  
  .result-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }
  
  .result-actions {
    display: flex;
    gap: 8px;
  }
}

.result-content {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
  color: #333;
  font-size: 14px;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
  
  p {
    margin: 0;
    white-space: pre-wrap;
  }
}

.error-area {
  margin-top: 10px;
  display: flex;
  align-items: center;
  
  .error-icon {
    font-size: 16px;
    color: #f56c6c;
    margin-right: 5px;
  }
  
  .error-text {
    margin: 0;
    font-size: 14px;
    color: #f56c6c;
  }
}

@media (prefers-color-scheme: dark) {
  .upload-default .upload-text .primary-text,
  .upload-with-file .file-info .file-name,
  .upload-processing .processing-info .processing-text {
    color: #f0f0f0;
  }
  
  .upload-default .upload-text .secondary-text,
  .upload-with-file .file-info .file-size {
    color: #bbb;
  }
  
  .result-content {
    color: #f0f0f0;
  }
}
</style> 