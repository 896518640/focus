declare module 'vue-router' {
  export * from 'vue-router/dist/vue-router'
  
  import { RouteRecordRaw as _RouteRecordRaw } from 'vue-router/dist/vue-router'
  
  export interface RouteMeta {
    title?: string;
    roles?: string[];
    keepAlive?: boolean;
    showNav?: boolean;
    layout?: {
      navBar?: {
        showNavBar?: boolean;
        showLeftArrow?: boolean;
      };
      tabbar?: {
        showTabbar?: boolean;
        icon?: string;
      };
    };
  }
  
  export interface RouteRecordRaw extends _RouteRecordRaw {
    alias?: string | string[];
  }

  // 添加组合式API导出
  export function useRouter(): any;
  export function useRoute(): any;
}
