<script setup lang="ts">
// 使用编译宏，不需要导入
const props = defineProps({
  animate: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['socialLogin', 'guestLogin']);

// 社交登录
const handleSocialLogin = (type: string) => {
  emit('socialLogin', type);
};

// 游客模式登录
const handleGuestLogin = () => {
  emit('guestLogin');
};
</script>

<template>
  <div>
    <!-- 分隔线 -->
    <div class="separator" :class="{ 'animate-in': animate }">或使用其他方式登录</div>
    
    <!-- 社交登录 -->
    <div class="social-login" :class="{ 'animate-in': animate }">
      <div class="social-button google-button" @click="handleSocialLogin('Google')">
        <i class="fab fa-google"></i>
      </div>
      <div class="social-button apple-button" @click="handleSocialLogin('Apple')">
        <i class="fab fa-apple"></i>
      </div>
      <div class="social-button github-button" @click="handleSocialLogin('GitHub')">
        <i class="fab fa-github"></i>
      </div>
    </div>
    
    <!-- 注册链接 -->
    <div class="signup-link" :class="{ 'animate-in': animate }">
      <div>还没有账号？<a href="javascript:void(0)" @click="emit('socialLogin', 'register')">立即注册</a></div>
      <div class="guest-login" @click="handleGuestLogin">游客模式</div>
    </div>
  </div>
</template>

<style scoped>
.separator {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-secondary, #8e8e93);
  font-size: 14px;
  margin: 15px 0;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.separator.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.separator::before {
  margin-right: 10px;
}

.separator::after {
  margin-left: 10px;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.social-login.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.social-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.google-button {
  background-color: white;
  color: #DB4437;
}

.apple-button {
  background-color: black;
  color: white;
}

.github-button {
  background-color: #333;
  color: white;
}

.social-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.social-button:active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.signup-link {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary, #8e8e93);
  margin-top: 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.signup-link.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.signup-link a {
  color: var(--primary-color, #007AFF);
  text-decoration: none;
  font-weight: 600;
}

.guest-login {
  color: var(--primary-color, #007AFF);
  cursor: pointer;
  font-weight: 500;
  padding: 5px;
  border-radius: 8px;
  transition: all 0.3s;
}

.guest-login:hover {
  background-color: rgba(0, 122, 255, 0.1);
}
</style>
