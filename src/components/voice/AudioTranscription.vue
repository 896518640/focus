<template>
  <div class="audio-transcription">
    <div class="upload-section">
      <van-uploader
        v-model="fileList"
        :max-count="1"
        :before-read="beforeUpload"
        :after-read="afterUpload"
        accept="audio/*"
        :disabled="isUploading"
      >
        <template #default>
          <div class="upload-button">
            <van-icon name="plus" size="24" />
            <span>上传音频</span>
          </div>
        </template>
      </van-uploader>

      <div v-if="isUploading" class="upload-progress">
        <van-loading type="spinner" color="#1989fa" />
        <span>正在上传并处理音频...</span>
      </div>
    </div>

    <div v-if="currentTask" class="task-info">
      <div class="task-header">
        <h3>转写任务</h3>
        <van-tag type="primary">{{ getStatusText(currentTask.status) }}</van-tag>
      </div>

      <div v-if="currentTask.status === 'RUNNING'" class="task-progress">
        <van-progress :percentage="Math.floor(currentTask.progress * 100)" :show-pivot="true" />
        <p>正在处理中，请稍候...</p>
      </div>

      <div v-if="currentTask.status === 'SUCCEEDED'" class="transcription-result">
        <h4>转写结果</h4>
        <div class="result-text">
          <p>{{ transcriptionText }}</p>
        </div>

        <div class="action-buttons">
          <van-button type="primary" size="small" @click="copyText">复制文本</van-button>
          <van-button plain type="primary" size="small" @click="exportText">导出文本</van-button>
        </div>
      </div>

      <div v-if="currentTask.status === 'FAILED'" class="task-error">
        <van-icon name="cross" color="#ee0a24" size="24" />
        <p>转写失败: {{ currentTask.error || '未知错误' }}</p>
      </div>
    </div>

    <div v-if="taskHistory.length > 0" class="task-history">
      <h3>历史任务</h3>
      <van-cell-group inset>
        <van-cell
          v-for="task in taskHistory"
          :key="task.taskId"
          :title="task.name || '未命名任务'"
          :label="formatDate(task.createTime)"
          :value="getStatusText(task.status)"
          is-link
          @click="loadTask(task.taskId)"
        />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { showToast, showDialog } from 'vant';
import tingwuService, { TingwuTaskStatus } from '@/common/services/tingwuService';

// 文件列表
const fileList = ref<any[]>([]);

// 上传状态
const isUploading = ref(false);

// 当前任务
const currentTask = ref<any>(null);

// 转写文本
const transcriptionText = ref('');

// 任务历史
const taskHistory = ref<any[]>([]);

// 轮询定时器
let pollingTimer: any = null;

// 组件挂载时加载历史任务
onMounted(() => {
  // 这里可以从本地存储加载历史任务
  const savedHistory = localStorage.getItem('transcriptionTaskHistory');
  if (savedHistory) {
    try {
      taskHistory.value = JSON.parse(savedHistory);
    } catch (e) {
      console.error('解析历史任务失败:', e);
    }
  }

  // 添加测试用的token
  if (!localStorage.getItem('token')) {
    // 这里使用一个与后端匹配的token，实际应用中应该通过登录获取
    // 该token使用密钥 'speakflow-jwt-secret-key' 生成
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6InRlc3QiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MTI0MDAwMDAsImV4cCI6MTc0NDAwMDAwMH0.Yx_NRbLXM5vCNZrppgq_qoZM_RRxN-qwE_JJHVQBYcw');
  }
});

// 组件卸载前清除定时器
onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
});

