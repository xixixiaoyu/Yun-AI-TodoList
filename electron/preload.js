import { contextBridge } from 'electron'

// 定义安全的 API
const api = {
	// 环境变量访问
	env: {
		get: (key) => process.env[key],
	},

	// 版本信息
	versions: {
		node: () => process.versions.node,
		chrome: () => process.versions.chrome,
		electron: () => process.versions.electron,
	},

	// 系统信息
	system: {
		platform: process.platform,
		arch: process.arch,
	},
}

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electron', api)
