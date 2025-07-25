# Cloudflare Workers 部署指南

## 🚀 快速开始

### 1. 安装 Wrangler CLI

```bash
# 全局安装 Wrangler
npm install -g wrangler

# 或者使用 pnpm
pnpm add -g wrangler
```

### 2. 登录 Cloudflare

```bash
# 登录到 Cloudflare 账户
wrangler login

# 验证登录状态
wrangler whoami
```

### 3. 配置项目

编辑 `wrangler.toml` 文件，更新以下配置：

```toml
# 更新项目名称（必须全局唯一）
name = "your-unique-project-name"

# 更新生产环境 API URL
[env.production.vars]
API_BASE_URL = "https://your-api-domain.com"
```

### 4. 部署应用

```bash
# 部署到开发环境
pnpm deploy:dev

# 部署到生产环境
pnpm deploy

# 或者直接使用脚本
./scripts/deploy-cloudflare.sh dev
./scripts/deploy-cloudflare.sh prod
```

## 📋 可用命令

### Package.json 脚本

```bash
# 部署到生产环境
pnpm deploy

# 部署到开发环境
pnpm deploy:dev
```

### 部署脚本选项

```bash
# 查看帮助
./scripts/deploy-cloudflare.sh --help

# 模拟部署（不实际执行）
./scripts/deploy-cloudflare.sh dev --dry-run

# 强制部署（跳过确认）
./scripts/deploy-cloudflare.sh prod --force
```

## ⚙️ 配置说明

### 环境变量

在 `wrangler.toml` 中配置的环境变量：

- `ENVIRONMENT`: 环境标识 (development/production)
- `APP_NAME`: 应用名称
- `APP_VERSION`: 应用版本
- `DEBUG_MODE`: 调试模式开关
- `API_BASE_URL`: 后端 API 地址

### 自定义域名

如果要使用自定义域名，在 `wrangler.toml` 中取消注释并配置：

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

## 🐛 故障排除

### 常见问题

1. **部署失败：权限不足**

   ```bash
   # 重新登录
   wrangler logout
   wrangler login
   ```

2. **项目名称冲突**

   - 在 `wrangler.toml` 中更改 `name` 为唯一值

3. **构建失败**
   ```bash
   # 清理缓存后重试
   pnpm clean
   pnpm install
   ```

### 查看日志

```bash
# 查看实时日志
wrangler tail

# 查看开发环境日志
wrangler tail --env development

# 查看生产环境日志
wrangler tail --env production
```

## 📊 监控和分析

部署成功后，你可以在 Cloudflare Dashboard 中查看：

- 请求统计
- 错误日志
- 性能指标
- 流量分析

访问地址：https://dash.cloudflare.com/

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Assets 文档](https://developers.cloudflare.com/workers/static-assets/)
