/// <reference types="vite/client" />

// 环境变量类型定义
declare const __CAPACITOR__: boolean
declare const __ELECTRON__: boolean

// Capacitor 全局类型
interface Window {
  electronAPI?: {
    env?: {
      get: (key: string) => string | undefined
      isDevelopment: boolean
      isProduction: boolean
    }
    versions?: {
      node: () => string
      chrome: () => string
      electron: () => string
      app: string
    }
    system?: {
      platform: string
      arch: string
      isWindows: boolean
      isMac: boolean
      isLinux: boolean
    }
  }
}
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >
  export default component
}
