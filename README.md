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

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 13 (可选，推荐使用 Docker)
- Redis >= 6.0 (可选)
- Docker >= 20.10.0 (推荐)
- Docker Compose >= 2.0.0 (推荐)

### 方式一：Docker 部署 (推荐)

```bash
# 克隆项目
git clone https://github.com/xixixiaoyu/todo.git
cd todo

# 复制环境变量配置
cp .env.example .env

# 启动开发环境 (包含数据库和缓存)
./scripts/docker-build.sh start dev

# 访问应用
# 前端: http://localhost:5173
# 后端 API: http://localhost:3001
# 数据库管理: http://localhost:8080

# 停止服务
./scripts/docker-build.sh stop dev
```

### 方式二：本地开发

```bash
# 克隆项目
git clone https://github.com/xixixiaoyu/todo.git
cd todo

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 启动后端服务
cd apps/backend
pnpm dev

# 启动前端服务 (新终端)
cd apps/frontend
pnpm dev

# 启动 Electron 应用 (可选)
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

### 前端

- Vue 3 - 渐进式 JavaScript 框架
- TypeScript - JavaScript 的超集
- Vite - 下一代前端构建工具
- Vue Router - Vue.js 官方路由
- UnoCSS - 原子化 CSS 引擎
- VueUse - Vue 组合式 API 工具集
- Chart.js - 数据可视化库
- Vue I18n - 国际化解决方案

### 后端

- NestJS - 企业级 Node.js 框架
- TypeScript - 类型安全的开发体验
- Prisma - 现代化数据库 ORM
- PostgreSQL - 可靠的关系型数据库
- Redis - 高性能缓存数据库
- JWT - JSON Web Token 认证
- Swagger - API 文档生成

### 桌面应用

- Electron - 跨平台桌面应用开发框架

### 部署和运维

- Docker - 容器化部署
- Docker Compose - 多容器编排
- Nginx - 高性能 Web 服务器
- GitHub Actions - CI/CD 自动化

## 📝 开发规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 使用 Husky 进行 Git 提交检查
- 遵循 TypeScript 类型检查

## 📚 文档

- [Docker 部署指南](./docs/DOCKER.md)
- [后端 API 文档](./apps/backend/docs/API.md)
- [Docker 配置总结](./README-DOCKER.md)

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
