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
TodoList 是一个功能丰富的智能待办事项管理应用，结合了现代化的前端技术和强大的后端服务。通过集成 AI 助手，它不仅能帮助您高效管理日常任务，还能提供智能建议和网络搜索功能，让您的工作效率倍增。

应用采用前后端分离架构，前端使用 Vue
3 和 Vite 构建，提供流畅的用户体验；后端基于 NestJS 框架，确保了系统的稳定性和可扩展性。通过 Electron，我们还提供了桌面应用版本，让您在任何设备上都能轻松管理任务。

## 📚 目录导航

- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [应用截图](#-应用截图)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [测试](#测试)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## 📸 应用截图

<div align="center">
  <img src='./apps/frontend/public/officialWebsite/整体.png' alt="Yun AI TodoList 应用截图" width="800" />
</div>

## ✨ 功能特性

- 📝
  **智能任务管理**：创建、编辑、删除待办事项，支持优先级、标签、截止日期和时间估算
- 🎯 **项目管理**：任务分类管理，项目统计和进度跟踪
- 🤖 **AI 助手**：智能任务建议和 Google 搜索集成（MCP 协议）
- 🎵 **语音输入**：支持语音识别输入任务
- 📊 **数据可视化**：任务统计图表和历史记录分析
- 🌐 **跨平台支持**：Web、桌面（Electron）应用
- 🎨 **现代化界面**：响应式设计，支持深色模式和多语言
- 🔒 **安全可靠**：JWT 认证，数据加密存储
- 🔄 **拖拽排序**：支持任务拖拽排序
- 📱 **移动端适配**：完美适配移动设备

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0
- **Docker** (推荐)

### 克隆项目

```bash
# 克隆项目
git clone https://github.com/xixixiaoyu/todo.git
cd yun-ai-todolist
```

### Docker 部署 (推荐)

```bash
# 配置环境变量
cp .env.example .env

# 启动开发环境
./scripts/docker-build.sh start dev

# 访问应用
# 前端: http://localhost:3001
# 后端: http://localhost:3000
# Swagger 文档: http://localhost:3000/api/docs
```

### 本地开发

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 启动后端服务
pnpm dev:backend

# 启动前端服务 (在新终端中)
pnpm dev
```

### 环境变量配置说明

项目现在使用精简版的环境变量配置。主要变化包括：

1. 移除了重复的数据库配置项（DATABASE_HOST,
   DATABASE_PORT 等），现在只使用 DATABASE_URL
2. 移除了限流相关配置（RATE_LIMIT_TTL,
   RATE_LIMIT_MAX），因为实际代码中使用的是硬编码值
3. 移除了文件上传相关配置（UPLOAD_MAX_SIZE, UPLOAD_DEST），因为代码中未实际使用
4. 保留了所有核心必需的配置项

### 构建部署

```bash
# 构建所有应用
pnpm build

# 桌面应用构建
pnpm --filter frontend electron:build:mac  # macOS
pnpm --filter frontend electron:build:win  # Windows

# 生产环境部署
docker-compose up -d

# 或使用开发环境配置进行测试
docker-compose -f docker-compose.dev.yml up -d
```

### 测试

```bash
# 运行单元测试
pnpm test

# 运行端到端测试
pnpm test:e2e

# 运行所有测试
pnpm test:all
```

## 🛠️ 技术栈

**前端**:

- Vue 3 + TypeScript + Vite
- UnoCSS - 原子化 CSS 框架
- Chart.js - 数据可视化
- Vue Router - 路由管理
- Vue I18n - 国际化支持

**后端**:

- NestJS - 企业级 Node.js 框架
- Prisma - ORM
- PostgreSQL - 关系型数据库
- Redis - 缓存系统
- JWT - 认证授权

**跨平台**:

- Electron - 桌面应用开发

**AI 集成**:

- Google Search API - 网络搜索
- MCP 协议 - AI 服务集成
- Playwright - 端到端测试

**开发工具**:

- pnpm - 包管理器
- Docker - 容器化部署
- ESLint + Prettier - 代码规范
- Vitest - 单元测试
- GitHub Actions - CI/CD

## 📁 项目结构

```
yun-ai-todolist/
├── apps/
│   ├── backend/                 # NestJS 后端服务
│   │   ├── src/                 # 源代码
│   │   ├── prisma/              # 数据库模型和迁移
│   │   └── test/                # 测试文件
│   └── frontend/               # Vue 3 前端应用
│       ├── src/                 # 源代码
│       └── public/              # 静态资源
├── scripts/                    # 构建和部署脚本
├── tools/                      # 开发工具配置
└── packages/                   # 共享包
    └── shared/                 # 前后端共享代码
```

## 🤝 贡献指南

我们欢迎任何形式的贡献，包括但不限于功能开发、bug 修复、文档完善等。

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 遵循项目现有的代码风格
- 确保所有测试通过
- 添加必要的文档和注释
- 编写有意义的提交信息

### 提交 Pull Request

- 保持 PR 聚焦于单个功能或修复
- 在 PR 描述中详细说明变更内容
- 确保 CI 检查通过
- 等待代码审查和反馈

## 📄 许可证

本项目采用 [GNU General Public License v3.0](LICENSE) 许可证。

```
Copyright (C) 2025 Yun AI TodoList

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

---

<div align="center">
  <p>如果这个项目对你有帮助，请给我一个 ⭐️ Star！</p>
  <p>欢迎提交 Issue 和 Pull Request 来贡献代码！</p>
</div>
