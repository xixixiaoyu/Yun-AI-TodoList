# 跨平台解决方案：Electron + Capacitor 架构

## 技术概述

本项目采用 Electron +
Capacitor 双引擎架构，实现真正的一套代码多端运行，支持桌面端（Windows、macOS、Linux）和移动端（iOS、Android）的全平台覆盖。

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue 3 + TypeScript 核心应用              │
├─────────────────────────────────────────────────────────────┤
│                      共享业务逻辑层                          │
│  ├─ Composables     ├─ Services      ├─ Utils              │
│  ├─ Stores (Pinia)  ├─ Types         ├─ Constants          │
├─────────────────────┬───────────────────────────────────────┤
│    桌面端适配层      │              移动端适配层              │
│  ┌─────────────────┐│  ┌─────────────────────────────────────┐│
│  │   Electron      ││  │           Capacitor                 ││
│  │  ├─ Main Process││  │  ├─ Native Bridge                  ││
│  │  ├─ Renderer   ││  │  ├─ Plugin System                 ││
│  │  ├─ IPC        ││  │  ├─ Platform APIs                 ││
│  │  └─ Native APIs││  │  └─ WebView Container              ││
│  └─────────────────┘│  └─────────────────────────────────────┘│
├─────────────────────┼───────────────────────────────────────┤
│   Windows/macOS/    │        iOS/Android                    │
│      Linux          │                                       │
└─────────────────────┴───────────────────────────────────────┘
```

## 📱 Capacitor 移动端解决方案

### Capacitor 配置

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yunmu.todolist',
  appName: 'Yun AI TodoList',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    App: {
      launchUrl: 'capacitor://localhost',
    },
  },
  ios: {
    scheme: 'Yun AI TodoList',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
}

export default config
```

### 平台检测和适配

```typescript
// composables/usePlatform.ts
import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'

export function usePlatform() {
  const deviceInfo = ref<any>(null)
  const isNative = computed(() => Capacitor.isNativePlatform())
  const isWeb = computed(() => Capacitor.getPlatform() === 'web')
  const isIOS = computed(() => Capacitor.getPlatform() === 'ios')
  const isAndroid = computed(() => Capacitor.getPlatform() === 'android')
  const isElectron = computed(() => {
    return typeof window !== 'undefined' && window.electronAPI
  })

  const platform = computed(() => {
    if (isElectron.value) return 'electron'
    if (isIOS.value) return 'ios'
    if (isAndroid.value) return 'android'
    return 'web'
  })

  const getDeviceInfo = async () => {
    try {
      deviceInfo.value = await Device.getInfo()
      return deviceInfo.value
    } catch (error) {
      console.warn('获取设备信息失败:', error)
      return null
    }
  }

  const getPlatformClass = () => {
    return {
      'platform-ios': isIOS.value,
      'platform-android': isAndroid.value,
      'platform-electron': isElectron.value,
      'platform-web': isWeb.value,
      'platform-native': isNative.value,
    }
  }

  return {
    deviceInfo,
    isNative,
    isWeb,
    isIOS,
    isAndroid,
    isElectron,
    platform,
    getDeviceInfo,
    getPlatformClass,
  }
}
```

### 原生功能集成

