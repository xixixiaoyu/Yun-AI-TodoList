# 🐳 Yun AI TodoList Docker 部署指南

本文档提供了 Yun AI
TodoList 项目的完整 Docker 部署指南，包括开发环境和生产环境的配置。

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [开发环境](#开发环境)
- [生产环境](#生产环境)
- [配置说明](#配置说明)
- [常见问题](#常见问题)
- [安全最佳实践](#安全最佳实践)

## 🔧 系统要求

### 最低要求

- Docker 20.10+
- Docker Compose 2.0+
- 可用内存：4GB+
- 可用磁盘空间：10GB+

### 推荐配置

- Docker 24.0+
- Docker Compose 2.20+
- 可用内存：8GB+
- 可用磁盘空间：20GB+

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd Yun-AI-TodoList
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（根据需要修改）
nano .env
```

### 3. 启动开发环境

```bash
# 使用便捷脚本
./scripts/docker-dev.sh start

# 或使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

### 4. 访问应用

- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 数据库管理：http://localhost:8080

## 🛠️ 开发环境

### 启动开发环境

```bash
# 使用便捷脚本（推荐）
./scripts/docker-dev.sh start

# 查看服务状态
./scripts/docker-dev.sh status

# 查看日志
./scripts/docker-dev.sh logs

# 进入容器
./scripts/docker-dev.sh shell backend-dev
```

### 开发环境特性

- ✅ 热重载支持
- ✅ 源代码实时同步
- ✅ 调试端口暴露
- ✅ 开发工具集成
- ✅ 数据库管理界面

### 服务端口映射

| 服务       | 容器端口 | 主机端口 | 说明             |
| ---------- | -------- | -------- | ---------------- |
| 前端       | 5173     | 5173     | Vite 开发服务器  |
| 后端       | 3000     | 3000     | NestJS API 服务  |
| 后端调试   | 9229     | 9229     | Node.js 调试端口 |
| PostgreSQL | 5432     | 5433     | 数据库服务       |
| Redis      | 6379     | 6380     | 缓存服务         |
| Adminer    | 8080     | 8080     | 数据库管理       |

### 开发环境命令

```bash
# 启动服务
./scripts/docker-dev.sh start

# 停止服务
./scripts/docker-dev.sh stop

# 重启服务
./scripts/docker-dev.sh restart

# 重新构建
./scripts/docker-dev.sh build

# 清理环境
./scripts/docker-dev.sh clean

# 完全清理（包括镜像和卷）
./scripts/docker-dev.sh clean --clean
```

## 🏭 生产环境

### 生产环境配置

```bash
# 复制生产环境配置模板
cp .env.production.example .env.production

# 编辑生产环境配置
nano .env.production
```

### 重要安全配置

```bash
# 生成强密码
openssl rand -base64 32  # JWT 密钥
openssl rand -base64 16  # 数据库密码

# 设置环境变量
export POSTGRES_PASSWORD="your-strong-password"
export JWT_SECRET="your-jwt-secret"
export JWT_REFRESH_SECRET="your-refresh-secret"
```

### 部署生产环境

```bash
# 使用便捷脚本（推荐）
./scripts/docker-prod.sh deploy

# 或使用 docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 生产环境特性

- ✅ 多阶段构建优化
- ✅ 安全配置增强
- ✅ 性能调优
- ✅ 健康检查
- ✅ 资源限制
- ✅ 日志管理

### 生产环境命令

```bash
# 部署应用
./scripts/docker-prod.sh deploy

# 滚动更新
./scripts/docker-prod.sh update

# 备份数据
./scripts/docker-prod.sh backup

# 查看状态
./scripts/docker-prod.sh status

# 安全扫描
./scripts/docker-prod.sh scan
```

## ⚙️ 配置说明

### Docker Compose 文件

- `docker-compose.yml` - 基础配置
- `docker-compose.dev.yml` - 开发环境
- `docker-compose.prod.yml` - 生产环境
- `docker-compose.test.yml` - 测试环境

### Dockerfile 说明

- `Dockerfile` - 多目标生产构建
- `Dockerfile.dev` - 开发环境构建

### 环境变量文件

- `.env.example` - 环境变量模板
- `.env.production.example` - 生产环境模板

## 🔍 监控和日志

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 查看最近的日志
docker-compose logs --tail=100 frontend
```

### 健康检查

```bash
# 检查服务健康状态
docker-compose ps

# 手动健康检查
curl http://localhost:3000/health
curl http://localhost:5173/health
```

### 性能监控

```bash
# 查看资源使用情况
docker stats

# 查看容器详细信息
docker inspect <container-name>
```

## 🛡️ 安全最佳实践

### 1. 镜像安全

- ✅ 使用官方基础镜像
- ✅ 定期更新基础镜像
- ✅ 使用非 root 用户
- ✅ 最小化镜像体积

### 2. 容器安全

- ✅ 启用只读文件系统
- ✅ 设置资源限制
- ✅ 禁用特权模式
- ✅ 使用安全选项

### 3. 网络安全

- ✅ 使用自定义网络
- ✅ 限制端口暴露
- ✅ 配置防火墙规则

### 4. 数据安全

- ✅ 加密敏感数据
- ✅ 定期备份数据
- ✅ 使用强密码
- ✅ 限制数据库访问

### 安全检查

```bash
# 运行安全检查
./scripts/docker-security-enhanced.sh

# 使用 Trivy 扫描漏洞
trivy image yun-todolist-backend
trivy image yun-todolist-frontend
```

## 🔧 故障排查

### 常见问题

#### 1. 容器启动失败

```bash
# 查看容器日志
docker-compose logs <service-name>

# 检查容器状态
docker-compose ps

# 重启服务
docker-compose restart <service-name>
```

#### 2. 数据库连接失败

```bash
# 检查数据库容器状态
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 测试数据库连接
docker-compose exec postgres psql -U postgres -d yun_ai_todolist
```

#### 3. 前端无法访问后端

```bash
# 检查网络连接
docker network ls
docker network inspect <network-name>

# 检查服务发现
docker-compose exec frontend nslookup backend
```

#### 4. 热重载不工作

```bash
# 检查文件挂载
docker-compose exec frontend ls -la /app/apps/frontend/src

# 重启开发服务
./scripts/docker-dev.sh restart
```

### 调试技巧

```bash
# 进入容器调试
docker-compose exec <service> sh

# 查看容器文件系统
docker-compose exec <service> find /app -name "*.js"

# 检查环境变量
docker-compose exec <service> env
```

## 📊 性能优化

### 构建优化

- 使用 `.dockerignore` 减少构建上下文
- 利用 Docker 层缓存
- 使用多阶段构建
- 并行构建镜像

### 运行时优化

- 设置合适的资源限制
- 使用健康检查
- 配置重启策略
- 优化日志配置

### 存储优化

- 使用命名卷
- 定期清理未使用的镜像
- 配置日志轮转
- 监控磁盘使用

## 🔄 更新和维护

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
./scripts/docker-prod.sh update
```

### 数据备份

```bash
# 自动备份
./scripts/docker-prod.sh backup

# 手动备份数据库
docker-compose exec postgres pg_dump -U postgres yun_ai_todolist > backup.sql
```

### 清理维护

```bash
# 清理未使用的镜像
docker image prune -f

# 清理未使用的卷
docker volume prune -f

# 清理系统
docker system prune -f
```

## 📞 支持和帮助

如果遇到问题，请：

1. 查看本文档的故障排查部分
2. 检查项目的 Issues 页面
3. 运行安全检查脚本
4. 提供详细的错误日志

## 🚨 紧急故障处理

### 服务完全无法访问

```bash
# 1. 检查 Docker 服务状态
sudo systemctl status docker

# 2. 检查容器状态
docker-compose ps

# 3. 重启所有服务
docker-compose restart

# 4. 如果仍然失败，完全重新部署
docker-compose down
docker-compose up -d
```

### 数据库数据丢失

```bash
# 1. 停止所有服务
docker-compose down

# 2. 恢复最新备份
docker-compose up -d postgres
docker-compose exec postgres psql -U postgres -d yun_ai_todolist < backup.sql

# 3. 重启所有服务
docker-compose up -d
```

### 磁盘空间不足

```bash
# 1. 清理 Docker 系统
docker system prune -a -f

# 2. 清理日志文件
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log

# 3. 清理旧备份
find ./backups -type f -mtime +30 -delete
```

---

**注意**：在生产环境中部署前，请务必：

- 修改所有默认密码
- 配置 SSL/TLS 证书
- 设置防火墙规则
- 启用监控和日志
- 制定备份策略
