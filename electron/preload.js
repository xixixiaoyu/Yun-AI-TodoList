import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
	getEnv: key => process.env[key],
})