```typescript
// services/nativeService.ts
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { Device } from '@capacitor/device'

export class NativeService {
  // 相机功能
  static async takePicture() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('相机功能仅在原生平台可用')
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      })

      return image.dataUrl
    } catch (error) {
      console.error('拍照失败:', error)
      throw error
    }
  }

  // 文件系统操作
  static async saveFile(fileName: string, data: string) {
    if (!Capacitor.isNativePlatform()) {
      // Web 平台使用 localStorage 或 IndexedDB
      localStorage.setItem(fileName, data)
      return
    }

    try {
      await Filesystem.writeFile({
        path: fileName,
        data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
    } catch (error) {
      console.error('文件保存失败:', error)
      throw error
    }
  }

  static async readFile(fileName: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      return localStorage.getItem(fileName) || ''
    }

    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })

      return result.data as string
    } catch (error) {
      console.error('文件读取失败:', error)
      return ''
    }
  }

  // 分享功能
  static async shareContent(title: string, text: string, url?: string) {
    if (!Capacitor.isNativePlatform()) {
      // Web 平台使用 Web Share API
      if (navigator.share) {
        await navigator.share({ title, text, url })
      } else {
        // 降级到复制到剪贴板
        await navigator.clipboard.writeText(
          `${title}\n${text}${url ? `\n${url}` : ''}`
        )
      }
      return
    }

    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: '分享到',
      })
    } catch (error) {
      console.error('分享失败:', error)
      throw error
    }
  }

  // 触觉反馈
  static async hapticFeedback(style: ImpactStyle = ImpactStyle.Medium) {
    if (!Capacitor.isNativePlatform()) {
      // Web 平台使用 Vibration API
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
      return
    }

    try {
      await Haptics.impact({ style })
    } catch (error) {
      console.warn('触觉反馈不可用:', error)
    }
  }

  // 状态栏控制
  static async setStatusBarStyle(style: Style) {
    if (!Capacitor.isNativePlatform()) return

    try {
      await StatusBar.setStyle({ style })
    } catch (error) {
      console.warn('状态栏样式设置失败:', error)
    }
  }

  // 启动屏幕控制
  static async hideSplashScreen() {
    if (!Capacitor.isNativePlatform()) return

    try {
      await SplashScreen.hide()
    } catch (error) {
      console.warn('隐藏启动屏幕失败:', error)
    }
  }

  // 应用状态监听
  static setupAppStateListeners() {
    if (!Capacitor.isNativePlatform()) return

    App.addListener('appStateChange', ({ isActive }) => {
      console.log('应用状态变化:', isActive ? '前台' : '后台')
      // 可以在这里处理应用前后台切换逻辑
    })

    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp()
      } else {
        window.history.back()
      }
    })
  }

  // 网络状态监听
  static setupNetworkListeners() {
    if (!Capacitor.isNativePlatform()) {
      // Web 平台使用 Navigator API
      window.addEventListener('online', () => {
        console.log('网络已连接')
      })

      window.addEventListener('offline', () => {
        console.log('网络已断开')
      })
      return
    }

    Network.addListener('networkStatusChange', (status) => {
      console.log('网络状态变化:', status)
    })
  }

  // 获取设备信息
  static async getDeviceInfo() {
    if (!Capacitor.isNativePlatform()) {
      return {
        platform: 'web',
        model: navigator.userAgent,
        operatingSystem: navigator.platform,
        osVersion: 'unknown',
        manufacturer: 'unknown',
        isVirtual: false,
        webViewVersion: 'unknown',
      }
    }

    try {
      return await Device.getInfo()
    } catch (error) {
      console.error('获取设备信息失败:', error)
      return null
    }
  }
}
```

## 🖥️ Electron 桌面端解决方案

### Electron 主进程配置

