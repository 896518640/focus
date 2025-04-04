/** 声明 vite 环境变量的类型（如果未声明则默认是 any） */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE_URL: string
  readonly VITE_CONSOLE: "true" | "false"
  readonly VITE_ROUTER_HISTORY: "hash" | "html5"
  readonly VITE_PUBLIC_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 引用自动生成的类型声明文件
/// <reference path="./auto/auto-imports.d.ts" />
/// <reference path="./auto/components.d.ts" />

// 声明.vue文件的类型
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
