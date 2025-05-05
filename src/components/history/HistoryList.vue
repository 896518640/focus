<template>
  <div class="history-list" ref="historyList" @scroll="handleScroll">
    <!-- 加载动画 -->
    <div v-if="isLoading && !hasMore && isEmpty" class="loading-state">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="loadError" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <div class="error-message">{{ errorMessage }}</div>
      <button class="retry-button" @click="$emit('retry')">
        <i class="fas fa-redo"></i> 重试
      </button>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-history"></i>
      </div>
      <div class="empty-title">暂无历史记录</div>
      <div class="empty-message">开始识别或翻译，记录将显示在这里</div>
    </div>
    
    <!-- 历史记录项 -->
    <template v-else>
      <div 
        v-for="(group, dateKey) in groupedItems" 
        :key="dateKey" 
        class="history-group"
      >
        <div class="date-header">{{ dateKey }}</div>
        <div class="history-items">
          <HistoryCard
            v-for="item in group"
            :key="item.id"
            :item="item"
            @view="(id: string) => $emit('view', id)"
            @delete="(id: string) => $emit('delete', id)"
            @share="(id: string) => $emit('share', id)"
            @download="(id: string) => $emit('download', id)"
            @copy="(id: string) => $emit('copy', id)"
          />
        </div>
      </div>
      
      <!-- 加载更多指示器 -->
      <div v-if="isLoading && hasMore" class="loading-more">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载更多...</div>
      </div>
      
      <!-- 无更多数据 -->
      <div v-else-if="!hasMore && !isEmpty" class="no-more-data">
        <div class="divider"></div>
        <div class="end-text">已经到底了</div>
        <div class="divider"></div>
      </div>
    </template>
    
    <!-- 回到顶部按钮 -->
    <transition name="fade">
      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
        <i class="fas fa-arrow-up"></i>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, onMounted, watch } from 'vue';
import { SaveTranslationParams, SaveTranslationResponse } from '@/api/translation/save';
import HistoryCard from './HistoryCard.vue';

// 完整的历史记录项接口
interface HistoryItem extends SaveTranslationParams, SaveTranslationResponse {}

const props = defineProps({
  items: {
    type: Array as () => HistoryItem[],
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  loadError: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: '加载失败，请稍后重试'
  },
  hasMore: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'loadMore'): void
  (e: 'view', id: string): void
  (e: 'delete', id: string): void
  (e: 'share', id: string): void
  (e: 'copy', id: string): void
  (e: 'download', id: string): void
}>();

// 引用滚动容器
const historyList = ref<HTMLElement | null>(null);
const showBackToTop = ref(false);

// 判断items是否为空
const isEmpty = computed(() => {
  return !Array.isArray(props.items) || props.items.length === 0;
});

// 按日期分组的历史记录
const groupedItems = computed(() => {
  const groups: { [key: string]: HistoryItem[] } = {};
  
  // 先检查items是否为数组
  if (!Array.isArray(props.items)) {
    return groups;
  }
  
  // 遍历记录并按日期分组
  for (const item of props.items as unknown as HistoryItem[]) {
    const date = new Date(item.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 确定日期键
    let dateKey = '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate()) {
      dateKey = '今天';
    } else if (year === yesterday.getFullYear() && month === yesterday.getMonth() + 1 && day === yesterday.getDate()) {
      dateKey = '昨天';
    } else {
      dateKey = `${year}年${month}月${day}日`;
    }
    
    // 如果该日期组不存在，则创建
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    // 将记录添加到对应日期组
    groups[dateKey].push(item);
  }
  
  return groups;
});

// 处理滚动事件
const handleScroll = () => {
  if (!historyList.value) return;
  
  // 显示/隐藏回到顶部按钮
  showBackToTop.value = historyList.value.scrollTop > 300;
  
  // 检测滚动到底部以加载更多
  const { scrollTop, scrollHeight, clientHeight } = historyList.value;
  if (scrollTop + clientHeight >= scrollHeight - 50 && !props.isLoading && props.hasMore) {
    emit('loadMore');
  }
};

// 回到顶部
const scrollToTop = () => {
  if (!historyList.value) return;
  
  historyList.value.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// 当props变化时，可能需要重置UI状态
watch(() => props, () => {
  // 当记录变化时，可能需要做一些调整
  if (isEmpty.value) {
    scrollToTop();
  }
}, { deep: true });
</script>

<style scoped>
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

/* 日期分组样式 */
.history-group {
  margin-bottom: 24px;
}

.date-header {
  font-size: 14px;
  font-weight: 600;
  color: #8E8E93;
  margin-bottom: 12px;
  padding-left: 4px;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 加载状态 */
.loading-state, .loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-radius: 50%;
  border-top-color: #007AFF;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #8E8E93;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  text-align: center;
}

.error-state i {
  font-size: 40px;
  color: #FF3B30;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #8E8E93;
  margin-bottom: 20px;
  max-width: 300px;
}

.retry-button {
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: #0062cc;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
}

.empty-icon {
  font-size: 50px;
  color: #C7C7CC;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #3C3C43;
  margin-bottom: 8px;
}

.empty-message {
  font-size: 14px;
  color: #8E8E93;
  max-width: 250px;
  margin-bottom: 24px;
}

/* 无更多数据 */
.no-more-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  margin-top: 10px;
}

.divider {
  height: 1px;
  background-color: #E5E5EA;
  flex: 1;
}

.end-text {
  font-size: 12px;
  color: #8E8E93;
  margin: 0 10px;
  white-space: nowrap;
}

/* 回到顶部按钮 */
.back-to-top {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* 过渡动画 */
.fade-enter-active, 
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, 
.fade-leave-to {
  opacity: 0;
}
</style> 