```typescript
// electron/main.ts
import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

class ElectronApp {
  private mainWindow: BrowserWindow | null = null

  constructor() {
    this.setupApp()
  }

  private setupApp() {
    // 应用准备就绪
    app.whenReady().then(() => {
      electronApp.setAppUserModelId('com.yunmu.todolist')

      // 开发环境下监听文件变化
      app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
      })

      this.createWindow()
      this.setupIPC()
      this.setupMenu()

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow()
        }
      })
    })

    // 所有窗口关闭时退出应用（macOS 除外）
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      icon,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
      },
    })

    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow?.show()
    })

    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    // 加载应用
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  private setupIPC() {
    // 文件操作
    ipcMain.handle(
      'file:save',
      async (_, data: { content: string; fileName: string }) => {
        try {
          const { filePath } = await dialog.showSaveDialog(this.mainWindow!, {
            defaultPath: data.fileName,
            filters: [
              { name: 'JSON Files', extensions: ['json'] },
              { name: 'Text Files', extensions: ['txt'] },
              { name: 'All Files', extensions: ['*'] },
            ],
          })

          if (filePath) {
            const fs = require('fs').promises
            await fs.writeFile(filePath, data.content, 'utf8')
            return { success: true, filePath }
          }

          return { success: false, error: '用户取消保存' }
        } catch (error) {
          return { success: false, error: error.message }
        }
      }
    )

    ipcMain.handle('file:open', async () => {
      try {
        const { filePaths } = await dialog.showOpenDialog(this.mainWindow!, {
          properties: ['openFile'],
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        })

        if (filePaths.length > 0) {
          const fs = require('fs').promises
          const content = await fs.readFile(filePaths[0], 'utf8')
          return { success: true, content, filePath: filePaths[0] }
        }

        return { success: false, error: '用户取消打开' }
      } catch (error) {
        return { success: false, error: error.message }
      }
    })

    // 系统信息
    ipcMain.handle('system:info', () => {
      const os = require('os')
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

    // 窗口控制
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize()
    })

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize()
      } else {
        this.mainWindow?.maximize()
      }
    })

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close()
    })

    // 通知
    ipcMain.handle(
      'notification:show',
      (_, data: { title: string; body: string }) => {
        const { Notification } = require('electron')

        if (Notification.isSupported()) {
          new Notification({
            title: data.title,
            body: data.body,
            icon,
          }).show()
        }
      }
    )
  }

  private setupMenu() {
    const template: any[] = [
      {
        label: '文件',
        submenu: [
          {
            label: '新建',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu:new')
            },
          },
          {
            label: '打开',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu:open')
            },
          },
          {
            label: '保存',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu:save')
            },
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit()
            },
          },
        ],
      },
      {
        label: '编辑',
        submenu: [
          { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        ],
      },
      {
        label: '视图',
        submenu: [
          { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          {
            label: '强制重新加载',
            accelerator: 'CmdOrCtrl+Shift+R',
            role: 'forceReload',
          },
          { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
          { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
          { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
        ],
      },
      {
        label: '窗口',
        submenu: [
          { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
          { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' },
        ],
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '关于',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: '关于 Yun AI TodoList',
                message: 'Yun AI TodoList',
                detail: '一个智能的跨平台待办事项应用\n版本: 1.0.0',
              })
            },
          },
        ],
      },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

new ElectronApp()
```

### Electron 预加载脚本

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  file: {
    save: (data: { content: string; fileName: string }) =>
      ipcRenderer.invoke('file:save', data),
    open: () => ipcRenderer.invoke('file:open'),
  },

  // 系统信息
  system: {
    getInfo: () => ipcRenderer.invoke('system:info'),
  },

  // 窗口控制
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // 通知
  notification: {
    show: (data: { title: string; body: string }) =>
      ipcRenderer.invoke('notification:show', data),
  },

  // 菜单事件监听
  menu: {
    onNew: (callback: () => void) => ipcRenderer.on('menu:new', callback),
    onOpen: (callback: () => void) => ipcRenderer.on('menu:open', callback),
    onSave: (callback: () => void) => ipcRenderer.on('menu:save', callback),
  },
})

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      file: {
        save: (data: { content: string; fileName: string }) => Promise<any>
        open: () => Promise<any>
      }
      system: {
        getInfo: () => Promise<any>
      }
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
      notification: {
        show: (data: { title: string; body: string }) => Promise<void>
      }
      menu: {
        onNew: (callback: () => void) => void
        onOpen: (callback: () => void) => void
        onSave: (callback: () => void) => void
      }
    }
  }
}
```

### 跨平台服务抽象

```typescript
// services/platformService.ts
import { NativeService } from './nativeService'
import { usePlatform } from '@/composables/usePlatform'

