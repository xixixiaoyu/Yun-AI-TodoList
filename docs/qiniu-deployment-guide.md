# 七牛云部署完整指南

## 📋 准备工作

### 1. 注册七牛云账号

- 访问：https://portal.qiniu.com/signup
- 完成实名认证（必须，否则无法使用 CDN）

### 2. 获取 API 密钥

1. 登录七牛云控制台
2. 进入 **个人中心** → **密钥管理**
3. 记录 `AccessKey` 和 `SecretKey`

## 🗂️ 创建存储空间

### 1. 新建存储空间

1. 进入 **对象存储** → **空间管理**
2. 点击 **新建空间**
3. 配置参数：
   - **空间名称**：`yun-todolist`（全局唯一，可自定义）
   - **存储区域**：`华东-浙江`（推荐，国内访问快）
   - **访问控制**：`公开空间`

### 2. 配置静态网站托管

1. 进入刚创建的存储空间
2. 点击 **空间设置** → **静态网站托管**
3. 开启静态网站托管
4. 配置：
   - **首页**：`index.html`
   - **404页面**：`index.html`（重要：SPA 路由需要）

## 🚀 配置 CDN 加速

### 1. 添加加速域名

1. 进入 **CDN** → **域名管理**
2. 点击 **添加域名**
3. 配置：
   - **加速域名**：你的域名（如 `todo.yourdomain.com`）
   - **通信协议**：`HTTP + HTTPS`
   - **源站配置**：选择刚创建的存储空间

### 2. 配置缓存规则

在域名管理中设置缓存规则：

```
文件类型          缓存时间
*.html           1小时
*.js, *.css      30天
*.png, *.jpg     30天
*                1天
```

### 3. 配置 HTTPS（推荐）

1. 在域名管理中点击 **HTTPS配置**
2. 上传 SSL 证书或使用免费证书
3. 开启 **强制HTTPS**

## ⚙️ 项目配置

### 1. 设置 GitHub Secrets

在你的 GitHub 仓库中设置以下 Secrets：

```
QINIU_ACCESS_KEY    = 你的AccessKey
QINIU_SECRET_KEY    = 你的SecretKey
QINIU_BUCKET        = yun-todolist
QINIU_DOMAIN        = todo.yourdomain.com（可选）
```

设置路径：GitHub 仓库 → Settings → Secrets and variables → Actions

### 2. 本地环境变量（可选）

如果需要本地部署，创建 `.env.local` 文件：

```bash
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=yun-todolist
QINIU_DOMAIN=todo.yourdomain.com
```

## 🚀 部署方式

### 方式一：GitHub Actions 自动部署（推荐）

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发部署
3. 查看部署状态：Actions 页面

### 方式二：本地手动部署

```bash
# 1. 构建项目
pnpm build

# 2. 设置环境变量
export QINIU_ACCESS_KEY=your_access_key
export QINIU_SECRET_KEY=your_secret_key
export QINIU_BUCKET=yun-todolist

# 3. 执行部署
chmod +x scripts/deploy-qiniu.sh
./scripts/deploy-qiniu.sh
```

## 🔧 高级配置

### 1. 自定义域名配置

如果使用自定义域名：

1. **DNS 配置**：

   ```
   类型    名称    值
   CNAME   todo    your-bucket.qiniucdn.com
   ```

2. **域名备案**（如果是 .cn 域名或在中国大陆使用）

### 2. 智能 DNS 配置（可选）

使用 DNSPod 或阿里云 DNS：

```
记录类型    线路类型    记录值
CNAME      默认       your-bucket.qiniucdn.com
CNAME      境外       your-cloudflare-domain.com
```

### 3. 缓存刷新

部署后如果需要立即生效：

```bash
# 使用 qshell 刷新缓存
qshell cdnrefresh --dirs https://your-domain.com/
```

## 📊 监控和优化

### 1. 访问统计

- 七牛云控制台 → CDN → 统计分析
- 查看流量、请求数、状态码等

### 2. 性能优化

- 开启 Gzip 压缩
- 配置合理的缓存策略
- 使用 WebP 图片格式

### 3. 成本控制

- 监控流量使用情况
- 设置流量告警
- 优化资源大小

## 🐛 常见问题

### 1. 上传失败

- 检查 AccessKey 和 SecretKey 是否正确
- 确认存储空间名称无误
- 检查网络连接

### 2. 访问 404

- 确认已开启静态网站托管
- 检查 404 页面设置为 `index.html`
- 确认文件已正确上传

### 3. HTTPS 证书问题

- 确认证书格式正确
- 检查证书是否过期
- 验证域名解析是否正确

### 4. 缓存问题

- 手动刷新 CDN 缓存
- 检查缓存规则配置
- 使用版本号或时间戳

## 💰 费用说明

### 免费额度（每月）

- 存储空间：10GB
- 下载流量：10GB
- PUT/DELETE 请求：10万次
- GET 请求：100万次

### 超出费用

- 存储：¥0.148/GB/月
- CDN 流量：¥0.29/GB（国内）
- 请求费用：¥0.01/万次

## 🔗 相关链接

- [七牛云官网](https://www.qiniu.com/)
- [七牛云文档](https://developer.qiniu.com/)
- [qshell 工具文档](https://developer.qiniu.com/kodo/1302/qshell)
- [CDN 配置指南](https://developer.qiniu.com/fusion)
