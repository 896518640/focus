import type { App } from 'vue'
import { Toast } from 'vant'

// 注册 Vant 组件
export function installVant(app: App) {
  // 全局注册 Toast 服务
  app.use(Toast)
}
