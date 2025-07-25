/**
 * Electron API 工具函数
 * 提供类型安全的 Electron API 访问
 */

/**
 * 检查是否在 Electron 环境中运行
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI
}

/**
 * 获取 Electron API（类型安全）
 */
export function getElectronAPI() {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment')
  }
  return window.electronAPI
}

/**
 * 获取系统信息
 */
export async function getSystemInfo() {
  if (!isElectron()) return null
  return window.electronAPI.system
}

/**
 * 获取应用版本信息
 */
export async function getVersionInfo() {
  if (!isElectron()) return null
  return {
    node: window.electronAPI.versions.node(),
    chrome: window.electronAPI.versions.chrome(),
    electron: window.electronAPI.versions.electron(),
    app: window.electronAPI.versions.app,
  }
}

/**
 * 显示系统通知
 */
export async function showNotification(title: string, body: string, options?: any) {
  if (!isElectron()) {
    // 回退到 Web Notification API
    if ('Notification' in window) {
      new Notification(title, { body, ...options })
      return { success: true }
    }
    return { success: false, error: 'Notifications not supported' }
  }

  return window.electronAPI.notification.show(title, body, options)
}

/**
 * 应用控制函数
 */
export const electronApp = {
  async quit() {
    if (!isElectron()) return
    return window.electronAPI.app.quit()
  },

  async minimize() {
    if (!isElectron()) return
    return window.electronAPI.app.minimize()
  },

  async maximize() {
    if (!isElectron()) return
    return window.electronAPI.app.maximize()
  },

  async close() {
    if (!isElectron()) return
    return window.electronAPI.app.close()
  },

  async isMaximized() {
    if (!isElectron()) return false
    return window.electronAPI.app.isMaximized()
  },
}

/**
 * 文件系统操作
 */
export const electronFS = {
  async readAppData(filename: string) {
    if (!isElectron()) {
      throw new Error('File system operations only available in Electron')
    }
    return window.electronAPI.fs.readAppData(filename)
  },

  async writeAppData(filename: string, data: string) {
    if (!isElectron()) {
      throw new Error('File system operations only available in Electron')
    }
    return window.electronAPI.fs.writeAppData(filename, data)
  },
}
