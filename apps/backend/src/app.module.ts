import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'

import { AIAnalysisModule } from './ai-analysis/ai-analysis.module'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { CommonModule } from './common/common.module'
import { DatabaseModule } from './database/database.module'
import { SettingsModule } from './settings/settings.module'
import { TodosModule } from './todos/todos.module'
import { UsersModule } from './users/users.module'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { configValidationSchema } from './config/config.validation'

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),

    // 缓存模块
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
      max: 1000, // maximum number of items in cache
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 业务模块
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    TodosModule,
    SettingsModule,
    AIAnalysisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
