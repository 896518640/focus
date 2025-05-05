<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/stores/user';

const router = useRouter();
const userStore = useUserStore();

// 设置选项分组列表
const settingGroups = ref([
  {
    id: 'account',
    title: '账号',
    items: [
      {
        id: 'profile',
        name: '个人信息',
        icon: 'fa-user-circle',
        path: '/settings/account',
        iconColor: '#007AFF',
        description: userStore.username || '未登录',
      },
      {
        id: 'notifications',
        name: '通知与声音',
        icon: 'fa-bell',
        path: '/settings/notification',
        iconColor: '#FF9500',
        toggleState: true
      }
    ]
  },
  {
    id: 'app',
    title: '应用设置',
    items: [
      {
        id: 'language',
        name: '语言',
        icon: 'fa-language',
        path: '/settings/language',
        iconColor: '#5856D6',
        description: '简体中文'
      },
      {
        id: 'theme',
        name: '外观',
        icon: 'fa-moon',
        path: '/settings/theme',
        iconColor: '#34C759',
        description: '跟随系统'
      },
      {
        id: 'privacy',
        name: '隐私与安全',
        icon: 'fa-shield-alt',
        path: '/settings/privacy',
        iconColor: '#FF2D55'
      }
    ]
  },
  {
    id: 'support',
    title: '支持',
    items: [
      {
        id: 'help',
        name: '帮助与反馈',
        icon: 'fa-question-circle',
        path: '/help',
        iconColor: '#5AC8FA'
      },
      {
        id: 'about',
        name: '关于',
        icon: 'fa-info-circle',
        path: '/about',
        iconColor: '#AF52DE'
      }
    ]
  }
]);

// 动画状态
const animations = reactive({
  pageEntered: false,
  headerAnimated: false,
  groupsAnimated: Array(settingGroups.value.length).fill(false)
});

// 跳转到具体设置页面
const navigateToSetting = (path: string) => {
  // 触觉反馈（如果可用）
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  
  // 添加转场动画类
  animations.pageEntered = false;
  
  // 延迟导航以等待动画
  setTimeout(() => {
    router.push(path);
  }, 150);
};

// 返回上一页
const goBack = () => {
  // 触觉反馈（如果可用）
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  
  // 添加离场动画
  animations.pageEntered = false;
  
  // 延迟导航以等待动画
  setTimeout(() => {
    router.back();
  }, 150);
};

// 切换开关状态
const toggleSetting = (item: any, event: Event) => {
  event.stopPropagation();
  item.toggleState = !item.toggleState;
  
  // 触觉反馈（如果可用）
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

onMounted(() => {
  // 页面加载时的入场动画序列
  setTimeout(() => {
    animations.pageEntered = true;
  }, 50);
  
  setTimeout(() => {
    animations.headerAnimated = true;
  }, 200);
  
  // 依次显示各组设置
  settingGroups.value.forEach((_, index) => {
    setTimeout(() => {
      animations.groupsAnimated[index] = true;
    }, 300 + index * 150);
  });
});
</script>

<template>
  <div class="settings-page" :class="{ 'page-entered': animations.pageEntered }">
    <!-- 顶部导航栏 -->
    <div class="header" :class="{ 'header-animated': animations.headerAnimated }">
      <div class="header-left" @click="goBack">
        <i class="fas fa-chevron-left"></i>
        <span>返回</span>
      </div>
      <div class="header-title">设置</div>
      <div class="header-right"></div>
    </div>
    
    <div class="settings-content">
      <!-- 设置组 -->
      <div 
        v-for="(group, groupIndex) in settingGroups" 
        :key="group.id"
        class="settings-group"
        :class="{ 'group-animated': animations.groupsAnimated[groupIndex] }"
        :style="{ animationDelay: `${groupIndex * 0.05}s` }"
      >
        <div class="group-title">{{ group.title }}</div>
        
        <div class="settings-list">
          <div 
            v-for="(item, itemIndex) in group.items" 
            :key="item.id"
            class="setting-item"
            @click="navigateToSetting(item.path)"
            :style="{ animationDelay: `${itemIndex * 0.05 + 0.1}s` }"
          >
            <div class="setting-icon" :style="{ backgroundColor: `${item.iconColor}20`, color: item.iconColor }">
              <i :class="['fas', item.icon]"></i>
            </div>
            
            <div class="setting-content">
              <div class="setting-name">{{ item.name }}</div>
              <div class="setting-description" v-if="item.description">{{ item.description }}</div>
            </div>
            
            <!-- 开关按钮 -->
            <div v-if="'toggleState' in item" class="setting-toggle" @click.stop="toggleSetting(item, $event)">
              <div class="toggle-track" :class="{ 'toggle-active': item.toggleState }">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            
            <!-- 箭头 -->
            <div v-else class="setting-action">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部版本信息 -->
    <div class="app-version" :class="{ 'version-animated': animations.pageEntered }">
      <span>Focus 1.0.0</span>
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
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.page-entered {
  opacity: 1;
  transform: translateY(0);
}

/* 内容区域 */
.settings-content {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.13, 0.82, 0.31, 1), opacity 0.3s ease;
}

