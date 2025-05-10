<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

interface Props {
  userInfo: {
    user_id: string;
    displayName: string;
    email: string;
    avatar: string;
    role: string;
    membership: {
      level: string;
    }
  };
  membershipLevelDisplay: string;
  avatarHovered: boolean;
  statsLoaded: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:avatarHovered': [value: boolean];
  'edit-avatar': [];
  'navigate': [path: string];
}>();

const updateAvatarHovered = (value: boolean) => {
  emit('update:avatarHovered', value);
};

const handleEditAvatar = () => {
  emit('edit-avatar');
};

const navigateToSetting = (path: string) => {
  emit('navigate', path);
};
</script>

<template>
  <div class="user-card">
    <div class="user-info">
      <div class="user-avatar-wrapper" 
        @click="handleEditAvatar" 
        @mouseenter="updateAvatarHovered(true)" 
        @mouseleave="updateAvatarHovered(false)">
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
          <span>{{ membershipLevelDisplay }}</span>
        </div>
      </div>
    </div>
    
    <!-- 编辑个人资料按钮 -->
    <button class="edit-profile-btn" @click="navigateToSetting('/settings/account')">
      <i class="fas fa-edit"></i>
      <span>编辑资料</span>
    </button>
    
    <!-- 插槽用于统计和会员信息内容 -->
    <slot></slot>
  </div>
</template>

<style scoped>
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
}
</style> 