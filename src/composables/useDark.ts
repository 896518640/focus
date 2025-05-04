import { getIsDark, setIsDark } from "@/utils/cache/local-storage"
import { setCssVar } from "@/utils/css"
import { useUserStore } from "@/pinia/stores/user"

// 创建响应式状态，但不要在顶层访问store
const isDark = ref<boolean>(getIsDark() === "true")

function _handler() {
  isDark.value = !isDark.value
  // store的访问移到函数内部
  try {
    const userStore = useUserStore()
    if (userStore.isLoggedIn) {
      userStore.updatePreferences({
        theme: isDark.value ? 'dark' : 'light'
      })
    }
  } catch (error) {
    console.warn('Failed to sync dark mode to user preferences:', error)
  }
}

function changeDark({ clientX, clientY }: MouseEvent) {
  const maxRadius = Math.hypot(
    Math.max(clientX, window.innerWidth - clientX),
    Math.max(clientY, window.innerHeight - clientY)
  )
  setCssVar("--mobvue-dark-x", `${clientX}px`)
  setCssVar("--mobvue-dark-y", `${clientY}px`)
  setCssVar("--mobvue-dark-r", `${maxRadius}px`)
  document.startViewTransition ? document.startViewTransition(_handler) : _handler()
}

/** 初始化 */
function initDark() {
  // watchEffect 来收集副作用
  watchEffect(() => {
    document.documentElement.classList.toggle("dark", isDark.value)
    setIsDark(isDark.value)
  })
  
  // 在初始化函数内部访问store，确保Pinia已经准备好
  try {
    const userStore = useUserStore()
    
    // 尝试从用户偏好设置中获取主题
    if (userStore.profile?.preferences?.theme === 'dark' && !isDark.value) {
      isDark.value = true
    } else if (userStore.profile?.preferences?.theme === 'light' && isDark.value) {
      isDark.value = false
    }
    
    // 监听用户偏好变化
    watch(
      () => userStore.profile?.preferences?.theme,
      (newTheme) => {
        if (newTheme === 'dark' && !isDark.value) {
          isDark.value = true
        } else if (newTheme === 'light' && isDark.value) {
          isDark.value = false
        }
      }
    )
  } catch (error) {
    console.warn('Failed to sync user preferences to dark mode:', error)
  }
}

// 手动设置暗黑模式状态
function setDarkMode(value: boolean) {
  if (isDark.value !== value) {
    isDark.value = value
    // 同步到用户偏好设置
    try {
      const userStore = useUserStore()
      if (userStore.isLoggedIn) {
        userStore.updatePreferences({
          theme: value ? 'dark' : 'light'
        })
      }
    } catch (error) {
      console.warn('Failed to sync dark mode to user preferences:', error)
    }
  }
}

/** 黑暗模式 Composable */
export function useDark() {
  return { isDark, changeDark, initDark, setDarkMode }
}
