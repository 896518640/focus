<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/stores/user';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { getUserProfileApi, updateUserProfileApi } from '@/api/users';
import SimultaneousSettings from '@/components/SimultaneousSettings.vue';

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

// 页面状态
const isLoading = ref(false);
const pageLoaded = ref(false);
const avatarHovered = ref(false);

// 同传设置弹窗
const showSimultaneousSettings = ref(false);
const sourceLanguage = ref('cn');
const targetLanguage = ref('en');

// 处理语言变更
const handleSourceLanguageChange = (lang: string) => {
  sourceLanguage.value = lang;
};

const handleTargetLanguageChange = (lang: string) => {
  targetLanguage.value = lang;
};

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
      console.warn('API返回数据为空，使用模拟数据');
      // 使用模拟数据
      useMockData();
      
      showToast({
        message: '获取用户资料失败，使用模拟数据',
        position: 'bottom',
      });
    }
  } catch (error: any) {
    console.error('获取用户资料出错:', error);
    // 使用模拟数据
    useMockData();
    
    showToast({
      message: error.message || '网络错误，使用模拟数据',
      position: 'bottom',
    });
  } finally {
    isLoading.value = false;
    closeToast();
    
    // 设置页面已加载状态，触发显示动画
    setTimeout(() => {
      pageLoaded.value = true;
    }, 100);
  }
};

// 使用模拟数据
const useMockData = () => {
  userInfo.value = {
    id: 'mock-id-123',
    displayName: '测试用户',
    email: 'test@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    role: '普通用户',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    usageStats: {
      studyHours: 12,
      recognitionCount: 56,
      fileCount: 15,
      translationCount: 84
    }
  };
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

// 打开同传设置
const openSimultaneousSettings = () => {
  showSimultaneousSettings.value = true;
};

// 页面加载时获取用户资料
onMounted(async () => {
  try {
    await fetchUserProfile();
  } catch (error) {
    console.error('加载用户资料失败:', error);
    // 即使API请求失败，也设置页面为已加载状态，以显示页面
    pageLoaded.value = true;
  }
  
  setTimeout(() => {
    statsLoaded.value = true;
  }, 300);
  
  setTimeout(() => {
    activityLoaded.value = true;
  }, 600);
});
</script>

