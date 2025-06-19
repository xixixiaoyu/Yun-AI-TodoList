# GitHub Actions 自动化部署配置指南

本项目已配置 GitHub
Actions 自动化部署流程，支持推送代码后自动构建并部署到 GitHub
Pages 和 Cloudflare Workers。

## 🚀 功能特性

- **自动触发**：推送到 `main` 或 `master` 分支时自动部署
- **手动触发**：支持通过 GitHub Actions 界面手动触发部署
- **多环境部署**：支持生产环境和开发环境
- **双平台部署**：同时部署到 GitHub Pages 和 Cloudflare Workers
- **构建验证**：包含类型检查、代码检查和构建验证
- **部署摘要**：提供详细的部署状态和访问链接

## 📋 配置要求

### 1. GitHub Secrets 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下密钥：

```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

#### 获取 Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角头像 > "My Profile"
3. 选择 "API Tokens" 标签
4. 点击 "Create Token"
5. 使用 "Custom token" 模板，配置以下权限：
   - **Account**: `Cloudflare Workers:Edit`
   - **Zone**: `Zone:Read` (如果使用自定义域名)
   - **Zone Resources**: `Include - All zones` (如果使用自定义域名)

#### 获取 Cloudflare Account ID

1. 在 Cloudflare Dashboard 右侧边栏找到 "Account ID"
2. 复制该 ID

### 2. GitHub Pages 配置

1. 进入仓库 Settings > Pages
2. Source 选择 "GitHub Actions"
3. 保存配置

## 🔧 工作流文件说明

### 主部署工作流 (`.github/workflows/deploy.yml`)

- **触发条件**：推送到 `main` 或 `master` 分支
- **功能**：完整的构建、测试和部署流程
- **部署目标**：GitHub Pages + Cloudflare Workers

### Cloudflare 专用工作流 (`.github/workflows/cloudflare-deploy.yml`)

- **触发条件**：推送到 `main`/`develop` 分支或手动触发
- **功能**：专门用于 Cloudflare Workers 部署
- **环境支持**：生产环境和开发环境

## 🎯 部署流程

### 自动部署

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发
3. 执行以下步骤：
   - 检出代码
   - 设置 Node.js 和 pnpm
   - 安装依赖
   - 类型检查
   - 代码检查
   - 构建项目
   - 验证构建输出
   - 部署到 GitHub Pages
   - 部署到 Cloudflare Workers
   - 生成部署摘要

### 手动部署

1. 进入 GitHub 仓库的 Actions 标签
2. 选择 "Deploy to Cloudflare" 工作流
3. 点击 "Run workflow"
4. 选择部署环境（production/development）
5. 点击 "Run workflow" 确认

## 🌍 访问地址

部署完成后，可以通过以下地址访问应用：

- **GitHub Pages**: `https://[username].github.io/[repository-name]`
- **Cloudflare Workers (生产环境)**:
  `https://yun-ai-todolist-prod.[your-subdomain].workers.dev`
- **Cloudflare Workers (开发环境)**:
  `https://yun-ai-todolist-dev.[your-subdomain].workers.dev`

> 注意：需要将 `[your-subdomain]` 替换为你的实际 Cloudflare Workers 子域名

## 🔍 故障排除

### 常见问题

1. **部署失败："No project was selected for deployment"**

   - 检查 `wrangler.toml` 文件是否包含 `name` 字段
   - 确认项目名称配置正确

2. **Cloudflare API 认证失败**

   - 检查 `CLOUDFLARE_API_TOKEN` 是否正确配置
   - 确认 API Token 权限是否足够
   - 验证 `CLOUDFLARE_ACCOUNT_ID` 是否正确

3. **构建失败**

   - 检查代码是否通过类型检查
   - 确认所有依赖都已正确安装
   - 查看构建日志中的具体错误信息

4. **GitHub Pages 部署失败**
   - 确认仓库 Pages 设置为 "GitHub Actions"
   - 检查是否有足够的权限

### 调试步骤

1. **查看 Actions 日志**

   - 进入 GitHub 仓库的 Actions 标签
   - 点击失败的工作流运行
   - 展开失败的步骤查看详细日志

2. **本地测试**

   ```bash
   # 本地构建测试
   pnpm install
   pnpm type-check
   pnpm lint:check
   pnpm build:frontend

   # 本地部署测试
   pnpm wrangler deploy --dry-run
   ```

3. **验证配置**
   ```bash
   # 检查 wrangler 配置
   pnpm wrangler whoami
   pnpm wrangler dev
   ```

## 📝 自定义配置

### 修改部署分支

在工作流文件中修改触发分支：

```yaml
on:
  push:
    branches:
      - main # 改为你的主分支
      - production # 添加其他分支
```

### 添加环境变量

在 `wrangler.toml` 中添加环境变量：

```toml
[vars]
ENVIRONMENT = "production"
API_URL = "https://api.example.com"
```

### 自定义域名

在 `wrangler.toml` 中配置自定义域名：

```toml
[env.production.routes]
pattern = "todo.yourdomain.com/*"
zone_name = "yourdomain.com"
```

## 🔒 安全最佳实践

1. **API Token 权限最小化**：只授予必要的权限
2. **定期轮换密钥**：定期更新 API Token
3. **分支保护**：为主分支设置保护规则
4. **审查权限**：定期审查 GitHub Actions 权限

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [项目 Cloudflare 部署指南](./CLOUDFLARE-DEPLOYMENT.md)
