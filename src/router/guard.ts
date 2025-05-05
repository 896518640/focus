import type { Router, RouteLocationNormalizedGeneric } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"
import { useKeepAliveStore } from "@/pinia/stores/keep-alive"
import { isWhiteList } from "@/router/whitelist"
import { useTitle } from "@/composables/useTitle"
import { getToken } from "@/utils/cache/cookies"
import { showErrorMessage } from "@/utils/toast"
import NProgress from "nprogress"

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = "/login"
const HOME_PATH = "/"

// 记录上次token失效的时间，避免重复提示
let lastTokenInvalidTime = 0;

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to: RouteLocationNormalizedGeneric, from: RouteLocationNormalizedGeneric) => {
    // 开始进度条
    NProgress.start()
    
    // 获取用户状态
    const userStore = useUserStore()
    const token = getToken()
    
    // 判断用户是否登录
    const isAuthenticated = !!token
    
    // 如果访问的是白名单页面，直接放行
    if (isWhiteList(to)) {
      return true
    }
    
    // 处理登录状态
    if (!isAuthenticated) {
      // 未登录且访问非白名单页面，重定向到登录页
      if (to.path !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          query: { redirect: to.fullPath }
        }
      }
      return true
    }
    
    // 已登录状态下的处理
    if (to.path === LOGIN_PATH) {
      // 已登录用户访问登录页，重定向到首页
      return HOME_PATH
    }
    
    // 验证用户信息是否已加载
    if (!userStore.isUserInfoLoaded && token) {
      try {
        // 尝试获取用户信息
        await userStore.getUserInfo()
      } catch (error) {
        // 获取用户信息失败，可能是token无效
        // 避免与axios中401处理冲突，这里只处理一次
        const now = Date.now();
        if (now - lastTokenInvalidTime > 5000) {
          lastTokenInvalidTime = now;
          userStore.resetToken()
          
          // 不再在这里显示错误信息，让axios拦截器统一处理
          // showErrorMessage('登录状态已失效，请重新登录')
        }
        
        return {
          path: LOGIN_PATH,
          query: { redirect: to.fullPath }
        }
      }
    }
    
    // 权限验证（如果页面需要权限）
    if (to.meta.requiresAuth !== false && to.meta.roles) {
      const hasPermission = userStore.roles.some((role: string) => 
        (to.meta.roles as string[]).includes(role)
      )
      
      if (!hasPermission) {
        showErrorMessage('您没有访问该页面的权限')
        return from.path !== '/' ? { path: from.path } : '/'
      }
    }
    
    return true
  })
  
  // 全局后置钩子
  router.afterEach((to: RouteLocationNormalizedGeneric) => {
    const keepAliveStore = useKeepAliveStore()
    
    // 处理路由缓存
    if (to.path === LOGIN_PATH) {
      // 登录页清除所有缓存
      keepAliveStore.delAllCachedRoutes()
    } else if (to.meta.keepAlive === false) {
      // 标记为不缓存的页面
      keepAliveStore.delCachedRoute(to)
    } else {
      // 默认添加到缓存
      keepAliveStore.addCachedRoute(to)
    }
    
    // 设置页面标题
    const title = to.meta.title as string
    if (title) {
      setTitle(title)
    }
    
    // 完成进度条
    NProgress.done()
  })
  
  // 路由错误处理
  router.onError((error: Error) => {
    console.error('路由错误:', error)
    NProgress.done()
  })
}