<template>
  <div class="profile-page" :class="{ 'page-loaded': pageLoaded }">
    <!-- 顶部导航栏 -->
    <!-- <div class="header">
      <div class="header-left">
        <i class="fas fa-cog animate-spin-hover" @click="router.push('/settings')"></i>
      </div>
      <div class="header-title">个人中心</div>
      <div class="header-right">
        <i class="fas fa-bell animate-shake-hover" @click="router.push('/notifications')"></i>
      </div>
    </div> -->
    
    <!-- 用户信息卡片 -->
    <div class="user-card card-shadow">
      <div class="profile-bg-pattern"></div>
      <div class="user-info">
        <div class="user-avatar" 
          @click="editAvatar" 
          @mouseenter="avatarHovered = true" 
          @mouseleave="avatarHovered = false">
          <div class="avatar-border" :class="{ 'avatar-hovered': avatarHovered }"></div>
          <i v-if="!userInfo.avatar" class="fas fa-user-circle avatar-icon"></i>
          <img v-else :src="userInfo.avatar" alt="用户头像" class="avatar-img">
          <div class="avatar-edit-badge" :class="{ 'badge-hovered': avatarHovered }">
            <i class="fas fa-camera"></i>
          </div>
        </div>
        <div class="user-details">
          <div class="user-name">{{ userInfo.displayName }}</div>
          <div class="user-email">{{ userInfo.email }}</div>
          <div class="user-role" v-if="userInfo.role">{{ userInfo.role }}</div>
        </div>
        <div class="edit-profile" @click="navigateToSetting('/settings/account')">
          <i class="fas fa-edit"></i>
          <span>编辑</span>
        </div>
      </div>
      
      <!-- 使用统计 -->
      <div class="stats-grid">
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
          <div class="stats-icon-container">
            <i class="fas fa-clock stats-icon"></i>
          </div>
          <div class="stats-value">{{ userInfo.usageStats.studyHours }}h</div>
          <div class="stats-label">学习时长</div>
        </div>
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }" style="transition-delay: 0.1s">
          <div class="stats-icon-container">
            <i class="fas fa-microphone stats-icon"></i>
          </div>
          <div class="stats-value">{{ userInfo.usageStats.recognitionCount }}</div>
          <div class="stats-label">识别次数</div>
        </div>
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }" style="transition-delay: 0.2s">
          <div class="stats-icon-container">
            <i class="fas fa-language stats-icon"></i>
          </div>
          <div class="stats-value">{{ userInfo.usageStats.translationCount }}</div>
          <div class="stats-label">翻译次数</div>
        </div>
      </div>
      
      <!-- 新增功能入口区域 -->
      <div class="quick-actions">
        <div class="action-item" @click="openSimultaneousSettings">
          <div class="action-icon">
            <i class="fas fa-headset"></i>
          </div>
          <div class="action-name">同传设置</div>
        </div>
        
        <div class="action-item" @click="router.push('/membership')">
          <div class="action-icon premium-icon">
            <i class="fas fa-crown"></i>
          </div>
          <div class="action-name">升级套餐</div>
        </div>
        
        <div class="action-item" @click="router.push('/settings')">
          <div class="action-icon">
            <i class="fas fa-cog"></i>
          </div>
          <div class="action-name">更多设置</div>
        </div>
      </div>
      
      <!-- 用户信息摘要 -->
      <div class="membership-card card-shadow">
        <div class="membership-info">
          <div class="membership-title">
            <i class="fas fa-user-shield"></i>
            <span>账号信息</span>
          </div>
          <div class="membership-desc">
            <i class="fas fa-calendar-alt"></i>
            <span>加入时间: {{ formattedCreatedAt }}</span>
          </div>
          <div class="membership-desc">
            <i class="fas fa-hourglass-half"></i>
            <span>已加入 {{ joinDays }} 天</span>
          </div>
        </div>
        <div class="membership-action">
          <button class="renew-btn" @click="navigateToSetting('/settings/account')">
            <span>账号设置</span>
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 最近活动 -->
    <div class="recent-activities card-shadow">
      <div class="section-header">
        <div class="section-title">
          <i class="fas fa-history"></i>
          <span>最近活动</span>
        </div>
        <div class="section-action" @click="viewAllActivities">
          <span>查看全部</span>
          <i class="fas fa-angle-right"></i>
        </div>
      </div>
      <div class="activities-list">
        <div 
          v-for="(activity, index) in recentActivities" 
          :key="activity.id"
          class="activity-item card-shadow-sm"
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
          <div class="activity-arrow">
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 功能入口区域 -->
    <div class="features-section card-shadow">
      <div class="section-header">
        <div class="section-title">
          <i class="fas fa-th-large"></i>
          <span>功能与设置</span>
        </div>
      </div>
      
      <div class="features-grid">
        <div class="feature-item" @click="router.push('/settings')">
          <div class="feature-icon">
            <i class="fas fa-cog"></i>
          </div>
          <div class="feature-name">设置</div>
        </div>
        
        <div class="feature-item" @click="router.push('/settings/account')">
          <div class="feature-icon">
            <i class="fas fa-user-cog"></i>
          </div>
          <div class="feature-name">账号</div>
        </div>
        
        <div class="feature-item" @click="router.push('/notifications')">
          <div class="feature-icon">
            <i class="fas fa-bell"></i>
          </div>
          <div class="feature-name">通知</div>
        </div>
        
        <div class="feature-item" @click="router.push('/privacy')">
          <div class="feature-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div class="feature-name">隐私</div>
        </div>
      </div>
    </div>
    
    <!-- 底部选项 -->
    <div class="bottom-options card-shadow">
      <div class="option-item" @click="router.push('/help')">
        <div class="option-icon">
          <i class="fas fa-question-circle"></i>
        </div>
        <span>帮助中心</span>
      </div>
      <div class="option-item" @click="router.push('/feedback')">
        <div class="option-icon">
          <i class="fas fa-comment-alt"></i>
        </div>
        <span>意见反馈</span>
      </div>
      <div class="option-item" @click="router.push('/about')">
        <div class="option-icon">
          <i class="fas fa-info-circle"></i>
        </div>
        <span>关于我们</span>
      </div>
    </div>
    
    <!-- 退出登录 -->
    <div class="logout-container">
      <button class="logout-btn" @click="logout">
        <i class="fas fa-sign-out-alt"></i>
        <span>退出登录</span>
      </button>
    </div>
    
    <!-- 同传设置弹窗 -->
    <SimultaneousSettings
      v-model:show="showSimultaneousSettings"
      :source-language="sourceLanguage"
      :target-language="targetLanguage"
      @source-language-change="handleSourceLanguageChange"
      @target-language-change="handleTargetLanguageChange"
    />
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
  opacity: 0.5;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.page-loaded {
  opacity: 1;
  transform: translateY(0);
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
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  background: linear-gradient(45deg, #007AFF, #5856D6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
  border-radius: 50%;
  transition: all 0.3s ease;
}

.header-left:active, .header-right:active {
  transform: scale(0.9);
  background-color: rgba(0, 122, 255, 0.1);
}

.animate-spin-hover:hover {
  animation: spin 1s ease;
}

.animate-shake-hover:hover {
  animation: shake 0.5s ease;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px) rotate(-5deg); }
  75% { transform: translateX(3px) rotate(5deg); }
}