.header-animated {
  transform: translateY(0);
  opacity: 1;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  transition: transform 0.2s ease;
}

.header-left {
  display: flex;
  align-items: center;
  color: #007AFF;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.header-left span {
  margin-left: 4px;
}

.header-left:active, .header-right:active {
  opacity: 0.7;
}

.header-right {
  width: 70px;
}

/* 设置组 */
.settings-group {
  margin: 8px 16px 24px;
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.group-animated {
  opacity: 1;
  transform: translateY(0);
}

.group-title {
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 8px;
  padding: 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* 设置列表 */
.settings-list {
  background-color: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  cursor: pointer;
  transition: background-color 0.2s ease;
  animation: slideInRight 0.4s ease both;
  animation-play-state: paused;
}

.group-animated .setting-item {
  animation-play-state: running;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.setting-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 15px;
  transition: transform 0.3s ease;
}

.setting-item:active .setting-icon {
  transform: scale(0.95);
}

.setting-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.setting-name {
  font-size: 16px;
  color: #000000;
  margin-bottom: 2px;
}

.setting-description {
  font-size: 14px;
  color: #8E8E93;
}

.setting-action {
  color: #C7C7CC;
  font-size: 14px;
  margin-left: 8px;
  transition: transform 0.2s ease;
}

.setting-item:active .setting-action {
  transform: translateX(3px);
}

/* 开关样式 */
.setting-toggle {
  margin-left: 12px;
}

.toggle-track {
  width: 51px;
  height: 31px;
  border-radius: 31px;
  background-color: #E9E9EA;
  position: relative;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.toggle-active {
  background-color: #34C759;
}

.toggle-thumb {
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background-color: #FFFFFF;
  position: absolute;
  left: 2px;
  top: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.toggle-active .toggle-thumb {
  transform: translateX(20px);
}

/* 底部版本信息 */
.app-version {
  text-align: center;
  padding: 20px 0;
  color: #8E8E93;
  font-size: 13px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
  transition-delay: 0.6s;
}

.version-animated {
  opacity: 1;
  transform: translateY(0);
}

/* 动画 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .settings-page {
    background-color: #1C1C1E;
  }
  
  .header {
    background-color: rgba(28, 28, 30, 0.9);
    border-bottom-color: rgba(60, 60, 65, 0.5);
  }
  
  .header-title {
    color: #FFFFFF;
  }
  
  .settings-list {
    background-color: #2C2C2E;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .setting-name {
    color: #FFFFFF;
  }
  
  .setting-item {
    border-bottom-color: rgba(60, 60, 65, 0.5);
  }
  
  .toggle-track {
    background-color: #3A3A3C;
  }
}
</style> 