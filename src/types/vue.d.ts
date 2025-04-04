// Vue 类型定义
declare module 'vue' {
  export type Ref<T> = { value: T }
  export function ref<T>(value: T): Ref<T>
  export function reactive<T extends object>(target: T): T
  export function computed<T>(getter: () => T): Ref<T>
  export type ComputedRef<T> = Ref<T>
  export function watch<T>(source: Ref<T> | (() => T), callback: (value: T, oldValue: T) => void, options?: any): void
  export function onMounted(callback: () => void): void
  export function onUnmounted(callback: () => void): void
  export function nextTick(callback?: () => void): Promise<void>
  // Support both runtime props
  export function defineProps<T>(props: T): T
  // And macro props (compiler macros)
  export function defineProps<T>(): T
  // Support both runtime emits with string array
  export function defineEmits<T extends string[]>(emits: T): {
    (event: T[number], ...args: any[]): void
  }
  // Support runtime emits with object
  export function defineEmits<T extends Record<string, any>>(emits: T): {
    <K extends keyof T>(event: K, ...args: T[K] extends (...args: infer P) => any ? P : never): void
  }
  // And macro emits (compiler macros)
  export function defineEmits<T>(): T

  // Support computed with get/set form
  export function computed<T>(options: { 
    get: () => T; 
    set: (value: T) => void 
  }): Ref<T>

  export type PropType<T> = any
  export type App = any
  export type Directive = any
}

// Vue Router 类型定义
declare module 'vue-router' {
  export type Router = any
  export type RouteLocationNormalizedGeneric = any
  export type RouteRecordNameGeneric = any
  export function createRouter(options: any): Router
  export function createWebHashHistory(base?: string): any
  export function createWebHistory(base?: string): any
  export type RouteRecordRaw = any
}
