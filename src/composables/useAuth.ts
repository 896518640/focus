/**
 * 统一的认证服务
 * 处理登录、注册、退出登录等操作
 */

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/stores/user';
import { showToast } from 'vant';
import { login } from '@/services/authService';
import { showSuccessMessage, showErrorMessage } from '@/http/axios';

// API 响应类型定义
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

interface LoginResponseData {
  token: string;
  [key: string]: any;
}

export function useAuth() {
  const router = useRouter();
  const userStore = useUserStore();
  const loading = ref(false);
  
  // 登录API调用
  const loginWithApi = async (username: string, password: string, redirectPath = '/') => {
    try {
      loading.value = true;
      const res = await login(username, password) as ApiResponse<LoginResponseData>;
      
      if (res.code === 0) {
        // 登录成功
        showSuccessMessage('登录成功');
        userStore.setToken(res.data.token);
        await userStore.getUserInfo();
        router.push(redirectPath);
        return true;
      } else {
        // 登录失败
        showErrorMessage(res.message || '登录失败');
        return false;
      }
    } catch (error: any) {
      showErrorMessage(error.message || '登录请求失败');
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // 退出登录
  const logout = () => {
    userStore.resetToken();
    showToast('已退出登录');
    
    // 跳转到首页
    if (router.currentRoute.value.path !== '/') {
      router.push('/');
    }
  };
  
  // 检查是否已登录
  const isLoggedIn = () => {
    return userStore.isLoggedIn;
  };
  
  return {
    loading,
    loginWithApi,
    logout,
    isLoggedIn
  };
} 