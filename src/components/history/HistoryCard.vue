<template>
  <div 
    class="history-item"
    :data-item-id="item.id"
  >
    <div 
      class="history-card"
      :data-item-id="item.id"
      @click="$emit('view', item.id)"
    >
      <div class="history-icon" :style="{ backgroundColor: getIconBackground() }">
        <i :class="['fas', getIcon()]"></i>
      </div>
      <div class="history-content">
        <div class="history-title">{{ item.title || '未命名翻译' }}</div>
        <div class="history-info">
          <span class="language-info">{{ item.sourceLanguage }} → {{ item.targetLanguage }}</span>
          <span class="date-info">• {{ formatDate(item.createdAt) }}</span>
          <span v-if="item.duration" class="duration-info">• {{ formatDuration(item.duration) }}</span>
        </div>
        <div class="history-preview">{{ getPreviewText() }}</div>
        <div class="history-actions">
          <button class="action-button" @click.stop="$emit('share', item.id)">
            <i class="fas fa-share-alt"></i>
            <span>分享</span>
          </button>
          <button class="action-button" @click.stop="$emit('download', item.id)" v-if="item.outputMp3Path">
            <i class="fas fa-download"></i>
            <span>下载</span>
          </button>
          <button class="action-button" @click.stop="$emit('copy', item.id)">
            <i class="fas fa-copy"></i>
            <span>复制</span>
          </button>
        </div>
      </div>
      <div class="action-menu">
        <button class="delete-button" @click.stop="$emit('delete', item.id)">
          <i class="fas fa-trash-alt"></i>
        </button>
        <button class="expand-toggle" @click.stop="toggleExpand">
          <i :class="['fas', expanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
        </button>
      </div>
    </div>
    
    <!-- 展开的内容 -->
    <transition name="expand">
      <div class="history-expand" v-if="expanded">
        <div class="expand-content">
          <div class="expand-section">
            <div class="expand-title">原文</div>
            <div class="expand-text">{{ item.originalText }}</div>
          </div>
          <div class="expand-section">
            <div class="expand-title">翻译</div>
            <div class="expand-text">{{ item.translatedText }}</div>
          </div>
        </div>
        <div class="expand-actions">
          <button class="expand-action-button" @click.stop="$emit('copy', item.id)">
            <i class="fas fa-copy"></i>
            <span>复制全文</span>
          </button>
          <button class="expand-action-button" @click.stop="$emit('download', item.id)" v-if="item.outputMp3Path">
            <i class="fas fa-download"></i>
            <span>下载音频</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { SaveTranslationParams, SaveTranslationResponse } from '@/api/translation/save';

// 完整的历史记录项接口
interface HistoryItem extends SaveTranslationParams, SaveTranslationResponse {}

const props = defineProps({
  item: {
    type: Object as () => HistoryItem,
    required: true
  }
});

const emit = defineEmits(['view', 'delete', 'share', 'download', 'copy']);
const expanded = ref(false);

// 切换展开状态
const toggleExpand = () => {
  expanded.value = !expanded.value;
};

// 获取图标
const getIcon = () => {
  // 使用非空断言和类型断言的组合
  const itemData = props.item as unknown as HistoryItem;
  return itemData.outputMp3Path ? 'fa-headset' : 'fa-language';
};

// 获取图标背景色
const getIconBackground = () => {
  // 使用非空断言和类型断言的组合
  const itemData = props.item as unknown as HistoryItem;
  return itemData.outputMp3Path ? '#4169E1' : '#FF3B30';
};

// 获取预览文本
const getPreviewText = () => {
  // 使用非空断言和类型断言的组合
  const itemData = props.item as unknown as HistoryItem;
  const text = itemData.translatedText || '';
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

// 格式化持续时间
const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}分${remainingSeconds}秒` 
      : `${minutes}分钟`;
  }
};
</script>

<style scoped>
.history-item {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.history-card {
  display: flex;
  padding: 16px;
  position: relative;
}

.history-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.history-icon i {
  font-size: 20px;
  color: #FFFFFF;
}

.history-content {
  flex: 1;
  min-width: 0; /* 确保内容可以收缩 */
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-info {
  display: flex;
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.language-info, .date-info, .duration-info {
  margin-right: 6px;
}

.history-preview {
  font-size: 14px;
  color: #3C3C43;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.history-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  /* gap: 6px; */
  background: #F5F5F5;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  color: #007AFF;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-button:hover {
  background-color: #E5E5EA;
}

.action-button i {
  font-size: 12px;
}

.action-menu {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 8px;
}

.delete-button, .expand-toggle {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8E8E93;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.delete-button {
  color: #FF3B30;
}

.delete-button:hover, .expand-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 展开内容样式 */
.history-expand {
  padding: 16px;
  border-top: 1px solid #F2F2F7;
  background-color: #FFFFFF;
}

.expand-content {
  margin-bottom: 16px;
}

.expand-section {
  margin-bottom: 16px;
}

.expand-section:last-child {
  margin-bottom: 0;
}

.expand-title {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.expand-text {
  font-size: 14px;
  color: #3C3C43;
  line-height: 1.5;
  white-space: pre-wrap;
}

.expand-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.expand-action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #F5F5F5;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: #007AFF;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.expand-action-button:hover {
  background-color: #E5E5EA;
}

.expand-action-button i {
  font-size: 14px;
}

/* 展开动画 */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style> 