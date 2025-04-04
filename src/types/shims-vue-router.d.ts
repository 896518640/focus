import 'vue-router'

// 确保 vue-router 类型正确导出
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    layout?: {
      navBar?: {
        showNavBar?: boolean
      }
      tabbar?: {
        showTabbar?: boolean
      }
    }
  }

  // 导出 vue-router 的类型
  export type RouteRecordRaw = import('vue-router').RouteRecordRaw
  export function createRouter(...args: any[]): any
  export function createWebHistory(...args: any[]): any
  export function createWebHashHistory(...args: any[]): any
  export function useRouter(): any
  export function useRoute(): any
}
