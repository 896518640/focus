<script setup lang="ts">
import { ref } from 'vue';
import BottomNav from './BottomNav.vue';

// 定义props
defineProps({
  // 是否显示底部导航栏
  showNav: {
    type: Boolean,
    default: true
  },
  // 当前激活的导航项
  activeTab: {
    type: String,
    default: '/'
  }
});
</script>

<template>
  <div class="app-layout">
    <!-- 页面内容区域 -->
    <div class="app-content">
      <slot></slot>
    </div>
    
    <!-- 底部导航栏 -->
    <BottomNav v-if="showNav" :active-tab="activeTab" />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F2F2F7;
  position: relative;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 65px; /* 底部导航栏的高度 + 额外空间 */
  -webkit-overflow-scrolling: touch; /* iOS流畅滚动 */
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 页面过渡动画 */
:deep(.page-enter-active),
:deep(.page-leave-active) {
  transition: opacity 0.3s, transform 0.3s;
}

:deep(.page-enter-from) {
  opacity: 0;
  transform: translateX(20px);
}

:deep(.page-leave-to) {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
