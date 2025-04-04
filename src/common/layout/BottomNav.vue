<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  activeTab: {
    type: String,
    default: '/'
  }
});

const router = useRouter();
const touchedItem = ref('');

// 导航项配置
const navItems = [
  { path: '/', icon: 'fa-home', label: '首页' },
  { path: '/upload', icon: 'fa-cloud-upload-alt', label: '上传' },
  { path: '/recognition', icon: 'fa-microphone', label: '识别' },
  { path: '/history', icon: 'fa-history', label: '历史' },
  { path: '/profile', icon: 'fa-user', label: '我的' }
];

// 导航函数
const navigateTo = (path: string) => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  router.push(path);
};

// 计算当前活动的标签
const currentTab = computed(() => props.activeTab);

// 触摸事件处理
const handleTouchStart = (path: string) => {
  touchedItem.value = path;
};

const handleTouchEnd = () => {
  touchedItem.value = '';
};
</script>

<template>
  <div class="bottom-nav">
    <div
      v-for="item in navItems"
      :key="item.path"
      class="nav-item"
      :class="{ 
        'active': currentTab === item.path,
        'touched': touchedItem === item.path 
      }"
      @click="navigateTo(item.path)"
      @touchstart="handleTouchStart(item.path)"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    >
      <div class="nav-icon-container">
        <i :class="['fas', item.icon, 'nav-icon']"></i>
        <!-- <div v-if="currentTab === item.path" class="nav-indicator"></div> -->
      </div>
      <span class="nav-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: space-around;
  align-items: center;
  /* box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.05); */
  z-index: 100;
  border-top: 1px solid rgba(209, 209, 214, 0.8);
  padding: 5px 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* 增加安全区域适配 */
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  padding: 6px 0;
  font-size: 12px;  
  text-decoration: none;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.nav-item:active, .nav-item.touched {
  transform: scale(0.92);
  opacity: 0.8;
}

.nav-item.active {
  color: #007AFF;
}

.nav-icon-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 28px;
  margin-bottom: 3px;
}

.nav-indicator {
  position: absolute;
  bottom: -4px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #007AFF;
  animation: fadeInUp 0.3s forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.nav-icon {
  font-size: 18px;
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  /* 增加文字锐化 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 增加图标清晰度 */
  /* filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.05)); */
}

.active .nav-icon {
  transform: translateY(-2px);
  /* animation: fadeInUp 0.3s forwards; */
  /* 增加活跃状态的阴影效果 */
  /* filter: drop-shadow(0 1px 3px rgba(0, 122, 255, 0.3)); */
}

.nav-label {
  font-size: 11px;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  letter-spacing: -0.2px;
  /* 增加文字锐化 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 增加文字清晰度 */
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.01);
}

.active .nav-label {
  font-weight: 600;
  transform: translateY(1px);
}

/* 适配深色模式 */
@media (prefers-color-scheme: dark) {
  .bottom-nav {
    background-color: rgba(28, 28, 30, 0.95);
    border-top: 1px solid rgba(44, 44, 46, 0.8);
  }
  
  .nav-item {
    color: #8E8E93;
  }
  
  .nav-item.active {
    color: #0A84FF;
  }
  
  .nav-indicator {
    background-color: #0A84FF;
  }
}
</style>
