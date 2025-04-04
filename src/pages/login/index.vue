<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import { setToken } from '@@/utils/cache/cookies';
import { useUserStore } from '@/pinia/stores/user';
import { login } from '@/services/authService';
import { showSuccessMessage, showErrorMessage } from '@/http/axios';

// 导入封装的组件
import LoginBackground from './components/LoginBackground.vue';
import LogoSection from './components/LogoSection.vue';
import LoginForm from './components/LoginForm.vue';
import SocialLogin from './components/SocialLogin.vue';

// 定义登录表单数据类型
interface LoginFormData {
  email: string;
  password: string;
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loading = ref(false);
const animateLogin = ref(false);
const loginFormRef = ref<InstanceType<typeof LoginForm> | null>(null);

// 动画状态
const animations = reactive({
  logo: false,
  title: false,
  emailField: false,
  passwordField: false,
  forgotPassword: false,
  loginButton: false,
  separator: false,
  socialLogin: false,
  signupLink: false
});

onMounted(() => {
  // 如果URL中有username参数，自动填充到邮箱输入框
  if (route.query?.username && loginFormRef?.value) {
    loginFormRef.value.email = route.query.username as string;
  }

  // 触发入场动画
  const animationSequence = [
    { key: 'logo', delay: 100 },
    { key: 'title', delay: 300 },
    { key: 'emailField', delay: 400 },
    { key: 'passwordField', delay: 500 },
    { key: 'forgotPassword', delay: 600 },
    { key: 'loginButton', delay: 700 },
    { key: 'separator', delay: 800 },
    { key: 'socialLogin', delay: 900 },
    { key: 'signupLink', delay: 1000 }
  ];
  
  animationSequence.forEach(({ key, delay }) => {
    setTimeout(() => { animations[key as keyof typeof animations] = true }, delay);
  });
});

// 触觉反馈
const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// 切换密码显示/隐藏
const togglePasswordVisibility = () => {
  vibrate(5);
};

// 处理重定向
const handleRedirect = (redirect: string) => {
  // 使用路由导航
  if (redirect.startsWith('http')) {
    window.location.href = redirect;
  } else {
    router.replace(redirect);
  }
};

// 登录处理
const handleLogin = async (formData: LoginFormData) => {
  if (!formData.email || !formData.password) {
    showToast('请输入邮箱和密码');
    return;
  }
  
  loading.value = true;
  animateLogin.value = true;
  vibrate([15, 30, 15]);
  
  try {
    // 调用登录接口
    const res = await login(formData.email, formData.password) as {
      code: number;
      data: { token: string };
      message?: string;
    };
    
    if (res.code === 0) {
      // 登录成功
      showSuccessMessage('登录成功');
      
      // 保存token
      setToken(res.data.token);
      
      // 更新用户信息
      await userStore.getInfo();
      
      // 处理重定向
      const redirect = route.query?.redirect as string || '/';
      handleRedirect(redirect);
    } else {
      // 登录失败
      showErrorMessage(res.message || '登录失败');
    }
  } catch (error: any) {
    showErrorMessage(error.message || '登录失败，请稍后再试');
  } finally {
    loading.value = false;
    animateLogin.value = false;
  }
};

// 社交登录
const handleSocialLogin = (type: string) => {
  vibrate(10);
  
  if (type === 'register') {
    router.push('/register');
    return;
  }
  
  showToast(`${type}登录功能开发中...`);
};

// 游客模式登录
const handleGuestLogin = () => {
  vibrate([10, 20, 10]);
  
  userStore.setGuestMode(true);
  showSuccessMessage('已进入游客模式');
  router.push('/');
};
</script>

<template>
  <div class="login-container">
    <!-- 背景组件 -->
    <LoginBackground />
    
    <div class="login-content">
      <!-- Logo区域 -->
      <LogoSection :animate="animations.logo" />
      
      <!-- 标题 -->
      <h1 class="login-title" :class="{ 'animate-in': animations.title }">欢迎回来</h1>
      
      <!-- 登录表单 -->
      <LoginForm 
        ref="loginFormRef"
        :animations="animations"
        :loading="loading"
        :animateLogin="animateLogin"
        @login="handleLogin"
        @togglePassword="togglePasswordVisibility"
      />
      
      <!-- 社交登录 -->
      <SocialLogin 
        :animate="animations.socialLogin"
        @socialLogin="handleSocialLogin"
        @guestLogin="handleGuestLogin"
      />
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color, #f2f2f7);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.login-content {
  width: 100%;
  max-width: 400px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  padding: 30px;
  z-index: 1;
  position: relative;
}

.login-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 30px;
  color: var(--text-color, #1c1c1e);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.login-title.animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .login-container {
    --bg-color: #1c1c1e;
    --text-color: #ffffff;
    --text-secondary: #8e8e93;
    --primary-color: #0A84FF;
    --primary-dark: #0071e3;
    --disabled-color: #3a3a3c;
  }
  
  .login-content {
    background-color: rgba(30, 30, 30, 0.8);
  }
}
</style>