// 递归查找对象中的文本字段
const findTextFieldInObject = (obj: any): string | null => {
  // 如果是空值或非对象，返回null
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  // 先检查常见的文本字段名称
  const commonTextFields = ['text', 'Text', 'content', 'Content', 'transcript', 'Transcript', 'transcription', 'Transcription'];

  // 检查对象的直接属性
  for (const field of commonTextFields) {
    if (obj[field] && typeof obj[field] === 'string' && obj[field].length > 0) {
      return obj[field];
    }
  }

  // 检查嵌套对象
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      const result = findTextFieldInObject(obj[key]);
      if (result) {
        return result;
      }
    }
  }

  // 检查数组
  if (Array.isArray(obj) && obj.length > 0) {
    // 如果是句子数组，尝试合并
    if (obj.some(item => item.text || item.Text)) {
      return obj.map(item => item.text || item.Text).filter(Boolean).join(' ');
    }

    // 递归检查数组中的对象
    for (const item of obj) {
      const result = findTextFieldInObject(item);
      if (result) {
        return result;
      }
    }
  }

  return null;
};

// 上传前验证
const beforeUpload = (file: any) => {
  // 检查文件类型
  if (!file.type.startsWith('audio/')) {
    showToast('请上传音频文件');
    return false;
  }

  // 检查文件大小（限制为100MB）
  if (file.size > 100 * 1024 * 1024) {
    showToast('文件大小不能超过100MB');
    return false;
  }

  return true;
};

// 上传后处理
const afterUpload = async (file: any) => {
  try {
    isUploading.value = true;

    // 上传文件并创建转写任务
    const fileObj = file.file;
    const fileName = fileObj.name || '未命名音频';

    // 使用新的uploadAndTranscribe方法
    const result = await tingwuService.uploadAndTranscribe(fileObj, {
      sourceLanguage: 'cn',
      type: 'offline'
    });

    // 保存任务信息
    const taskInfo = {
      taskId: result.taskId,
      name: fileName,
      status: 'RUNNING',
      progress: 0,
      createTime: new Date().toISOString(),
      fileUrl: result.fileUrl
    };

    // 更新当前任务
    currentTask.value = taskInfo;

    // 添加到历史记录
    taskHistory.value.unshift(taskInfo);
    saveTaskHistory();

    // 开始轮询任务状态
    startPolling(taskInfo.taskId);

    showToast({
      type: 'success',
      message: '文件上传成功，开始转写'
    });
  } catch (error: any) {
    console.error('上传文件失败:', error);
    showToast({
      type: 'fail',
      message: error.message || '上传文件失败'
    });
  } finally {
    isUploading.value = false;
    // 清空文件列表
    fileList.value = [];
  }
};

