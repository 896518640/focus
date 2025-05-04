<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 定义Props类型
interface UploadItem {
  id: number;
  title: string;
  info: string;
  icon: string;
  color: string;
}

// 组件Props
defineProps<{
  items: UploadItem[]
}>();

// 组件事件
const emit = defineEmits(['view-all', 'show-actions']);

// 查看全部历史
const viewAllHistory = () => {
  emit('view-all');
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

// 文件操作菜单
const showFileActions = (id: number) => {
  emit('show-actions', id);
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

// 组件挂载
onMounted(() => {
  // 为列表项添加滑入动画
  const items = document.querySelectorAll('.file-item');
  items.forEach((item, index) => {
    (item as HTMLElement).style.animationDelay = `${index * 0.05}s`;
  });
});
</script>

<template>
  <div class="recent-section">
    <div class="section-header">
      <div class="section-title">最近上传</div>
      <div class="section-more" @click="viewAllHistory">查看全部</div>
    </div>

    <transition-group name="file-list" tag="div" class="file-list">
      <div v-for="item in items" :key="item.id" class="file-item">
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
</template>

<style scoped>
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
  border-radius: 12px;
  background-color: var(--background-color, #F2F2F7);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: slideInRight 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
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

.file-action-btn {
  color: var(--text-secondary, #8E8E93);
  background: none;
  border: none;
  font-size: 16px;
  padding: 5px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-action-btn:active {
  transform: scale(0.9);
  opacity: 0.7;
  background-color: rgba(142, 142, 147, 0.1);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
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
