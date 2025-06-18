# Yun AI TodoList

一个基于 Vue 3 + NestJS +
Electron 构建的现代化全栈 AI 智能待办事项应用，支持桌面端、Web 端和移动端。

![License](https://img.shields.io/badge/license-GPL--3.0-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-brightgreen)
![Vue](https://img.shields.io/badge/Vue-3.5.16-4FC08D?logo=vue.js)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)

## 📸 应用截图

<img src='https://cdn.nlark.com/yuque/0/2025/png/21596389/1750244289304-50f944bd-9923-4496-b02b-83872f93b9d2.png?x-oss-process=image%2Fformat%2Cwebp'>

## ✨ 功能特性

### 🚀 核心功能

- 📝 **任务管理**：创建、编辑、删除和组织待办事项，支持优先级、标签、截止日期
- 🎯 **项目管理**：将任务分类到不同项目中，支持项目统计和进度跟踪
- 📊 **数据统计**：直观的任务完成情况统计，支持图表可视化
- 🔍 **历史记录**：查看和回顾已完成的任务，支持历史数据分析
- 🔍 **智能搜索**：全文搜索任务内容，支持标签和项目筛选

### 🤖 AI 智能功能

- 🤖 **AI 助手**：智能任务管理建议和优化
- 🔍 **Google 搜索集成**：内置 Google 搜索工具，支持 MCP 协议
- 🎵 **语音输入**：支持语音识别输入任务
- 📈 **智能分析**：AI 驱动的任务分析和建议

### 🌐 跨平台支持

- 💻 **桌面端**：支持 macOS、Windows、Linux 桌面应用（Electron）
- 🌐 **Web 端**：响应式设计，支持现代浏览器
- 🔄 **数据同步**：跨设备数据同步和备份

### 🎨 用户体验

- 🎨 **现代化界面**：简洁优雅的用户界面设计，支持深色模式
- 🌍 **多语言支持**：支持多种语言切换
- 💾 **离线存储**：本地数据持久化，支持离线使用
- ⚡ **高性能**：基于 Vue 3 和 Vite，快速响应
- 🔒 **安全可靠**：JWT 认证，数据加密存储

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0
- **PostgreSQL** >= 13 (生产环境推荐)
- **Redis** >= 6.0 (缓存，可选)
- **Docker** >= 20.10.0 (推荐)
- **Docker Compose** >= 2.0.0 (推荐)

### 移动端开发环境（可选）

- **Android Studio** (Android 开发)
- **Xcode** (iOS 开发，仅 macOS)
- **Java** >= 17 (Android 构建)
- **Capacitor CLI** >= 6.0

### 方式一：Docker 部署 (推荐)

```bash
# 克隆项目
git clone https://github.com/xixixiaoyu/todo.git
cd yun-ai-todolist

# 复制环境变量配置
cp .env.example .env

# 启动开发环境 (包含数据库和缓存)
./scripts/docker-build.sh start dev

# 访问应用
# 前端: http://localhost:3001
# 后端 API: http://localhost:3000
# 数据库管理: http://localhost:8080

# 停止服务
./scripts/docker-build.sh stop dev
```

### 方式二：本地开发

```bash
# 克隆项目
git clone https://github.com/xixixiaoyu/todo.git
cd yun-ai-todolist

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 启动后端服务
pnpm dev:backend

# 启动前端服务 (新终端)
pnpm dev

# 同时启动前后端 (推荐)
pnpm dev:all
```

### 构建部署

#### 桌面应用构建

```bash
# 构建前端
pnpm build:frontend

# 构建桌面应用
# macOS
pnpm --filter frontend electron:build:mac

# Windows
pnpm --filter frontend electron:build:win

# Linux
pnpm --filter frontend electron:build:linux
```

#### 移动应用构建

```bash
# 构建移动端
pnpm --filter frontend mobile:build

# Android
pnpm --filter frontend mobile:run:android

# iOS (仅 macOS)
pnpm --filter frontend mobile:run:ios
```

#### 生产环境部署

```bash
# 构建所有应用
pnpm build

# Docker 生产环境部署
docker-compose -f docker-compose.prod.yml up -d
```

#### Cloudflare Workers 部署 (前端)

```bash
# 快速部署到 Cloudflare Workers
pnpm deploy:cf:prod

# 或者分步执行
pnpm build:frontend
./scripts/deploy-cloudflare.sh prod
```

详细部署指南请参考 [Cloudflare 部署文档](./docs/CLOUDFLARE-DEPLOYMENT.md)。

## 🛠️ 技术栈

### 前端技术栈

- **Vue 3.5.16** - 渐进式 JavaScript 框架
- **TypeScript 5.8.3** - 类型安全的开发体验
- **Vite** - 下一代前端构建工具
- **Vue Router 4.5.1** - Vue.js 官方路由
- **UnoCSS** - 原子化 CSS 引擎
- **VueUse 13.3.0** - Vue 组合式 API 工具集
- **Chart.js 4.4.9** - 数据可视化库
- **Vue I18n 11.1.5** - 国际化解决方案
- **Date-fns 4.1.0** - 现代化日期处理库
- **Marked 15.0.12** - Markdown 解析器
- **SortableJS** - 拖拽排序库

### 后端技术栈

- **NestJS 10.x** - 企业级 Node.js 框架
- **TypeScript 5.x** - 类型安全的开发体验
- **Prisma 6.x** - 现代化数据库 ORM
- **PostgreSQL 13+** - 可靠的关系型数据库
- **Redis 6.0+** - 高性能缓存数据库
- **JWT + Passport** - 身份认证和授权
- **Swagger/OpenAPI** - API 文档生成
- **Jest + Supertest** - 测试框架

### 跨平台技术

- **Electron 36.4.0** - 桌面应用开发框架
- **Capacitor 6.1.2** - 移动应用开发框架
- **Android/iOS** - 原生移动应用支持

### AI 和搜索

- **Google Search CLI** - 基于 Playwright 的搜索工具
- **Model Context Protocol (MCP)** - AI 助手集成协议
- **Playwright** - 浏览器自动化
- **MCP SDK** - MCP 服务器开发工具包

### 开发工具和部署

- **pnpm 9.0.0** - 高效的包管理工具
- **Docker & Docker Compose** - 容器化部署
- **Nginx** - 高性能 Web 服务器
- **GitHub Actions** - CI/CD 自动化
- **ESLint + Prettier** - 代码质量和格式化
- **Husky + lint-staged** - Git 钩子和代码检查

## 📝 开发规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 使用 Husky 进行 Git 提交检查
- 遵循 TypeScript 类型检查

## 📚 文档

- [Docker 部署指南](./docs/DOCKER.md)
- [Cloudflare Workers 部署指南](./docs/CLOUDFLARE-DEPLOYMENT.md)
- [后端 API 文档](./apps/backend/docs/API.md)
- [后端开发文档](./apps/backend/README.md)
- [Google 搜索工具文档](./google-search/README.md)

## 📁 项目结构

```
yun-ai-todolist/
├── apps/                          # 应用目录
│   ├── frontend/                  # Vue 3 前端应用
│   └── backend/                   # NestJS 后端应用
├── packages/                      # 共享包
│   ├── shared/                    # 共享类型和工具
│   └── ui/                        # UI 组件库
├── tools/                         # 开发工具配置
│   ├── eslint-config/            # ESLint 配置
│   └── typescript-config/        # TypeScript 配置
├── google-search/                 # Google 搜索 CLI 工具
├── scripts/                       # 构建和部署脚本
├── docker/                        # Docker 配置文件
├── docs/                          # 项目文档
├── android/                       # Android 应用配置
├── ios/                          # iOS 应用配置
├── electron/                     # Electron 配置
├── build/                        # 构建资源
└── nginx/                        # Nginx 配置
```

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

## 🌟 特色亮点

- **🤖 AI 驱动**：集成 AI 助手，提供智能任务管理建议
- **🔍 智能搜索**：内置 Google 搜索工具，支持 MCP 协议集成
- **📱 真正跨平台**：一套代码，支持 Web、桌面、移动端
- **🏗️ 现代化架构**：采用最新的技术栈和最佳实践
- **🐳 容器化部署**：完整的 Docker 化部署方案
- **📊 数据可视化**：丰富的图表和统计功能
- **🔒 安全可靠**：完整的认证授权体系
- **⚡ 高性能**：优化的前后端性能

## 📮 联系方式

- **GitHub**: [xixixiaoyu/todo](https://github.com/xixixiaoyu/todo)
- **Issues**: [提交问题](https://github.com/xixixiaoyu/todo/issues)
- **Pull Requests**: [贡献代码](https://github.com/xixixiaoyu/todo/pulls)

如有任何问题或建议，欢迎提出 Issue 或 Pull Request。