export class PlatformService {
  private static platform = usePlatform()

  // 文件操作
  static async saveFile(fileName: string, content: string) {
    if (this.platform.isElectron.value) {
      return window.electronAPI.file.save({ fileName, content })
    } else if (this.platform.isNative.value) {
      return NativeService.saveFile(fileName, content)
    } else {
      // Web 平台降级处理
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  static async openFile(): Promise<string | null> {
    if (this.platform.isElectron.value) {
      const result = await window.electronAPI.file.open()
      return result.success ? result.content : null
    } else if (this.platform.isNative.value) {
      // 移动端可能需要不同的文件选择策略
      return null
    } else {
      // Web 平台使用 File API
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,.txt'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              resolve(e.target?.result as string)
            }
            reader.readAsText(file)
          } else {
            resolve(null)
          }
        }
        input.click()
      })
    }
  }

  // 通知
  static async showNotification(title: string, body: string) {
    if (this.platform.isElectron.value) {
      return window.electronAPI.notification.show({ title, body })
    } else if (this.platform.isNative.value) {
      // 使用 Capacitor 的本地通知
      const { LocalNotifications } = await import(
        '@capacitor/local-notifications'
      )
      return LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      })
    } else {
      // Web 平台使用 Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body })
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification(title, { body })
        }
      }
    }
  }

  // 系统信息
  static async getSystemInfo() {
    if (this.platform.isElectron.value) {
      return window.electronAPI.system.getInfo()
    } else if (this.platform.isNative.value) {
      return NativeService.getDeviceInfo()
    } else {
      return {
        platform: 'web',
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      }
    }
  }

  // 分享功能
  static async share(data: { title: string; text: string; url?: string }) {
    if (this.platform.isElectron.value) {
      // 桌面端复制到剪贴板
      await navigator.clipboard.writeText(
        `${data.title}\n${data.text}${data.url ? `\n${data.url}` : ''}`
      )
    } else if (this.platform.isNative.value) {
      return NativeService.shareContent(data.title, data.text, data.url)
    } else {
      // Web 平台使用 Web Share API
      if (navigator.share) {
        return navigator.share(data)
      } else {
        await navigator.clipboard.writeText(
          `${data.title}\n${data.text}${data.url ? `\n${data.url}` : ''}`
        )
      }
    }
  }
}
```

## 🎨 平台特定样式适配

### CSS 平台适配

```scss
// styles/platform.scss

// 基础平台类
.platform-ios {
  // iOS 特定样式
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);

  .app-header {
    padding-top: var(--safe-area-inset-top);
  }

  .app-footer {
    padding-bottom: var(--safe-area-inset-bottom);
  }

  // iOS 风格的按钮
  .btn {
    border-radius: 8px;
    font-weight: 500;
  }
}

.platform-android {
  // Android Material Design 样式
  .btn {
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.platform-electron {
  // 桌面端样式
  .app-container {
    border-radius: 0;
  }

  // 自定义标题栏（如果需要）
  .title-bar {
    height: 32px;
    background: var(--bg-color);
    -webkit-app-region: drag;

    .window-controls {
      -webkit-app-region: no-drag;
    }
  }

  // 桌面端特有的快捷键提示
  .shortcut-hint {
    display: inline;
    opacity: 0.7;
    font-size: 0.8em;
  }
}

.platform-web {
  // Web 平台样式
  .install-prompt {
    display: block;
  }
}

// 响应式断点
@media (max-width: 768px) {
  .platform-web {
    // 移动端 Web 样式
    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.3s ease;

      &.open {
        transform: translateX(0);
      }
    }
  }
}

// 平台特定的滚动条样式
.platform-electron,
.platform-web {
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-color-soft);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;

    &:hover {
      background: var(--text-color-soft);
    }
  }
}
```

### 平台适配组件

```vue
<!-- components/PlatformAdaptive.vue -->
<template>
  <div :class="platformClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlatform } from '@/composables/usePlatform'

