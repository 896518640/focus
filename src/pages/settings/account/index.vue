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

// 动画状态
const showSuccessAnimation = ref(false);

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
};

// 编辑用户头像
const editAvatar = async () => {
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
        router.push('/profile');
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
      router.back();
    }).catch(() => {
      // 用户取消，继续编辑
    });
  } else {
    router.back();
  }
};

// 页面加载时获取用户资料
onMounted(async () => {
  await fetchUserProfile();
});
</script>

<template>
  <div class="account-settings-page" :class="{ 'page-loaded': pageLoaded }">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <i class="fas fa-chevron-left"></i>
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
    
    <!-- 用户信息表单 -->
    <div class="user-form card-shadow">
      <!-- 头像设置 -->
      <div class="form-item avatar-setting">
        <div class="form-label">头像</div>
        <div class="avatar-wrapper" 
          @click="editAvatar"
          @mouseenter="avatarHovered = true" 
          @mouseleave="avatarHovered = false">
          <div class="avatar-preview" :class="{ 'avatar-loaded': avatarLoaded }">
            <div class="avatar-border" :class="{ 'avatar-hovered': avatarHovered }"></div>
            <i v-if="!userForm.avatar" class="fas fa-user-circle"></i>
            <img v-else :src="userForm.avatar" alt="用户头像" @load="avatarLoaded = true">
            <div class="avatar-placeholder" v-if="!avatarLoaded">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>
          <div class="avatar-edit-text" :class="{ 'text-hovered': avatarHovered }">
            <i class="fas fa-camera"></i>
            <span>更换头像</span>
          </div>
        </div>
      </div>
      
      <!-- 用户名设置 -->
      <div class="form-item">
        <div class="form-label">用户名</div>
        <div class="form-input-container">
          <div class="form-input">
            <input 
              type="text" 
              v-model="userForm.displayName" 
              placeholder="请输入用户名"
              maxlength="20"
            >
            <div class="input-actions" v-if="userForm.displayName">
              <div class="char-count" :style="{ color: nameColor }">
                {{ nameLength }}/{{ maxNameLength }}
              </div>
              <i class="fas fa-times-circle" @click="userForm.displayName = ''" v-if="userForm.displayName"></i>
            </div>
          </div>
          <div class="name-progress-bar">
            <div class="progress-inner" :style="{ width: `${namePercentage}%`, backgroundColor: nameColor }"></div>
          </div>
        </div>
      </div>
      
      <!-- 邮箱设置（只读） -->
      <div class="form-item">
        <div class="form-label">邮箱</div>
        <div class="form-input readonly">
          <input 
            type="email" 
            v-model="userForm.email" 
            readonly
            placeholder="未设置邮箱"
          >
          <div class="email-verified">
            <i class="fas fa-check-circle"></i>
            <span>已验证</span>
          </div>
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="form-actions">
        <button class="reset-button" @click="resetForm" :disabled="!hasChanged">
          <i class="fas fa-undo"></i>
          <span>重置</span>
        </button>
      </div>
    </div>
    
    <!-- 其他账号选项 -->
    <div class="account-options card-shadow">
      <div class="option-title">
        <i class="fas fa-shield-alt"></i>
        <span>账号安全</span>
      </div>
      
      <div class="option-item ripple-effect">
        <div class="option-icon">
          <i class="fas fa-key"></i>
        </div>
        <div class="option-content">
          <div class="option-label">修改密码</div>
          <div class="option-description">定期修改密码以保护账号安全</div>
        </div>
        <div class="option-action">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
      
      <div class="option-divider"></div>
      
      <div class="option-item ripple-effect">
        <div class="option-icon warning">
          <i class="fas fa-user-times"></i>
        </div>
        <div class="option-content">
          <div class="option-label warning-text">账号注销</div>
          <div class="option-description">永久注销您的账号及相关数据</div>
        </div>
        <div class="option-action">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>
    
    <!-- 数据与隐私 -->
    <div class="account-options card-shadow">
      <div class="option-title">
        <i class="fas fa-database"></i>
        <span>数据与隐私</span>
      </div>
      
      <div class="option-item ripple-effect">
        <div class="option-icon">
          <i class="fas fa-download"></i>
        </div>
        <div class="option-content">
          <div class="option-label">下载个人数据</div>
          <div class="option-description">获取您在Focus中的所有数据</div>
        </div>
        <div class="option-action">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
      
      <div class="option-divider"></div>
      
      <div class="option-item ripple-effect">
        <div class="option-icon">
          <i class="fas fa-eraser"></i>
        </div>
        <div class="option-content">
          <div class="option-label">清除历史记录</div>
          <div class="option-description">清除您的使用记录和历史数据</div>
        </div>
        <div class="option-action">
          <i class="fas fa-chevron-right"></i>
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
  transform: translateY(20px);
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

