import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import compression from 'compression'
import helmet from 'helmet'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  // 安全中间件
  app.use(helmet())
  app.use(compression())

  // 全局前缀
  app.setGlobalPrefix('api/v1')

  // CORS 配置
  app.enableCors({
    origin: [
      'http://localhost:3001', // 前端开发服务器
      'http://localhost:3002', // 前端开发服务器（备用端口）
      'http://localhost:3000', // Electron 应用
      'http://localhost:5173', // Vite 开发服务器
      configService.get('FRONTEND_URL', 'http://localhost:5173'),
      /^file:\/\//, // 允许 file:// 协议用于测试
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  )

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter())

  // 全局拦截器
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor())

  // Swagger 文档
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Yun AI TodoList API')
      .setDescription(
        `
        # 智能 Todo 管理应用 API

        这是一个功能完整的智能 Todo 管理应用的后端 API，提供以下核心功能：

        ## 🔐 认证系统
        - JWT 令牌认证
        - 用户注册和登录
        - 自动令牌刷新
        - 安全的用户会话管理

        ## 📝 Todo 管理
        - 完整的 CRUD 操作
        - 智能优先级分析
        - 时间估算功能
        - 拖拽排序支持
        - 标签和分类管理
        - 到期日期提醒

        ## 🔍 搜索服务
        - 实时网络搜索
        - 搜索历史管理
        - 智能搜索建议
        - 搜索统计分析

        ## ⚙️ 用户设置
        - 个性化偏好配置
        - 主题和语言设置
        - AI 分析配置
        - 通知设置管理

        ## 📖 使用指南
        1. 首先通过 \`/auth/register\` 注册账户或 \`/auth/login\` 登录
        2. 获取访问令牌后，在请求头中添加 \`Authorization: Bearer <token>\`
        3. 使用相应的 API 端点管理 Todo、搜索内容或配置设置
        4. 定期使用 \`/auth/refresh\` 刷新令牌以保持会话活跃
      `
      )
      .setVersion('1.0.0')
      .setContact('Yunmu', 'https://github.com/xixixiaoyu', '1416900346@qq.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3000', '开发环境')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: '请输入 JWT 令牌',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('auth', '🔐 用户认证 - 注册、登录、令牌管理')
      .addTag('todos', '📝 Todo 管理 - CRUD 操作、AI 分析、排序')
      .addTag('search', '🔍 搜索服务 - 网络搜索、历史管理、统计')
      .addTag('users', '👤 用户管理 - 用户信息、权限管理')
      .addTag('settings', '⚙️ 用户设置 - 偏好配置、主题、通知')
      .build()

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    })

    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Yun AI TodoList API 文档',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #3b82f6 }
        .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    })
  }

  const port = configService.get('PORT', 3000)
  const host = configService.get('HOST', '0.0.0.0')

  await app.listen(port, host)

  logger.log(`🚀 Application is running on: http://${host}:${port}`)
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})
