# Yun AI TodoList API 文档

## 📖 概述

Yun AI TodoList
API 是一个功能完整的智能 Todo 管理应用后端服务，提供用户认证、Todo 管理、搜索服务和用户设置等核心功能。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6.0 (可选，用于缓存)

### 安装和运行

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 运行数据库迁移
pnpm migration:run

# 启动开发服务器
pnpm dev
```

### API 文档

启动服务后，访问
[http://localhost:3000/api/docs](http://localhost:3000/api/docs)
查看完整的 Swagger API 文档。

## 🔐 认证

API 使用 JWT (JSON Web Token) 进行认证。

### 获取访问令牌

```bash
# 注册新用户
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "password123"
  }'

# 用户登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 使用访问令牌

在请求头中添加 Authorization 字段：

```bash
curl -X GET http://localhost:3000/api/v1/todos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📝 API 端点

### 认证相关

| 方法 | 端点             | 描述             |
| ---- | ---------------- | ---------------- |
| POST | `/auth/register` | 用户注册         |
| POST | `/auth/login`    | 用户登录         |
| POST | `/auth/logout`   | 用户登出         |
| POST | `/auth/refresh`  | 刷新访问令牌     |
| GET  | `/auth/profile`  | 获取当前用户信息 |

### Todo 管理

| 方法   | 端点                   | 描述               |
| ------ | ---------------------- | ------------------ |
| GET    | `/todos`               | 获取 Todo 列表     |
| POST   | `/todos`               | 创建新 Todo        |
| GET    | `/todos/:id`           | 获取单个 Todo      |
| PATCH  | `/todos/:id`           | 更新 Todo          |
| DELETE | `/todos/:id`           | 删除 Todo          |
| GET    | `/todos/stats`         | 获取 Todo 统计信息 |
| POST   | `/todos/reorder`       | 重新排序 Todo      |
| POST   | `/todos/batch-analyze` | 批量 AI 分析       |

### 搜索服务

| 方法   | 端点                  | 描述             |
| ------ | --------------------- | ---------------- |
| POST   | `/search`             | 执行搜索         |
| GET    | `/search/history`     | 获取搜索历史     |
| DELETE | `/search/history/:id` | 删除搜索历史记录 |
| DELETE | `/search/history`     | 清空搜索历史     |
| GET    | `/search/stats`       | 获取搜索统计信息 |

### 用户设置

| 方法 | 端点                           | 描述             |
| ---- | ------------------------------ | ---------------- |
| GET  | `/settings/preferences`        | 获取用户偏好设置 |
| PUT  | `/settings/preferences`        | 更新用户偏好设置 |
| POST | `/settings/preferences/reset`  | 重置偏好设置     |
| GET  | `/settings/preferences/export` | 导出偏好设置     |
| POST | `/settings/preferences/import` | 导入偏好设置     |

## 📊 数据格式

### Todo 对象

```json
{
  "id": "clx1234567890",
  "title": "完成项目文档",
  "description": "编写项目的技术文档和用户手册",
  "completed": false,
  "completedAt": null,
  "tags": ["工作", "文档"],
  "priority": 3,
  "estimatedTime": "2小时",
  "aiAnalyzed": true,
  "dueDate": "2024-12-31T23:59:59.000Z",
  "order": 1,
  "userId": "user123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 用户偏好设置

```json
{
  "theme": "auto",
  "language": "zh-CN",
  "aiConfig": {
    "enabled": true,
    "autoAnalyze": true,
    "priorityAnalysis": true,
    "timeEstimation": true,
    "modelConfig": {
      "model": "deepseek-chat",
      "temperature": 0.3,
      "maxTokens": 1000
    }
  },
  "searchConfig": {
    "defaultLanguage": "zh-CN",
    "safeSearch": true,
    "defaultResultCount": 10,
    "saveHistory": true,
    "engineConfig": {
      "engine": "google",
      "region": "CN"
    }
  },
  "notifications": {
    "desktop": true,
    "email": false,
    "dueReminder": true,
    "reminderMinutes": 30
  }
}
```

## 🔍 查询参数

### Todo 列表查询

- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `search`: 搜索关键词
- `type`: 过滤类型 (`all`, `active`, `completed`, `overdue`, `today`, `week`)
- `tags`: 标签过滤 (逗号分隔)
- `priority`: 优先级过滤 (逗号分隔)
- `sortBy`: 排序字段 (`createdAt`, `title`, `priority`, `dueDate`, `order`)
- `sortOrder`: 排序方向 (`asc`, `desc`)
- `includeStats`: 是否包含统计信息 (默认: true)

### 搜索历史查询

- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `search`: 搜索关键词过滤
- `dateFrom`: 开始日期
- `dateTo`: 结束日期

## ❌ 错误处理

API 使用标准的 HTTP 状态码和统一的错误响应格式：

```json
{
  "statusCode": 400,
  "message": "请求参数错误",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/todos"
}
```

### 常见状态码

- `200`: 成功
- `201`: 创建成功
- `204`: 删除成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 禁止访问
- `404`: 资源不存在
- `409`: 数据冲突
- `422`: 数据验证失败
- `429`: 请求过于频繁
- `500`: 服务器内部错误

## 🧪 测试

```bash
# 运行单元测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e

# 运行所有测试
pnpm test:all

# 生成测试覆盖率报告
pnpm test:ci
```

## 📈 性能和限制

- 请求频率限制：每分钟 100 次请求
- 文件上传大小限制：10MB
- 查询结果分页：最大每页 100 条记录
- JWT 令牌有效期：1 小时
- 刷新令牌有效期：7 天

## 🔗 相关链接

- [Swagger API 文档](http://localhost:3000/api/docs)
- [健康检查](http://localhost:3000/api/v1/health)
- [GitHub 仓库](https://github.com/xixixiaoyu/todo)
- [前端应用](http://localhost:5173)
