# Docker 容器化部署指南

## 📖 概述

本文档介绍如何使用 Docker 和 Docker Compose 部署 Yun AI TodoList 应用。

## 🏗️ 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Backend       │    │   PostgreSQL    │
│   (前端 + 代理)  │◄──►│   (NestJS API)  │◄──►│   (数据库)      │
│   Port: 80/443  │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │    (缓存)       │
                       │   Port: 6379    │
                       └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- Docker >= 20.10.0
- Docker Compose >= 2.0.0
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

### 1. 克隆项目

```bash
git clone https://github.com/xixixiaoyu/todo.git
cd todo
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

### 3. 启动服务

#### 开发环境

```bash
# 使用脚本启动
./scripts/docker-build.sh start dev

# 或直接使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

#### 生产环境

```bash
# 构建镜像
./scripts/docker-build.sh build

# 启动生产环境
./scripts/docker-build.sh start prod

# 或直接使用 docker-compose
docker-compose up -d
```

## 📋 服务说明

### 开发环境服务

| 服务名       | 端口 | 描述              |
| ------------ | ---- | ----------------- |
| postgres-dev | 5433 | PostgreSQL 数据库 |
| redis-dev    | 6380 | Redis 缓存        |
| adminer      | 8080 | 数据库管理工具    |

### 生产环境服务

| 服务名   | 端口   | 描述              |
| -------- | ------ | ----------------- |
| postgres | 5432   | PostgreSQL 数据库 |
| redis    | 6379   | Redis 缓存        |
| backend  | 3000   | 后端 API 服务     |
| frontend | 80/443 | 前端应用 + Nginx  |

## 🔧 管理命令

### 使用管理脚本

```bash
# 构建镜像
./scripts/docker-build.sh build

# 启动开发环境
./scripts/docker-build.sh start dev

# 启动生产环境
./scripts/docker-build.sh start prod

# 停止服务
./scripts/docker-build.sh stop dev

# 重启服务
./scripts/docker-build.sh restart prod

# 查看日志
./scripts/docker-build.sh logs backend dev

# 清理资源
./scripts/docker-build.sh cleanup
```

### 直接使用 Docker Compose

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f

# 生产环境
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 📊 监控和日志

### 查看服务状态

```bash
# 查看所有容器状态
docker ps

# 查看特定服务状态
docker-compose ps

# 查看服务健康状态
docker-compose ps --services --filter "status=running"
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 查看最近的日志
docker-compose logs --tail=100 backend
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入数据库容器
docker-compose exec postgres psql -U postgres -d yun_ai_todolist
```

## 🗄️ 数据管理

### 数据库操作

```bash
# 运行数据库迁移
docker-compose exec backend pnpm prisma migrate deploy

# 重置数据库
docker-compose exec backend pnpm prisma migrate reset

# 查看数据库状态
docker-compose exec backend pnpm prisma migrate status
```

### 数据备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres yun_ai_todolist > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres yun_ai_todolist < backup.sql
```

### 数据卷管理

```bash
# 查看数据卷
docker volume ls | grep yun-todolist

# 备份数据卷
docker run --rm -v yun-todolist-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v yun-todolist-postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## 🔒 安全配置

### 生产环境安全检查

1. **更改默认密码**

   ```bash
   # 数据库密码
   POSTGRES_PASSWORD=your-strong-password

   # Redis 密码
   REDIS_PASSWORD=your-redis-password

   # JWT 密钥
   JWT_SECRET=your-super-secret-jwt-key
   ```

2. **配置 HTTPS**

   - 将 SSL 证书放在 `nginx/ssl/` 目录
   - 取消注释 `nginx/nginx.conf` 中的 HTTPS 配置

3. **网络安全**
   ```bash
   # 只暴露必要端口
   # 使用防火墙限制访问
   # 定期更新镜像
   ```

## 🚨 故障排除

### 常见问题

1. **容器启动失败**

   ```bash
   # 查看详细错误信息
   docker-compose logs service-name

   # 检查端口占用
   netstat -tulpn | grep :3000
   ```

2. **数据库连接失败**

   ```bash
   # 检查数据库容器状态
   docker-compose ps postgres

   # 测试数据库连接
   docker-compose exec backend pnpm prisma db push
   ```

3. **内存不足**

   ```bash
   # 查看容器资源使用
   docker stats

   # 清理未使用的镜像
   docker image prune -f
   ```

### 性能优化

1. **调整资源限制**

   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

2. **优化数据库配置**
   ```yaml
   postgres:
     environment:
       POSTGRES_SHARED_PRELOAD_LIBRARIES: pg_stat_statements
       POSTGRES_MAX_CONNECTIONS: 100
   ```

## 📈 扩展部署

### 水平扩展

```bash
# 扩展后端服务
docker-compose up -d --scale backend=3

# 使用负载均衡器
# 配置 Nginx upstream
```

### 集群部署

```bash
# 使用 Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml yun-todolist
```

## 🔗 相关链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目 GitHub 仓库](https://github.com/xixixiaoyu/todo)
