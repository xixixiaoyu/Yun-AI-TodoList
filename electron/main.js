import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

// 获取 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 加载环境变量
const envPath = app.isPackaged
	? path.join(process.resourcesPath, '.env')
	: path.join(process.cwd(), '.env')

dotenv.config({ path: envPath })

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
	mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
		console.error('Page failed to load:', errorCode, errorDescription)
	})

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
	} else if (process.env.ELECTRON_START_URL) {
		mainWindow.loadURL(process.env.ELECTRON_START_URL)
	} else {
		const indexPath = app.isPackaged
			? path.join(app.getAppPath(), 'dist', 'index.html')
			: path.join(process.cwd(), 'dist', 'index.html')

		console.log('Loading index.html from:', indexPath)
		console.log('App path:', app.getAppPath())
		console.log('Resource path:', process.resourcesPath)

		mainWindow.loadFile(indexPath).catch(err => {
			console.error('Failed to load index.html:', err)
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
	process.on('uncaughtException', error => {
		console.error('Uncaught Exception:', error)
	})
}
