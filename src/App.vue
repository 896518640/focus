<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useUserStore } from "@/pinia/stores/user"
import { useDark } from "@@/composables/useDark"
import { getToken } from "@@/utils/cache/cookies"

const userStore = useUserStore()

const { isDark, initDark } = useDark()

// 修改加载状态的判断逻辑
const isLoading = computed(() => {
  // 如果没有token，不需要加载
  if (!getToken()) return false
  // 如果有token但没有用户名，说明正在加载用户信息
  return userStore.token !== null && !userStore.username
})

// 初始化时检查是否需要进入游客模式
onMounted(() => {
  // 如果没有token，设置为游客模式
  if (!getToken()) {
    userStore.setGuestMode(true)
  }
})

watch(
  () => userStore.token,
  (newVal: string | null) => {
    if (newVal) {
      console.log('newVal', newVal)
      userStore.getInfo()
    }
  },
  {
    immediate: true
  }
)

initDark()
</script>

<template>
  <van-config-provider :theme="isDark ? 'dark' : 'light'" un-h-full>
    <van-loading v-if="isLoading" un-h-full un-flex-center>
      加载中...
    </van-loading>
    <router-view v-else v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </van-config-provider>
</template>

<style>
:root {
  --primary-color: #007AFF;
  --secondary-color: #5AC8FA;
  --success-color: #4CD964;
  --warning-color: #FF9500;
  --error-color: #FF3B30;
  --info-color: #34AADC;
  --text-primary: #000000;
  --text-secondary: #8E8E93;
  --background-color: #F2F2F7;
  --background-light: #FFFFFF;
  --background-secondary: #F5F5F5;
  --background-tertiary: #EBEBEB;
  --border-color: rgba(209, 209, 214, 0.5);
  --border-radius-sm: 8px;
  --border-radius-md: 14px;
  --border-radius-lg: 20px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
  color: var(--text-primary);
}

/* iOS风格的点击态效果 */
.ios-tap-highlight {
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.2s;
}

.ios-tap-highlight:active {
  opacity: 0.7;
}

/* 页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
