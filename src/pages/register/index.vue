<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { setToken } from '@/utils/cache/cookies';
import { useUserStore } from '@/pinia/stores/user';
import { register } from '@/services/authService';
import { showSuccessMessage, showErrorMessage } from '@/http/axios';

const router = useRouter();
const userStore = useUserStore();
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const animateRegister = ref(false);
const agreeTerms = ref(false);

// 动画状态
const animations = reactive({
  logo: false,
  title: false,
  usernameField: false,
  emailField: false,
  passwordField: false,
  confirmPasswordField: false,
  termsCheckbox: false,
  registerButton: false,
  separator: false,
  socialLogin: false,
  loginLink: false
});

onMounted(() => {
  // 触发入场动画
  setTimeout(() => { animations.logo = true }, 100);
  setTimeout(() => { animations.title = true }, 300);
  setTimeout(() => { animations.usernameField = true }, 400);
  setTimeout(() => { animations.emailField = true }, 500);
  setTimeout(() => { animations.passwordField = true }, 600);
  setTimeout(() => { animations.confirmPasswordField = true }, 700);
  setTimeout(() => { animations.termsCheckbox = true }, 800);
  setTimeout(() => { animations.registerButton = true }, 900);
  setTimeout(() => { animations.separator = true }, 1000);
  setTimeout(() => { animations.socialLogin = true }, 1100);
  setTimeout(() => { animations.loginLink = true }, 1200);
});

// 切换密码显示/隐藏
const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
  if (field === 'password') {
    showPassword.value = !showPassword.value;
  } else {
    showConfirmPassword.value = !showConfirmPassword.value;
  }
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

// 验证邮箱格式
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 注册处理
const handleRegister = async () => {
  loading.value = true;
  animateRegister.value = true;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate([15, 30, 15]);
  }
  
  try {
    // 调用注册接口
    const res: any = await register(username.value, email.value, password.value);
    
    if (res.code === 0) {
      // 注册成功
      showSuccessMessage('注册成功，请登录');
      
      // 跳转到登录页面
      router.push({
        path: '/login',
        query: { username: username.value }
      });
    } else {
      // 注册失败
      showErrorMessage(res.message || '注册失败');
    }
  } catch (error: any) {
    showErrorMessage(error.message || '注册失败，请稍后再试');
  } finally {
    loading.value = false;
    animateRegister.value = false;
  }
};

// 社交登录
const handleSocialLogin = (type: string) => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
  
  showToast(`${type}登录功能开发中...`);
};

// 跳转到登录页
const goToLogin = () => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
  
  router.push('/login');
};
</script>

<template>
  <div class="register-container">
    <div class="background-shape"></div>
    <div class="background-shape-2"></div>
    
    <div class="register-content">
      <!-- Logo区域 -->
      <div class="logo-container" :class="{ 'animate-in': animations.logo }">
        <div class="logo floating">
          <i class="fas fa-bullseye"></i>
        </div>
        <div class="app-name">Focus</div>
        <div class="app-slogan">高效学习，智能助手</div>
      </div>
      
      <!-- 标题 -->
      <h1 class="register-title" :class="{ 'animate-in': animations.title }">创建账号</h1>
      
      <!-- 注册表单 -->
      <div class="register-form">
        <!-- 用户名输入框 -->
        <div class="input-group-animated" :class="{ 'animate-in': animations.usernameField }">
          <input 
            v-model="username" 
            type="text" 
            id="username" 
            class="input-field" 
            placeholder=" "
          />
          <label for="username" class="input-label">登陆账号</label>
          <div class="input-icon">
            <i class="fas fa-user"></i>
          </div>
        </div>
        
        <!-- 邮箱输入框 -->
        <div class="input-group-animated" :class="{ 'animate-in': animations.emailField }">
          <input 
            v-model="email" 
            type="email" 
            id="email" 
            class="input-field" 
            placeholder=" "
          />
          <label for="email" class="input-label">邮箱地址</label>
          <div class="input-icon">
            <i class="fas fa-envelope"></i>
          </div>
        </div>
        
        <!-- 密码输入框 -->
        <div class="input-group-animated" :class="{ 'animate-in': animations.passwordField }">
          <input 
            v-model="password" 
            :type="showPassword ? 'text' : 'password'" 
            id="password" 
            class="input-field" 
            placeholder=" "
          />
          <label for="password" class="input-label">密码</label>
          <div class="input-icon" @click="togglePasswordVisibility('password')">
            <i :class="['fas', showPassword ? 'fa-eye' : 'fa-eye-slash']"></i>
          </div>
        </div>
        
        <!-- 确认密码输入框 -->
        <div class="input-group-animated" :class="{ 'animate-in': animations.confirmPasswordField }">
          <input 
            v-model="confirmPassword" 
            :type="showConfirmPassword ? 'text' : 'password'" 
            id="confirmPassword" 
            class="input-field" 
            placeholder=" "
          />
          <label for="confirmPassword" class="input-label">确认密码</label>
          <div class="input-icon" @click="togglePasswordVisibility('confirmPassword')">
            <i :class="['fas', showConfirmPassword ? 'fa-eye' : 'fa-eye-slash']"></i>
          </div>
        </div>
        
        <!-- 用户协议 -->
        <div class="terms-checkbox" :class="{ 'animate-in': animations.termsCheckbox }">
          <label class="checkbox-container">
            <input type="checkbox" v-model="agreeTerms">
            <span class="checkmark"></span>
            <span class="terms-text">我已阅读并同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a></span>
          </label>
        </div>
        
        <!-- 注册按钮 -->
        <button 
          class="register-button" 
          :class="{ 
            'loading': loading, 
            'animate-in': animations.registerButton,
            'ios-button-effect': animateRegister
          }"
          @click="handleRegister"
          :disabled="loading"
        >
          <span v-if="!loading">注册</span>
          <span v-else class="loading-spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
            注册中...
          </span>
        </button>
        
        <!-- 分隔线 -->
        <div class="separator" :class="{ 'animate-in': animations.separator }">或使用其他方式注册</div>
        
        <!-- 社交登录 -->
        <div class="social-login" :class="{ 'animate-in': animations.socialLogin }">
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
        
        <!-- 登录链接 -->
        <div class="login-link" :class="{ 'animate-in': animations.loginLink }">
          已有账号？<a href="javascript:void(0)" @click="goToLogin">登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--background, #f2f2f7);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.background-shape {
  position: absolute;
  top: -150px;
  right: -150px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  opacity: 0.2;
  z-index: 0;
}

