<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/stores/user';
import TranslationSettings from '@/components/common/TranslationSettings.vue';
import { useUserProfile } from './composables';

// 导入拆分的组件
import UserCard from './components/UserCard.vue';
import UserStats from './components/UserStats.vue';
import MembershipUsage from './components/MembershipUsage.vue';
import QuickActions from './components/QuickActions.vue';
import AccountInfo from './components/AccountInfo.vue';
import LogoutButton from './components/LogoutButton.vue';

const router = useRouter();
const userStore = useUserStore();

// 使用用户资料组合式函数
const {
  userInfo,
  pageLoaded,
  avatarHovered,
  statsLoaded,
  formattedCreatedAt,
  joinDays,
  membershipLevelDisplay,
  usedMinutesPercentage,
  formattedNextResetTime,
  sourceLanguage,
  targetLanguage,
  fetchUserProfile,
  editAvatar,
  handleSourceLanguageChange,
  handleTargetLanguageChange,
} = useUserProfile();

// 同传设置初始化
const showSettings = ref(false);

// 跳转到设置页面
const navigateToSetting = (path: string) => {
  router.push(path);
};

// 打开同传设置
const openSimultaneousSettings = () => {
  showSettings.value = true;
};

// 退出登录
const logout = () => {
  userStore.logout();
  router.push('/login');
};

// 页面加载时获取用户资料
onMounted(async () => {
  await fetchUserProfile();
});
</script>

<template>
  <div class="profile-page" :class="{ 'page-loaded': pageLoaded }">
    <!-- 背景图案 -->
    <div class="background-pattern">
      <div class="pattern-bubble" v-for="n in 5" :key="n" :class="`bubble-${n}`"></div>
    </div>
    
    <!-- 用户信息卡片 -->
    <UserCard 
      :userInfo="userInfo" 
      :membershipLevelDisplay="membershipLevelDisplay"
      :avatarHovered="avatarHovered"
      :statsLoaded="statsLoaded"
      @update:avatarHovered="(value: boolean) => avatarHovered = value"
      @edit-avatar="editAvatar"
      @navigate="navigateToSetting">
      
      <!-- 使用统计 -->
      <UserStats :usage="userInfo.usage" :statsLoaded="statsLoaded" />
      
      <!-- 会员使用情况 -->
      <MembershipUsage 
        :membership="userInfo.membership" 
        :usedMinutesPercentage="usedMinutesPercentage"
        :formattedNextResetTime="formattedNextResetTime" />
    </UserCard>
    
    <!-- 快捷功能 -->
    <QuickActions 
      @open-settings="openSimultaneousSettings" 
      @navigate="navigateToSetting" />
    
    <!-- 会员信息 -->
    <AccountInfo 
      :formattedCreatedAt="formattedCreatedAt" 
      :joinDays="joinDays"
      @navigate="navigateToSetting" />
    
    <!-- 退出登录 -->
    <LogoutButton @logout="logout" />
    
    <!-- 同传设置弹窗 -->
    <TranslationSettings
      v-model:show="showSettings"
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
</style>
