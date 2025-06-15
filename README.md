# Todo Desktop App

一个基于 Vue 3 + Electron 构建的现代化待办事项桌面应用。

![License](https://img.shields.io/badge/license-GPL--3.0-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-brightgreen)

## 📸 应用截图

![应用截图1](/public/readmeImg/img1.png)
![应用截图2](/public/readmeImg/img2.png)
![应用截图3](/public/readmeImg/img3.png)

## ✨ 功能特性

- 🔒 前端缓存，纯前端项目，敏感信息存储前端，不发送到服务器
- 📱 跨平台，响应式设计，可用于 pc 和移动端，也可以打包成桌面应用（mac、win、linux）
- 📝 任务管理：创建、编辑、删除和组织待办事项
- 🎯 项目管理：将任务分类到不同项目中
- 📊 数据统计：直观的任务完成情况统计
- 🔍 历史记录：查看和回顾已完成的任务
- 🎨 现代化界面：简洁优雅的用户界面设计
- 🌍 多语言支持：支持多种语言切换
- 💾 离线存储：本地数据持久化
- 🔄 数据同步：支持数据备份和恢复
- 🎵 语音输入：支持语音识别输入任务
- 🤖 AI 助手：智能任务管理建议

想更深入交流，欢迎知识星球找我：https://t.zsxq.com/kE5vJ

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装

```bash
# 克隆项目
git clone [项目地址]

# 进入项目目录
cd todo

# 安装依赖
pnpm install

# 创建环境配置文件
cp .env.example .env
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 启动 Electron 开发环境
pnpm electron:serve
```

### 构建

```bash
# macOS
pnpm electron:build:mac

# Windows
pnpm electron:build:win

# Linux
pnpm electron:build:linux
```

## 🛠️ 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Electron - 跨平台桌面应用开发框架
- TypeScript - JavaScript 的超集
- Vite - 下一代前端构建工具
- Vue Router - Vue.js 官方路由
- Chart.js - 数据可视化库
- Vue I18n - 国际化解决方案

## 📝 开发规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 使用 Husky 进行 Git 提交检查
- 遵循 TypeScript 类型检查

## 🤝 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (git checkout -b feature/AmazingFeature)
3. 提交你的更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 [GNU General Public License v3.0](LICENSE)
开源协议。该协议要求任何基于本项目的衍生作品必须以相同的协议开源，并且禁止闭源商业使用。详情请参阅
[LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

## 📮 联系方式

如有任何问题或建议，欢迎提出 Issue 或 Pull Request。