.header-left {
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

.header-left:active {
  transform: scale(0.9);
  background-color: rgba(0, 122, 255, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
}

.save-button {
  padding: 8px 16px;
  border-radius: 16px;
  background-color: rgba(0, 122, 255, 0.5);
  color: white;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  transition: all 0.3s ease;
}

.save-button.button-active {
  background: linear-gradient(45deg, #007AFF, #5856D6);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-button:active:not(:disabled) {
  transform: scale(0.95);
  background: linear-gradient(45deg, #0062CC, #4744B7);
}

/* 成功动画覆盖层 */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

.success-animation {
  font-size: 80px;
  color: #34C759;
  animation: pop 0.5s ease, float 1.5s ease infinite alternate;
}

@keyframes pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes float {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 卡片阴影 */
.card-shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.card-shadow:active {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 用户表单 */
.user-form {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px;
  overflow: hidden;
  animation: slideInUp 0.3s ease;
}

.form-item {
  display: flex;
  padding: 18px;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
}

.form-item:last-of-type {
  border-bottom: none;
}

.form-label {
  width: 80px;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
}

.form-input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-input {
  flex: 1;
  display: flex;
  align-items: center;
}

.form-input input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #000000;
  background: transparent;
  padding: 4px 0;
}

.form-input.readonly input {
  color: #8E8E93;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-count {
  font-size: 12px;
  color: #8E8E93;
}

.fa-times-circle {
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fa-times-circle:hover {
  color: #FF3B30;
}

/* 用户名进度条 */
.name-progress-bar {
  height: 3px;
  background-color: #E5E5EA;
  border-radius: 1.5px;
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  border-radius: 1.5px;
  background-color: #34C759;
  transition: all 0.3s ease;
}

/* 邮箱已验证标签 */
.email-verified {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(52, 199, 89, 0.1);
  border-radius: 12px;
  font-size: 12px;
  color: #34C759;
  width: fit-content;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-verified i {
  font-size: 10px;
}

/* 头像设置 */
.avatar-setting {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-wrapper:active {
  opacity: 0.8;
}

.avatar-preview {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: visible;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F2F2F7;
  margin-right: 16px;
  transition: all 0.3s ease;
  transform: scale(0.95);
  opacity: 0.9;
}

.avatar-preview.avatar-loaded {
  transform: scale(1);
  opacity: 1;
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
  z-index: 1;
}

.avatar-hovered {
  transform: scale(1.1);
  opacity: 1;
}

.avatar-preview i {
  font-size: 70px;
  color: #C7C7CC;
  z-index: 0;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  z-index: 0;
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
  background-color: rgba(242, 242, 247, 0.8);
  z-index: 1;
}

.avatar-placeholder i {
  font-size: 24px;
  color: #8E8E93;
}

.avatar-edit-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #007AFF;
  font-size: 14px;
  transition: all 0.3s ease;
}

.text-hovered {
  transform: translateX(5px);
  color: #0062CC;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.reset-button {
  padding: 10px 20px;
  border-radius: 16px;
  background-color: rgba(142, 142, 147, 0.1);
  color: #8E8E93;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.reset-button:not(:disabled):hover {
  background-color: rgba(142, 142, 147, 0.2);
}

.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-button:active:not(:disabled) {
  transform: scale(0.95);
}

/* 账号选项 */
.account-options {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin: 16px;
  overflow: hidden;
  animation: slideInUp 0.3s ease;
  animation-delay: 0.1s;
}

.option-title {
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #8E8E93;
  background-color: #F8F8FA;
  display: flex;
  align-items: center;
  gap: 6px;
}

.option-title i {
  color: #007AFF;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 16px;
  transition: background-color 0.3s ease;
  position: relative;
  overflow: hidden;
}

.ripple-effect {
  position: relative;
  cursor: pointer;
}

.ripple-effect::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(0, 0, 0, 0.05);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.ripple-effect:active::after {
  animation: ripple 0.4s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0) translate(-50%, -50%);
    opacity: 0.5;
  }
  100% {
    transform: scale(100, 100) translate(-50%, -50%);
    opacity: 0;
  }
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(45deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #007AFF;
  font-size: 18px;
}

.option-icon.warning {
  background: linear-gradient(45deg, rgba(255, 59, 48, 0.1), rgba(255, 69, 58, 0.1));
  color: #FF3B30;
}

.option-content {
  flex: 1;
}

.option-label {
  font-size: 16px;
  color: #000000;
  margin-bottom: 4px;
}

.warning-text {
  color: #FF3B30;
}

.option-description {
  font-size: 12px;
  color: #8E8E93;
}

.option-action {
  color: #C7C7CC;
  font-size: 16px;
  transition: transform 0.3s ease;
}

.option-item:active .option-action {
  transform: translateX(5px);
}

.option-divider {
  height: 1px;
  background-color: rgba(209, 209, 214, 0.5);
  margin: 0 16px;
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
</style> 