interface Props {
  showOnPlatforms?: string[]
  hideOnPlatforms?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  showOnPlatforms: () => [],
  hideOnPlatforms: () => [],
})

const { platform, getPlatformClass } = usePlatform()

const platformClasses = computed(() => {
  const classes = getPlatformClass()

  // 显示/隐藏逻辑
  if (props.showOnPlatforms.length > 0) {
    classes['hidden'] = !props.showOnPlatforms.includes(platform.value)
  }

  if (props.hideOnPlatforms.length > 0) {
    classes['hidden'] = props.hideOnPlatforms.includes(platform.value)
  }

  return classes
})
</script>

<style scoped>
.hidden {
  display: none !important;
}
</style>
```

## 📦 构建和部署

### 构建脚本配置

```json
// package.json
{
  "scripts": {
    // 开发环境
    "dev": "vite",
    "dev:electron": "electron-vite dev",
    "dev:ios": "cap run ios",
    "dev:android": "cap run android",

    // 构建
    "build": "vue-tsc && vite build",
    "build:electron": "electron-vite build",
    "build:ios": "cap build ios",
    "build:android": "cap build android",

    // 打包
    "package:electron": "electron-builder",
    "package:ios": "cap copy ios && cd ios && xcodebuild -workspace App.xcworkspace -scheme App archive",
    "package:android": "cap copy android && cd android && ./gradlew assembleRelease",

    // 同步
    "sync:capacitor": "cap sync",
    "sync:ios": "cap sync ios",
    "sync:android": "cap sync android"
  }
}
```

### Electron Builder 配置

```json
// electron-builder.json
{
  "appId": "com.yunmu.todolist",
  "productName": "Yun AI TodoList",
  "directories": {
    "output": "dist-electron"
  },
  "files": ["dist/**/*", "node_modules/**/*", "package.json"],
  "mac": {
    "category": "public.app-category.productivity",
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      },
      {
        "target": "zip",
        "arch": ["x64", "arm64"]
      }
    ]
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]
      },
      {
        "target": "portable",
        "arch": ["x64", "ia32"]
      }
    ]
  },
  "linux": {
    "target": [
      {
        "target": "AppImage",
        "arch": ["x64"]
      },
      {
        "target": "deb",
        "arch": ["x64"]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

## 📈 学习要点

### 1. 跨平台架构设计

- 共享代码层的抽象设计
- 平台特定功能的适配策略
- 统一 API 接口的设计模式
- 条件编译和运行时检测

### 2. Capacitor 移动端开发

- 原生插件系统的使用
- WebView 和原生代码的桥接
- 平台特定配置和优化
- 移动端性能优化策略

### 3. Electron 桌面端开发

- 主进程和渲染进程的通信
- IPC 机制的安全实现
- 原生菜单和快捷键集成
- 桌面端特有功能实现

### 4. 平台适配策略

- CSS 媒体查询和平台类
- 组件级别的平台适配
- 功能降级和渐进增强
- 用户体验的一致性保证

### 5. 构建和部署流程

- 多平台构建脚本管理
- 代码签名和应用商店发布
- 自动化 CI/CD 流程
- 版本管理和更新机制

## 🎯 简历亮点总结

- **跨平台架构设计**：一套代码支持 Web、桌面端、移动端的完整解决方案
- **Electron 桌面应用**：主进程/渲染进程通信、原生 API 集成、系统级功能实现
- **Capacitor 移动开发**：WebView 容器、原生插件系统、平台特定功能适配
- **平台抽象层设计**：统一 API 接口、条件编译、功能降级策略
- **响应式适配方案**：多端 UI 适配、平台特定样式、用户体验优化
- **构建部署流程**：多平台构建脚本、自动化打包、应用商店发布流程
