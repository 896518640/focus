<script setup lang="ts">
import { ref } from 'vue';

// 使用编译宏，不需要导入
const props = defineProps({
  animations: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  animateLogin: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['login', 'togglePassword']);

const email = ref('');
const password = ref('');
const showPassword = ref(false);

// 切换密码显示/隐藏
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
  emit('togglePassword');
};

// 登录处理
const handleLogin = () => {
  if (!email.value || !password.value) {
    return;
  }
  emit('login', { email: email.value, password: password.value });
};

// 暴露给父组件的属性和方法
defineExpose({
  email,
  password
});
</script>

<template>
  <div class="login-form">
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
      <div class="input-icon" @click="togglePasswordVisibility">
        <i :class="['fas', showPassword ? 'fa-eye' : 'fa-eye-slash']"></i>
      </div>
    </div>
    
    <!-- 忘记密码 -->
    <div class="forgot-password" :class="{ 'animate-in': animations.forgotPassword }">
      <a href="#">忘记密码？</a>
    </div>
    
    <!-- 登录按钮 -->
    <button 
      class="login-button" 
      :class="{ 
        'loading': loading, 
        'animate-in': animations.loginButton,
        'animate-pulse': animateLogin
      }"
      @click="handleLogin"
      :disabled="loading"
    >
      <span v-if="!loading">登录</span>
      <span v-else class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
        登录中...
      </span>
    </button>
  </div>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group-animated {
  position: relative;
  margin-bottom: 5px;
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
  padding: 15px 15px 15px 45px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.8);
}

.input-field:focus {
  border-color: var(--primary-color, #007AFF);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  outline: none;
}

.input-field:focus + .input-label,
.input-field:not(:placeholder-shown) + .input-label {
  transform: translateY(-25px) scale(0.85);
  color: var(--primary-color, #007AFF);
}

.input-label {
  position: absolute;
  left: 45px;
  top: 15px;
  color: var(--text-secondary, #8e8e93);
  pointer-events: none;
  transition: all 0.3s;
  transform-origin: left top;
}

.input-icon {
  position: absolute;
  left: 15px;
  top: 15px;
  color: var(--text-secondary, #8e8e93);
  cursor: pointer;
}

.forgot-password {
  text-align: right;
  font-size: 14px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.forgot-password.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.forgot-password a {
  color: var(--primary-color, #007AFF);
  text-decoration: none;
}

.login-button {
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0;
  transform: translateY(20px);
  position: relative;
  overflow: hidden;
}

.login-button.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.login-button:hover {
  background-color: var(--primary-dark, #0062cc);
}

.login-button:active {
  transform: scale(0.98);
}

.login-button:disabled {
  background-color: var(--disabled-color, #c7c7cc);
  cursor: not-allowed;
}

.login-button.animate-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 122, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .input-field {
    background-color: rgba(30, 30, 30, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .input-field:focus {
    border-color: var(--primary-color);
  }
}
</style>
