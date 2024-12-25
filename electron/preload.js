const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getEnv: key => process.env[key]
})
