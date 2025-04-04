// 重定向到 Pinia 中的 userStore
import { useUserStore as usePiniaUserStore } from '@/pinia/stores/user';
export * from '@/pinia/stores/user';

/**
 * @deprecated 请直接从 '@/pinia/stores/user' 导入
 * 这是一个兼容层，用于支持旧代码，建议所有新代码直接使用 Pinia store
 */
export const useUserStore = usePiniaUserStore; 