/* eslint-disable perfectionist/sort-imports */

// core
import { createApp } from 'vue/dist/vue.esm-bundler.js'
import { pinia } from "@/pinia"
import { router } from "@/router"
import { installPlugins } from "@/plugins"
import App from "@/App.vue"
import Vant from 'vant';
// vant
import "@vant/touch-emulator"
// 2. 引入组件样式
import 'vant/lib/index.css';
// css
import "normalize.css"
import "nprogress/nprogress.css"
import "@/assets/styles/index.css"
import "virtual:uno.css"
// 自定义 Vant 样式
import "@/assets/styles/vant-custom.css"
// fontawesome
import '@fortawesome/fontawesome-free/css/all.css'

// 创建应用实例
const app = createApp(App)

// 安装插件（全局组件、自定义指令等）
installPlugins(app)

// 安装 Vant
app.use(Vant)

// 安装 pinia 和 router
app.use(pinia).use(router)

// router 准备就绪后挂载应用
router.isReady().then(() => {
  app.mount("#app")
})
