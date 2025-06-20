# 数据库设计方案：高性能数据架构

## 技术概述

本项目采用 PostgreSQL + Prisma ORM +
Redis 缓存的数据架构，实现了高性能、高可用的数据存储方案，支持复杂查询、事务处理、数据缓存和实时同步。

## 🗄️ 数据库架构设计

### 核心技术栈

- **PostgreSQL 15+**：主数据库，支持 JSONB、全文搜索、分区表
- **Prisma ORM**：类型安全的数据库访问层
- **Redis 7+**：缓存层，支持数据结构、发布订阅
- **连接池**：PgBouncer 连接池管理

### 数据库 Schema 设计

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [uuid_ossp, pg_trgm, btree_gin]
}

// 用户表
model User {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)
  name      String   @db.VarChar(100)
  avatar    String?  @db.Text
  role      Role     @default(USER)

  // 用户偏好设置
  preferences Json @default("{}") @db.JsonB

  // 安全相关
  emailVerified      Boolean   @default(false)
  emailVerifiedAt    DateTime?
  passwordChangedAt  DateTime?
  lastLoginAt        DateTime?
  lastLoginIp        String?   @db.Inet
  lastLoginUserAgent String?   @db.Text
  isActive           Boolean   @default(true)
  forcePasswordChange Boolean  @default(false)

  // 注册信息
  registrationIp        String?  @db.Inet
  registrationUserAgent String?  @db.Text

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联关系
  todos         Todo[]
  searchHistory SearchHistory[]
  userSettings  UserSettings?
  todoHistory   TodoHistory[]
  aiUsageStats  AIUsageStats[]
  securityLogs  SecurityLog[]

  // 索引
  @@index([email])
  @@index([lastLoginAt])
  @@index([createdAt])
  @@map("users")
}

// 角色枚举
enum Role {
  ADMIN
  USER
  MODERATOR

  @@map("role")
}

// 待办事项表
model Todo {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  title       String   @db.VarChar(200)
  description String?  @db.Text
  completed   Boolean  @default(false)
  priority    Priority @default(MEDIUM)

  // 时间管理
  estimatedTime Int?     // 预估时间（分钟）
  actualTime    Int?     // 实际时间（分钟）
  dueDate       DateTime?
  completedAt   DateTime?

  // AI 相关
  aiAnalyzed    Boolean @default(false)
  aiSuggestions Json?   @db.JsonB
  aiTags        String[] @db.VarChar(50)

  // 分类和标签
  category String?   @db.VarChar(50)
  tags     String[] @db.VarChar(50)

  // 附件和链接
  attachments Json? @db.JsonB
  links       Json? @db.JsonB

  // 位置信息
  location Json? @db.JsonB

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联关系
  userId      String       @db.Uuid
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  todoHistory TodoHistory[]

  // 全文搜索
  @@index([title, description], type: Gin)
  @@index([userId, completed])
  @@index([userId, priority])
  @@index([userId, dueDate])
  @@index([userId, createdAt])
  @@index([aiTags], type: Gin)
  @@index([tags], type: Gin)
  @@map("todos")
}

// 优先级枚举
enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT

  @@map("priority")
}

