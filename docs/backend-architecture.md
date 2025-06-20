# NestJS 企业级后端架构设计

## 技术概述

本项目采用 NestJS 框架构建企业级后端服务，结合 Prisma
ORM、PostgreSQL、Redis 等技术，实现高性能、可扩展的 API 服务。

## 🏗️ 核心技术栈

### NestJS 框架架构

```typescript
// main.ts - 应用启动入口
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // CORS 配置
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })

  // Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('Yun AI TodoList API')
    .setDescription('AI-powered todo application API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(3000)
}

bootstrap()
```

### 模块化架构设计

```typescript
// app.module.ts - 根模块
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { CacheModule } from '@nestjs/cache-manager'
import { ScheduleModule } from '@nestjs/schedule'

import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { TodosModule } from './todos/todos.module'
import { UsersModule } from './users/users.module'
import { AIModule } from './ai/ai.module'

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 限流模块
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),

    // 缓存模块
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 业务模块
    PrismaModule,
    AuthModule,
    TodosModule,
    UsersModule,
    AIModule,
  ],
})
export class AppModule {}
```

## 🗄️ Prisma ORM 数据层

### Schema 设计

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  avatarUrl String?

  // 用户偏好设置
  theme         String  @default("light")
  language      String  @default("zh-CN")
  aiConfig      Json    @default("{}")
  searchConfig  Json    @default("{}")
  notifications Json    @default("{}")

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联关系
  todos         Todo[]
  searchHistory SearchHistory[]
  settings      UserSetting[]
  todoHistory   TodoHistory[]

  @@map("users")
}

model Todo {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  completedAt DateTime?

  // 优先级和 AI 分析
  priority      Int?
  estimatedTime String?
  aiAnalyzed    Boolean @default(false)
  aiSuggestions Json?

  // 分类和标签
  category String?
  tags     String[]

  // 时间管理
  dueDate   DateTime?
  reminders DateTime[]

  // 关联关系
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("todos")
  @@index([userId, completed])
  @@index([userId, dueDate])
}
```

### Prisma Service

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()

    // 数据库连接日志
    this.$on('query', (e) => {
      console.log('Query: ' + e.query)
      console.log('Duration: ' + e.duration + 'ms')
    })
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  // 软删除扩展
  async softDelete(model: string, where: any) {
    return this[model].update({
      where,
      data: {
        deletedAt: new Date(),
      },
    })
  }

  // 批量操作扩展
  async batchUpdate(model: string, data: any[]) {
    const operations = data.map((item) =>
      this[model].update({
        where: { id: item.id },
        data: item,
      })
    )

    return this.$transaction(operations)
  }
}
```

## 🔐 JWT 认证系统

### Auth Module

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

### JWT Strategy

```typescript
// auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../../users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    })
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub)

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    }
  }
}
```

### Auth Service

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { LoginDto, RegisterDto } from './dto'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto

    // 检查用户是否已存在
    const existingUser = await this.usersService.findByEmailOrUsername(
      email,
      username
    )
    if (existingUser) {
      throw new UnauthorizedException('用户已存在')
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
    })

    // 生成 JWT
    const payload = { sub: user.id, email: user.email }
    const accessToken = this.jwtService.sign(payload)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken,
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    // 验证用户
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    // 生成 JWT
    const payload = { sub: user.id, email: user.email }
    const accessToken = this.jwtService.sign(payload)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken,
    }
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    const payload = { sub: user.id, email: user.email }
    return {
      accessToken: this.jwtService.sign(payload),
    }
  }
}
```

## 📝 Todos 业务模块

### Todos Controller

```typescript
// todos/todos.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TodosService } from './todos.service'
import { CreateTodoDto, UpdateTodoDto, TodoQueryDto } from './dto'