.background-shape-2 {
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF2D55, #FF9500);
  opacity: 0.15;
  z-index: 0;
}

.register-content {
  width: 100%;
  max-width: 400px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo 样式 */
.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.logo-container.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.logo {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30px;
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
}

.floating {
  animation: floating 3s ease-in-out infinite;
}

@keyframes floating {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.app-name {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 5px;
}

.app-slogan {
  font-size: 14px;
  color: var(--text-secondary, #8e8e93);
}

/* 标题样式 */
.register-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #000000);
  margin-bottom: 30px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
  text-align: center;
}

.register-title.animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* 表单样式 */
.register-form {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.input-group-animated {
  position: relative;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.input-group-animated.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.input-field {
  width: 100%;
  padding: 16px 40px 16px 16px;
  border: 1px solid var(--border-color, #c7c7cc);
  border-radius: 10px;
  background-color: var(--input-background, #ffffff);
  font-size: 16px;
  color: var(--text-primary, #000000);
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  outline: none;
}

.input-field:not(:placeholder-shown) + .input-label,
.input-field:focus + .input-label {
  transform: translateY(-25px) scale(0.8);
  color: #007AFF;
}

.input-label {
  position: absolute;
  left: 16px;
  top: 16px;
  font-size: 16px;
  color: var(--text-secondary, #8e8e93);
  pointer-events: none;
  transition: all 0.3s ease;
  transform-origin: left top;
  background-color: var(--input-background, #ffffff);
  padding: 0 5px;
}

.input-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #8e8e93);
  cursor: pointer;
  transition: color 0.3s ease;
}

.input-icon:hover {
  color: #007AFF;
}

/* 用户协议复选框 */
.terms-checkbox {
  margin-bottom: 25px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.terms-checkbox.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary, #8e8e93);
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: var(--input-background, #ffffff);
  border: 1px solid var(--border-color, #c7c7cc);
  border-radius: 4px;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: #007AFF;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #007AFF;
  border-color: #007AFF;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.terms-text {
  margin-left: 10px;
}

.terms-text a {
  color: #007AFF;
  text-decoration: none;
}

.terms-text a:hover {
  text-decoration: underline;
}

/* 注册按钮 */
.register-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(20px);
  box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.register-button.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.register-button:hover {
  background: linear-gradient(135deg, #0066CC, #4BB4F5);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
}

.register-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* iOS 风格按钮动画效果 */
.register-button.ios-button-effect {
  animation: ios-button-animation 1.5s infinite;
}

@keyframes ios-button-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7);
    transform: scale(1);
  }
  30% {
    box-shadow: 0 0 0 10px rgba(0, 122, 255, 0);
    transform: scale(0.97);
  }
  60% {
    box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
    transform: scale(1.01);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7);
    transform: scale(1);
  }
}

/* 按钮点击波纹效果 */
.register-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.register-button:active::after {
  animation: ios-ripple 0.6s ease-out;
}

@keyframes ios-ripple {
  0% {
    opacity: 0.5;
    transform: scale(0, 0) translate(-50%, -50%);
  }
  100% {
    opacity: 0;
    transform: scale(20, 20) translate(-50%, -50%);
  }
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-spinner i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 分隔线 */
.separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: var(--text-secondary, #8e8e93);
  font-size: 14px;
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
  border-bottom: 1px solid var(--border-color, #c7c7cc);
}

.separator::before {
  margin-right: 10px;
}

.separator::after {
  margin-left: 10px;
}

/* 社交登录 */
.social-login {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
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
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.social-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.social-button:active {
  transform: translateY(1px);
}

.social-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  background-color: #24292e;
  color: white;
}

/* 登录链接 */
.login-link {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary, #8e8e93);
  margin-top: 10px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.login-link.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.login-link a {
  color: #007AFF;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .register-content {
    padding: 0 10px;
  }
  
  .register-title {
    font-size: 24px;
  }
  
  .social-button {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
}
</style>