/* 卡片阴影 */
.card-shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card-shadow:active {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transform: translateY(2px);
}

.card-shadow-sm {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.card-shadow-sm:active {
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  transform: scale(0.99);
}

/* 用户卡片 */
.user-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.5s ease;
}

.profile-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(45deg, #EDF2FF, #E0EAFF);
  opacity: 0.8;
  z-index: 0;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.user-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: visible;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.avatar-border {
  position: absolute;
  top: -4px;
  left: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  border-radius: 50%;
  border: 2px solid transparent;
  background: linear-gradient(45deg, #007AFF, #5856D6) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.avatar-hovered {
  transform: scale(1.1);
  opacity: 1;
}

.user-avatar:active {
  transform: scale(0.95);
}

.avatar-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 70px;
  color: #C7C7CC;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-edit-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(45deg, #007AFF, #5856D6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
  transform: scale(1);
  transition: all 0.3s ease;
}

.badge-hovered {
  transform: scale(1.1);
  opacity: 1;
}

.user-details {
  margin-left: 16px;
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 700;
  color: #000000;
  margin-bottom: 4px;
  background: linear-gradient(45deg, #000000, #333333);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.user-role {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  background: linear-gradient(45deg, #34C759, #32D74B);
  color: white;
  border-radius: 12px;
}

.edit-profile {
  padding: 6px;
  border-radius: 16px;
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.1));
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.edit-profile:active {
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.2), rgba(88, 86, 214, 0.2));
  transform: scale(0.95);
}

/* 使用统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stats-item {
  background: linear-gradient(45deg, #FFFFFF, #F8F8FA);
  border-radius: 16px;
  padding: 16px 10px;
  text-align: center;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.5s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.stats-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.stats-item.stats-loaded {
  opacity: 1;
  transform: translateY(0);
}

.stats-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.1));
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-icon {
  font-size: 18px;
  color: #007AFF;
}

.stats-value {
  font-size: 20px;
  font-weight: 700;
  color: #007AFF;
  margin-bottom: 6px;
  background: linear-gradient(45deg, #007AFF, #5856D6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-label {
  font-size: 12px;
  color: #8E8E93;
}

/* 快速功能入口 */
.quick-actions {
  display: flex;
  justify-content: space-between;
  background: linear-gradient(45deg, #F9F9FC, #F4F4F8);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  animation: slideInUp 0.6s ease;
  animation-delay: 0.1s;
  opacity: 0;
  animation-fill-mode: forwards;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 30%;
}

.action-item:active {
  background-color: rgba(0, 0, 0, 0.02);
  transform: translateY(3px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #007AFF;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 122, 255, 0.1);
}

.premium-icon {
  background: linear-gradient(45deg, rgba(255, 184, 0, 0.15), rgba(255, 204, 0, 0.15));
  color: #FF9500;
  box-shadow: 0 4px 10px rgba(255, 149, 0, 0.1);
}

.action-item:active .action-icon {
  transform: scale(0.9);
}

.action-name {
  font-size: 13px;
  font-weight: 600;
  color: #1C1C1E;
  text-align: center;
}

/* 会员信息卡片 */
.membership-card {
  background: linear-gradient(45deg, #F8F9FA, #E7F0FF);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  position: relative;
  overflow: hidden;
}

.membership-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.4));
  transform: rotate(45deg) translate(20px, -60px);
}

