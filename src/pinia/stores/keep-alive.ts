import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pinia } from "@/pinia"
import { isString } from "@@/utils/validate"

export const useKeepAliveStore = defineStore("keep-alive", () => {
  const cachedRoutes = ref<string[]>([])

  const addCachedRoute = (route: any) => {
    const keepAlive = route.meta?.keepAlive
    const name = route.name
    if (keepAlive && name && typeof name === 'string' && !cachedRoutes.value.includes(name)) {
      cachedRoutes.value.push(name)
    }
  }

  const delAllCachedRoutes = () => {
    cachedRoutes.value = []
  }

  return { cachedRoutes, addCachedRoute, delAllCachedRoutes }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useKeepAliveStoreOutside() {
  return useKeepAliveStore(pinia)
}
