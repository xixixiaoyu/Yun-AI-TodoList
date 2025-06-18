import { contextBridge, ipcRenderer } from 'electron'

// 定义允许访问的环境变量白名单
const ALLOWED_ENV_VARS = ['NODE_ENV', 'ELECTRON_START_URL']

// 定义安全的 API
const api = {
  // 环境变量访问（仅允许白名单中的变量）
  env: {
    get: (key) => {
      if (ALLOWED_ENV_VARS.includes(key)) {
        return process.env[key]
      }
      return undefined
    },
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // 版本信息
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    app: '0.0.0', // 从 package.json 获取
  },

  // 系统信息
  system: {
    platform: process.platform,
    arch: process.arch,
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
  },

  // 应用程序控制
  app: {
    quit: () => ipcRenderer.invoke('app-quit'),
    minimize: () => ipcRenderer.invoke('app-minimize'),
    maximize: () => ipcRenderer.invoke('app-maximize'),
    unmaximize: () => ipcRenderer.invoke('app-unmaximize'),
    isMaximized: () => ipcRenderer.invoke('app-is-maximized'),
    close: () => ipcRenderer.invoke('app-close'),
  },

  // 文件系统操作（受限）
  fs: {
    // 仅允许读取应用程序数据目录
    readAppData: (filename) => ipcRenderer.invoke('fs-read-app-data', filename),
    writeAppData: (filename, data) => ipcRenderer.invoke('fs-write-app-data', filename, data),
  },

  // 通知
  notification: {
    show: (title, body, options = {}) =>
      ipcRenderer.invoke('notification-show', { title, body, ...options }),
  },
}

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', api)

// 为了向后兼容，保留原有的 electron 对象
contextBridge.exposeInMainWorld('electron', {
  versions: api.versions,
  system: api.system,
  env: api.env,
})
