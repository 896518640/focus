<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/stores/user';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { getUserProfileApi, updateUserProfileApi } from '@/api/users';
import TranslationSettings from '@/components/common/TranslationSettings.vue';

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
    userInfo.value = {
      id: res.id,
      displayName: res.displayName,
      email: res.email,
      avatar: res.avatar || '',
      role: res.role,
      createdAt: res.createdAt,
      lastLoginAt: res.lastLoginAt || '',
      usageStats: {
        studyHours: res.usageStats?.studyHours || 0,
        recognitionCount: res.usageStats?.recognitionCount || 0,
        fileCount: res.usageStats?.fileCount || 0,
        translationCount: res.usageStats?.translationCount || 0
      }
    };
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
    
    userInfo.value.avatar = newAvatar;
    showToast({
      message: '头像更新成功',
      position: 'bottom',
      type: 'success'
    });
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
    <!-- 背景图案 -->
    <div class="background-pattern">
      <div class="pattern-bubble" v-for="n in 5" :key="n" :class="`bubble-${n}`"></div>
    </div>
    
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-info">
        <div class="user-avatar-wrapper" 
          @click="editAvatar" 
          @mouseenter="avatarHovered = true" 
          @mouseleave="avatarHovered = false">
          <div class="user-avatar" :class="{ 'avatar-hovered': avatarHovered }">
            <i v-if="!userInfo.avatar" class="fas fa-user avatar-icon"></i>
            <img v-else :src="userInfo.avatar" alt="用户头像" class="avatar-img">
            <div class="avatar-edit-overlay" :class="{ 'overlay-visible': avatarHovered }">
              <i class="fas fa-camera"></i>
            </div>
          </div>
        </div>
        <div class="user-details">
          <div class="user-name">{{ userInfo.displayName }}</div>
          <div class="user-email">{{ userInfo.email }}</div>
          <div class="user-membership">
            <i class="fas fa-crown"></i>
            <span>普通会员</span>
          </div>
        </div>
      </div>
      
      <!-- 编辑个人资料按钮 -->
      <button class="edit-profile-btn" @click="navigateToSetting('/settings/account')">
        <i class="fas fa-edit"></i>
        <span>编辑资料</span>
      </button>
      
      <!-- 使用统计 -->
      <div class="stats-container">
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
          <div class="stats-value">{{ userInfo.usageStats.studyHours }}<span class="stats-unit">h</span></div>
          <div class="stats-label">学习时长</div>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
          <div class="stats-value">{{ userInfo.usageStats.recognitionCount }}</div>
          <div class="stats-label">识别次数</div>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
          <div class="stats-value">{{ userInfo.usageStats.translationCount }}</div>
          <div class="stats-label">翻译次数</div>
        </div>
      </div>
    </div>
    
    <!-- 快捷功能 -->
    <div class="quick-actions">
      <div class="action-item" @click="openSimultaneousSettings">
        <div class="action-icon translation-icon">
          <i class="fas fa-language"></i>
        </div>
        <div class="action-name">同传设置</div>
      </div>
      
      <div class="action-item" @click="router.push('/membership')">
        <div class="action-icon membership-icon">
          <i class="fas fa-crown"></i>
        </div>
        <div class="action-name">升级套餐</div>
      </div>
      
      <div class="action-item" @click="router.push('/settings')">
        <div class="action-icon settings-icon">
          <i class="fas fa-cog"></i>
        </div>
        <div class="action-name">个人设置</div>
      </div>
    </div>
    
    <!-- 会员信息 -->
    <div class="membership-info-card">
      <div class="membership-header">
        <i class="fas fa-shield-alt"></i>
        <span>账号信息</span>
      </div>
      <div class="membership-details">
        <div class="membership-row">
          <div class="info-label">加入时间</div>
          <div class="info-value">{{ formattedCreatedAt }}</div>
        </div>
        <div class="membership-row">
          <div class="info-label">已加入</div>
          <div class="info-value">{{ joinDays }} 天</div>
        </div>
        <div class="membership-row">
          <div class="info-label">账号状态</div>
          <div class="info-value active">活跃</div>
        </div>
      </div>
      <div class="membership-actions">
        <button class="membership-action-btn" @click="navigateToSetting('/settings/account')">
          <span>账号设置</span>
          <i class="fas fa-chevron-right"></i>
        </button>
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
    <TranslationSettings
      v-model:show="showSimultaneousSettings"
      :source-language="sourceLanguage"
      :target-language="targetLanguage"
      title="同传设置"
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
  background-color: #f8f9fa;
  padding: 16px;
  padding-bottom: 80px;
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  position: relative;
  overflow: hidden;
}

.page-loaded {
  opacity: 1;
  transform: translateY(0);
}

/* 背景图案 */
.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: -1;
}

.pattern-bubble {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  opacity: 0.5;
  filter: blur(20px);
}

.bubble-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: -50px;
  animation: float 15s ease-in-out infinite;
}

.bubble-2 {
  width: 150px;
  height: 150px;
  top: 30%;
  left: -70px;
  animation: float 20s ease-in-out infinite reverse;
}

