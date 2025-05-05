<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant';
import { getUserProfileApi, updateUserProfileApi } from '@/api/users';

const router = useRouter();

// 用户信息表单
const userForm = reactive({
  id: '',
  displayName: '',
  email: '',
  avatar: ''
});

// 原始信息，用于检测是否有修改
const originalForm = ref({
  displayName: '',
  avatar: ''
});

// 页面状态
const isLoading = ref(false);
const isSaving = ref(false);
const hasChanged = ref(false);
const pageLoaded = ref(false);
const avatarLoaded = ref(false);
const avatarHovered = ref(false);
const isEditing = ref(false);

// 动画状态
const showSuccessAnimation = ref(false);
const animations = reactive({
  pageEnter: false,
  headerEnter: false,
  avatarEnter: false,
  formEnter: false,
  buttonEnter: false
});

// 计算属性：用户名长度限制和验证
const nameLength = computed(() => userForm.displayName.length);
const maxNameLength = 20;
const namePercentage = computed(() => (nameLength.value / maxNameLength) * 100);
const nameColor = computed(() => {
  if (namePercentage.value < 50) return '#34C759';
  if (namePercentage.value < 80) return '#FF9500';
  return '#FF3B30';
});

// 计算属性：是否有效的用户名
const isValidName = computed(() => {
  return userForm.displayName.trim().length > 0 && userForm.displayName.length <= maxNameLength;
});

// 监听表单变化
watch(() => [userForm.displayName, userForm.avatar], () => {
  checkFormChanged();
}, { deep: true });

// 获取用户详细资料
const fetchUserProfile = async () => {
  isLoading.value = true;
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
  });
  
  try {
    const data = await getUserProfileApi();
      // 更新表单数据
      userForm.id = data.id;
      userForm.displayName = data.displayName;
      userForm.email = data.email;
      userForm.avatar = data.avatar || '';
      
      // 保存原始数据用于比较
      originalForm.value = {
        displayName: data.displayName,
        avatar: data.avatar || ''
      };
      
      // 设置头像加载状态
      if (data.avatar) {
        setTimeout(() => {
          avatarLoaded.value = true;
        }, 300);
      } else {
        avatarLoaded.value = true;
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
    
    // 页面元素进入动画序列
    setTimeout(() => animations.pageEnter = true, 50);
    setTimeout(() => animations.headerEnter = true, 200);
    setTimeout(() => animations.avatarEnter = true, 400);
    setTimeout(() => animations.formEnter = true, 600);
    setTimeout(() => animations.buttonEnter = true, 800);
    
    setTimeout(() => {
      pageLoaded.value = true;
    }, 100);
  }
};

// 检测表单是否有变化
const checkFormChanged = () => {
  hasChanged.value = 
    userForm.displayName !== originalForm.value.displayName || 
    userForm.avatar !== originalForm.value.avatar;
};

// 重置表单
const resetForm = () => {
  userForm.displayName = originalForm.value.displayName;
  userForm.avatar = originalForm.value.avatar;
  hasChanged.value = false;
  isEditing.value = false;
};