// 用户设置表
model UserSettings {
  id     String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId String @unique @db.Uuid

  // 主题设置
  theme          String  @default("light") @db.VarChar(20)
  language       String  @default("zh-CN") @db.VarChar(10)
  timezone       String  @default("Asia/Shanghai") @db.VarChar(50)
  dateFormat     String  @default("YYYY-MM-DD") @db.VarChar(20)
  timeFormat     String  @default("HH:mm") @db.VarChar(10)

  // AI 设置
  aiEnabled      Boolean @default(true)
  aiModel        String  @default("deepseek-chat") @db.VarChar(50)
  aiApiKey       String? @db.Text // 加密存储
  aiSystemPrompt String? @db.Text

  // 搜索设置
  searchEnabled     Boolean @default(true)
  searchEngine      String  @default("google") @db.VarChar(20)
  searchApiKey      String? @db.Text // 加密存储
  searchResultLimit Int     @default(10)

  // 通知设置
  notifications Json @default("{}") @db.JsonB

  // 隐私设置
  dataRetention Json @default("{}") @db.JsonB

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联关系
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

// 搜索历史表
model SearchHistory {
  id       String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId   String @db.Uuid
  query    String @db.VarChar(500)
  results  Json?  @db.JsonB
  source   String @db.VarChar(20) // 'ai' | 'google' | 'local'

  // 统计信息
  resultCount Int @default(0)
  clickCount  Int @default(0)

  // 时间戳
  createdAt DateTime @default(now())

  // 关联关系
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 索引
  @@index([userId, createdAt])
  @@index([query], type: Gin)
  @@map("search_history")
}

// 待办历史表（用于版本控制和审计）
model TodoHistory {
  id       String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  todoId   String @db.Uuid
  userId   String @db.Uuid
  action   String @db.VarChar(20) // 'created', 'updated', 'deleted', 'completed'

  // 变更前后的数据
  oldData Json? @db.JsonB
  newData Json? @db.JsonB
  changes Json? @db.JsonB // 具体变更字段

  // 操作信息
  ip        String? @db.Inet
  userAgent String? @db.Text

  // 时间戳
  createdAt DateTime @default(now())

  // 关联关系
  todo Todo @relation(fields: [todoId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 索引
  @@index([todoId, createdAt])
  @@index([userId, createdAt])
  @@index([action])
  @@map("todo_history")
}

// AI 使用统计表
model AIUsageStats {
  id     String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId String @db.Uuid

  // 使用统计
  requestCount    Int @default(0)
  tokenUsed       Int @default(0)
  successCount    Int @default(0)
  errorCount      Int @default(0)

  // 功能使用统计
  chatUsage        Int @default(0)
  suggestionUsage  Int @default(0)
  analysisUsage    Int @default(0)

  // 成本统计
  estimatedCost Float @default(0.0) @db.DoublePrecision

  // 统计周期
  date DateTime @db.Date

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联关系
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 唯一约束
  @@unique([userId, date])
  @@index([date])
  @@map("ai_usage_stats")
}

// 安全日志表
model SecurityLog {
  id     String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId String? @db.Uuid

  // 事件信息
  eventType String @db.VarChar(50)
  severity  String @db.VarChar(20) // 'low', 'medium', 'high', 'critical'
  message   String @db.Text
  details   Json?  @db.JsonB

  // 请求信息
  ip        String? @db.Inet
  userAgent String? @db.Text
  endpoint  String? @db.VarChar(200)
  method    String? @db.VarChar(10)

  // 状态
  resolved   Boolean   @default(false)
  resolvedAt DateTime?
  resolvedBy String?   @db.Uuid

  // 时间戳
  createdAt DateTime @default(now())

  // 关联关系
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  // 索引
  @@index([eventType, createdAt])
  @@index([severity, resolved])
  @@index([ip, createdAt])
  @@index([userId, createdAt])
  @@map("security_logs")
}

// 系统配置表
model SystemConfig {
  id    String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  key   String @unique @db.VarChar(100)
  value Json   @db.JsonB

  // 配置元信息
  description String?  @db.Text
  category    String?  @db.VarChar(50)
  isPublic    Boolean  @default(false)
  isEditable  Boolean  @default(true)

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@map("system_config")
}
```

## 🚀 数据库优化策略

### 索引优化

```sql
-- 复合索引优化
CREATE INDEX CONCURRENTLY idx_todos_user_status_priority
ON todos (user_id, completed, priority, created_at DESC);

-- 部分索引（只索引未完成的待办）
CREATE INDEX CONCURRENTLY idx_todos_incomplete
ON todos (user_id, due_date)
WHERE completed = false;

-- 表达式索引（用于搜索）
CREATE INDEX CONCURRENTLY idx_todos_search
ON todos USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- JSONB 索引
CREATE INDEX CONCURRENTLY idx_user_preferences
ON users USING gin(preferences);

-- 数组索引
CREATE INDEX CONCURRENTLY idx_todos_tags
ON todos USING gin(tags);
```

### 分区表设计

```sql
-- 按时间分区的日志表
CREATE TABLE security_logs_partitioned (
  LIKE security_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE security_logs_2024_01 PARTITION OF security_logs_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE security_logs_2024_02 PARTITION OF security_logs_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 自动分区管理函数
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
  partition_name text;
  end_date date;
BEGIN
  partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
  end_date := start_date + interval '1 month';

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                  FOR VALUES FROM (%L) TO (%L)',
                 partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

### 查询优化

```typescript
// apps/backend/src/database/database.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
      errorFormat: 'pretty',
    })

    // 查询日志记录
    this.$on('query', (e) => {
      if (e.duration > 1000) {
        // 记录慢查询
        console.warn(`Slow query detected: ${e.duration}ms`, {
          query: e.query,
          params: e.params,
        })
      }
    })
  }

  async onModuleInit() {
    await this.$connect()

    // 数据库连接池配置
    await this.$executeRaw`SET statement_timeout = '30s'`
    await this.$executeRaw`SET lock_timeout = '10s'`
    await this.$executeRaw`SET idle_in_transaction_session_timeout = '60s'`
  }

  // 批量操作优化
  async batchCreateTodos(todos: any[], userId: string) {
    return this.$transaction(async (tx) => {
      const results = []

      // 分批处理，避免单次事务过大
      const batchSize = 100
      for (let i = 0; i < todos.length; i += batchSize) {
        const batch = todos.slice(i, i + batchSize)
        const batchResults = await tx.todo.createMany({
          data: batch.map((todo) => ({ ...todo, userId })),
          skipDuplicates: true,
        })
        results.push(batchResults)
      }

      return results
    })
  }

  // 复杂查询优化
  async getTodoStatistics(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const whereClause = {
      userId,
      ...(dateRange && {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }),
    }

    // 使用原生 SQL 进行复杂统计
    const stats = await this.$queryRaw`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed = true) as completed,
        COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority,
        COUNT(*) FILTER (WHERE priority = 'URGENT') as urgent,
        AVG(CASE WHEN completed = true AND actual_time IS NOT NULL 
            THEN actual_time END) as avg_completion_time,
        COUNT(DISTINCT category) as categories_count
      FROM todos 
      WHERE user_id = ${userId}
        ${dateRange ? Prisma.sql`AND created_at BETWEEN ${dateRange.start} AND ${dateRange.end}` : Prisma.empty}
    `

    return stats[0]
  }

  // 全文搜索优化
  async searchTodos(
    userId: string,
    query: string,
    options: {
      limit?: number
      offset?: number
      filters?: any
    } = {}
  ) {
    const { limit = 20, offset = 0, filters = {} } = options

    return this.$queryRaw`
      SELECT 
        *,
        ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')), 
                plainto_tsquery('english', ${query})) as rank
      FROM todos
      WHERE user_id = ${userId}
        AND to_tsvector('english', title || ' ' || COALESCE(description, '')) 
            @@ plainto_tsquery('english', ${query})
        ${
          filters.completed !== undefined
            ? Prisma.sql`AND completed = ${filters.completed}`
            : Prisma.empty
        }
        ${
          filters.priority
            ? Prisma.sql`AND priority = ${filters.priority}`
            : Prisma.empty
        }
      ORDER BY rank DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  }

  // 数据归档
  async archiveOldData(retentionDays: number = 365) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    return this.$transaction(async (tx) => {
      // 归档旧的搜索历史
      const archivedSearchHistory = await tx.searchHistory.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      })

      // 归档旧的安全日志
      const archivedSecurityLogs = await tx.securityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          resolved: true,
        },
      })

      return {
        searchHistoryArchived: archivedSearchHistory.count,
        securityLogsArchived: archivedSecurityLogs.count,
      }
    })
  }
}
```

## 📊 缓存策略

### Redis 缓存服务

```typescript
// apps/backend/src/cache/cache.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class CacheService implements OnModuleInit {
  private redis: Redis
  private readonly defaultTTL = 3600 // 1小时

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService
  ) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,

      // 连接池配置
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,

      // 重连策略
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    // 连接事件监听
    this.redis.on('connect', () => {
      console.log('Redis connected')
    })

    this.redis.on('error', (err) => {
      console.error('Redis error:', err)
    })

    await this.redis.connect()
  }

  // 基础缓存操作
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  async increment(key: string, value: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, value)
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error)
      return 0
    }
  }

  // 缓存模式实现

  // Cache-Aside 模式
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // 先从缓存获取
    let value = await this.get<T>(key)

    if (value === null) {
      // 缓存未命中，从数据源获取
      value = await fetcher()

      // 写入缓存
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl)
      }
    }

    return value
  }

  // Write-Through 模式
  async setWithWriteThrough<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    // 同时写入缓存和数据库
    await Promise.all([this.set(key, value, ttl), writer(value)])
  }

  // Write-Behind 模式
  async setWithWriteBehind<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    // 先写入缓存
    await this.set(key, value, ttl)

    // 异步写入数据库
    setImmediate(async () => {
      try {
        await writer(value)
      } catch (error) {
        console.error('Write-behind error:', error)
        // 可以实现重试机制或死信队列
      }
    })
  }

  // 分布式锁
  async acquireLock(key: string, ttl: number = 30): Promise<string | null> {
    const lockKey = `lock:${key}`
    const lockValue = `${Date.now()}-${Math.random()}`

    const result = await this.redis.set(lockKey, lockValue, 'EX', ttl, 'NX')
    return result === 'OK' ? lockValue : null
  }

  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${key}`

    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `

    const result = await this.redis.eval(script, 1, lockKey, lockValue)
    return result === 1
  }

  // 缓存预热
  async warmupCache(userId: string): Promise<void> {
    try {
      // 预加载用户常用数据
      const [user, todos, settings] = await Promise.all([
        this.databaseService.user.findUnique({ where: { id: userId } }),
        this.databaseService.todo.findMany({
          where: { userId, completed: false },
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
        this.databaseService.userSettings.findUnique({ where: { userId } }),
      ])

      // 写入缓存
      await Promise.all([
        this.set(`user:${userId}`, user, 1800), // 30分钟
        this.set(`todos:${userId}:active`, todos, 900), // 15分钟
        this.set(`settings:${userId}`, settings, 3600), // 1小时
      ])
    } catch (error) {
      console.error('Cache warmup error:', error)
    }
  }

  // 缓存失效
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}`,
      `todos:${userId}:*`,
      `settings:${userId}`,
      `stats:${userId}:*`,
    ]

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } else {
        await this.del(pattern)
      }
    }
  }

  // 缓存统计
  async getCacheStats(): Promise<any> {
    const info = await this.redis.info('stats')
    const memory = await this.redis.info('memory')

    return {
      connections: await this.redis.info('clients'),
      stats: info,
      memory: memory,
      keyspace: await this.redis.info('keyspace'),
    }
  }
}
```

### 查询缓存装饰器

```typescript
// apps/backend/src/cache/cache.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const CACHE_KEY = 'cache_key'
export const CACHE_TTL = 'cache_ttl'

export const Cacheable = (key: string, ttl: number = 3600) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    SetMetadata(CACHE_KEY, key)(target, propertyName, descriptor)
    SetMetadata(CACHE_TTL, ttl)(target, propertyName, descriptor)

    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService
      if (!cacheService) {
        return method.apply(this, args)
      }

      // 生成缓存键
      const cacheKey = key.replace(/\{(\d+)\}/g, (match, index) => {
        return args[parseInt(index)] || match
      })

      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // 执行原方法
      const result = await method.apply(this, args)

      // 写入缓存
      if (result !== null && result !== undefined) {
        await cacheService.set(cacheKey, result, ttl)
      }

      return result
    }

    return descriptor
  }
}

// 使用示例
export class TodosService {
  constructor(private cacheService: CacheService) {}

  @Cacheable('todos:user:{0}:active', 900) // 15分钟缓存
  async getActiveTodos(userId: string) {
    return this.databaseService.todo.findMany({
      where: { userId, completed: false },
      orderBy: { createdAt: 'desc' },
    })
  }

  @Cacheable('stats:user:{0}:daily', 1800) // 30分钟缓存
  async getDailyStats(userId: string) {
    return this.databaseService.getTodoStatistics(userId, {
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999)),
    })
  }
}
```

## 🔄 数据同步与备份

### 数据备份策略

```typescript
// apps/backend/src/database/backup.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

const execAsync = promisify(exec)

@Injectable()
export class BackupService {
  private readonly backupDir: string
  private readonly encryptionKey: string

  constructor(private configService: ConfigService) {
    this.backupDir = this.configService.get('BACKUP_DIR', './backups')
    this.encryptionKey = this.configService.get('BACKUP_ENCRYPTION_KEY')
  }

  // 全量备份
  async createFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(this.backupDir, `full-backup-${timestamp}.sql`)
    const encryptedFile = `${backupFile}.enc`

    try {
      // 确保备份目录存在
      await fs.mkdir(this.backupDir, { recursive: true })

      // 执行 pg_dump
      const databaseUrl = this.configService.get('DATABASE_URL')
      const command = `pg_dump "${databaseUrl}" --no-password --verbose --clean --no-acl --no-owner -f "${backupFile}"`

      await execAsync(command)

      // 加密备份文件
      await this.encryptFile(backupFile, encryptedFile)

      // 删除未加密文件
      await fs.unlink(backupFile)

      // 验证备份文件
      const stats = await fs.stat(encryptedFile)
      if (stats.size === 0) {
        throw new Error('备份文件为空')
      }

      console.log(`Full backup created: ${encryptedFile} (${stats.size} bytes)`)
      return encryptedFile
    } catch (error) {
      console.error('Full backup failed:', error)
      throw error
    }
  }

  // 增量备份（基于 WAL）
  async createIncrementalBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(
      this.backupDir,
      `incremental-backup-${timestamp}.tar.gz`
    )

    try {
      // 使用 pg_basebackup 创建增量备份
      const command = `pg_basebackup -D "${backupFile}" -Ft -z -P -v`
      await execAsync(command)

      console.log(`Incremental backup created: ${backupFile}`)
      return backupFile
    } catch (error) {
      console.error('Incremental backup failed:', error)
      throw error
    }
  }

  // 数据导出
  async exportUserData(userId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const exportFile = path.join(
      this.backupDir,
      `user-export-${userId}-${timestamp}.json`
    )

    try {
      // 导出用户相关数据
      const userData = await this.databaseService.$transaction(async (tx) => {
        const [user, todos, settings, searchHistory] = await Promise.all([
          tx.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              preferences: true,
              createdAt: true,
            },
          }),
          tx.todo.findMany({ where: { userId } }),
          tx.userSettings.findUnique({ where: { userId } }),
          tx.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 1000, // 限制导出数量
          }),
        ])

        return { user, todos, settings, searchHistory }
      })

      // 写入文件
      await fs.writeFile(exportFile, JSON.stringify(userData, null, 2))

      console.log(`User data exported: ${exportFile}`)
      return exportFile
    } catch (error) {
      console.error('User data export failed:', error)
      throw error
    }
  }

  // 备份恢复
  async restoreBackup(backupFile: string): Promise<void> {
    try {
      let sqlFile = backupFile

      // 如果是加密文件，先解密
      if (backupFile.endsWith('.enc')) {
        sqlFile = backupFile.replace('.enc', '')
        await this.decryptFile(backupFile, sqlFile)
      }

      // 执行恢复
      const databaseUrl = this.configService.get('DATABASE_URL')
      const command = `psql "${databaseUrl}" -f "${sqlFile}"`

      await execAsync(command)

      // 清理临时文件
      if (sqlFile !== backupFile) {
        await fs.unlink(sqlFile)
      }

      console.log(`Backup restored from: ${backupFile}`)
    } catch (error) {
      console.error('Backup restore failed:', error)
      throw error
    }
  }

  // 清理旧备份
  async cleanupOldBackups(retentionDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      for (const file of files) {
        const filePath = path.join(this.backupDir, file)
        const stats = await fs.stat(filePath)

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath)
          console.log(`Deleted old backup: ${file}`)
        }
      }
    } catch (error) {
      console.error('Backup cleanup failed:', error)
    }
  }

  // 文件加密
  private async encryptFile(
    inputFile: string,
    outputFile: string
  ): Promise<void> {
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32)
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipher(algorithm, key)
    cipher.setAAD(Buffer.from('backup', 'utf8'))

    const input = await fs.readFile(inputFile)
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()])
    const tag = cipher.getAuthTag()

    // 组合 IV + Tag + 加密数据
    const output = Buffer.concat([iv, tag, encrypted])
    await fs.writeFile(outputFile, output)
  }

  // 文件解密
  private async decryptFile(
    inputFile: string,
    outputFile: string
  ): Promise<void> {
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32)

    const input = await fs.readFile(inputFile)
    const iv = input.slice(0, 16)
    const tag = input.slice(16, 32)
    const encrypted = input.slice(32)

    const decipher = crypto.createDecipher(algorithm, key)
    decipher.setAAD(Buffer.from('backup', 'utf8'))
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])
    await fs.writeFile(outputFile, decrypted)
  }
}
```

## 🎯 核心学习要点

### 1. 数据库设计

- **Schema 设计**：规范化与反规范化平衡
- **索引策略**：复合索引、部分索引、表达式索引
- **分区表**：时间分区、范围分区
- **约束设计**：外键、唯一约束、检查约束

### 2. 查询优化

- **SQL 优化**：执行计划分析、慢查询优化
- **ORM 优化**：N+1 问题解决、批量操作
- **全文搜索**：PostgreSQL FTS、搜索排序
- **分页优化**：游标分页、偏移分页

### 3. 缓存架构

- **缓存模式**：Cache-Aside、Write-Through、Write-Behind
- **缓存策略**：TTL 设置、缓存预热、缓存失效
- **分布式缓存**：Redis 集群、一致性哈希
- **缓存监控**：命中率、性能指标

### 4. 数据安全

- **备份策略**：全量备份、增量备份、实时备份
- **数据加密**：静态加密、传输加密
- **访问控制**：行级安全、列级权限
- **审计日志**：操作记录、变更追踪

### 5. 性能监控

- **数据库监控**：连接池、慢查询、锁等待
- **缓存监控**：内存使用、命中率、延迟
- **容量规划**：存储增长、性能预测
- **故障恢复**：主从切换、数据恢复

## 📝 简历技术亮点

### 数据库架构亮点

- **PostgreSQL 高级特性**：JSONB、全文搜索、分区表
- **Prisma ORM 优化**：类型安全、查询优化、事务管理
- **索引优化策略**：复合索引、部分索引、GIN 索引
- **分区表设计**：时间分区、自动分区管理

### 缓存架构亮点

- **Redis 缓存策略**：多种缓存模式实现
- **分布式锁**：Redis 分布式锁机制
- **缓存装饰器**：AOP 缓存抽象
- **缓存预热**：智能缓存预加载

### 数据安全亮点

- **自动备份系统**：全量+增量备份策略
- **数据加密**：备份文件加密保护
- **数据导出**：GDPR 合规数据导出
- **故障恢复**：自动化恢复流程
