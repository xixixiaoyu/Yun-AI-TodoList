# Render 部署指南

本文档详细介绍如何将 Yun AI TodoList 应用部署到 Render 平台。

## 📋 目录

- [项目概述](#项目概述)
- [部署前准备](#部署前准备)
- [数据库部署](#数据库部署)
- [后端 API 部署](#后端-api-部署)
- [前端部署](#前端部署)
- [环境变量配置](#环境变量配置)
- [域名配置](#域名配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 🎯 项目概述

Yun AI TodoList 是一个现代化的全栈应用，包含以下组件：

- **前端**：Vue 3 + TypeScript + Vite
- **后端**：NestJS + TypeScript + Prisma ORM
- **数据库**：PostgreSQL
- **缓存**：Redis（可选）
- **AI 服务**：支持 DeepSeek、OpenAI、Claude

## 🚀 部署前准备

### 1. 注册 Render 账户

1. 访问 [Render.com](https://render.com)
2. 使用 GitHub 账户注册（推荐）
3. 连接你的 GitHub 仓库

### 2. 准备代码仓库

确保你的代码已推送到 GitHub，并且包含以下文件：

```
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── prisma/
│   │   └── src/
│   └── frontend/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

### 3. 获取必要的 API 密钥

在部署前，请准备以下 API 密钥：

- **AI 服务**：DeepSeek API Key、OpenAI API Key 或 Claude API Key
- **搜索服务**：Google Search API Key 和 Search Engine ID
- **邮件服务**：SMTP 配置（如 Gmail）

## 🗄️ 数据库部署

### 1. 创建 PostgreSQL 数据库

1. 在 Render Dashboard 中点击 "New +"
2. 选择 "PostgreSQL"
3. 配置数据库：
   ```
   Name: yun-ai-todolist-db
   Database: yun_ai_todolist
   User: postgres
   Region: 选择离你用户最近的区域
   PostgreSQL Version: 15
   Plan: 选择适合的计划（Free 或 Starter）
   ```
4. 点击 "Create Database"
5. 等待数据库创建完成，记录连接信息

### 2. 获取数据库连接信息

创建完成后，在数据库详情页面获取：

- **Internal Database URL**：用于后端连接
- **External Database URL**：用于本地开发和数据库管理

格式类似：

```
postgresql://username:password@hostname:port/database
```

## 🔧 后端 API 部署

### 1. 创建 Web Service

1. 在 Render Dashboard 中点击 "New +"
2. 选择 "Web Service"
3. 连接你的 GitHub 仓库
4. 配置服务：

```yaml
Name: yun-ai-todolist-backend
Environment: Docker
Region: 选择与数据库相同的区域
Branch: main
Root Directory: apps/backend
Dockerfile Path: apps/backend/Dockerfile
```

### 2. 配置构建设置

在 "Settings" 页面配置：

**Build Command:**

```bash
# Render 会自动使用 Dockerfile 构建
```

**Start Command:**

```bash
node dist/main.js
```

### 3. 配置环境变量

在 "Environment" 标签页添加以下环境变量：

```bash
# 基础配置
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-url.onrender.com

# 数据库配置
DATABASE_URL=postgresql://username:password@hostname:port/database

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# AI 服务配置
DEEPSEEK_API_KEY=your-deepseek-api-key
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key

# 搜索服务配置
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-google-search-engine-id

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@yourdomain.com

# 日志配置
LOG_LEVEL=info

# 安全配置
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

### 4. 配置健康检查

在 "Settings" 中配置：

```
Health Check Path: /api/v1/health
```

### 5. 部署后端

1. 点击 "Create Web Service"
2. Render 会自动开始构建和部署
3. 等待部署完成，记录后端 URL

## 🌐 前端部署

### 1. 创建静态站点

1. 在 Render Dashboard 中点击 "New +"
2. 选择 "Static Site"
3. 连接你的 GitHub 仓库
4. 配置站点：

```yaml
Name: yun-ai-todolist-frontend
Branch: main
Root Directory: apps/frontend
Build Command: pnpm install && pnpm build
Publish Directory: dist
```

### 2. 配置环境变量

在构建设置中添加环境变量：

```bash
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api/v1
VITE_APP_TITLE=Yun AI TodoList
VITE_APP_VERSION=1.0.0
```

### 3. 配置重定向规则

为了支持 Vue Router 的 history 模式，需要配置重定向规则。

在 `apps/frontend/public/` 目录下创建 `_redirects` 文件：

```
/*    /index.html   200
```

### 4. 部署前端

1. 点击 "Create Static Site"
2. Render 会自动开始构建和部署
3. 等待部署完成，记录前端 URL

## ⚙️ 环境变量配置

### 后端环境变量详解

| 变量名                  | 描述                 | 示例值                     | 必需 |
| ----------------------- | -------------------- | -------------------------- | ---- |
| `NODE_ENV`              | 运行环境             | `production`               | ✅   |
| `PORT`                  | 服务端口             | `10000`                    | ✅   |
| `DATABASE_URL`          | 数据库连接字符串     | `postgresql://...`         | ✅   |
| `JWT_SECRET`            | JWT 密钥             | `your-secret-key`          | ✅   |
| `FRONTEND_URL`          | 前端 URL             | `https://app.onrender.com` | ✅   |
| `DEEPSEEK_API_KEY`      | DeepSeek API 密钥    | `sk-...`                   | ❌   |
| `OPENAI_API_KEY`        | OpenAI API 密钥      | `sk-...`                   | ❌   |
| `GOOGLE_SEARCH_API_KEY` | Google 搜索 API 密钥 | `AIza...`                  | ❌   |

### 前端环境变量详解

| 变量名              | 描述          | 示例值                            | 必需 |
| ------------------- | ------------- | --------------------------------- | ---- |
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://api.onrender.com/api/v1` | ✅   |
| `VITE_APP_TITLE`    | 应用标题      | `Yun AI TodoList`                 | ❌   |
| `VITE_APP_VERSION`  | 应用版本      | `1.0.0`                           | ❌   |

## 🔗 域名配置

### 1. 配置自定义域名（可选）

如果你有自己的域名，可以为前端和后端配置自定义域名：

**前端域名配置：**

1. 在前端服务的 "Settings" 页面
2. 找到 "Custom Domains" 部分
3. 添加你的域名（如 `app.yourdomain.com`）
4. 按照提示配置 DNS 记录

**后端域名配置：**

1. 在后端服务的 "Settings" 页面
2. 找到 "Custom Domains" 部分
3. 添加你的 API 域名（如 `api.yourdomain.com`）
4. 按照提示配置 DNS 记录

### 2. 更新环境变量

配置自定义域名后，需要更新相关环境变量：

**后端环境变量：**

```bash
FRONTEND_URL=https://app.yourdomain.com
CORS_ORIGIN=https://app.yourdomain.com
```

**前端环境变量：**

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## 📊 监控和日志

### 1. 查看部署日志

在每个服务的 "Logs" 标签页可以查看：

- 构建日志
- 运行时日志
- 错误日志

### 2. 监控服务状态

在 Dashboard 中可以监控：

- 服务运行状态
- CPU 和内存使用情况
- 请求响应时间
- 错误率

### 3. 设置告警（付费计划）

在付费计划中，可以设置：

- 服务宕机告警
- 性能告警
- 错误率告警

## 🔧 故障排除

### 常见问题及解决方案

#### 1. 数据库连接失败

**问题：** 后端无法连接到数据库

**解决方案：**

- 检查 `DATABASE_URL` 环境变量是否正确
- 确保使用 Internal Database URL
- 检查数据库服务是否正常运行

#### 2. 前端无法访问后端 API

**问题：** 前端请求后端 API 失败

**解决方案：**

- 检查 `VITE_API_BASE_URL` 是否正确
- 检查后端 CORS 配置
- 确保后端服务正常运行

#### 3. 构建失败

**问题：** Docker 构建或 pnpm 安装失败

**解决方案：**

- 检查 Dockerfile 语法
- 确保 package.json 中的依赖版本正确
- 查看构建日志中的具体错误信息

#### 4. 环境变量未生效

**问题：** 配置的环境变量在应用中无法读取

**解决方案：**

- 确保环境变量名称正确
- 重新部署服务使环境变量生效
- 检查代码中是否正确读取环境变量

#### 5. Prisma 迁移失败

**问题：** 数据库迁移执行失败

**解决方案：**

- 确保数据库连接正常
- 检查 Prisma schema 文件
- 手动执行迁移命令：
  ```bash
  npx prisma migrate deploy
  ```

### 调试技巧

1. **查看详细日志：**

   ```bash
   # 在后端代码中添加更多日志
   console.log('Environment:', process.env.NODE_ENV);
   console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
   ```

2. **测试数据库连接：**

   ```bash
   # 在后端添加健康检查端点
   @Get('health')
   async health() {
     return {
       status: 'ok',
       database: await this.prisma.$queryRaw`SELECT 1`,
       timestamp: new Date().toISOString()
     };
   }
   ```

3. **检查网络连接：**
   ```bash
   # 使用 curl 测试 API 端点
   curl https://your-backend-url.onrender.com/api/v1/health
   ```

## 📝 部署检查清单

部署完成后，请检查以下项目：

- [ ] 数据库服务正常运行
- [ ] 后端服务正常启动
- [ ] 前端页面可以正常访问
- [ ] 用户注册和登录功能正常
- [ ] API 接口响应正常
- [ ] 数据库迁移已执行
- [ ] 环境变量配置正确
- [ ] CORS 配置正确
- [ ] 健康检查端点正常
- [ ] 日志输出正常

## 🚀 后续优化

部署成功后，可以考虑以下优化：

1. **性能优化：**

   - 启用 CDN 加速
   - 配置缓存策略
   - 优化数据库查询

2. **安全加固：**

   - 配置 HTTPS
   - 设置安全头
   - 定期更新依赖

3. **监控告警：**

   - 集成第三方监控服务
   - 设置性能监控
   - 配置错误追踪

4. **备份策略：**
   - 配置数据库自动备份
   - 设置代码版本管理
   - 建立灾难恢复计划

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. 查看 [Render 官方文档](https://render.com/docs)
2. 访问项目 GitHub 仓库提交 Issue
3. 查看项目 README 文件
4. 联系项目维护者

---

**祝你部署成功！** 🎉

如果这份文档对你有帮助，请给项目一个 ⭐ Star！