.bubble-3 {
  width: 250px;
  height: 250px;
  bottom: 10%;
  right: -70px;
  opacity: 0.3;
  animation: float 18s ease-in-out infinite;
  animation-delay: 2s;
}

.bubble-4 {
  width: 100px;
  height: 100px;
  bottom: 25%;
  left: 20%;
  opacity: 0.2;
  animation: float 12s ease-in-out infinite;
  animation-delay: 1s;
}

.bubble-5 {
  width: 180px;
  height: 180px;
  top: 45%;
  right: 10%;
  opacity: 0.15;
  animation: float 25s ease-in-out infinite reverse;
  animation-delay: 3s;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(10px, 10px) rotate(5deg); }
  50% { transform: translate(0, 15px) rotate(0deg); }
  75% { transform: translate(-10px, 5px) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

/* 用户卡片 */
.user-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  transform: translateY(30px);
  opacity: 0;
  animation: card-slide-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.2s;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar-wrapper {
  position: relative;
}

.user-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.3s ease;
}

.user-avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(45deg, #60a5fa, #7dd3fc);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.avatar-hovered {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.avatar-hovered::before {
  opacity: 1;
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
  font-size: 40px;
  color: #94a3b8;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.overlay-visible {
  opacity: 1;
  transform: scale(1);
}

.user-details {
  margin-left: 20px;
  flex: 1;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  background: linear-gradient(45deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-email {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 10px;
}

.user-membership {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: linear-gradient(45deg, rgba(96, 165, 250, 0.1), rgba(147, 197, 253, 0.1));
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #3b82f6;
}

.user-membership i {
  color: #3b82f6;
  font-size: 12px;
}

/* 编辑资料按钮 */
.edit-profile-btn {
  width: 100%;
  margin-top: 24px;
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(45deg, #3b82f6, #60a5fa);
  color: white;
  font-size: 15px;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.edit-profile-btn:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

/* 使用统计 */
.stats-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(45deg, #f1f5f9, #f8fafc);
  border-radius: 18px;
  padding: 16px;
}

.stats-item {
  flex: 1;
  text-align: center;
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}

.stats-item.stats-loaded {
  opacity: 1;
  transform: translateY(0);
}

.stats-item:nth-child(1) { transition-delay: 0.6s; }
.stats-item:nth-child(3) { transition-delay: 0.7s; }
.stats-item:nth-child(5) { transition-delay: 0.8s; }

.stats-divider {
  width: 1px;
  height: 30px;
  background-color: rgba(100, 116, 139, 0.2);
}

.stats-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 5px;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.stats-unit {
  font-size: 14px;
  font-weight: 500;
  margin-left: 2px;
  color: #64748b;
}

.stats-label {
  font-size: 13px;
  color: #64748b;
}

/* 快捷功能 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  transform: translateY(30px);
  opacity: 0;
  animation: card-slide-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.4s;
}

.action-item {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
  transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.action-item:active {
  transform: translateY(4px) scale(0.96);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: inherit;
  filter: blur(8px);
  opacity: 0.5;
  z-index: -1;
  transition: opacity 0.4s ease;
}

.action-item:active .action-icon {
  transform: scale(0.9);
}

.action-item:active .action-icon::before {
  opacity: 0.7;
}

.translation-icon {
  background: linear-gradient(135deg, #93c5fd, #60a5fa);
  color: white;
}

.membership-icon {
  background: linear-gradient(135deg, #fcd34d, #fbbf24);
  color: white;
}

.settings-icon {
  background: linear-gradient(135deg, #a855f7, #8b5cf6);
  color: white;
}

.action-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

/* 会员信息卡片 */
.membership-info-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 22px;
  margin-bottom: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  transform: translateY(30px);
  opacity: 0;
  animation: card-slide-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.6s;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.membership-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.membership-header i {
  font-size: 18px;
  color: #3b82f6;
}

.membership-details {
  margin-bottom: 18px;
}

.membership-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.membership-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.info-value.active {
  color: #10b981;
}

.membership-actions {
  margin-top: 6px;
}

.membership-action-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #f1f5f9, #f8fafc);
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), background 0.3s ease;
}

.membership-action-btn:active {
  transform: scale(0.98);
  background: linear-gradient(45deg, #e2e8f0, #f1f5f9);
}

.membership-action-btn i {
  font-size: 12px;
  opacity: 0.5;
}

/* 退出登录 */
.logout-container {
  margin-top: 12px;
  transform: translateY(30px);
  opacity: 0;
  animation: card-slide-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.8s;
}

.logout-btn {
  width: 100%;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(45deg, rgba(239, 68, 68, 0.05), rgba(248, 113, 113, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), background 0.3s ease;
}

.logout-btn:active {
  transform: scale(0.98);
  background: linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1));
}

/* 动画 */
@keyframes card-slide-up {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 适配小屏幕 */
@media (max-width: 370px) {
  .user-avatar {
    width: 74px;
    height: 74px;
  }
  
  .user-name {
    font-size: 18px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .action-item {
    flex-direction: row;
    justify-content: flex-start;
    padding: 16px;
  }
  
  .action-icon {
    margin-bottom: 0;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>
