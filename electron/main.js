import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#fff',
  })

  // 优雅地显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 添加页面加载错误处理
  mainWindow.webContents.on('did-fail-load', (_event, _errorCode, _errorDescription) => {
    // 记录错误到日志文件或错误追踪系统
  })

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
app.whenReady().then(() => {
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
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// 开发环境下的错误处理
if (process.env.NODE_ENV === 'development') {
  process.on('uncaughtException', (_error) => {
    // 记录错误到日志文件或错误追踪系统
  })
}
