import { app, BrowserWindow, dialog, ipcMain, Notification, shell } from 'electron'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null

// 安全配置
const isDevelopment = process.env.NODE_ENV === 'development'

// 设置 IPC 处理器
function setupIPC() {
  // 应用程序控制
  ipcMain.handle('app-quit', () => {
    app.quit()
  })

  ipcMain.handle('app-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.handle('app-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.handle('app-unmaximize', () => {
    if (mainWindow) {
      mainWindow.unmaximize()
    }
  })

  ipcMain.handle('app-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false
  })

  ipcMain.handle('app-close', () => {
    if (mainWindow) {
      mainWindow.close()
    }
  })

  // 文件系统操作（受限）
  ipcMain.handle('fs-read-app-data', async (_, filename) => {
    try {
      const userDataPath = app.getPath('userData')
      const filePath = path.join(userDataPath, filename)
      const data = await fs.readFile(filePath, 'utf8')
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs-write-app-data', async (_, filename, data) => {
    try {
      const userDataPath = app.getPath('userData')
      const filePath = path.join(userDataPath, filename)
      await fs.writeFile(filePath, data, 'utf8')
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 通知
  ipcMain.handle('notification-show', (_, { title, body, ...options }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: path.join(__dirname, '../build/icon.png'),
        ...options,
      })
      notification.show()
      return { success: true }
    }
    return { success: false, error: 'Notifications not supported' }
  })

  // 系统信息
  ipcMain.handle('system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.getSystemVersion(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
      },
      cpu: os.cpus()[0]?.model || 'Unknown',
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false, // 如果需要更高安全性，可以设置为 true
    },
    show: false,
    backgroundColor: '#f8f7f6',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: process.platform === 'linux' ? path.join(__dirname, '../build/icon.png') : undefined,
  })

  // 安全：阻止新窗口创建
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 允许在外部浏览器中打开链接
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 安全：阻止导航到外部 URL
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })

  // 优雅地显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // 开发环境下打开开发者工具
    if (isDevelopment) {
      mainWindow.webContents.openDevTools()
    }
  })

  // 添加页面加载错误处理
  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error('页面加载失败:', errorCode, errorDescription, validatedURL)

      // 在生产环境中显示友好的错误页面
      if (!isDevelopment) {
        dialog.showErrorBox('加载错误', '应用程序无法正常加载，请重试。')
      }
    }
  )

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
  } else if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL)
  } else {
    const indexPath = app.isPackaged
      ? path.join(app.getAppPath(), 'dist', 'index.html')
      : path.join(process.cwd(), 'dist', 'index.html')

    mainWindow.loadFile(indexPath).catch((_err) => {
      // 记录错误到日志文件或错误追踪系统
    })
  }

  // 处理窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用程序准备就绪时创建窗口
app.whenReady().then(async () => {
  // 设置应用程序安全策略
  app.setAsDefaultProtocolClient('yun-ai-todo')

  // 设置 IPC 处理器
  setupIPC()

  createWindow()

  // macOS 应用程序激活时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 所有窗口关闭时退出应用程序
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 防止应用程序多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // 当运行第二个实例时，将焦点放在主窗口上
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// 安全：阻止权限请求
app.on('web-contents-created', (_event, contents) => {
  contents.on('new-window', (event, _navigationUrl) => {
    event.preventDefault()
  })
})

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)

  if (!isDevelopment) {
    dialog.showErrorBox('应用程序错误', '应用程序遇到了一个错误，将会重启。')
    app.relaunch()
    app.exit(0)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason, 'at:', promise)
})
