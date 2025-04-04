import { createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from "vue-router"
import { registerNavigationGuard } from "@/router/guard"
import Layout from "@/common/layout/index.vue"

const VITE_PUBLIC_PATH = import.meta.env.VITE_PUBLIC_PATH

const VITE_ROUTER_HISTORY = import.meta.env.VITE_ROUTER_HISTORY

/** 系统页面 */
export const systemRoutes: RouteRecordRaw[] = [
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    name: "403",
    meta: {
      title: "403"
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    name: "404",
    meta: {
      title: "404"
    },
    alias: "/:pathMatch(.*)*"
  }
]

/** 业务页面 */
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/pages/home/index.vue"),
        meta: {
          title: "首页",
          showNav: true
        }
      },
      {
        path: "/upload",
        name: "Upload",
        component: () => import("@/pages/upload/index.vue"),
        meta: {
          title: "上传",
          showNav: true
        }
      },
      {
        path: "/recognition",
        name: "Recognition",
        component: () => import("@/pages/recognition/index.vue"),
        meta: {
          title: "识别",
          showNav: true
        }
      },
      {
        path: "/history",
        name: "History",
        component: () => import("@/pages/history/index.vue"),
        meta: {
          title: "历史",
          showNav: true
        }
      },
      {
        path: "/profile",
        name: "Profile",
        component: () => import("@/pages/profile/index.vue"),
        meta: {
          title: "我的",
          showNav: true
        }
      }
    ]
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      title: "登录"
    }
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/pages/register/index.vue"),
    meta: {
      title: "注册"
    }
  }
]

// 构建路由配置
const allRoutes = [...systemRoutes, ...routes]


// 创建路由实例
export const router = createRouter({
  // 根据环境变量决定使用哪种路由模式
  history: VITE_ROUTER_HISTORY === "hash" ? 
    createWebHashHistory(VITE_PUBLIC_PATH) : 
    createWebHistory(VITE_PUBLIC_PATH),
  routes: allRoutes,
  // 刷新页面后滚动到顶部
  scrollBehavior: () => ({ left: 0, top: 0 })
})

console.log(allRoutes)

// 注册路由导航守卫
registerNavigationGuard(router)

export default router
