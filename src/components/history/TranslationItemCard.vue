<template>
  <div class="translation-card">
    <!-- 卡片头部信息 -->
    <div class="card-header">
      <div class="translation-info">
        <van-icon :name="getTypeIcon(item)" class="type-icon" />
        <span class="language-badge">{{ getLanguageLabel(item.sourceLanguage) }} → {{ getLanguageLabel(item.targetLanguage) }}</span>
      </div>
      <div class="time">{{ formatTime(item.timestamp) }}</div>
    </div>
    
    <!-- 翻译内容 -->
    <div class="translation-content">
      <div class="source-text">{{ item.sourceText }}</div>
      <div class="divider"></div>
      <div class="translated-text">{{ item.translatedText }}</div>
    </div>
    
    <!-- 功能按钮 -->
    <div class="action-bar">
      <div class="action-btn" @click="$emit('toggle-favorite')">
        <van-icon 
          :name="item.isFavorite ? 'star' : 'star-o'" 
          :class="{'active-icon': item.isFavorite}" 
          size="18"
        />
      </div>
      <div class="action-btn" @click="$emit('copy')">
        <van-icon name="copy-o" size="18" />
      </div>
      <div class="action-btn" @click="$emit('speak')">
        <van-icon name="volume-o" size="18" />
      </div>
      <div class="action-btn" @click="$emit('share')">
        <van-icon name="share-o" size="18" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TranslationHistoryItem } from '@/pinia/stores/user';

// 接收翻译记录项
const props = defineProps<{
  item: TranslationHistoryItem;
}>();

// 定义事件
defineEmits<{
  (e: 'toggle-favorite'): void;
  (e: 'delete'): void;
  (e: 'copy'): void;
  (e: 'speak'): void;
  (e: 'share'): void;
}>();

// 获取记录类型图标
function getTypeIcon(item: TranslationHistoryItem) {
  // 判断是否为语音翻译
  if (item.isVoice) {
    return 'volume';
  }
  
  // 文本翻译类型图标
  if (item.sourceLanguage === 'zh-CN' && item.targetLanguage === 'en-US') {
    return 'chat-o'; // 中译英
  } else if (item.sourceLanguage === 'en-US' && item.targetLanguage === 'zh-CN') {
    return 'chat-o'; // 英译中
  } else {
    return 'notes-o'; // 其他
  }
}

// 获取记录类型名称
function getTypeName(item: TranslationHistoryItem) {
  // 判断是否为语音翻译
  if (item.isVoice) {
    return '语音翻译';
  }
  return '文本翻译';
}

// 获取语言标签
function getLanguageLabel(languageCode: string) {
  const languageMap: Record<string, string> = {
    'zh-CN': '中文',
    'en-US': '英语',
    'ja-JP': '日语',
    'ko-KR': '韩语',
    'fr-FR': '法语',
    'es-ES': '西班牙语',
    'ru-RU': '俄语',
    'zh_cn': '中文',
    'en_us': '英语',
    'ja_jp': '日语',
    'ko_kr': '韩语',
    'fr_fr': '法语',
    'es_es': '西班牙语',
    'ru_ru': '俄语',
  };
  
  return languageMap[languageCode] || languageCode;
}

// 格式化时间
function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}
</script>

<style lang="less" scoped>
.translation-card {
  background: linear-gradient(135deg, #ffffff, #fafcff);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04),
              0 1px 5px rgba(74, 132, 239, 0.03);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  animation: fadeIn 0.5s ease-out;
  margin-bottom: 0;
  isolation: isolate;
  
  &:active {
    transform: scale(0.985);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #4a84ef, #5e6bf7);
    border-radius: 4px 0 0 4px;
    opacity: 0.8;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.translation-info {
  display: flex;
  align-items: center;
}

.type-icon {
  color: #4a84ef;
  font-size: 16px;
  margin-right: 10px;
  opacity: 0.9;
}

.language-badge {
  color: #4a84ef;
  font-size: 13px;
  background-color: #eef4ff;
  padding: 4px 10px;
  border-radius: 20px;
  transition: all 0.2s;
  letter-spacing: 0.3px;
  font-weight: 500;
  
  &:hover {
    background-color: #deeaff;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(74, 132, 239, 0.1);
  }
}

.time {
  color: #999;
  font-size: 12px;
  font-weight: 500;
  background-color: #f8f9fc;
  padding: 4px 8px;
  border-radius: 12px;
}

/* 翻译内容 */
.translation-content {
  margin-bottom: 16px;
  padding-left: 6px;
}

.source-text {
  color: #444;
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 12px;
  word-break: break-word;
  transition: color 0.2s;
  
  &:hover {
    color: #222;
  }
}

.divider {
  height: 1px;
  background: linear-gradient(to right, rgba(74, 132, 239, 0.1), rgba(74, 132, 239, 0.3), rgba(74, 132, 239, 0.1));
  margin: 10px 0;
  border-radius: 1px;
}

.translated-text {
  color: #4a84ef;
  font-size: 16px;
  line-height: 1.5;
  word-break: break-word;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover {
    color: #3366db;
    transform: translateY(-1px);
  }
}

/* 功能按钮 */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 6px;
  position: relative;
}

.action-btn {
  color: #999;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  z-index: 1;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background-color: #f0f4ff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: -1;
    transition: width 0.3s, height 0.3s;
  }
  
  &:hover {
    color: #4a84ef;
    transform: translateY(-2px);
    
    &::before {
      width: 40px;
      height: 40px;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
}

.active-icon {
  color: #ffb800;
  animation: pop 0.4s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

// 响应式调整
@media (max-width: 360px) {
  .translation-card {
    padding: 15px;
  }
  
  .action-bar {
    gap: 12px;
  }
  
  .language-badge {
    font-size: 12px;
    padding: 3px 8px;
  }
  
  .source-text, .translated-text {
    font-size: 14px;
  }
}
</style> 