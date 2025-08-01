# Yun AI TodoList

基于 Vue 3 + NestJS +
Electron 构建的现代化 AI 智能待办事项应用，支持跨平台使用。

![License](https://img.shields.io/badge/license-GPL--3.0-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Vue](https://img.shields.io/badge/Vue-3.5.16-4FC08D?logo=vue.js)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)
![Electron](https://img.shields.io/badge/Electron-36.x-47848F?logo=electron)

## 📖 简介

Yun AI
TodoList 是一个功能丰富的智能待办事项管理应用，采用现代化的前后端分离架构，并支持通过 Electron 打包为桌面应用。通过集成 AI 助手，它不仅能帮助您高效管理日常任务，还能提供智能建议和网络搜索功能，让您的工作效率倍增。

## 📸 应用截图

<div align="center">
  <img src='./apps/frontend/public/officialWebsite/整体.png' alt="Yun AI TodoList 应用截图" width="800" />
</div>

## ✨ 核心功能

- **智能任务管理**: 创建、编辑、删除、排序待办事项。
- **AI 助手**: 提供智能任务建议。
- **跨平台支持**: 支持 Web 和桌面端 (Windows, macOS, Linux)。
- **数据可视化**: 通过图表分析任务完成情况。
- **安全认证**: 基于 JWT 的用户认证系统。

## 🏛️ 架构概览

本项目是一个 Monorepo 项目，使用 pnpm workspaces 管理，主要包含以下部分：

- **`apps/frontend`**: 基于 Vue 3 和 Vite 的前端应用。
- **`apps/backend`**: 基于 NestJS 和 Prisma 的后端 API 服务。
- **`packages/`**: 前后端共享的工具库和类型定义。
- **`electron/`**: Electron 主进程和预加载脚本。

## 🚀 快速开始

我们推荐使用 Docker 进行一键部署，这可以简化环境配置。

### 环境要求

- Docker & Docker Compose
- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Docker 部署 (推荐)

```bash
# 1. 克隆项目
git clone https://github.com/xixixiaoyu/todo.git
cd yun-ai-todolist

# 2. 配置环境变量
cp .env.example .env

# 3. 启动服务
./scripts/docker-build.sh start dev
```

服务启动后，您可以访问：

- **前端**: `http://localhost:3001`
- **后端 API**: `http://localhost:3000`
- **Swagger 文档**: `http://localhost:3000/api/docs`

### 本地开发

如果您希望在本地单独运行前端或后端，请参考其各自的 `README.md`
文件获取详细指南：

- ➡️ **[前端开发指南](./apps/frontend/README.md)**
- ⬅️ **[后端开发指南](./apps/backend/README.md)**

## 📁 项目结构

```
yun-ai-todolist/
├── apps/
│   ├── backend/        # NestJS 后端服务 (详情见内部 README)
│   └── frontend/       # Vue 3 前端应用 (详情见内部 README)
├── electron/           # Electron 配置和主进程
├── packages/           # 共享代码库
├── scripts/            # 构建和部署脚本
├── .env.example        # 环境变量模板
├── docker-compose.yml  # Docker 编排文件
└── package.json        # 项目依赖
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！请在提交 Pull Request 前，先阅读我们的贡献指南。

1. Fork 本仓库并创建您的分支。
2. 遵循项目的代码规范和提交信息格式。
3. 确保所有测试通过。
4. 提交 Pull Request 并详细描述您的更改。

## 📄 许可证

本项目采用 [GNU General Public License v3.0](LICENSE) 许可证。

---

<div align="center">
  <p>如果这个项目对你有帮助，请给我一个 ⭐️ Star！</p>
  <p>欢迎提交 Issue 和 Pull Request 来贡献代码！</p>
</div>
