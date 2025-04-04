<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 当前激活的标签
const activeTab = ref(route.path);

// 导航函数
const navigateTo = (path: string) => {
  activeTab.value = path;
  router.push(path);
};
</script>

<template>
  <div class="bottom-nav">
    <div class="nav-item" :class="{ active: activeTab === '/' }" @click="navigateTo('/')">
      <i class="fas fa-home nav-icon"></i>
      <span class="nav-label">首页</span>
    </div>
    <div class="nav-item" :class="{ active: activeTab === '/translate' }" @click="navigateTo('/translate')">
      <i class="fas fa-cloud-upload-alt nav-icon"></i>
      <span class="nav-label">翻译</span>
    </div>
    <div class="nav-item" :class="{ active: activeTab === '/history' }" @click="navigateTo('/history')">
      <i class="fas fa-history nav-icon"></i>
      <span class="nav-label">历史</span>
    </div>
    <div class="nav-item" :class="{ active: activeTab === '/me' }" @click="navigateTo('/me')">
      <i class="fas fa-user nav-icon"></i>
      <span class="nav-label">我的</span>
    </div>
  </div>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 55px;
  background-color: var(--background-light, #FFFFFF);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
  border-top: 1px solid var(--border-color, #D1D1D6);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: var(--text-secondary, #8E8E93);
  cursor: pointer;
  transition: color 0.3s;
  padding: 8px 0;
  font-size: 12px;
}

.nav-item.active {
  color: var(--primary-color, #007AFF);
}

.nav-icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 12px;
}
</style>
