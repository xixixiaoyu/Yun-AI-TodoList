# 🖥️ Yun AI TodoList 桌面应用开发指南

## 📖 概述

本指南介绍如何开发、构建和分发 Yun AI
TodoList 的桌面应用版本。桌面应用基于 Electron 框架构建，支持 Windows、macOS 和 Linux 平台。

## 🛠️ 技术栈

| 技术                 | 版本 | 用途               |
| -------------------- | ---- | ------------------ |
| **Electron**         | 36.x | 跨平台桌面应用框架 |
| **Electron Builder** | 26.x | 应用打包和分发     |
| **Vue 3**            | 3.5+ | 前端渲染进程       |
| **Node.js**          | 18+  | 主进程运行时       |

## 📁 项目结构

```
electron/
├── 📄 main.js              # 主进程入口文件
├── 📄 preload.js           # 预加载脚本
├── 📄 dev-config.js        # 开发环境配置
└── 📄 README.md            # 本文档

build/                      # 构建资源
├── 📄 icon.ico             # Windows 图标
├── 📄 icon.icns            # macOS 图标
├── 📄 icon.iconset/        # macOS 图标集
├── 📄 entitlements.mac.plist        # macOS 权限配置
└── 📄 entitlements.mac.prod.plist   # macOS 生产权限

electron-builder.config.js  # 构建配置文件
```

## 🚀 快速开始

### 📋 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- 已完成前端应用构建

### 🔧 开发环境设置

```bash
# 1. 安装依赖（在项目根目录）
pnpm install

# 2. 构建前端应用
pnpm build:frontend

# 3. 启动桌面应用开发模式
pnpm electron:dev
```

### 🏗️ 构建桌面应用

```bash
# 构建当前平台的应用
pnpm electron:build

# 构建特定平台
pnpm electron:build --win     # Windows
pnpm electron:build --mac     # macOS
pnpm electron:build --linux   # Linux

# 构建所有平台（需要相应的构建环境）
pnpm electron:build --win --mac --linux
```

## ⚙️ 配置说明

### 🔧 主进程配置 (main.js)

主进程负责应用的生命周期管理、窗口创建和系统集成：

```javascript
// 主要功能
;-创建和管理应用窗口 -
  处理应用菜单 -
  管理应用生命周期 -
  处理系统托盘 -
  文件系统访问
```

### 🛡️ 预加载脚本 (preload.js)

预加载脚本在渲染进程中运行，提供安全的 API 桥接：

```javascript
// 主要功能
- 暴露安全的 Node.js API
- 处理主进程与渲染进程通信
- 提供系统功能访问接口
```

### 📦 构建配置 (electron-builder.config.js)

```javascript
module.exports = {
  appId: 'com.yunmu.yun-ai-todolist',
  productName: 'Yun AI TodoList',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  // 平台特定配置
  win: {
    /* Windows 配置 */
  },
  mac: {
    /* macOS 配置 */
  },
  linux: {
    /* Linux 配置 */
  },
}
```

## 🎯 开发指南

### 🔄 开发工作流

1. **前端开发**：在 `apps/frontend` 中开发 Vue 应用
2. **构建前端**：运行 `pnpm build:frontend`
3. **桌面调试**：运行 `pnpm electron:dev`
4. **功能测试**：测试桌面特有功能
5. **构建发布**：运行 `pnpm electron:build`

### 🔌 主进程与渲染进程通信

#### 从渲染进程调用主进程

```javascript
// 在渲染进程中（Vue 组件）
const result = await window.electronAPI.invoke('some-method', data)
```

#### 从主进程发送消息到渲染进程

```javascript
// 在主进程中
mainWindow.webContents.send('message-channel', data)
```

### 🖼️ 窗口管理

```javascript
// 创建新窗口
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
}
```

### 📱 系统集成功能

