<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 设置选项列表
const settingOptions = ref([
  {
    id: 'account',
    name: '账号设置',
    icon: 'fa-user-circle',
    path: '/settings/account'
  },
  {
    id: 'notification',
    name: '通知设置',
    icon: 'fa-bell',
    path: '/settings/notification'
  },
  {
    id: 'language',
    name: '语言设置',
    icon: 'fa-language',
    path: '/settings/language'
  },
  {
    id: 'theme',
    name: '主题设置',
    icon: 'fa-palette',
    path: '/settings/theme'
  },
  {
    id: 'privacy',
    name: '隐私设置',
    icon: 'fa-shield-alt',
    path: '/settings/privacy'
  },
  {
    id: 'about',
    name: '关于我们',
    icon: 'fa-info-circle',
    path: '/about'
  }
]);

// 跳转到具体设置页面
const navigateToSetting = (path: string) => {
  router.push(path);
};

// 返回上一页
const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="settings-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <i class="fas fa-chevron-left"></i>
      </div>
      <div class="header-title">设置</div>
      <div class="header-right"></div>
    </div>
    
    <!-- 设置选项列表 -->
    <div class="settings-list">
      <div 
        v-for="option in settingOptions" 
        :key="option.id"
        class="setting-item"
        @click="navigateToSetting(option.path)"
      >
        <div class="setting-icon">
          <i :class="['fas', option.icon]"></i>
        </div>
        <div class="setting-name">{{ option.name }}</div>
        <div class="setting-action">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>
    
    <!-- 底部版本信息 -->
    <div class="app-version">
      <span>Focus应用版本 1.0.0</span>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.settings-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F2F2F7;
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #FFFFFF;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.header-left, .header-right {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.header-left:active, .header-right:active {
  transform: scale(0.9);
  opacity: 0.7;
}

/* 设置列表 */
.settings-list {
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  border-radius: 12px;
  margin: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background-color: rgba(0, 0, 0, 0.02);
}

.setting-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #F2F2F7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  font-size: 16px;
  margin-right: 12px;
}

.setting-name {
  flex: 1;
  font-size: 16px;
  color: #000000;
}

.setting-action {
  color: #C7C7CC;
  font-size: 14px;
}

/* 底部版本信息 */
.app-version {
  text-align: center;
  padding: 20px 0;
  margin-top: auto;
  color: #8E8E93;
  font-size: 13px;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 