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

// 开发环境配置 (参考 dev-config.js)
const devSettings = {
  devServer: { port: 3000, host: 'localhost' },
  window: { openDevTools: true, x: 100, y: 100 },
  debug: { verbose: true, performance: true },
}

// 获取应用图标路径的辅助函数
function getAppIconPath() {
  if (app.isPackaged) {
    // 打包后的路径
    return path.join(process.resourcesPath, 'logo.png')
  } else {
    // 开发环境路径
    return path.join(__dirname, '../build/icon.png')
  }
}

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
      // 获取正确的图标路径
      const getIconPath = () => {
        if (app.isPackaged) {
          // 打包后的路径
          return path.join(process.resourcesPath, 'logo.png')
        } else {
          // 开发环境路径
          return path.join(__dirname, '../build/icon.png')
        }
      }

      const notification = new Notification({
        title,
        body,
        icon: getIconPath(),
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
  const windowOptions = {
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    // 开发环境下设置窗口位置
    ...(isDevelopment && {
      x: devSettings.window.x,
      y: devSettings.window.y,
    }),
    webPreferences: {
      // 安全配置
      nodeIntegration: false, // 禁用 Node.js 集成
      contextIsolation: true, // 启用上下文隔离
      enableRemoteModule: false, // 禁用远程模块
      allowRunningInsecureContent: false, // 禁止运行不安全内容
      experimentalFeatures: false, // 禁用实验性功能
      webSecurity: true, // 启用 Web 安全
      preload: path.join(__dirname, 'preload.js'),
      // 沙箱模式：生产环境可考虑启用以提高安全性
      // 注意：启用沙箱会限制某些功能，需要确保预加载脚本兼容
      sandbox: process.env.ENABLE_SANDBOX === 'true' ? true : false,
    },
    show: false,
    backgroundColor: '#f8f7f6',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: process.platform === 'linux' ? getAppIconPath() : undefined,
  }

  mainWindow = new BrowserWindow(windowOptions)

  // 安全：阻止新窗口创建
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 允许在外部浏览器中打开链接
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 安全：阻止导航到外部 URL
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    // 允许的域名列表
    const allowedOrigins = ['http://localhost:3000', 'https://localhost:3000', 'file://']

    if (!allowedOrigins.some((origin) => parsedUrl.origin.startsWith(origin))) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })

  // 安全：设置内容安全策略
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
            "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*; " +
            "img-src 'self' data: blob: https:; " +
            "media-src 'self' data: blob:; " +
            "font-src 'self' data:; " +
            "style-src 'self' 'unsafe-inline';",
        ],
      },
    })
  })

  // 优雅地显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // 开发环境下打开开发者工具
    if (isDevelopment && devSettings.window.openDevTools) {
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
