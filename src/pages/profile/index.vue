<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/stores/user';

const router = useRouter();
const userStore = useUserStore();

// 用户信息
const userInfo = ref({
  name: '张明',
  email: 'zhangming@example.com',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  membership: 'Focus会员',
  membershipDays: 25,
  usageStats: {
    studyHours: 24,
    recognitionCount: 128,
    fileCount: 36
  },
  recentActivities: [
    {
      id: 1,
      title: '完成了30分钟的语音识别',
      time: '今天 14:30',
      icon: 'fa-microphone',
      iconBg: '#E5F1FF'
    },
    {
      id: 2,
      title: '上传了一个音频文件',
      time: '昨天 16:45',
      icon: 'fa-file-audio',
      iconBg: '#E5F1FF'
    },
    {
      id: 3,
      title: '获得了一篇课程摘要',
      time: '3月21日 10:15',
      icon: 'fa-file-alt',
      iconBg: '#E5F1FF'
    }
  ]
});
// const userInfo = ref(userStore.getUserInfo());


// 动画状态
const statsLoaded = ref(false);
const activityLoaded = ref(false);

// 跳转到设置页面
const navigateToSetting = (path: string) => {
  router.push(path);
};

// 续费会员
const renewMembership = () => {
  router.push('/membership');
};

// 查看全部活动
const viewAllActivities = () => {
  router.push('/activities');
};

// 退出登录
const logout = () => {
  // 实际应用中应该调用登出API
  userStore.logout();
  router.push('/login');
  
};

// 页面加载动画
onMounted(() => {
  setTimeout(() => {
    statsLoaded.value = true;
  }, 300);
  
  setTimeout(() => {
    activityLoaded.value = true;
  }, 600);
});
</script>

<template>
  <div class="profile-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <i class="fas fa-cog" @click="router.push('/settings')"></i>
      </div>
      <div class="header-title">个人中心</div>
      <div class="header-right">
        <i class="fas fa-bell" @click="router.push('/notifications')"></i>
      </div>
    </div>
    
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-info">
        <div class="user-avatar">
          <i v-if="!userInfo.avatar" class="fas fa-user-circle"></i>
          <img v-else :src="userInfo.avatar" alt="用户头像">
        </div>
        <div class="user-details">
          <div class="user-name">{{ userInfo.name }}</div>
          <div class="user-role">Focus会员</div>
        </div>
        <div class="edit-profile" @click="navigateToSetting('/settings/account')">
          <span>编辑</span>
        </div>
      </div>
      
      <!-- 使用统计 -->
      <div class="stats-grid">
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
          <div class="stats-value">{{ userInfo.usageStats.studyHours }}h</div>
          <div class="stats-label">学习时长</div>
        </div>
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }" style="transition-delay: 0.1s">
          <div class="stats-value">{{ userInfo.usageStats.recognitionCount }}</div>
          <div class="stats-label">识别次数</div>
        </div>
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }" style="transition-delay: 0.2s">
          <div class="stats-value">{{ userInfo.usageStats.fileCount }}</div>
          <div class="stats-label">文件数量</div>
        </div>
      </div>
      
      <!-- 会员信息 -->
      <div class="membership-card">
        <div class="membership-info">
          <div class="membership-title">Focus高级会员</div>
          <div class="membership-desc">剩余{{ userInfo.membershipDays }}天 | 已解锁全部特权</div>
        </div>
        <div class="membership-action">
          <button class="renew-btn" @click="renewMembership">续费会员</button>
        </div>
      </div>
    </div>
    
    <!-- 最近活动 -->
    <div class="recent-activities">
      <div class="section-header">
        <div class="section-title">最近活动</div>
        <div class="section-action" @click="viewAllActivities">查看全部</div>
      </div>
      <div class="activities-list">
        <div 
          v-for="(activity, index) in userInfo.recentActivities" 
          :key="activity.id"
          class="activity-item"
          :class="{ 'activity-loaded': activityLoaded }"
          :style="{ 'transition-delay': `${0.1 * index}s` }"
        >
          <div class="activity-icon" :style="{ backgroundColor: activity.iconBg }">
            <i :class="['fas', activity.icon]"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部选项 -->
    <div class="bottom-options">
      <div class="option-item" @click="router.push('/help')">
        <i class="fas fa-question-circle"></i>
        <span>帮助中心</span>
      </div>
      <div class="option-item" @click="router.push('/feedback')">
        <i class="fas fa-comment-alt"></i>
        <span>意见反馈</span>
      </div>
      <div class="option-item" @click="router.push('/about')">
        <i class="fas fa-info-circle"></i>
        <span>关于我们</span>
      </div>
    </div>
    
    <!-- 退出登录 -->
    <div class="logout-container">
      <button class="logout-btn" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F2F2F7;
  padding-bottom: 80px;
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

/* 用户卡片 */
.user-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  margin: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  animation: cardFadeIn 0.5s ease;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.user-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #E5F1FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #007AFF;
  margin-right: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 4px;
}

.user-role {
  font-size: 14px;
  color: #8E8E93;
}

.edit-profile {
  padding: 8px 16px;
  background-color: #FFFFFF;
  border: 1px solid #007AFF;
  border-radius: 20px;
  color: #007AFF;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-profile:active {
  background-color: rgba(0, 122, 255, 0.1);
  transform: scale(0.95);
}

/* 使用统计 */
.stats-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 10px;
}

.stats-item {
  flex: 1;
  text-align: center;
  padding: 15px 10px;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.stats-loaded {
  opacity: 1;
  transform: translateY(0);
}

.stats-value {
  font-size: 22px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 13px;
  color: #8E8E93;
}

/* 会员卡片 */
.membership-card {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.membership-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.membership-desc {
  font-size: 13px;
  opacity: 0.9;
}

.renew-btn {
  background-color: #FFFFFF;
  color: #007AFF;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.renew-btn:active {
  opacity: 0.8;
  transform: scale(0.95);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 最近活动 */
.recent-activities {
  background-color: #FFFFFF;
  border-radius: 12px;
  margin: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  animation: cardFadeIn 0.5s ease 0.2s both;
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

.section-action {
  font-size: 14px;
  color: #007AFF;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.section-action:active {
  opacity: 0.7;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  opacity: 0;
  transform: translateX(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.activity-loaded {
  opacity: 1;
  transform: translateX(0);
}

.activity-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #007AFF;
  font-size: 16px;
  transition: transform 0.2s ease;
}

.activity-item:active .activity-icon {
  transform: scale(0.9);
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 16px;
  color: #000000;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 13px;
  color: #8E8E93;
}

/* 底部选项 */
.bottom-options {
  display: flex;
  justify-content: space-around;
  background-color: #FFFFFF;
  padding: 16px;
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  animation: cardFadeIn 0.5s ease 0.4s both;
}

.option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #8E8E93;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  padding: 10px;
}

.option-item:active {
  color: #007AFF;
  transform: scale(0.95);
}

.option-item i {
  font-size: 22px;
  margin-bottom: 8px;
}

/* 退出登录按钮 */
.logout-container {
  padding: 0 16px;
  margin-top: 16px;
  animation: cardFadeIn 0.5s ease 0.5s both;
}

.logout-btn {
  width: 100%;
  background-color: #FF3B30;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  padding: 15px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(255, 59, 48, 0.2);
}

.logout-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(255, 59, 48, 0.2);
}

/* 动画 */
@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* iOS风格的点击态 */
.ios-tap-highlight {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
}
</style>
