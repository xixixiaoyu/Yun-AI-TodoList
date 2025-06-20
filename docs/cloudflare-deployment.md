# Cloudflare Workers 部署指南

本文档详细介绍如何将 Yun AI TodoList 部署到 Cloudflare Workers。

## 📋 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [部署流程](#部署流程)
- [自定义域名](#自定义域名)
- [环境管理](#环境管理)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

## 🚀 前置要求

### 必需工具

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0
- **Wrangler CLI** (最新版本)
- **Cloudflare 账户** (免费或付费)

### 安装 Wrangler CLI

```bash
# 全局安装
npm install -g wrangler

# 或使用 pnpm
pnpm add -g wrangler

# 验证安装
wrangler --version
```

## 🚀 快速开始

### 方式一：使用初始化脚本（推荐）

```bash
# 运行初始化脚本
./scripts/init-cloudflare.sh

# 按照提示完成配置
# 脚本会自动：
# 1. 检查必要工具
# 2. 设置 Cloudflare 认证
# 3. 收集配置信息
# 4. 更新配置文件
# 5. 安装依赖
```

### 方式二：手动配置

1. **登录 Cloudflare**

   ```bash
   wrangler login
   ```

2. **复制环境变量文件**

   ```bash
   cp .env.cloudflare.example .env.cloudflare
   ```

3. **编辑配置文件**

   ```bash
   # 编辑 .env.cloudflare
   vim .env.cloudflare

   # 编辑 wrangler.toml（如需要）
   vim wrangler.toml
   ```

4. **安装依赖**
   ```bash
   pnpm install
   cd workers-site && pnpm install && cd ..
   ```

## ⚙️ 详细配置

### wrangler.toml 配置说明

```toml
# 应用基本信息
name = "yun-ai-todolist"                    # Workers 应用名称
main = "workers-site/index.js"             # 入口文件
compatibility_date = "2024-12-01"          # 兼容性日期
compatibility_flags = ["nodejs_compat"]    # 兼容性标志

# 全局环境变量
[vars]
ENVIRONMENT = "production"
APP_NAME = "Yun AI TodoList"
APP_VERSION = "1.0.0"

# Workers Assets 配置
[assets]
directory = "./apps/frontend/dist"         # 静态资源目录
serve_single_page_app = true               # SPA 支持
html_handling = "auto-trailing-slash"      # HTML 处理
text_compression = "gzip"                  # 文本压缩

# 开发环境
[env.development]
name = "yun-ai-todolist-dev"
vars = {
  ENVIRONMENT = "development",
  DEBUG_MODE = "true",
  API_BASE_URL = "http://localhost:3000"
}

# 生产环境
[env.production]
name = "yun-ai-todolist-prod"
vars = {
  ENVIRONMENT = "production",
  DEBUG_MODE = "false",
  API_BASE_URL = "https://api.yourdomain.com"
}
```

### 环境变量配置

编辑 `.env.cloudflare` 文件：

```bash
# Cloudflare 账户信息
CLOUDFLARE_ACCOUNT_ID=your-account-id      # 在 Cloudflare Dashboard 右侧找到
CLOUDFLARE_API_TOKEN=your-api-token        # 创建 API Token

# Workers 应用配置
WORKERS_APP_NAME=yun-ai-todolist
WORKERS_SUBDOMAIN=your-subdomain           # 您的 workers.dev 子域名

# 自定义域名（可选）
CUSTOM_DOMAIN=todo.yourdomain.com
ZONE_NAME=yourdomain.com

# 后端 API 配置
API_BASE_URL=https://api.yourdomain.com

# 环境变量
ENVIRONMENT=production
DEBUG_MODE=false
```

## 🚀 部署流程

### 开发环境部署

```bash
# 构建前端
pnpm run build:frontend

# 部署到开发环境
./scripts/deploy-cloudflare.sh dev

# 或使用 wrangler 直接部署
cd workers-site
wrangler deploy --env development
```

### 生产环境部署

```bash
# 构建前端
pnpm run build:frontend

# 部署到生产环境
./scripts/deploy-cloudflare.sh prod

# 强制部署（跳过确认）
./scripts/deploy-cloudflare.sh prod --force

# 模拟部署（不实际执行）
./scripts/deploy-cloudflare.sh prod --dry-run
```

### 部署脚本选项

```bash
# 查看帮助
./scripts/deploy-cloudflare.sh --help

# 可用选项：
# --force     强制部署，跳过确认
# --dry-run   模拟部署，不实际执行
# --debug     显示调试信息
```

## 🌐 自定义域名

### 1. 在 Cloudflare Dashboard 中配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择您的域名
3. 进入 **Workers Routes** 或 **Workers & Pages**
4. 添加自定义域名

### 2. 更新 wrangler.toml

```toml
# 在生产环境配置中添加路由
[env.production]
name = "yun-ai-todolist-prod"
routes = [
  { pattern = "todo.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### 3. 重新部署

```bash
./scripts/deploy-cloudflare.sh prod
```

## 🔧 环境管理

### 本地开发

```bash
# 启动本地开发服务器
cd workers-site
pnpm run dev

# 或使用远程模式
pnpm run dev:remote
```

### 查看日志

```bash
# 实时日志
wrangler tail

# 指定环境
wrangler tail --env production
wrangler tail --env development
```

### 管理部署

```bash
# 查看部署列表
wrangler deployments list

# 回滚到上一个版本
wrangler rollback

# 查看当前用户
wrangler whoami
```

## 🔍 故障排除

### 常见问题

#### 1. 部署失败："Authentication error"

```bash
# 重新登录
wrangler logout
wrangler login

# 检查登录状态
wrangler whoami
```

#### 2. 构建失败："dist directory not found"

```bash
# 确保前端已构建
cd apps/frontend
pnpm run build
cd ../..

# 检查构建产物
ls -la apps/frontend/dist/
```

#### 3. 配置验证失败

```bash
# 验证配置文件
wrangler validate

# 检查语法错误
cat wrangler.toml
```

#### 4. 自定义域名不工作

1. 检查 DNS 设置
2. 确认域名已添加到 Cloudflare
3. 验证路由配置
4. 等待 DNS 传播（最多 24 小时）

### 调试技巧

```bash
# 启用调试模式
./scripts/deploy-cloudflare.sh dev --debug

# 查看详细日志
wrangler tail --format pretty

# 检查 Worker 状态
curl https://your-app.workers.dev/health
```

## 📚 最佳实践

### 1. 环境分离

- 使用不同的 Worker 名称区分环境
- 开发环境使用 `app-dev`，生产环境使用 `app-prod`
- 配置不同的环境变量

### 2. 安全配置

```toml
# 在 wrangler.toml 中配置安全头
[env.production.vars]
SECURITY_HEADERS = "true"
CSP_ENABLED = "true"
```

### 3. 性能优化

- 启用资源压缩
- 配置适当的缓存策略
- 使用 CDN 加速静态资源

### 4. 监控和日志

```bash
# 设置日志监控
wrangler tail --format json | jq .

# 配置错误报告
# 在 Worker 中添加错误处理
```

### 5. CI/CD 集成

```yaml
# GitHub Actions 示例
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: |
          npm install -g wrangler
          ./scripts/deploy-cloudflare.sh prod --force
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 📞 获取帮助

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [项目 GitHub Issues](https://github.com/xixixiaoyu/todo/issues)

## 🔗 相关链接

- [项目主 README](../README.md)
- [前端部署文档](./frontend-deployment.md)
- [后端部署文档](./backend-deployment.md)
- [Docker 部署文档](./docker-deployment.md)