.membership-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.membership-title i {
  color: #007AFF;
}

.membership-desc {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #636366;
  margin-bottom: 4px;
}

.membership-desc i {
  color: #8E8E93;
  font-size: 12px;
}

.renew-btn {
  padding: 8px 16px;
  border-radius: 20px;
  background: linear-gradient(45deg, #007AFF, #5856D6);
  color: white;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.renew-btn:active {
  transform: scale(0.95);
  background: linear-gradient(45deg, #0062CC, #4744B7);
}

/* 最近活动 */
.recent-activities {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px;
  padding: 20px;
  animation: slideInUp 0.5s ease;
  animation-delay: 0.2s;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.section-title i {
  color: #007AFF;
}

.section-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.section-action:active {
  transform: translateX(3px);
  opacity: 0.8;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.5s ease;
}

.activity-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.activity-item.activity-loaded {
  opacity: 1;
  transform: translateY(0);
}

.activity-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #007AFF;
  font-size: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 15px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 13px;
  color: #8E8E93;
}

.activity-arrow {
  color: #C7C7CC;
  font-size: 14px;
}

/* 底部选项 */
.bottom-options {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  margin: 16px;
  background-color: #FFFFFF;
  border-radius: 16px;
  animation: slideInUp 0.5s ease;
  animation-delay: 0.3s;
}

.option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 30%;
}

.option-item:active {
  background-color: rgba(0, 0, 0, 0.02);
  transform: scale(0.95);
}

.option-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.option-item i {
  font-size: 20px;
  color: #007AFF;
}

.option-item span {
  font-size: 13px;
  color: #000000;
  font-weight: 500;
}

/* 退出登录 */
.logout-container {
  padding: 0 16px;
  margin-top: 16px;
  animation: slideInUp 0.5s ease;
  animation-delay: 0.4s;
}

.logout-btn {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(45deg, #FF3B30, #FF453A);
  color: white;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(255, 59, 48, 0.2);
}

.logout-btn:active {
  background: linear-gradient(45deg, #D83028, #E03C33);
  transform: scale(0.98);
  box-shadow: 0 2px 5px rgba(255, 59, 48, 0.3);
}

/* 动画 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* 设置按钮 */
.settings-button {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 2;
  transition: all 0.3s ease;
}

.settings-button:active {
  transform: scale(0.9) rotate(45deg);
  background-color: rgba(0, 122, 255, 0.1);
}

/* 功能入口区域 */
.features-section {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px;
  padding: 20px;
  animation: slideInUp 0.5s ease;
  animation-delay: 0.15s;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-item:active {
  background-color: rgba(0, 0, 0, 0.02);
  transform: scale(0.95);
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  font-size: 18px;
  transition: all 0.3s ease;
}

.feature-item:active .feature-icon {
  transform: scale(0.9);
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.2), rgba(88, 86, 214, 0.2));
}

.feature-name {
  font-size: 12px;
  color: #000000;
  font-weight: 500;
}

/* 确保在小屏幕上正确显示 */
@media (max-width: 360px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .quick-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-item {
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .action-name {
    text-align: left;
  }
}
</style>
