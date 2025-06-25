# 🚀 Docker 快速启动指南

## 📋 核心命令

| 命令                | 说明             | 适用场景             |
| ------------------- | ---------------- | -------------------- |
| `pnpm docker:basic` | 仅启动基础服务   | 前端开发，需要数据库 |
| `pnpm docker:dev`   | 启动完整开发环境 | 全栈开发             |
| `pnpm docker:prod`  | 部署生产环境     | 正式部署             |
| `pnpm docker:stop`  | 停止所有服务     | 停止开发环境         |
| `pnpm docker:logs`  | 查看服务日志     | 调试问题             |
| `pnpm docker:clean` | 清理环境         | 重置环境             |

## 🎯 推荐使用方式

### 1. 前端开发者（推荐）

```bash
# 启动基础服务（数据库 + 缓存 + 管理工具）
pnpm docker:basic

# 本地启动前端开发服务器
pnpm dev

# 访问应用: http://localhost:5173
# 访问数据库管理: http://localhost:8080
```

### 2. 全栈开发者

```bash
# 启动完整开发环境
pnpm docker:dev

# 访问前端: http://localhost:5173
# 访问后端: http://localhost:3000
# 访问数据库管理: http://localhost:8080
```

### 3. 生产部署

```bash
# 部署生产环境
pnpm docker:prod
```

## 🛠️ 常用操作

### 停止服务

```bash
# 停止所有 Docker 服务
pnpm docker:stop
```

### 查看日志

```bash
# 实时查看服务日志
pnpm docker:logs
```

### 清理环境

```bash
# 清理 Docker 环境（删除容器和卷）
pnpm docker:clean
```

### 重启服务

```bash
# 停止后重新启动
pnpm docker:stop
pnpm docker:dev  # 或 docker:basic
```

## 🔗 服务访问地址

| 服务       | 地址                  | 说明       |
| ---------- | --------------------- | ---------- |
| 前端应用   | http://localhost:5173 | Vue 3 应用 |
| 后端 API   | http://localhost:3000 | NestJS API |
| 数据库管理 | http://localhost:8080 | Adminer    |
| PostgreSQL | localhost:5433        | 数据库连接 |
| Redis      | localhost:6380        | 缓存连接   |

## 🔧 数据库连接信息

### Adminer 连接（推荐）

- 访问: http://localhost:8080
- 服务器: `postgres-dev`
- 用户名: `postgres`
- 密码: `postgres123`
- 数据库: `yun_ai_todolist_dev`

### 外部客户端连接

- 主机: `localhost`
- 端口: `5433`
- 用户名: `postgres`
- 密码: `postgres123`
- 数据库: `yun_ai_todolist_dev`

## 🚨 常见问题

### 端口冲突

如果遇到端口占用，检查以下端口：

- 5173 (前端)
- 3000 (后端)
- 5433 (PostgreSQL)
- 6380 (Redis)
- 8080 (Adminer)

### 数据库连接失败

1. 确保 Docker 服务正在运行
2. 检查端口是否正确（开发环境使用 5433）
3. 等待数据库完全启动（约 10-30 秒）

### 重置环境

如果遇到问题，可以完全重置：

```bash
pnpm docker:clean
pnpm docker:dev  # 重新启动
```

## 🎉 快速验证

启动服务后，检查状态：

```bash
# 查看容器状态
docker-compose -f docker-compose.dev.yml ps

# 测试数据库连接
docker exec -it yun-todolist-postgres-dev psql -U postgres -d yun_ai_todolist_dev -c "\dt"
```
