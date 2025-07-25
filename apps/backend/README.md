# Yun AI TodoList Backend

## 📖 概述

这是 Yun AI TodoList 应用的后端服务，基于 NestJS + TypeScript + Prisma +
PostgreSQL 构建的现代化 RESTful API。

## 🚀 特性

### 🔐 认证系统

- JWT 令牌认证
- 用户注册和登录
- 自动令牌刷新
- 安全的用户会话管理

### 📝 Todo 管理

- 完整的 CRUD 操作
- 智能优先级分析
- 时间估算功能
- 拖拽排序支持
- 标签和分类管理
- 到期日期提醒

### 🔍 搜索服务

- 实时网络搜索
- 搜索历史管理
- 智能搜索建议
- 搜索统计分析

### ⚙️ 用户设置

- 个性化偏好配置
- 主题和语言设置
- AI 分析配置
- 通知设置管理

## 🛠️ 技术栈

- **框架**: NestJS 10.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL 13+
- **ORM**: Prisma 6.x
- **缓存**: Redis 6.0+ (可选)
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **测试**: Jest + Supertest
- **包管理**: pnpm

## 📦 安装和运行

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6.0 (可选)
- pnpm >= 9.0.0

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量模板：

```bash
cp .env.example .env
```

配置环境变量：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/yun_ai_todolist"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_REFRESH_EXPIRES_IN="7d"

# 应用配置
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# 密码加密
BCRYPT_ROUNDS=12

# Redis 配置 (可选)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
```

### 数据库设置

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 运行数据库迁移
pnpm migration:run

# (可选) 填充测试数据
pnpm db:seed
```

### 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start:prod
```

## 📚 API 文档

启动服务后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:3000/api/docs
- **健康检查**: http://localhost:3000/api/v1/health
- **应用信息**: http://localhost:3000/api/v1

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

# 监听模式运行测试
pnpm test:watch
pnpm test:e2e:watch
```

## 📁 项目结构

```
src/
├── app.module.ts           # 应用主模块
├── main.ts                 # 应用入口文件
├── auth/                   # 认证模块
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/               # 数据传输对象
│   ├── guards/            # 认证守卫
│   └── strategies/        # Passport 策略
├── users/                  # 用户模块
├── todos/                  # Todo 模块
├── search/                 # 搜索模块
├── settings/               # 设置模块
├── common/                 # 公共模块
│   ├── decorators/        # 装饰器
│   ├── filters/           # 异常过滤器
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   ├── pipes/             # 管道
│   └── services/          # 公共服务
├── database/              # 数据库模块
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── config/                # 配置模块
```

## 🔧 开发工具

### 数据库管理

```bash
# 查看数据库
pnpm db:studio

# 重置数据库
pnpm migration:revert

# 生成新迁移
pnpm migration:generate "migration_name"
```

### 代码质量

```bash
# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 修复代码问题
pnpm lint:fix

# 类型检查
pnpm type-check
```

## 🚀 部署

### Docker 部署

```bash
# 在项目根目录构建后端镜像
cd ../../  # 回到项目根目录
docker build -t yun-ai-todolist-backend --target backend .

# 运行容器
docker run -p 3000:3000 yun-ai-todolist-backend

# 或者使用 docker-compose 启动完整开发环境
docker-compose up -d
```

### 生产环境配置

1. 设置环境变量
2. 配置数据库连接
3. 运行数据库迁移
4. 启动应用服务

## 📈 性能和限制

- 请求频率限制：每分钟 100 次请求
- 文件上传大小限制：10MB
- 查询结果分页：最大每页 100 条记录
- JWT 令牌有效期：1 小时
- 刷新令牌有效期：7 天

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 GPL-3.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [前端应用](../frontend)
- [共享类型](../shared)
- [API 文档](./docs/API.md)
- [GitHub 仓库](https://github.com/xixixiaoyu/todo)
