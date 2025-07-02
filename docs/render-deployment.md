# Render 部署指南

本文档详细介绍如何将 Yun AI TodoList 应用部署到 Render 平台。

## 📋 目录

- [项目概述](#项目概述)
- [部署前准备](#部署前准备)
- [数据库部署](#数据库部署)
- [后端 API 部署](#后端-api-部署)
- [前端部署](#前端部署)
- [环境变量配置](#环境变量配置)
- [数据库迁移](#数据库迁移)
- [域名配置](#域名配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)
- [部署验证](#部署验证)
- [性能优化](#性能优化)

## 🎯 项目概述

Yun AI TodoList 是一个现代化的全栈 AI 驱动的待办事项应用，包含以下组件：

- **前端**：Vue 3 + TypeScript + Vite + UnoCSS
- **后端**：NestJS + TypeScript + Prisma ORM
- **数据库**：PostgreSQL 15
- **缓存**：Redis（可选，推荐生产环境使用）
- **AI 服务**：支持 DeepSeek、OpenAI、Claude
- **认证**：JWT + Refresh Token
- **文件上传**：支持多种格式
- **邮件服务**：SMTP 支持
- **监控**：健康检查 + 日志系统

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

### 3. 获取必要的 API 密钥和服务

在部署前，请准备以下服务和密钥：

**必需服务：**

- **数据库**：PostgreSQL（Render 提供）
- **JWT 密钥**：用于用户认证（自生成强密码）

**可选服务（根据需要配置）：**

- **AI 服务**：
  - DeepSeek API Key（推荐，性价比高）
  - OpenAI API Key
  - Claude API Key
- **搜索服务**：
  - Google Search API Key 和 Search Engine ID
  - Bing Search API Key（备选）
- **邮件服务**：
  - SMTP 配置（Gmail、QQ 邮箱、SendGrid 等）
- **监控服务**：
  - Sentry DSN（错误监控）
- **缓存服务**：
  - Redis（Render 提供，推荐生产环境）

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
Region: 选择与数据库相同的区域（推荐 Singapore 或 Oregon）
Branch: main
Root Directory: .
Dockerfile Path: Dockerfile
```

### 2. 配置构建设置

在 "Settings" 页面配置：

**Build Command:**

```bash
# Render 会自动使用 Dockerfile 构建，无需额外配置
```

**Docker Build Arguments:**

```bash
target=backend
```

**Start Command:**

```bash
# 由 Dockerfile 中的 CMD 指令控制，无需手动配置
```

### 3. 配置环境变量

在 "Environment" 标签页添加以下环境变量：

**必需的基础配置：**

```bash
# 应用环境
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-url.onrender.com

# 数据库配置（从 Render PostgreSQL 服务获取）
DATABASE_URL=postgresql://username:password@hostname:port/database

# JWT 认证配置（请生成强密码）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-change-this
JWT_REFRESH_EXPIRES_IN=7d

# 安全配置
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-url.onrender.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# 日志配置
LOG_LEVEL=warn
LOG_FILE=./logs/app.log
```

**可选的 AI 服务配置：**

```bash
# DeepSeek API（推荐）
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1

# Claude API
CLAUDE_API_KEY=sk-ant-your-claude-api-key
```

**可选的其他服务配置：**

```bash
# Redis 缓存（如果使用 Render Redis）
REDIS_HOST=your-redis-host.onrender.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# 搜索服务
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
BING_SEARCH_API_KEY=your-bing-search-api-key

# 邮件服务（SMTP）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM_NAME=Yun AI TodoList
MAIL_FROM_ADDRESS=noreply@yourdomain.com

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_DEST=./uploads

# 监控配置
SENTRY_DSN=your-sentry-dsn
```

### 4. 配置健康检查

在 "Settings" 中配置：

```
Health Check Path: /api/v1/health
```

**重要提示：** 确保后端代码中有对应的健康检查端点。

### 5. 部署后端

1. 点击 "Create Web Service"
2. Render 会自动开始构建和部署
3. 构建过程大约需要 5-10 分钟
4. 等待部署完成，记录后端 URL（格式：`https://your-service-name.onrender.com`）

**部署成功标志：**

- 服务状态显示为 "Live"
- 健康检查通过
- 可以访问 `https://your-backend-url.onrender.com/api/v1/health`

## 🌐 前端部署

### 1. 创建静态站点

1. 在 Render Dashboard 中点击 "New +"
2. 选择 "Static Site"
3. 连接你的 GitHub 仓库
4. 配置站点：

```yaml
Name: yun-ai-todolist-frontend
Branch: main
Root Directory: .
Build Command: pnpm install && pnpm build:shared && pnpm --filter frontend build
Publish Directory: apps/frontend/dist
```

**重要说明：**

- Root Directory 设置为 `.`（项目根目录）
- Build Command 需要先构建共享包，再构建前端
- Publish Directory 指向前端构建输出目录

### 2. 配置环境变量

在 "Environment Variables" 部分添加构建时环境变量：

```bash
# API 配置（必需）
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api/v1

# 应用信息（可选）
VITE_APP_TITLE=Yun AI TodoList
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=AI-powered Todo application

# 构建优化
NODE_ENV=production
```

**注意：**

- 前端环境变量必须以 `VITE_` 开头才能在构建时被包含
- `VITE_API_BASE_URL` 必须指向已部署的后端服务 URL

### 3. 配置重定向规则

为了支持 Vue Router 的 history 模式，需要配置重定向规则。

在 `apps/frontend/public/` 目录下创建 `_redirects` 文件：

```
/*    /index.html   200
```

**如果 `_redirects` 文件不存在，请创建：**

```bash
# 在项目根目录执行
echo "/*    /index.html   200" > apps/frontend/public/_redirects
```

### 4. 部署前端

1. 点击 "Create Static Site"
2. Render 会自动开始构建和部署
3. 构建过程大约需要 3-8 分钟（取决于依赖安装）
4. 等待部署完成，记录前端 URL（格式：`https://your-site-name.onrender.com`）

**部署成功标志：**

- 构建日志显示 "Build successful"
- 可以正常访问前端页面
- 前端能够成功连接到后端 API

**常见构建问题：**

- 如果构建失败，检查 Build Command 是否正确
- 确保 `pnpm-workspace.yaml` 文件存在
- 检查前端环境变量是否正确配置

## ⚙️ 环境变量配置详解

### 后端环境变量完整列表

| 变量名                    | 描述                  | 示例值                           | 必需 | 默认值  |
| ------------------------- | --------------------- | -------------------------------- | ---- | ------- |
| `NODE_ENV`                | 运行环境              | `production`                     | ✅   | -       |
| `PORT`                    | 服务端口              | `10000`                          | ✅   | `3000`  |
| `DATABASE_URL`            | 数据库连接字符串      | `postgresql://user:pass@host/db` | ✅   | -       |
| `JWT_SECRET`              | JWT 密钥              | `your-32-char-secret-key`        | ✅   | -       |
| `JWT_EXPIRES_IN`          | JWT 过期时间          | `1h`                             | ❌   | `7d`    |
| `JWT_REFRESH_SECRET`      | JWT 刷新密钥          | `your-32-char-refresh-secret`    | ✅   | -       |
| `JWT_REFRESH_EXPIRES_IN`  | JWT 刷新过期时间      | `7d`                             | ❌   | `30d`   |
| `FRONTEND_URL`            | 前端 URL              | `https://app.onrender.com`       | ✅   | -       |
| `BCRYPT_ROUNDS`           | 密码加密轮数          | `12`                             | ❌   | `12`    |
| `CORS_ORIGIN`             | CORS 允许源           | `https://app.onrender.com`       | ❌   | -       |
| `RATE_LIMIT_TTL`          | 限流时间窗口（秒）    | `60`                             | ❌   | `60`    |
| `RATE_LIMIT_MAX`          | 限流最大请求数        | `100`                            | ❌   | `100`   |
| `LOG_LEVEL`               | 日志级别              | `warn`                           | ❌   | `info`  |
| `LOG_FILE`                | 日志文件路径          | `./logs/app.log`                 | ❌   | -       |
| `UPLOAD_MAX_SIZE`         | 文件上传最大大小      | `10485760`                       | ❌   | `10MB`  |
| `UPLOAD_DEST`             | 文件上传目录          | `./uploads`                      | ❌   | -       |
| `DEEPSEEK_API_KEY`        | DeepSeek API 密钥     | `sk-...`                         | ❌   | -       |
| `DEEPSEEK_BASE_URL`       | DeepSeek API 基础 URL | `https://api.deepseek.com/v1`    | ❌   | -       |
| `OPENAI_API_KEY`          | OpenAI API 密钥       | `sk-...`                         | ❌   | -       |
| `OPENAI_BASE_URL`         | OpenAI API 基础 URL   | `https://api.openai.com/v1`      | ❌   | -       |
| `CLAUDE_API_KEY`          | Claude API 密钥       | `sk-ant-...`                     | ❌   | -       |
| `GOOGLE_SEARCH_API_KEY`   | Google 搜索 API 密钥  | `AIza...`                        | ❌   | -       |
| `GOOGLE_SEARCH_ENGINE_ID` | Google 搜索引擎 ID    | `your-engine-id`                 | ❌   | -       |
| `BING_SEARCH_API_KEY`     | Bing 搜索 API 密钥    | `your-bing-key`                  | ❌   | -       |
| `REDIS_HOST`              | Redis 主机            | `redis-host.onrender.com`        | ❌   | -       |
| `REDIS_PORT`              | Redis 端口            | `6379`                           | ❌   | `6379`  |
| `REDIS_PASSWORD`          | Redis 密码            | `your-redis-password`            | ❌   | -       |
| `REDIS_DB`                | Redis 数据库编号      | `0`                              | ❌   | `0`     |
| `SMTP_HOST`               | SMTP 主机             | `smtp.gmail.com`                 | ❌   | -       |
| `SMTP_PORT`               | SMTP 端口             | `587`                            | ❌   | `587`   |
| `SMTP_SECURE`             | SMTP 安全连接         | `false`                          | ❌   | `false` |
| `SMTP_USER`               | SMTP 用户名           | `your-email@gmail.com`           | ❌   | -       |
| `SMTP_PASSWORD`           | SMTP 密码             | `your-app-password`              | ❌   | -       |
| `MAIL_FROM_NAME`          | 发件人名称            | `Yun AI TodoList`                | ❌   | -       |
| `MAIL_FROM_ADDRESS`       | 发件人地址            | `noreply@yourdomain.com`         | ❌   | -       |
| `SENTRY_DSN`              | Sentry 错误监控 DSN   | `https://...@sentry.io/...`      | ❌   | -       |

### 前端环境变量完整列表

| 变量名                 | 描述          | 示例值                            | 必需 | 默认值            |
| ---------------------- | ------------- | --------------------------------- | ---- | ----------------- |
| `VITE_API_BASE_URL`    | 后端 API 地址 | `https://api.onrender.com/api/v1` | ✅   | -                 |
| `VITE_APP_TITLE`       | 应用标题      | `Yun AI TodoList`                 | ❌   | `Yun AI TodoList` |
| `VITE_APP_VERSION`     | 应用版本      | `1.0.0`                           | ❌   | `1.0.0`           |
| `VITE_APP_DESCRIPTION` | 应用描述      | `AI-powered Todo application`     | ❌   | -                 |
| `NODE_ENV`             | 构建环境      | `production`                      | ❌   | -                 |

## 🗄️ 数据库迁移

### 自动迁移（推荐）

项目的 Docker 配置已经包含了自动数据库迁移，部署时会自动执行：

1. **等待数据库连接**：确保 PostgreSQL 服务可用
2. **运行迁移**：执行 `prisma migrate deploy`
3. **生成客户端**：执行 `prisma generate`

### 手动迁移（如需要）

如果自动迁移失败，可以通过 Render Shell 手动执行：

1. 在后端服务页面，点击 "Shell" 标签
2. 执行以下命令：

```bash
# 检查数据库连接
npx prisma db push --accept-data-loss

# 运行迁移
npx prisma migrate deploy

# 生成 Prisma 客户端
npx prisma generate

# 查看数据库状态
npx prisma migrate status
```

### 数据库初始化

首次部署后，数据库会自动创建必要的表结构。如需要初始数据，可以：

```bash
# 运行种子数据（如果有）
npm run db:seed
```

### 迁移故障排除

**常见问题：**

1. **迁移超时**：增加数据库连接超时时间
2. **权限问题**：确保数据库用户有足够权限
3. **表冲突**：检查是否有手动创建的表

**解决方案：**

```bash
# 重置数据库（谨慎使用）
npx prisma migrate reset --force

# 强制推送 schema
npx prisma db push --force-reset
```

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

- 确保环境变量名称正确（区分大小写）
- 前端环境变量必须以 `VITE_` 开头
- 重新部署服务使环境变量生效
- 检查代码中是否正确读取环境变量
- 在 Render Shell 中验证：`echo $VARIABLE_NAME`

#### 5. Prisma 迁移失败

**问题：** 数据库迁移执行失败

**解决方案：**

- 确保数据库连接正常
- 检查 `DATABASE_URL` 格式是否正确
- 检查 Prisma schema 文件语法
- 手动执行迁移命令：

  ```bash
  # 检查迁移状态
  npx prisma migrate status

  # 强制部署迁移
  npx prisma migrate deploy --force

  # 重置数据库（谨慎使用）
  npx prisma migrate reset --force
  ```

#### 6. 构建内存不足

**问题：** 构建过程中出现内存不足错误

**解决方案：**

- 升级到 Starter 计划（更多内存）
- 优化构建过程：

  ```bash
  # 减少并发构建
  NODE_OPTIONS="--max-old-space-size=1024"

  # 清理缓存
  pnpm store prune
  ```

#### 7. 服务启动超时

**问题：** 服务启动时间过长导致超时

**解决方案：**

- 检查启动脚本是否有阻塞操作
- 优化数据库连接等待时间
- 增加健康检查的 start_period
- 检查依赖安装是否正常

#### 8. CORS 错误

**问题：** 前端无法访问后端 API，出现 CORS 错误

**解决方案：**

- 检查后端 `CORS_ORIGIN` 环境变量
- 确保前端域名在 CORS 白名单中
- 验证 `FRONTEND_URL` 配置正确
- 检查 API 请求 URL 是否正确

#### 9. 文件上传失败

**问题：** 文件上传功能不工作

**解决方案：**

- 检查 `UPLOAD_MAX_SIZE` 配置
- 确保上传目录权限正确
- 验证文件类型限制
- 检查网络超时设置

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

## ✅ 部署验证

### 部署完成检查清单

部署完成后，请按以下顺序检查：

**基础服务检查：**

- [ ] 数据库服务状态为 "Available"
- [ ] 后端服务状态为 "Live"
- [ ] 前端服务状态为 "Live"
- [ ] 所有服务的健康检查通过

**功能验证：**

- [ ] 前端页面可以正常访问
- [ ] 前端能够连接到后端 API
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] JWT 认证工作正常
- [ ] 待办事项 CRUD 操作正常
- [ ] 文件上传功能正常（如果启用）

**API 端点测试：**

```bash
# 健康检查
curl https://your-backend-url.onrender.com/api/v1/health

# API 文档
curl https://your-backend-url.onrender.com/api/v1/docs

# 用户注册测试
curl -X POST https://your-backend-url.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
```

**数据库验证：**

- [ ] 数据库迁移已执行完成
- [ ] 所有必要的表已创建
- [ ] 数据库连接正常
- [ ] 数据持久化正常

**安全检查：**

- [ ] HTTPS 证书正常
- [ ] CORS 配置正确
- [ ] 环境变量配置正确
- [ ] 敏感信息未暴露在日志中

**性能检查：**

- [ ] 前端页面加载时间 < 3 秒
- [ ] API 响应时间 < 1 秒
- [ ] 数据库查询性能正常
- [ ] 内存使用在合理范围内

### 常用验证命令

**检查服务状态：**

```bash
# 检查后端健康状态
curl -f https://your-backend-url.onrender.com/api/v1/health

# 检查前端是否正常
curl -f https://your-frontend-url.onrender.com

# 检查 API 文档
curl https://your-backend-url.onrender.com/api/v1/docs
```

**检查日志：**

- 在 Render Dashboard 中查看各服务的日志
- 确认没有错误或警告信息
- 验证启动日志正常

## 🚀 性能优化

### 生产环境优化建议

**1. 数据库优化：**

```bash
# 在 PostgreSQL 中启用连接池
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20"

# 优化查询性能
- 添加适当的数据库索引
- 使用 Prisma 查询优化
- 启用查询缓存
```

**2. 缓存策略：**

```bash
# 启用 Redis 缓存
REDIS_HOST=your-redis-host.onrender.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# 配置缓存策略
- API 响应缓存
- 数据库查询缓存
- 静态资源缓存
```

**3. 前端优化：**

```bash
# 构建优化
- 启用代码分割
- 压缩静态资源
- 使用 CDN 加速

# 运行时优化
- 懒加载组件
- 图片优化
- 预加载关键资源
```

**4. 监控和告警：**

```bash
# 集成 Sentry 错误监控
SENTRY_DSN=your-sentry-dsn

# 性能监控
- 响应时间监控
- 错误率监控
- 资源使用监控
```

**5. 安全加固：**

```bash
# 安全头配置
- HTTPS 强制
- CSP 策略
- CORS 限制

# 认证安全
- JWT 密钥轮换
- 密码策略
- 限流保护
```

**6. 备份和恢复：**

```bash
# 数据库备份
- 自动备份策略
- 备份验证
- 恢复测试

# 代码备份
- Git 版本管理
- 部署回滚
- 配置备份
```

### 成本优化

**Render 服务计划选择：**

| 服务类型        | 免费计划             | Starter ($7/月)   | Standard ($25/月)  |
| --------------- | -------------------- | ----------------- | ------------------ |
| **Web Service** | 750小时/月，睡眠机制 | 无睡眠，基础资源  | 更多资源，自动扩展 |
| **PostgreSQL**  | 1GB 存储，90天       | 10GB 存储，持久化 | 100GB 存储，备份   |
| **Redis**       | 不支持               | 25MB 内存         | 100MB 内存         |

**推荐配置：**

- **开发/测试**：使用免费计划
- **小型生产**：Starter 计划 + PostgreSQL
- **中型生产**：Standard 计划 + Redis + 备份

## 📞 技术支持

### 获取帮助

如果在部署过程中遇到问题，可以：

1. **查看官方文档**：

   - [Render 官方文档](https://render.com/docs)
   - [NestJS 部署指南](https://docs.nestjs.com/deployment)
   - [Vue 3 部署指南](https://vuejs.org/guide/best-practices/production-deployment.html)

2. **项目支持**：

   - 访问项目 GitHub 仓库提交 Issue
   - 查看项目 README 文件
   - 查看项目 Wiki 和 FAQ

3. **社区支持**：
   - Render 社区论坛
   - Stack Overflow
   - Discord/Telegram 技术群

### 常用资源链接

- **Render Dashboard**：https://dashboard.render.com
- **Render 状态页面**：https://status.render.com
- **PostgreSQL 文档**：https://www.postgresql.org/docs/
- **Prisma 文档**：https://www.prisma.io/docs/
- **Vue 3 文档**：https://vuejs.org/
- **NestJS 文档**：https://docs.nestjs.com/

### 更新日志

**v1.2.0 (2025-01-02)**

- ✅ 完善环境变量配置说明
- ✅ 添加数据库迁移详细步骤
- ✅ 增加部署验证清单
- ✅ 补充性能优化建议
- ✅ 扩展故障排除场景

**v1.1.0 (2024-12-01)**

- ✅ 添加 Docker 配置说明
- ✅ 完善健康检查配置
- ✅ 增加安全配置建议

**v1.0.0 (2024-11-01)**

- ✅ 初始版本发布
- ✅ 基础部署流程

---

## 🎉 部署成功！

恭喜您成功部署了 Yun AI TodoList 应用！

**接下来您可以：**

- 🔧 根据需要配置 AI 服务
- 📧 设置邮件通知功能
- 📊 配置监控和告警
- 🚀 优化性能和安全性
- 📱 部署移动端应用

**如果这份文档对您有帮助，请：**

- ⭐ 给项目一个 Star
- 🐛 报告发现的问题
- 💡 提出改进建议
- 📖 完善文档内容

**祝您使用愉快！** 🎊
