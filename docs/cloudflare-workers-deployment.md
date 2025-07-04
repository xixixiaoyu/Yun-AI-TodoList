# Cloudflare Workers 部署指南

本文档详细介绍如何将 Yun AI TodoList 前端应用部署到 Cloudflare Workers 平台。

## 📋 目录

- [项目概述](#项目概述)
- [部署前准备](#部署前准备)
- [快速部署](#快速部署)
- [配置说明](#配置说明)
- [自定义域名](#自定义域名)
- [环境变量管理](#环境变量管理)
- [监控和分析](#监控和分析)
- [故障排除](#故障排除)
- [性能优化](#性能优化)

## 🎯 项目概述

Cloudflare Workers 是一个无服务器平台，非常适合部署前端静态应用：

**优势：**

- 🌍 **全球 CDN**：200+ 个边缘节点，极速访问
- 💰 **免费额度**：每天 100,000 次请求
- ⚡ **零冷启动**：即时响应
- 🔒 **自动 HTTPS**：免费 SSL 证书
- 📊 **实时分析**：详细的访问统计

**适用场景：**

- 前端静态应用部署
- 全球用户访问优化
- 高性能要求的应用
- 成本敏感的项目

## 🚀 部署前准备

### 1. 注册 Cloudflare 账户

1. 访问 [Cloudflare](https://cloudflare.com)
2. 注册免费账户
3. 验证邮箱地址

### 2. 安装必要工具

**安装 Node.js（>= 18.0.0）：**

```bash
# 使用 nvm（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 或直接下载
# https://nodejs.org/
```

**安装 pnpm：**

```bash
npm install -g pnpm
```

**安装 Wrangler CLI：**

```bash
npm install -g wrangler
```

### 3. 登录 Cloudflare

```bash
# 登录账户
wrangler login

# 验证登录状态
wrangler whoami
```

### 4. 克隆项目

```bash
git clone https://github.com/your-username/Yun-AI-TodoList.git
cd Yun-AI-TodoList
```

## ⚡ 快速部署

### 使用自动化脚本（推荐）

项目提供了完整的自动化部署脚本：

```bash
# 部署到开发环境
./scripts/deploy-cloudflare.sh dev

# 部署到生产环境
./scripts/deploy-cloudflare.sh prod --force

# 模拟部署（查看将要执行的操作）
./scripts/deploy-cloudflare.sh prod --dry-run

# 清理缓存后部署
./scripts/deploy-cloudflare.sh prod --clean

# 查看帮助
./scripts/deploy-cloudflare.sh --help
```

### 手动部署步骤

如果需要手动部署：

```bash
# 1. 安装依赖
pnpm install

# 2. 构建共享包
pnpm --filter shared build

# 3. 构建前端
pnpm --filter frontend build

# 4. 进入 workers-site 目录
cd workers-site

# 5. 安装 Workers 依赖
pnpm install

# 6. 部署到开发环境
wrangler deploy --env development

# 7. 部署到生产环境
wrangler deploy --env production
```

## ⚙️ 配置说明

### wrangler.toml 配置文件

项目根目录的 `wrangler.toml` 文件包含了完整的配置：

```toml
name = "yun-ai-todolist"
main = "workers-site/index.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# 全局环境变量
[vars]
ENVIRONMENT = "production"
APP_NAME = "Yun AI TodoList"
APP_VERSION = "1.0.0"

# Workers Assets 配置
[assets]
directory = "./apps/frontend/dist"
serve_single_page_app = true
html_handling = "auto-trailing-slash"
text_compression = "gzip"

# 开发环境配置
[env.development]
name = "yun-ai-todolist-dev"

[env.development.vars]
ENVIRONMENT = "development"
DEBUG_MODE = "true"
API_BASE_URL = "http://localhost:3000"

# 生产环境配置
[env.production]
name = "yun-ai-todolist-prod"

[env.production.vars]
ENVIRONMENT = "production"
DEBUG_MODE = "false"
API_BASE_URL = "https://api.yourdomain.com"
```

### 重要配置项说明

| 配置项                  | 说明             | 示例值                  |
| ----------------------- | ---------------- | ----------------------- |
| `name`                  | Workers 应用名称 | `yun-ai-todolist`       |
| `main`                  | 入口文件路径     | `workers-site/index.js` |
| `compatibility_date`    | 兼容性日期       | `2024-12-01`            |
| `directory`             | 静态资源目录     | `./apps/frontend/dist`  |
| `serve_single_page_app` | SPA 支持         | `true`                  |
| `text_compression`      | 文本压缩         | `gzip`                  |

## 🌐 自定义域名

### 1. 添加域名到 Cloudflare

1. 登录 Cloudflare Dashboard
2. 点击 "Add a Site"
3. 输入您的域名
4. 选择免费计划
5. 更新域名服务器

### 2. 配置 Workers 路由

**方法一：通过 Dashboard 配置**

1. 进入 Workers & Pages
2. 选择您的 Workers 应用
3. 点击 "Settings" → "Triggers"
4. 添加自定义域名或路由

**方法二：通过 wrangler.toml 配置**

```toml
# 在 wrangler.toml 中添加
[env.production]
routes = [
  { pattern = "todo.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### 3. 更新 API 配置

部署后需要更新后端 API 地址：

```bash
# 更新 wrangler.toml 中的 API_BASE_URL
[env.production.vars]
API_BASE_URL = "https://your-backend-api.com"
```

## 🔐 环境变量管理

### 设置密钥变量

对于敏感信息，使用 Wrangler 密钥管理：

```bash
# 设置 API 密钥
wrangler secret put API_KEY --env production

# 设置数据库连接
wrangler secret put DATABASE_URL --env production

# 查看已设置的密钥
wrangler secret list --env production
```

### 环境变量配置

在 `wrangler.toml` 中配置非敏感环境变量：

```toml
[env.production.vars]
ENVIRONMENT = "production"
APP_VERSION = "1.0.0"
API_BASE_URL = "https://api.yourdomain.com"
ENABLE_ANALYTICS = "true"
```

## 📊 监控和分析

### 查看实时日志

```bash
# 查看实时日志
wrangler tail --env production

# 过滤特定日志
wrangler tail --env production --format pretty

# 查看错误日志
wrangler tail --env production --status error
```

### 分析数据

```bash
# 查看请求统计
wrangler analytics --env production

# 查看详细分析
wrangler analytics --env production --since 7d
```

### Dashboard 监控

访问 Cloudflare Dashboard 查看：

- 📈 **请求统计**：QPS、带宽使用
- 🌍 **地理分布**：用户访问地区
- ⚡ **性能指标**：响应时间、错误率
- 🔒 **安全事件**：攻击拦截统计

## 🔧 故障排除

### 常见问题

**1. 部署失败**

```bash
# 检查配置文件
wrangler config validate

# 查看详细错误
wrangler deploy --env production --verbose

# 检查账户限制
wrangler whoami
```

**2. 静态资源 404**

```bash
# 检查构建输出
ls -la apps/frontend/dist/

# 验证 wrangler.toml 配置
grep -A 5 "\[assets\]" wrangler.toml

# 重新构建
pnpm --filter frontend build
```

**3. API 连接失败**

```bash
# 检查 API 地址配置
wrangler secret list --env production

# 测试 API 连接
curl https://your-api-domain.com/health

# 检查 CORS 配置
```

**4. 自定义域名不工作**

```bash
# 检查 DNS 设置
dig your-domain.com

# 验证 SSL 证书
curl -I https://your-domain.com

# 检查路由配置
wrangler routes list
```

### 调试技巧

**本地开发模式：**

```bash
# 启动本地开发服务器
wrangler dev

# 指定端口
wrangler dev --port 8080

# 启用远程调试
wrangler dev --remote
```

**日志调试：**

```bash
# 在 Workers 代码中添加日志
console.log('Debug info:', request.url);

# 查看实时日志
wrangler tail --env production
```

## 🚀 性能优化

### 缓存策略

```javascript
// 在 workers-site/index.js 中配置缓存
export default {
  async fetch(request, env, ctx) {
    const cache = caches.default
    const cacheKey = new Request(request.url, request)

    // 检查缓存
    let response = await cache.match(cacheKey)

    if (!response) {
      // 处理请求
      response = await handleRequest(request)

      // 设置缓存
      response.headers.set('Cache-Control', 'public, max-age=86400')
      ctx.waitUntil(cache.put(cacheKey, response.clone()))
    }

    return response
  },
}
```

### 压缩优化

```toml
# 在 wrangler.toml 中启用压缩
[assets]
text_compression = "gzip"
```

### 边缘计算优化

```javascript
// 利用边缘计算处理请求
export default {
  async fetch(request, env, ctx) {
    // 地理位置优化
    const country = request.cf.country

    // 根据地区返回不同内容
    if (country === 'CN') {
      return handleChinaRequest(request)
    }

    return handleGlobalRequest(request)
  },
}
```

## 📋 部署检查清单

**部署前检查：**

- [ ] Cloudflare 账户已注册并登录
- [ ] Wrangler CLI 已安装并登录
- [ ] 项目代码已更新到最新版本
- [ ] 前端构建成功
- [ ] wrangler.toml 配置正确

**部署后验证：**

- [ ] 应用可以正常访问
- [ ] 所有页面路由正常
- [ ] API 连接正常
- [ ] 静态资源加载正常
- [ ] 自定义域名工作正常（如果配置）

**性能检查：**

- [ ] 页面加载时间 < 2 秒
- [ ] 静态资源缓存正常
- [ ] 全球访问速度正常
- [ ] 移动端访问正常

---

## 🎉 部署成功！

恭喜您成功将 Yun AI TodoList 部署到 Cloudflare Workers！

**接下来您可以：**

- 🌐 配置自定义域名
- 📊 设置监控和分析
- ⚡ 优化缓存策略
- 🔒 配置安全策略

**有用的链接：**

- 📖 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- 🛠️ [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- 📊 [Cloudflare Dashboard](https://dash.cloudflare.com/)

**祝您使用愉快！** 🎊
