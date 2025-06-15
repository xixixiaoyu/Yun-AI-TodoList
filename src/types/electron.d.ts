/**
 * Electron API 类型声明
 * 为渲染进程提供 Electron API 的类型支持
 */

interface ElectronEnv {
  get(key: string): string | undefined
  isDevelopment: boolean
  isProduction: boolean
}

interface ElectronVersions {
  node(): string
  chrome(): string
  electron(): string
  app: string
}

interface ElectronSystem {
  platform: string
  arch: string
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
}

interface ElectronApp {
  quit(): Promise<void>
  minimize(): Promise<void>
  maximize(): Promise<void>
  unmaximize(): Promise<void>
  isMaximized(): Promise<boolean>
  close(): Promise<void>
}

interface ElectronFS {
  readAppData(filename: string): Promise<string>
  writeAppData(filename: string, data: string): Promise<void>
}

interface ElectronNotificationOptions {
  icon?: string
  silent?: boolean
  tag?: string
  requireInteraction?: boolean
}

interface ElectronNotification {
  show(title: string, body: string, options?: ElectronNotificationOptions): Promise<void>
}

interface ElectronAPI {
  env: ElectronEnv
  versions: ElectronVersions
  system: ElectronSystem
  app: ElectronApp
  fs: ElectronFS
  notification: ElectronNotification
}

// 向后兼容的 electron 对象
interface ElectronLegacy {
  versions: ElectronVersions
  system: ElectronSystem
  env: ElectronEnv
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    electron: ElectronLegacy
  }
}

export {}
