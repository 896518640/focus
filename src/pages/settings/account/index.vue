<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
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

// 获取用户详细资料
const fetchUserProfile = async () => {
  isLoading.value = true;
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
  });
  
  try {
    const res = await getUserProfileApi();
    
    if (res.data) {
      const data = res.data;
      
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

// 监听表单变化
const checkFormChanged = () => {
  hasChanged.value = 
    userForm.displayName !== originalForm.value.displayName || 
    userForm.avatar !== originalForm.value.avatar;
};

// 编辑用户头像
const editAvatar = async () => {
  // 实际应用中可以实现图片上传逻辑
  // 这里简化处理，使用一个随机头像
  const randomId = Math.floor(Math.random() * 100);
  const newAvatar = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${randomId}.jpg`;
  
  userForm.avatar = newAvatar;
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
    
    if (res.data) {
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
    } else {
      showToast({
        message: '保存失败',
        position: 'bottom',
      });
    }
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
    if (confirm('有未保存的修改，确定要离开吗？')) {
      router.back();
    }
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
  <div class="account-settings-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <i class="fas fa-chevron-left"></i>
      </div>
      <div class="header-title">账号设置</div>
      <div class="header-right">
        <button class="save-button" :disabled="!hasChanged" @click="saveProfile">
          保存
        </button>
      </div>
    </div>
    
    <!-- 用户信息表单 -->
    <div class="user-form">
      <!-- 头像设置 -->
      <div class="form-item avatar-setting">
        <div class="form-label">头像</div>
        <div class="avatar-wrapper" @click="editAvatar">
          <div class="avatar-preview">
            <i v-if="!userForm.avatar" class="fas fa-user-circle"></i>
            <img v-else :src="userForm.avatar" alt="用户头像">
          </div>
          <div class="avatar-edit-text">点击更换</div>
        </div>
      </div>
      
      <!-- 用户名设置 -->
      <div class="form-item">
        <div class="form-label">用户名</div>
        <div class="form-input">
          <input 
            type="text" 
            v-model="userForm.displayName" 
            placeholder="请输入用户名"
            @input="checkFormChanged"
          >
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
        </div>
      </div>
    </div>
    
    <!-- 其他账号选项 -->
    <div class="account-options">
      <div class="option-title">账号安全</div>
      
      <div class="option-item">
        <div class="option-label">修改密码</div>
        <div class="option-action">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
      
      <div class="option-item">
        <div class="option-label">账号注销</div>
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

.header-left {
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

.header-left:active {
  transform: scale(0.9);
  opacity: 0.7;
}

.header-right {
  display: flex;
  align-items: center;
}

.save-button {
  padding: 6px 12px;
  border-radius: 16px;
  background-color: #007AFF;
  color: white;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-button:active:not(:disabled) {
  transform: scale(0.95);
  background-color: #0062CC;
}

/* 用户表单 */
.user-form {
  background-color: #FFFFFF;
  border-radius: 12px;
  margin: 16px;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.form-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  width: 80px;
  font-size: 16px;
  color: #000000;
}

.form-input {
  flex: 1;
}

.form-input input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  color: #000000;
  background: transparent;
}

.form-input.readonly input {
  color: #8E8E93;
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
  transition: opacity 0.2s ease;
}

.avatar-wrapper:active {
  opacity: 0.8;
}

.avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F2F2F7;
  margin-right: 12px;
}

.avatar-preview i {
  font-size: 60px;
  color: #C7C7CC;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit-text {
  color: #007AFF;
  font-size: 14px;
}

/* 账号选项 */
.account-options {
  background-color: #FFFFFF;
  border-radius: 12px;
  margin: 16px;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
  animation-delay: 0.1s;
}

.option-title {
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #8E8E93;
  background-color: #F2F2F7;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item:active {
  background-color: rgba(0, 0, 0, 0.02);
}

.option-label {
  flex: 1;
  font-size: 16px;
  color: #000000;
}

.option-action {
  color: #C7C7CC;
  font-size: 14px;
}

/* 动画 */
@keyframes fadeIn {
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