import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// 获取 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 加载环境变量
dotenv.config()

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
			contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
			preload: path.join(__dirname, 'preload.js'),
		},
	})

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else if (process.env.ELECTRON_START_URL) {
		win.loadURL(process.env.ELECTRON_START_URL)
	} else {
		win.loadURL(`file://${path.join(__dirname, '..', 'dist/index.html')}`)
	}
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})
