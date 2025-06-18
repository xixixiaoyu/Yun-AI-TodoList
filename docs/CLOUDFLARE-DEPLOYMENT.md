# Cloudflare Workers 部署指南

本指南将帮助你将 Yun AI TodoList 前端项目部署到 Cloudflare Workers。

## 📋 前置要求

1. **Cloudflare 账户**: 注册 [Cloudflare](https://cloudflare.com) 账户
2. **Node.js**: 版本 18 或更高
3. **pnpm**: 项目使用 pnpm 作为包管理器
4. **Wrangler CLI**: Cloudflare Workers 的命令行工具

## 🚀 快速开始

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

这将打开浏览器，让你登录 Cloudflare 账户并授权 Wrangler。

### 3. 构建和部署

使用提供的部署脚本：

```bash
# 部署到开发环境
./scripts/deploy-cloudflare.sh dev

# 部署到生产环境
./scripts/deploy-cloudflare.sh prod
```

或者手动执行：

```bash
# 1. 构建前端
cd apps/frontend
pnpm run build
cd ../..

# 2. 安装 Workers 依赖
cd workers-site
pnpm install
cd ..

# 3. 部署
wrangler deploy --env development  # 开发环境
wrangler deploy --env production   # 生产环境
```

## 📁 项目结构

```
├── wrangler.toml              # Wrangler 配置文件
├── workers-site/              # Workers 站点代码
│   ├── index.js              # Workers 入口文件
│   └── package.json          # Workers 依赖
├── apps/frontend/dist/        # 构建后的前端文件
└── scripts/deploy-cloudflare.sh  # 部署脚本
```

## ⚙️ 配置说明

### wrangler.toml 配置

主要配置项：

- `name`: Workers 应用名称
- `site.bucket`: 静态文件目录（指向前端构建输出）
- `compatibility_date`: 兼容性日期
- `env`: 环境配置（development/production）

### 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
ENVIRONMENT = "production"
```

### 自定义域名

1. 在 Cloudflare Dashboard 中添加你的域名
2. 在 `wrangler.toml` 中配置路由：

```toml
[env.production.routes]
pattern = "todo.yourdomain.com/*"
zone_name = "yourdomain.com"
```

## 🔧 高级配置

### KV 存储

如果需要使用 Cloudflare KV 存储：

```toml
[[kv_namespaces]]
binding = "TODO_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### D1 数据库

如果需要使用 Cloudflare D1 数据库：

```toml
[[d1_databases]]
binding = "DB"
database_name = "todo-db"
database_id = "your-database-id"
```

### 安全头配置

Workers 代码已包含基本的安全头：

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: 根据应用需求配置

## 🛠️ 开发和调试

### 本地开发

```bash
wrangler dev
```

这将启动本地开发服务器，你可以在本地测试 Workers 功能。

### 查看日志

```bash
# 实时查看生产环境日志
wrangler tail --env production

# 查看开发环境日志
wrangler tail --env development
```

### 调试模式

在 `workers-site/index.js` 中设置 `DEBUG = true` 可以启用调试模式，这将：

1. 跳过边缘缓存
2. 返回详细的错误信息

## 📊 性能优化

### 缓存策略

Workers 会自动缓存静态资源。你可以在代码中自定义缓存策略：

```javascript
options.cacheControl = {
  browserTTL: 60 * 60 * 24, // 浏览器缓存 24 小时
  edgeTTL: 60 * 60 * 24 * 7, // 边缘缓存 7 天
}
```

### 资源压缩

Vite 构建已启用资源压缩和代码分割，Workers 会自动处理 gzip 压缩。

## 🔍 故障排除

### 常见问题

1. **部署失败**: 检查 Wrangler 登录状态和权限
2. **404 错误**: 确保 SPA 路由配置正确
3. **资源加载失败**: 检查 `base` 路径配置

### 检查部署状态

```bash
wrangler deployments list
```

### 回滚部署

```bash
wrangler rollback [deployment-id]
```

## 💰 费用说明

Cloudflare Workers 提供慷慨的免费额度：

- 每天 100,000 次请求
- 每次请求最多 10ms CPU 时间
- 超出免费额度后按使用量计费

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Sites 指南](https://developers.cloudflare.com/workers/platform/sites/)

## 📞 支持

如果遇到问题，可以：

1. 查看 Cloudflare Workers 文档
2. 检查项目的 GitHub Issues
3. 联系项目维护者