// 开始轮询任务状态
const startPolling = (taskId: string) => {
  // 清除之前的定时器
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  // 使用客户端轮询方式
  pollingTimer = setInterval(async () => {
    try {
      // 使用getTingwuTaskInfo直接获取任务信息
      const taskInfo = await tingwuService.getTingwuTaskInfo(taskId);

      console.log('轮询任务状态:', taskInfo);

      // 更新当前任务状态
      if (currentTask.value && currentTask.value.taskId === taskId) {
        currentTask.value = {
          ...currentTask.value,
          status: taskInfo.status === TingwuTaskStatus.COMPLETED ? 'SUCCEEDED' :
                 taskInfo.status === TingwuTaskStatus.FAILED ? 'FAILED' : 'RUNNING',
          progress: 0.5, // 由于API没有提供进度信息，设置一个默认值
          error: taskInfo.errorMessage
        };

        // 如果任务成功，提取转写结果
        if (taskInfo.status === TingwuTaskStatus.COMPLETED && taskInfo.result) {
          extractTranscriptionText(taskInfo.result);

          // 停止轮询
          clearInterval(pollingTimer);
          pollingTimer = null;
        }

        // 如果任务失败或完成，停止轮询
        if (taskInfo.status === TingwuTaskStatus.FAILED || taskInfo.status === TingwuTaskStatus.COMPLETED) {
          clearInterval(pollingTimer);
          pollingTimer = null;
        }
      }
    } catch (error: any) {
      console.error('获取任务状态失败:', error);

      // 显示错误消息
      showToast({
        type: 'fail',
        message: error.message || '获取任务状态失败'
      });

      // 停止轮询
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }, 5000); // 5秒一次轮询
};

// 提取转写文本
const extractTranscriptionText = async (result: any) => {
  try {
    // 处理通义听悟返回的JSON URL
    if (result.transcription && typeof result.transcription === 'string' && result.transcription.startsWith('http')) {
      try {
        isUploading.value = true; // 显示加载状态
        // 获取JSON文件内容
        const jsonData = await tingwuService.fetchTranscriptionJson(result.transcription);
        console.log('获取到的JSON数据:', jsonData);

        // 处理通义听悟的JSON数据结构
        console.log('开始解析通义听悟返回的JSON数据');

        // 处理通义听悟特定的转录结果格式
        if (jsonData.Transcription && jsonData.Transcription.Paragraphs && Array.isArray(jsonData.Transcription.Paragraphs)) {
          console.log('检测到通义听悟特定的转录结果格式');
          // 处理通义听悟的段落和单词结构
          const paragraphs = jsonData.Transcription.Paragraphs.map((paragraph: any) => {
            if (paragraph.Words && Array.isArray(paragraph.Words)) {
              // 将每个段落中的单词组合成文本
              return paragraph.Words.map((word: any) => word.Text).join('');
            }
            return '';
          });

          // 将所有段落组合成完整文本
          transcriptionText.value = paragraphs.join('\n\n').trim();
          console.log('解析完成，文本长度:', transcriptionText.value.length);
        }
        // 如果是嵌套在data属性中
        else if (jsonData.data && jsonData.data.Transcription && jsonData.data.Transcription.Paragraphs) {
          console.log('检测到嵌套在data属性中的通义听悟转录结果');
          const paragraphs = jsonData.data.Transcription.Paragraphs.map((paragraph: any) => {
            if (paragraph.Words && Array.isArray(paragraph.Words)) {
              return paragraph.Words.map((word: any) => word.Text).join('');
            }
            return '';
          });

          transcriptionText.value = paragraphs.join('\n\n').trim();
          console.log('解析完成，文本长度:', transcriptionText.value.length);
        }
        // 其他格式的处理
        else if (jsonData.sentences && Array.isArray(jsonData.sentences)) {
          // 合并所有句子
          transcriptionText.value = jsonData.sentences
            .map((sentence: any) => sentence.text)
            .join(' ')
            .trim();
        } else if (jsonData.text) {
          transcriptionText.value = jsonData.text;
        } else if (jsonData.Data && jsonData.Data.Result && jsonData.Data.Result.Text) {
          transcriptionText.value = jsonData.Data.Result.Text;
        } else if (jsonData.result && jsonData.result.text) {
          transcriptionText.value = jsonData.result.text;
        } else {
          // 尝试找到文本字段
          const textField = findTextFieldInObject(jsonData);
          if (textField) {
            transcriptionText.value = textField;
          } else {
            console.log('无法解析转录结果，返回JSON字符串');
            transcriptionText.value = JSON.stringify(jsonData);
          }
        }
      } catch (jsonError) {
        console.error('获取JSON文件内容失败:', jsonError);
        transcriptionText.value = `无法获取转写结果: ${jsonError.message}`;
      } finally {
        isUploading.value = false; // 隐藏加载状态
      }
    } else if (result.sentences && Array.isArray(result.sentences)) {
      // 合并所有句子
      transcriptionText.value = result.sentences
        .map((sentence: any) => sentence.text)
        .join(' ')
        .trim();
    } else if (result.text) {
      transcriptionText.value = result.text;
    } else if (typeof result === 'string') {
      transcriptionText.value = result;
    } else {
      transcriptionText.value = JSON.stringify(result);
    }
  } catch (error) {
    console.error('提取转写文本失败:', error);
    transcriptionText.value = '无法解析转写结果';
  }
};

// 加载历史任务
const loadTask = async (taskId: string) => {
  try {
    isUploading.value = true;

    // 使用getTingwuTaskInfo直接获取任务信息
    const taskInfo = await tingwuService.getTingwuTaskInfo(taskId);

    // 查找任务历史中的信息
    const historyTask = taskHistory.value.find(task => task.taskId === taskId);

    // 更新当前任务
    currentTask.value = {
      taskId,
      name: historyTask ? historyTask.name : '未命名任务',
      status: taskInfo.status === TingwuTaskStatus.SUCCESS || taskInfo.status === TingwuTaskStatus.COMPLETED ? 'SUCCEEDED' :
              taskInfo.status === TingwuTaskStatus.FAILED ? 'FAILED' : 'RUNNING',
      progress: taskInfo.status === TingwuTaskStatus.SUCCESS || taskInfo.status === TingwuTaskStatus.COMPLETED ? 1 : 0.5,
      error: taskInfo.errorMessage,
      createTime: historyTask ? historyTask.createTime : new Date().toISOString()
    };

    // 如果任务成功完成，获取转写文本
    if ((taskInfo.status === TingwuTaskStatus.SUCCESS || taskInfo.status === TingwuTaskStatus.COMPLETED) && taskInfo.result) {
      extractTranscriptionText(taskInfo.result);
    }

    // 如果任务仍在进行中，开始轮询
    if (taskInfo.status === TingwuTaskStatus.RUNNING) {
      startPolling(taskId);
    }
  } catch (error: any) {
    console.error('加载任务失败:', error);
    showToast({
      type: 'fail',
      message: error.message || '加载任务失败'
    });
  } finally {
    isUploading.value = false;
  }
};

// 复制文本
const copyText = () => {
  if (!transcriptionText.value) {
    showToast('没有可复制的文本');
    return;
  }

  navigator.clipboard.writeText(transcriptionText.value)
    .then(() => {
      showToast({
        type: 'success',
        message: '文本已复制到剪贴板'
      });
    })
    .catch(err => {
      console.error('复制失败:', err);
      showToast({
        type: 'fail',
        message: '复制失败'
      });
    });
};

// 导出文本
const exportText = () => {
  if (!transcriptionText.value) {
    showToast('没有可导出的文本');
    return;
  }

  const blob = new Blob([transcriptionText.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `转写结果-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast({
    type: 'success',
    message: '文本已导出'
  });
};

// 保存任务历史到本地存储
const saveTaskHistory = () => {
  // 只保留最近的10个任务
  const recentHistory = taskHistory.value.slice(0, 10);
  localStorage.setItem('transcriptionTaskHistory', JSON.stringify(recentHistory));
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'RUNNING':
      return '处理中';
    case 'SUCCEEDED':
      return '已完成';
    case 'FAILED':
      return '失败';
    default:
      return '未知';
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
};
</script>

<style scoped>
.audio-transcription {
  padding: 16px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.upload-button {
  width: 100%;
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
}

.upload-button span {
  margin-top: 8px;
  color: #646566;
}

.upload-progress {
  margin-top: 16px;
  display: flex;
  align-items: center;
}

.upload-progress span {
  margin-left: 8px;
}

.task-info {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.task-progress {
  margin-top: 16px;
}

.task-progress p {
  margin-top: 8px;
  color: #969799;
  font-size: 14px;
}

.transcription-result {
  margin-top: 16px;
}

.transcription-result h4 {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 500;
}

.result-text {
  padding: 12px;
  background-color: #f7f8fa;
  border-radius: 4px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.result-text p {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.task-error {
  margin-top: 16px;
  display: flex;
  align-items: center;
  color: #ee0a24;
}

.task-error p {
  margin: 0 0 0 8px;
}

.task-history {
  margin-top: 24px;
}

.task-history h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}
</style>