// 编辑用户头像
const editAvatar = async () => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
  
  // 实际应用中可以实现图片上传逻辑
  // 这里简化处理，使用一个随机头像
  const randomId = Math.floor(Math.random() * 100);
  const newAvatar = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${randomId}.jpg`;
  
  userForm.avatar = newAvatar;
  avatarLoaded.value = false;
  
  setTimeout(() => {
    avatarLoaded.value = true;
  }, 300);
  
  checkFormChanged();
};

// 开始编辑用户名
const startEditing = () => {
  isEditing.value = true;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  
  // 延迟一帧后聚焦输入框
  setTimeout(() => {
    const nameInput = document.getElementById('name-input');
    if (nameInput) {
      nameInput.focus();
    }
  }, 50);
};

// 完成编辑
const finishEditing = () => {
  isEditing.value = false;
};

// 提交表单
const saveProfile = async () => {
  if (!hasChanged.value) {
    showToast({
      message: '未做任何修改',
      position: 'bottom',
    });
    return;
  }
  
  if (!isValidName.value) {
    showToast({
      message: '请输入有效的用户名',
      position: 'bottom',
      type: 'fail'
    });
    return;
  }
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 20, 10]);
  }
  
  isSaving.value = true;
  showLoadingToast({
    message: '保存中...',
    forbidClick: true,
  });
  
  try {
    const updateData = {
      displayName: userForm.displayName,
      avatar: userForm.avatar
    };
    
    const res = await updateUserProfileApi(updateData);
    
    // 显示成功动画
    showSuccessAnimation.value = true;
    
    setTimeout(() => {
      showSuccessAnimation.value = false;
      
      showToast({
        message: '保存成功',
        position: 'bottom',
        type: 'success'
      });
      
      // 更新原始数据
      originalForm.value = {
        displayName: userForm.displayName,
        avatar: userForm.avatar
      };
      
      hasChanged.value = false;
      
      // 返回个人中心页面
      setTimeout(() => {
        // 退出动画
        animations.pageEnter = false;
        setTimeout(() => {
          router.push('/profile');
        }, 300);
      }, 1000);
    }, 1500);

  } catch (error: any) {
    console.error('保存资料出错:', error);
    showToast({
      message: error.message || '网络错误',
      position: 'bottom',
    });
  } finally {
    isSaving.value = false;
    closeToast();
  }
};

// 返回上一页
const goBack = () => {
  if (hasChanged.value) {
    // 如果有未保存的修改，提示用户
    showDialog({
      title: '提示',
      message: '有未保存的修改，确定要离开吗？',
      confirmButtonText: '离开',
      confirmButtonColor: '#FF3B30',
      cancelButtonText: '继续编辑',
      showCancelButton: true,
    }).then(() => {
      // 退出动画
      animations.pageEnter = false;
      setTimeout(() => {
        router.back();
      }, 300);
    }).catch(() => {
      // 用户取消，继续编辑
    });
  } else {
    // 退出动画
    animations.pageEnter = false;
    setTimeout(() => {
      router.back();
    }, 300);
  }
};

// 页面加载时获取用户资料
onMounted(async () => {
  await fetchUserProfile();
});
</script>

<template>
  <div class="account-settings-page" :class="{ 'page-entered': animations.pageEnter }">
    <!-- 顶部导航栏 -->
    <div class="header" :class="{ 'header-entered': animations.headerEnter }">
      <div class="header-left" @click="goBack">
        <i class="fas fa-chevron-left"></i>
        <span>返回</span>
      </div>
      <div class="header-title">账号设置</div>
      <div class="header-right">
        <button 
          class="save-button"
          :class="{ 'button-active': hasChanged && isValidName }"
          :disabled="!hasChanged || !isValidName"
          @click="saveProfile"
        >
          <span v-if="!isSaving">保存</span>
          <i v-else class="fas fa-spinner fa-spin"></i>
        </button>
      </div>
    </div>
    
    <!-- 成功动画覆盖层 -->
    <div class="success-overlay" v-if="showSuccessAnimation">
      <div class="success-animation">
        <i class="fas fa-check-circle"></i>
      </div>
    </div>
    
    <div class="content-container">
      <!-- 头像设置区域 -->
      <div class="avatar-section" :class="{ 'avatar-entered': animations.avatarEnter }">
        <div 
          class="avatar-container"
          @click="editAvatar"
          @mouseenter="avatarHovered = true"
          @mouseleave="avatarHovered = false"
        >
          <div class="avatar-wrapper" :class="{ 'avatar-loaded': avatarLoaded, 'avatar-hovered': avatarHovered }">
            <div class="avatar-placeholder" v-if="!avatarLoaded">
              <i class="fas fa-circle-notch fa-spin"></i>
            </div>
            <i v-else-if="!userForm.avatar" class="fas fa-user avatar-default"></i>
            <img v-else :src="userForm.avatar" alt="用户头像" @load="avatarLoaded = true">
            
            <div class="avatar-overlay" :class="{ 'overlay-visible': avatarHovered }">
              <i class="fas fa-camera"></i>
            </div>
          </div>
          <div class="avatar-edit-hint">点击更换头像</div>
        </div>
      </div>
      
      <!-- 表单区域 -->
      <div class="form-section" :class="{ 'form-entered': animations.formEnter }">
        <!-- 用户名设置 -->
        <div class="form-card">
          <div class="form-item" @click="startEditing">
            <div class="item-label">用户名</div>
            <div class="item-content" v-if="!isEditing">
              <div class="display-name">{{ userForm.displayName }}</div>
              <i class="fas fa-chevron-right item-icon"></i>
            </div>
            <div class="item-content editing" v-else>
              <input 
                id="name-input"
                type="text" 
                class="name-input" 
                v-model="userForm.displayName"
                placeholder="请输入用户名"
                @blur="finishEditing"
                maxlength="20"
              />
              <div class="name-limit" :style="{ color: nameColor }">
                {{ nameLength }}/{{ maxNameLength }}
              </div>
            </div>
          </div>
          
          <!-- 邮箱设置 -->
          <div class="form-item">
            <div class="item-label">邮箱</div>
            <div class="item-content">
              <div class="email-display">{{ userForm.email }}</div>
            </div>
          </div>
        </div>
        
        <!-- 账户安全卡片 -->
        <div class="form-card">
          <div class="form-item">
            <div class="item-label">修改密码</div>
            <div class="item-content">
              <i class="fas fa-chevron-right item-icon"></i>
            </div>
          </div>
          
          <div class="form-item">
            <div class="item-label">账户安全</div>
            <div class="item-content">
              <div class="security-badge">安全</div>
              <i class="fas fa-chevron-right item-icon"></i>
            </div>
          </div>
        </div>
        
        <!-- 隐私设置卡片 -->
        <div class="form-card">
          <div class="form-item">
            <div class="item-label">隐私设置</div>
            <div class="item-content">
              <i class="fas fa-chevron-right item-icon"></i>
            </div>
          </div>
          
          <div class="form-item">
            <div class="item-label">数据与同步</div>
            <div class="item-content">
              <i class="fas fa-chevron-right item-icon"></i>
            </div>
          </div>
        </div>
        
        <!-- 底部按钮区域 -->
        <div class="button-section" :class="{ 'button-entered': animations.buttonEnter }">
          <button v-if="hasChanged" class="reset-button" @click="resetForm">取消修改</button>
          <button class="logout-button">退出登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.account-settings-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F2F2F7;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-entered {
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
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
}

.header-entered {
  transform: translateY(0);
  opacity: 1;
}

.header-left {
  display: flex;
  align-items: center;
  color: #007AFF;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.header-left span {
  margin-left: 4px;
}

.header-left:active {
  opacity: 0.7;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-right {
  display: flex;
  justify-content: flex-end;
  min-width: 60px;
}

.save-button {
  padding: 6px 12px;
  background-color: transparent;
  color: #007AFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.save-button:disabled {
  color: #8E8E93;
  opacity: 0.5;
  cursor: not-allowed;
}

.button-active {
  opacity: 1;
}

.save-button:active:not(:disabled) {
  transform: scale(0.96);
  opacity: 0.8;
}

/* 内容容器 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

/* 头像设置 */
.avatar-section {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  margin-bottom: 32px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.avatar-entered {
  opacity: 1;
  transform: translateY(0);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  width: 110px;
  height: 110px;
  border-radius: 55px;
  background-color: #FFFFFF;
  border: 2px solid #F2F2F7;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.9);
}

.avatar-loaded {
  opacity: 1;
  transform: scale(1);
}

.avatar-wrapper:active {
  transform: scale(0.95);
}

.avatar-hovered {
  border-color: #007AFF;
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.15);
}

.avatar-default {
  font-size: 60px;
  color: #C7C7CC;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.avatar-hovered img {
  filter: brightness(0.7);
}

.avatar-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F2F2F7;
  color: #8E8E93;
  font-size: 24px;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overlay-visible {
  opacity: 1;
}

.avatar-edit-hint {
  margin-top: 10px;
  font-size: 13px;
  color: #8E8E93;
  font-weight: 500;
}

/* 表单区域 */
.form-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.form-entered {
  opacity: 1;
  transform: translateY(0);
}

.form-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
}

.form-item {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.form-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}

.form-item:active {
  background-color: rgba(0, 0, 0, 0.02);
}

.item-label {
  font-size: 16px;
  color: #000000;
}

.item-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  text-align: right;
  margin-left: 16px;
}

.display-name {
  color: #8E8E93;
  font-size: 16px;
  margin-right: 8px;
}

.email-display {
  color: #8E8E93;
  font-size: 16px;
}

.item-icon {
  margin-left: 8px;
  color: #C7C7CC;
  font-size: 14px;
}

.security-badge {
  padding: 2px 8px;
  background-color: #34C759;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
}

.item-content.editing {
  display: flex;
  align-items: center;
}

.name-input {
  flex: 1;
  text-align: right;
  padding: 6px 8px;
  border: none;
  background-color: #F2F2F7;
  border-radius: 6px;
  font-size: 16px;
  color: #000000;
  width: 100%;
}

.name-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.name-limit {
  margin-left: 10px;
  font-size: 13px;
  min-width: 42px;
}

/* 底部按钮 */
.button-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.button-entered {
  opacity: 1;
  transform: translateY(0);
}

.reset-button, .logout-button {
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.reset-button {
  background-color: #FFFFFF;
  color: #007AFF;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
}

.logout-button {
  background-color: #FFFFFF;
  color: #FF3B30;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
}

.reset-button:active, .logout-button:active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 成功动画 */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.success-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.success-animation i {
  font-size: 80px;
  color: #34C759;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .account-settings-page {
    background-color: #1C1C1E;
  }
  
  .header {
    background-color: rgba(28, 28, 30, 0.9);
    border-bottom-color: rgba(60, 60, 65, 0.5);
  }
  
  .header-title {
    color: #FFFFFF;
  }
  
  .item-label {
    color: #FFFFFF;
  }
  
  .form-card {
    background-color: #2C2C2E;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  }
  
  .form-item:not(:last-child)::after {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .form-item:active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .avatar-wrapper {
    background-color: #2C2C2E;
    border-color: #1C1C1E;
  }
  
  .avatar-placeholder {
    background-color: #2C2C2E;
  }
  
  .name-input {
    background-color: #3A3A3C;
    color: #FFFFFF;
  }
  
  .display-name, .email-display {
    color: #8E8E93;
  }
  
  .reset-button, .logout-button {
    background-color: #2C2C2E;
  }
  
  .success-overlay {
    background-color: rgba(28, 28, 30, 0.9);
  }
}
</style> 