- **系统托盘**：最小化到系统托盘
- **全局快捷键**：注册全局快捷键
- **系统通知**：发送桌面通知
- **文件关联**：关联特定文件类型
- **自动启动**：开机自动启动

## 🔒 安全最佳实践

### 🛡️ 安全配置

```javascript
webPreferences: {
  nodeIntegration: false,        // 禁用 Node.js 集成
  contextIsolation: true,        // 启用上下文隔离
  enableRemoteModule: false,     // 禁用远程模块
  preload: path.join(__dirname, 'preload.js')
}
```

### 🔐 API 暴露原则

- 只暴露必要的 API
- 验证所有输入参数
- 使用白名单而非黑名单
- 避免直接暴露 Node.js 模块

## 📦 打包和分发

### 🏗️ 构建产物

构建完成后，在 `release/` 目录下会生成：

```
release/
├── win-unpacked/           # Windows 未打包版本
├── mac/                    # macOS 应用包
├── linux-unpacked/         # Linux 未打包版本
├── Yun-AI-TodoList-1.0.0.exe      # Windows 安装包
├── Yun-AI-TodoList-1.0.0.dmg      # macOS 磁盘镜像
└── Yun-AI-TodoList-1.0.0.AppImage  # Linux AppImage
```

### 🚀 自动更新

```javascript
// 配置自动更新
const { autoUpdater } = require('electron-updater')

// 检查更新
autoUpdater.checkForUpdatesAndNotify()
```

### 📝 代码签名

#### macOS 代码签名

```bash
# 设置环境变量
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"

# 构建并签名
pnpm electron:build --mac
```

#### Windows 代码签名

```bash
# 设置环境变量
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"

# 构建并签名
pnpm electron:build --win
```

## 🧪 测试指南

### 🔬 单元测试

```bash
# 测试主进程代码
npm test electron/
```

### 🎭 E2E 测试

```bash
# 使用 Spectron 进行 E2E 测试
npm run test:e2e:electron
```

### 📊 性能测试

- 内存使用监控
- CPU 使用率分析
- 启动时间测试
- 响应时间测试

## 🐛 调试指南

### 🔍 主进程调试

```bash
# 启用主进程调试
electron --inspect=5858 .
```

### 🔍 渲染进程调试

```javascript
// 打开开发者工具
mainWindow.webContents.openDevTools()
```

### 📝 日志记录

```javascript
// 使用 electron-log
const log = require('electron-log')
log.info('应用启动')
log.error('错误信息', error)
```

## 🚀 部署和分发

### 📱 应用商店分发

- **Mac App Store**：需要 Apple Developer 账号
- **Microsoft Store**：需要 Microsoft Partner 账号
- **Snap Store**：Linux 应用商店

### 🌐 自托管分发

```bash
# 上传到 GitHub Releases
gh release create v1.0.0 release/*.exe release/*.dmg release/*.AppImage
```

## 📚 常见问题

### ❓ 常见错误

**Q: 应用启动后白屏** A: 检查前端构建是否完成，确认 `dist` 目录存在

**Q: 主进程与渲染进程通信失败**
A: 检查 preload.js 是否正确配置，确认 contextIsolation 设置

**Q: 构建失败** A: 检查 Node.js 版本，确认所有依赖已安装

### 🔧 性能优化

- 使用 `webSecurity: false` 仅在开发环境
- 启用 `nodeIntegrationInWorker: false`
- 合理设置窗口大小和最小尺寸
- 使用 `show: false` 然后 `ready-to-show` 事件

## 📖 参考资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Electron Builder 文档](https://www.electron.build/)
- [Electron 安全指南](https://www.electronjs.org/docs/tutorial/security)
- [Vue Electron 集成](https://nklayman.github.io/vue-cli-plugin-electron-builder/)

---

<div align="center">
  <p><strong>🖥️ 桌面应用开发愉快！</strong></p>
  <p>如有问题，请查看 <a href="../README.md">主项目文档</a> 或提交 Issue</p>
</div>
