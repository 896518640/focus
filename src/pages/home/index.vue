<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 功能卡片数据
const features = [
  { 
    id: 'recognition', 
    title: '实时语音识别', 
    description: '将课堂讲解转为文本', 
    icon: 'fa-microphone', 
    color: '#FF2D55',
    path: '/recognition'
  },
  // { 
  //   id: 'upload', 
  //   title: '录音上传', 
  //   description: '上传音频文件转为文本', 
  //   icon: 'fa-cloud-upload-alt', 
  //   color: '#007AFF',
  //   path: '/upload'
  // },
  // { 
  //   id: 'translate', 
  //   title: '机器翻译', 
  //   description: '将英文文本翻译成中文', 
  //   icon: 'fa-language', 
  //   color: '#4CD964',
  //   path: '/translate'
  // },
  // { 
  //   id: 'summary', 
  //   title: '课程摘要', 
  //   description: '生成课程内容摘要', 
  //   icon: 'fa-file-alt', 
  //   color: '#FF9500',
  //   path: '/summary'
  // },
  { 
    id: 'simultaneous', 
    title: '同传', 
    description: '实时翻译语音内容', 
    icon: 'fa-headset', 
    color: '#4169E1',
    path: '/simultaneous'
  },
  { 
    id: 'translate-demo', 
    title: '实时翻译演示', 
    description: '通义听悟API实时翻译', 
    icon: 'fa-language', 
    color: '#FF3B30',
    path: '/translate-demo'
  }
];

// 最近使用数据
const recentItems = ref([
  {
    id: 1,
    title: '国际贸易课程摘要',
    info: '生成了摘要 • 3月21日',
    icon: 'fa-file-alt'
  },
  {
    id: 2,
    title: '经济学原理录音',
    info: '完成转录 • 3月20日',
    icon: 'fa-headphones'
  },
  {
    id: 3,
    title: '市场营销策略',
    info: '完成翻译 • 3月18日',
    icon: 'fa-language'
  }
]);

// 跳转到功能页面
const navigateToFeature = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="home-page">
    <!-- 顶部标题栏 -->
    <div class="header">
      <div class="header-logo">
        <div class="logo-icon">
          <i class="fas fa-bullseye"></i>
        </div>
        <div class="logo-text">Focus</div>
      </div>
      <div class="header-actions">
        <button class="header-button">
          <i class="fas fa-bell"></i>
        </button>
        <button class="header-button" @click="router.push('/profile')">
          <i class="fas fa-user-circle"></i>
        </button>
      </div>
    </div>
    
    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 欢迎区域 -->
      <div class="welcome-section">
        <h1 class="welcome-title">下午好，同学</h1>
        <p class="welcome-subtitle">今天是学习的好日子！</p>
        <div class="search-bar">
          <div class="search-icon">
            <i class="fas fa-search"></i>
          </div>
          <input type="text" class="search-input" placeholder="搜索文件或记录...">
        </div>
      </div>
      
      <!-- 功能卡片 -->
      <div class="features-grid">
        <div 
          v-for="feature in features" 
          :key="feature.id" 
          class="feature-card"
          @click="navigateToFeature(feature.path)"
        >
          <div class="feature-icon" :style="{ backgroundColor: feature.color }">
            <i :class="['fas', feature.icon]"></i>
          </div>
          <div class="feature-title">{{ feature.title }}</div>
          <div class="feature-description">{{ feature.description }}</div>
        </div>
      </div>
      
      <!-- 最近使用 -->
      <div class="recent-section">
        <div class="section-header">
          <div class="section-title">最近使用</div>
          <div class="section-more" @click="router.push('/history')">查看全部</div>
        </div>
        <div class="recent-list">
          <div 
            v-for="item in recentItems" 
            :key="item.id" 
            class="recent-item"
          >
            <div class="recent-icon">
              <i :class="['fas', item.icon]"></i>
            </div>
            <div class="recent-content">
              <div class="recent-title">{{ item.title }}</div>
              <div class="recent-info">{{ item.info }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 顶部标题栏 */
.header {
  background-color: #FFFFFF;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
}

.header-logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 24px;
  color: #007AFF;
  margin-right: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
}

.header-button {
  color: #007AFF;
  background: none;
  border: none;
  font-size: 18px;
  padding: 8px;
  margin-left: 15px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.header-button:active {
  background-color: rgba(0, 122, 255, 0.1);
}

/* 主要内容区 */
.main-content {
  padding: 16px;
}

/* 欢迎区域 */
.welcome-section {
  background-color: #FFFFFF;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 16px;
  color: #8E8E93;
  margin: 0 0 20px 0;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #F5F5F5;
  border-radius: 12px;
  padding: 10px 16px;
}

.search-icon {
  color: #8E8E93;
  margin-right: 10px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  color: #000000;
  outline: none;
}

.search-input::placeholder {
  color: #8E8E93;
}

/* 功能卡片 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.feature-card {
  background-color: #FFFFFF;
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.feature-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.feature-icon i {
  font-size: 20px;
  color: #FFFFFF;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.feature-description {
  font-size: 13px;
  color: #8E8E93;
}

/* 最近使用 */
.recent-section {
  background-color: #FFFFFF;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
}

.section-more {
  font-size: 14px;
  color: #007AFF;
  cursor: pointer;
}

.section-more:active {
  opacity: 0.8;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background-color: #F5F5F5;
  transition: background-color 0.2s ease;
}

.recent-item:active {
  background-color: #EBEBEB;
}

.recent-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.recent-icon i {
  font-size: 18px;
  color: #FFFFFF;
}

.recent-content {
  flex: 1;
}

.recent-title {
  font-size: 15px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 4px;
}

.recent-info {
  font-size: 13px;
  color: #8E8E93;
}
</style>
