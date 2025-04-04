import type { App } from "vue"
import { installConsole } from "./console"
import { installPermissionDirective } from "./permission-directive"
import { installVant } from "./vant"

export function installPlugins(app: App) {
  installPermissionDirective(app)
  installConsole()
  installVant(app)
}
