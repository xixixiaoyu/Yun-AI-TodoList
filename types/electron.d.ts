/**
 * Electron API 类型定义
 * 为预加载脚本暴露的 electronAPI 提供 TypeScript 类型支持
 */

export interface SystemInfo {
  platform: string
  arch: string
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
}

export interface VersionInfo {
  node: () => string
  chrome: () => string
  electron: () => string
  app: string
}

export interface EnvAPI {
  get: (key: string) => string | undefined
  isDevelopment: boolean
  isProduction: boolean
}

export interface AppAPI {
  quit: () => Promise<void>
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  unmaximize: () => Promise<void>
  isMaximized: () => Promise<boolean>
  close: () => Promise<void>
}

export interface FileSystemAPI {
  readAppData: (filename: string) => Promise<{ success: boolean; data?: string; error?: string }>
  writeAppData: (filename: string, data: string) => Promise<{ success: boolean; error?: string }>
}

export interface NotificationOptions {
  title: string
  body: string
  [key: string]: any
}

export interface NotificationAPI {
  show: (
    title: string,
    body: string,
    options?: Partial<NotificationOptions>
  ) => Promise<{ success: boolean; error?: string }>
}

export interface ElectronAPI {
  env: EnvAPI
  versions: VersionInfo
  system: SystemInfo
  app: AppAPI
  fs: FileSystemAPI
  notification: NotificationAPI
}

// 向后兼容的 electron 对象
export interface LegacyElectronAPI {
  versions: VersionInfo
  system: SystemInfo
  env: EnvAPI
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    electron: LegacyElectronAPI
  }
}

export {}
