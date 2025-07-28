# Yun AI TodoList Frontend

## 📖 概述

这是 Yun AI TodoList 应用的前端部分，基于 Vue 3,
Vite, 和 TypeScript 构建的现代化、响应式的 Web 和桌面应用界面。

## ✨ 功能亮点

- **响应式设计**: 完美适配桌面和移动设备。
- **现代化 UI**: 使用 UnoCSS 和 Naive UI 构建，界面美观、体验流畅。
- **数据可视化**: 通过 Chart.js 展示任务统计数据。
- **国际化**: 支持多语言切换 (i18n)。
- **桌面端集成**: 使用 Electron 打包为跨平台桌面应用。
- **实时通信**: 与后端服务高效交互，实现实时任务更新。

## 🛠️ 技术栈

- **框架**: Vue 3.5+
- **构建工具**: Vite 5.x
- **语言**: TypeScript 5.x
- **UI 框架**: Naive UI 2.x
- **CSS 工具**: UnoCSS
- **路由**: Vue Router 4.x
- **状态管理**: Pinia 2.x
- **国际化**: Vue I18n 9.x
- **桌面端**: Electron 31.x
- **测试**: Vitest, Playwright

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### 安装与运行

```bash
# 在项目根目录安装所有依赖
# pnpm install

# 启动 Web 开发服务器
pnpm dev
```

应用将运行在 `http://localhost:5173`。

### 桌面应用开发

```bash
# 启动 Electron 应用进行开发
pnpm dev:electron

# 构建桌面应用
pnpm build:electron

# 针对特定平台构建
pnpm build:electron:mac
pnpm build:electron:win
pnpm build:electron:linux
```

## 🧪 测试

```bash
# 运行单元和组件测试
pnpm test

# 运行端到端测试 (Playwright)
pnpm test:e2e
```

## 📁 项目结构

```
src/
├── assets/         # 静态资源 (图片, 字体)
├── components/     # 全局 Vue 组件
├── views/          # 页面级组件
├── router/         # Vue Router 配置
├── store/          # Pinia 状态管理
├── locales/        # 国际化语言文件
├── styles/         # 全局样式
├── utils/          # 工具函数
├── services/       # API 请求服务
├── main.ts         # 应用入口文件
└── App.vue         # 根组件
```

## 🔗 相关链接

- [项目根目录 README](../../README.md)
- [后端服务 README](../backend/README.md)
