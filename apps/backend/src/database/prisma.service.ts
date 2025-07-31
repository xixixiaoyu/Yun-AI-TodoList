import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL +
            '?pgbouncer=true&connection_limit=5&pool_timeout=20&connect_timeout=30&statement_cache_size=0',
        },
      },
      // 优化连接池配置 - 使用类型断言避免 TypeScript 错误
      ...({
        __internal: {
          engine: {
            connectTimeout: 30000,
            requestTimeout: 30000,
          },
        },
      } as any),
    })
  }

  async onModuleInit() {
    try {
      // 应用软删除中间件
      // this.$use(softDeleteMiddleware)

      // 使用重试机制连接数据库
      await this.connectWithRetry()
      this.logger.log('Successfully connected to database')

      // 定期健康检查
      this.startHealthCheck()
    } catch (error) {
      this.logger.error('Failed to connect to database', error)
      throw error
    }
  }

  private async connectWithRetry(maxRetries = 3, delay = 2000): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect()
        return
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed:`,
          error instanceof Error ? error.message : String(error)
        )

        if (attempt === maxRetries) {
          throw error
        }

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, delay * attempt))
      }
    }
  }

  private startHealthCheck(): void {
    // 每30秒检查一次数据库连接
    setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`
      } catch (error) {
        this.logger.error(
          'Database health check failed:',
          error instanceof Error ? error.message : String(error)
        )
        // 尝试重新连接
        try {
          await this.$disconnect()
          await this.connectWithRetry()
          this.logger.log('Database reconnected successfully')
        } catch (reconnectError) {
          this.logger.error(
            'Failed to reconnect to database:',
            reconnectError instanceof Error ? reconnectError.message : String(reconnectError)
          )
        }
      }
    }, 30000)
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Disconnected from database')
  }

  async enableShutdownHooks(app: { close: () => Promise<void> }) {
    // Note: beforeExit event handling for graceful shutdown
    process.on('beforeExit', async () => {
      await app.close()
    })
  }
}
