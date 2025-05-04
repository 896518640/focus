<template>
  <div class="translation-item" :class="{ 'is-favorite': item.isFavorite }">
    <div class="item-header">
      <div class="language-badges">
        <span class="source-lang">{{ getLanguageLabel(item.sourceLanguage) }}</span>
        <van-icon name="arrow" class="arrow-icon" />
        <span class="target-lang">{{ getLanguageLabel(item.targetLanguage) }}</span>
      </div>
      <div class="time-stamp">{{ formatTime(item.timestamp) }}</div>
    </div>
    
    <div class="text-content">
      <div class="source-text">{{ item.sourceText }}</div>
      <div class="translated-text">{{ item.translatedText }}</div>
    </div>
    
    <div class="item-actions">
      <van-button 
        size="mini" 
        :icon="item.isFavorite ? 'star' : 'star-o'" 
        class="action-btn favorite-btn"
        :class="{ 'is-active': item.isFavorite }"
        @click="$emit('toggle-favorite')"
      />
      <van-button 
        size="mini" 
        icon="delete-o" 
        class="action-btn delete-btn"
        @click="$emit('delete')"
      />
      <van-button 
        size="mini" 
        icon="copy-o" 
        class="action-btn copy-btn"
        @click="$emit('copy')"
      />
      <van-button 
        size="mini" 
        icon="volume-o" 
        class="action-btn speak-btn"
        @click="$emit('speak')"
      />
      <van-button 
        size="mini" 
        icon="share-o" 
        class="action-btn share-btn"
        @click="$emit('share')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';
import { supportedLanguages } from '@/composables/useTranslationService';
import type { TranslationHistoryItem } from '@/pinia/stores/user';

// 定义组件属性
defineProps<{
  item: TranslationHistoryItem;
}>();

// 定义组件事件
defineEmits<{
  'toggle-favorite': [];
  'delete': [];
  'copy': [];
  'speak': [];
  'share': [];
}>();

// 格式化时间戳
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  // 今天的日期
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 昨天的日期
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 转换为当地时间字符串
  const timeString = date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // 检查是否是今天
  if (date >= today) {
    return `今天 ${timeString}`;
  }
  
  // 检查是否是昨天
  else if (date >= yesterday) {
    return `昨天 ${timeString}`;
  }
  
  // 其他日期
  else {
    return date.toLocaleDateString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// 获取语言标签
function getLanguageLabel(code: string): string {
  const language = supportedLanguages.find(lang => lang.code === code);
  return language ? language.label : code;
}
</script>

<style lang="less" scoped>
.translation-item {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
  
  &.is-favorite {
    background: rgba(251, 191, 36, 0.15);
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.language-badges {
  display: flex;
  align-items: center;
  
  .source-lang, .target-lang {
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    color: #4b5563;
  }
  
  .arrow-icon {
    margin: 0 6px;
    color: #6b7280;
    font-size: 12px;
  }
}

.time-stamp {
  color: #6b7280;
  font-size: 12px;
}

.text-content {
  margin-bottom: 12px;
}

.source-text {
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.translated-text {
  color: #111827;
  font-weight: 500;
  font-size: 15px;
  line-height: 1.5;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-btn {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  &.is-active {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.15);
  }
  
  &.favorite-btn:hover {
    color: #f59e0b;
  }
  
  &.delete-btn:hover {
    color: #ef4444;
  }
  
  &.copy-btn:hover {
    color: #3b82f6;
  }
  
  &.speak-btn:hover {
    color: #10b981;
  }
  
  &.share-btn:hover {
    color: #8b5cf6;
  }
}

@media (max-width: 380px) {
  .item-actions {
    flex-wrap: wrap;
  }
}
</style> 