@ApiTags('todos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Get()
  @ApiOperation({ summary: '获取待办事项列表' })
  async findAll(@Request() req, @Query() query: TodoQueryDto) {
    return this.todosService.findAll(req.user.id, query)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个待办事项' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.todosService.findOne(req.user.id, id)
  }

  @Post()
  @ApiOperation({ summary: '创建待办事项' })
  async create(@Request() req, @Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(req.user.id, createTodoDto)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新待办事项' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto
  ) {
    return this.todosService.update(req.user.id, id, updateTodoDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除待办事项' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.todosService.remove(req.user.id, id)
  }

  @Post('batch')
  @ApiOperation({ summary: '批量操作待办事项' })
  async batchOperation(@Request() req, @Body() batchDto: any) {
    return this.todosService.batchOperation(req.user.id, batchDto)
  }
}
```

### Todos Service

```typescript
// todos/todos.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTodoDto, UpdateTodoDto, TodoQueryDto } from './dto'
import { CacheService } from '../cache/cache.service'
import { AIService } from '../ai/ai.service'

@Injectable()
export class TodosService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private aiService: AIService
  ) {}

  async findAll(userId: string, query: TodoQueryDto) {
    const {
      page = 1,
      limit = 20,
      completed,
      category,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query

    // 构建查询条件
    const where: any = { userId }

    if (completed !== undefined) {
      where.completed = completed
    }

    if (category) {
      where.category = category
    }

    if (priority) {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 缓存键
    const cacheKey = `todos:${userId}:${JSON.stringify(query)}`

    // 尝试从缓存获取
    const cached = await this.cacheService.get(cacheKey)
    if (cached) {
      return cached
    }

    // 查询数据库
    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.todo.count({ where }),
    ])

    const result = {
      data: todos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }

    // 缓存结果
    await this.cacheService.set(cacheKey, result, 300) // 5分钟

    return result
  }

  async create(userId: string, createTodoDto: CreateTodoDto) {
    const { title, description, category, priority, dueDate, tags } =
      createTodoDto

    // AI 分析任务
    let aiAnalysis = null
    try {
      aiAnalysis = await this.aiService.analyzeTodo(title, description)
    } catch (error) {
      console.warn('AI 分析失败:', error.message)
    }

    const todo = await this.prisma.todo.create({
      data: {
        title,
        description,
        category,
        priority: priority || aiAnalysis?.priority || 2,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
        estimatedTime: aiAnalysis?.estimatedTime,
        aiSuggestions: aiAnalysis?.suggestions,
        aiAnalyzed: !!aiAnalysis,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    // 清除相关缓存
    await this.cacheService.deletePattern(`todos:${userId}:*`)

    return todo
  }

  async update(userId: string, id: string, updateTodoDto: UpdateTodoDto) {
    // 验证所有权
    const existingTodo = await this.findOne(userId, id)

    const todo = await this.prisma.todo.update({
      where: { id },
      data: {
        ...updateTodoDto,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    // 清除相关缓存
    await this.cacheService.deletePattern(`todos:${userId}:*`)

    return todo
  }

  async findOne(userId: string, id: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    if (!todo) {
      throw new NotFoundException('待办事项不存在')
    }

    return todo
  }

  async remove(userId: string, id: string) {
    // 验证所有权
    await this.findOne(userId, id)

    await this.prisma.todo.delete({
      where: { id },
    })

    // 清除相关缓存
    await this.cacheService.deletePattern(`todos:${userId}:*`)

    return { message: '删除成功' }
  }

  async batchOperation(userId: string, batchDto: any) {
    const { operation, todoIds, data } = batchDto

    // 验证所有待办事项都属于当前用户
    const todos = await this.prisma.todo.findMany({
      where: {
        id: { in: todoIds },
        userId,
      },
    })

    if (todos.length !== todoIds.length) {
      throw new ForbiddenException('部分待办事项不存在或无权限')
    }

    let result

    switch (operation) {
      case 'complete':
        result = await this.prisma.todo.updateMany({
          where: { id: { in: todoIds } },
          data: { completed: true, completedAt: new Date() },
        })
        break

      case 'delete':
        result = await this.prisma.todo.deleteMany({
          where: { id: { in: todoIds } },
        })
        break

      case 'update':
        result = await this.prisma.todo.updateMany({
          where: { id: { in: todoIds } },
          data,
        })
        break

      default:
        throw new BadRequestException('不支持的批量操作')
    }

    // 清除相关缓存
    await this.cacheService.deletePattern(`todos:${userId}:*`)

    return result
  }
}
```

## 🤖 AI 集成模块

### AI Service

```typescript
// ai/ai.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class AIService {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {
    this.apiKey = this.configService.get('DEEPSEEK_API_KEY')
    this.baseUrl = this.configService.get(
      'DEEPSEEK_BASE_URL',
      'https://api.deepseek.com'
    )
  }

  async analyzeTodo(title: string, description?: string) {
    const prompt = `
      请分析以下待办事项，并提供：
      1. 优先级评分 (1-5，5为最高)
      2. 预估完成时间
      3. 改进建议
      
      标题：${title}
      描述：${description || '无'}
      
      请以 JSON 格式返回结果：
      {
        "priority": 数字,
        "estimatedTime": "字符串",
        "suggestions": ["建议1", "建议2"]
      }
    `

    try {
      const response = await this.callAI(prompt)
      return this.parseAIResponse(response)
    } catch (error) {
      console.error('AI 分析失败:', error)
      return null
    }
  }

  async generateSuggestions(domain: string, userHistory?: string[]) {
    let prompt = `请为${domain}领域生成5个实用的待办事项建议。`

    if (userHistory && userHistory.length > 0) {
      prompt += `\n\n用户历史记录：\n${userHistory.slice(-10).join('\n')}`
      prompt += `\n\n请基于用户历史记录生成相关的建议。`
    }

    prompt += `\n\n请直接返回建议列表，每行一个建议，总共5个建议。`

    try {
      const response = await this.callAI(prompt)
      return this.parseSuggestions(response)
    } catch (error) {
      console.error('AI 建议生成失败:', error)
      throw new HttpException(
        'AI 服务暂时不可用',
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  private async callAI(prompt: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )
    )

    return response.data.choices[0].message.content
  }

  private parseAIResponse(response: string) {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // 如果没有 JSON，尝试解析文本
      return this.parseTextResponse(response)
    } catch (error) {
      console.error('AI 响应解析失败:', error)
      return null
    }
  }

  private parseSuggestions(response: string): string[] {
    return response
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((suggestion) => suggestion.length > 0)
      .slice(0, 5)
  }
}
```

## 📊 缓存策略

### Cache Service

```typescript
// cache/cache.service.ts
import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key)
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl)
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    // Redis 模式删除
    const keys = await this.getKeys(pattern)
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.del(key)))
    }
  }

  private async getKeys(pattern: string): Promise<string[]> {
    // 这里需要根据具体的缓存实现来获取匹配的键
    // 示例实现
    return []
  }

  // 缓存装饰器
  static Cacheable(key: string, ttl: number = 300) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ) {
      const method = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${key}:${JSON.stringify(args)}`
        const cacheService = this.cacheService as CacheService

        // 尝试从缓存获取
        const cached = await cacheService.get(cacheKey)
        if (cached) {
          return cached
        }

        // 执行原方法
        const result = await method.apply(this, args)

        // 缓存结果
        await cacheService.set(cacheKey, result, ttl)

        return result
      }
    }
  }
}
```

## 🔍 数据验证和 DTO

### DTO 定义

```typescript
// todos/dto/create-todo.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator'

export class CreateTodoDto {
  @ApiProperty({ description: '待办事项标题' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string

  @ApiProperty({ description: '待办事项描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string

  @ApiProperty({ description: '优先级 (1-5)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number

  @ApiProperty({ description: '截止日期', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string

  @ApiProperty({ description: '标签列表', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
```

## 🧪 测试策略

### 单元测试

```typescript
// todos/todos.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { TodosService } from './todos.service'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../cache/cache.service'
import { AIService } from '../ai/ai.service'

describe('TodosService', () => {
  let service: TodosService
  let prismaService: PrismaService
  let cacheService: CacheService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: PrismaService,
          useValue: {
            todo: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            deletePattern: jest.fn(),
          },
        },
        {
          provide: AIService,
          useValue: {
            analyzeTodo: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<TodosService>(TodosService)
    prismaService = module.get<PrismaService>(PrismaService)
    cacheService = module.get<CacheService>(CacheService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a todo successfully', async () => {
      const userId = 'user-1'
      const createTodoDto = {
        title: 'Test Todo',
        description: 'Test Description',
      }

      const mockTodo = {
        id: 'todo-1',
        ...createTodoDto,
        userId,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      jest.spyOn(prismaService.todo, 'create').mockResolvedValue(mockTodo)
      jest.spyOn(cacheService, 'deletePattern').mockResolvedValue()

      const result = await service.create(userId, createTodoDto)

      expect(result).toEqual(mockTodo)
      expect(prismaService.todo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createTodoDto.title,
          description: createTodoDto.description,
          userId,
        }),
        include: expect.any(Object),
      })
    })
  })
})
```

### E2E 测试

```typescript
// test/todos.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('TodosController (e2e)', () => {
  let app: INestApplication
  let prismaService: PrismaService
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    prismaService = moduleFixture.get<PrismaService>(PrismaService)

    await app.init()

    // 创建测试用户并获取 token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      })

    authToken = authResponse.body.accessToken
  })

  afterAll(async () => {
    await prismaService.$disconnect()
    await app.close()
  })

  describe('/todos (POST)', () => {
    it('should create a new todo', () => {
      return request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Todo',
          description: 'Test Description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('Test Todo')
          expect(res.body.description).toBe('Test Description')
          expect(res.body.completed).toBe(false)
        })
    })
  })
})
```

## 📈 学习要点

### 1. NestJS 架构设计

- 模块化架构和依赖注入
- 装饰器的使用和自定义装饰器
- 中间件、守卫、拦截器、管道的应用
- 异常处理和错误过滤器

### 2. Prisma ORM 实践

- Schema 设计和关系建模
- 查询优化和索引策略
- 事务处理和批量操作
- 数据迁移和种子数据

### 3. 认证和授权

- JWT 策略实现
- Passport 集成
- 权限控制和角色管理
- 安全最佳实践

### 4. 缓存和性能优化

- Redis 缓存策略
- 查询优化和 N+1 问题解决
- 数据库连接池管理
- API 响应时间优化

### 5. API 设计和文档

- RESTful API 设计原则
- Swagger 文档自动生成
- 版本控制策略
- 错误响应标准化

## 🎯 简历亮点总结

- **NestJS 企业级架构**：模块化设计、依赖注入、装饰器模式的深度应用
- **Prisma ORM 数据建模**：类型安全的数据库操作、复杂查询优化、事务处理
- **JWT 认证系统**：无状态认证、Passport 策略、权限控制机制
- **Redis 缓存架构**：多层缓存策略、缓存失效机制、性能优化
- **AI 服务集成**：第三方 API 集成、错误处理、响应解析
- **API 设计规范**：RESTful 设计、Swagger 文档、数据验证
- **测试驱动开发**：单元测试、集成测试、E2E 测试的完整覆盖
- **性能监控优化**：数据库查询优化、缓存命中率提升、响应时间监控
