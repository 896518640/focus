<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/stores/user';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { getUserProfileApi, updateUserProfileApi } from '@/api/users';

const router = useRouter();
const userStore = useUserStore();

// 用户信息
const userInfo = ref({
  id: '',
  displayName: '',
  email: '',
  avatar: '',
  role: '',
  createdAt: '',
  lastLoginAt: '',
  usageStats: {
    studyHours: 0,
    recognitionCount: 0,
    fileCount: 0,
    translationCount: 0
  }
});

// 计算属性：格式化创建时间
const formattedCreatedAt = computed(() => {
  if (!userInfo.value.createdAt) return '';
  
  const date = new Date(userInfo.value.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
});

// 计算属性：加入天数
const joinDays = computed(() => {
  if (!userInfo.value.createdAt) return 0;
  
  const createdDate = new Date(userInfo.value.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// 最近活动数据
const recentActivities = ref([
  {
    id: 1,
    title: '完成了语音识别',
    time: '今天',
    icon: 'fa-microphone',
    iconBg: '#E5F1FF'
  },
  {
    id: 2,
    title: '翻译了一段文本',
    time: '昨天',
    icon: 'fa-language',
    iconBg: '#E5F1FF'
  },
  {
    id: 3,
    title: '获取了AI总结',
    time: '前天',
    icon: 'fa-robot',
    iconBg: '#E5F1FF'
  }
]);

// 动画状态
const statsLoaded = ref(false);
const activityLoaded = ref(false);
const isLoading = ref(false);

// 获取用户详细资料
const fetchUserProfile = async () => {
  isLoading.value = true;
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
  });
  
  try {
    const res = await getUserProfileApi();
    console.log('用户资料API响应:', res);
    
    if (res.data) {
      const data = res.data;
      userInfo.value = {
        id: data.id,
        displayName: data.displayName,
        email: data.email,
        avatar: data.avatar || '',
        role: data.role,
        createdAt: data.createdAt,
        lastLoginAt: data.lastLoginAt || '',
        usageStats: {
          studyHours: data.usageStats?.studyHours || 0,
          recognitionCount: data.usageStats?.recognitionCount || 0,
          fileCount: data.usageStats?.fileCount || 0,
          translationCount: data.usageStats?.translationCount || 0
        }
      };
    } else {
      showToast({
        message: '获取用户资料失败',
        position: 'bottom',
      });
    }
  } catch (error: any) {
    console.error('获取用户资料出错:', error);
    showToast({
      message: error.message || '网络错误',
      position: 'bottom',
    });
  } finally {
    isLoading.value = false;
    closeToast();
  }
};

// 编辑用户头像
const editAvatar = async () => {
  // 实际应用中可以实现图片上传逻辑
  // 这里简化处理，使用一个随机头像
  const randomId = Math.floor(Math.random() * 100);
  const newAvatar = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${randomId}.jpg`;
  
  try {
    showLoadingToast({
      message: '更新中...',
      forbidClick: true,
    });
    
    const res = await updateUserProfileApi({
      avatar: newAvatar
    });
    
    if (res.data) {
      userInfo.value.avatar = newAvatar;
      showToast({
        message: '头像更新成功',
        position: 'bottom',
        type: 'success'
      });
    } else {
      showToast({
        message: '更新失败',
        position: 'bottom',
      });
    }
  } catch (error: any) {
    console.error('更新头像出错:', error);
    showToast({
      message: error.message || '网络错误',
      position: 'bottom',
    });
  } finally {
    closeToast();
  }
};

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
  userStore.logout();
  router.push('/login');
};

// 页面加载时获取用户资料
onMounted(async () => {
  await fetchUserProfile();
  
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
        <div class="user-avatar" @click="editAvatar">
          <i v-if="!userInfo.avatar" class="fas fa-user-circle"></i>
          <img v-else :src="userInfo.avatar" alt="用户头像">
          <div class="avatar-edit-badge">
            <i class="fas fa-camera"></i>
          </div>
        </div>
        <div class="user-details">
          <div class="user-name">{{ userInfo.displayName }}</div>
          <div class="user-email">{{ userInfo.email }}</div>
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
          <div class="stats-value">{{ userInfo.usageStats.translationCount }}</div>
          <div class="stats-label">翻译次数</div>
        </div>
      </div>
      
      <!-- 用户信息摘要 -->
      <div class="membership-card">
        <div class="membership-info">
          <div class="membership-title">账号信息</div>
          <div class="membership-desc">加入时间: {{ formattedCreatedAt }}</div>
          <div class="membership-desc">已加入 {{ joinDays }} 天</div>
        </div>
        <div class="membership-action">
          <button class="renew-btn" @click="navigateToSetting('/settings/account')">账号设置</button>
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
          v-for="(activity, index) in recentActivities" 
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background-color: #F2F2F7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.user-avatar:active {
  transform: scale(0.95);
}

.user-avatar > i {
  font-size: 64px;
  color: #C7C7CC;
}

.user-avatar > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: #007AFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.user-details {
  margin-left: 16px;
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 4px;
}

.user-email {
  font-size: 14px;
  color: #8E8E93;
}

.edit-profile {
  padding: 6px 12px;
  border-radius: 16px;
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-profile:active {
  background-color: rgba(0, 122, 255, 0.2);
  transform: scale(0.95);
}

/* 使用统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stats-item {
  background-color: #F2F2F7;
  border-radius: 12px;
  padding: 15px 10px;
  text-align: center;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.stats-item.stats-loaded {
  opacity: 1;
  transform: translateY(0);
}

.stats-value {
  font-size: 20px;
  font-weight: 700;
  color: #007AFF;
  margin-bottom: 6px;
}

.stats-label {
  font-size: 12px;
  color: #8E8E93;
}

/* 会员信息卡片 */
.membership-card {
  background: linear-gradient(135deg, #F8F9FA 0%, #E7F0FF 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.membership-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 6px;
}

.membership-desc {
  font-size: 13px;
  color: #636366;
  margin-bottom: 3px;
}

.renew-btn {
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #007AFF;
  color: white;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.renew-btn:active {
  background-color: #0062CC;
  transform: scale(0.95);
}

/* 最近活动 */
.recent-activities {
  background-color: #FFFFFF;
  border-radius: 12px;
  margin: 16px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  animation: cardFadeIn 0.5s ease;
  animation-delay: 0.2s;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.section-action {
  font-size: 14px;
  color: #007AFF;
  cursor: pointer;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.activity-item.activity-loaded {
  opacity: 1;
  transform: translateY(0);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #007AFF;
  font-size: 16px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 15px;
  color: #000000;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 13px;
  color: #8E8E93;
}

/* 底部选项 */
.bottom-options {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  margin: 16px;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  animation: cardFadeIn 0.5s ease;
  animation-delay: 0.3s;
}

.option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.option-item i {
  font-size: 24px;
  color: #007AFF;
}

.option-item span {
  font-size: 13px;
  color: #8E8E93;
}

/* 退出登录 */
.logout-container {
  padding: 0 16px;
  margin-top: 16px;
  animation: cardFadeIn 0.5s ease;
  animation-delay: 0.4s;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background-color: #FF3B30;
  color: white;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:active {
  background-color: #D83028;
  transform: scale(0.98);
}

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
</style>
