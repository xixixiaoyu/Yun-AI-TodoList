import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL +
            '?pgbouncer=true&connection_limit=10&pool_timeout=20&connect_timeout=60',
        },
      },
      // 优化连接池配置
      __internal: {
        engine: {
          connectTimeout: 60000,
          queryTimeout: 30000,
        },
      },
    })
  }

  async onModuleInit() {
    try {
      // 应用软删除中间件
      // this.$use(softDeleteMiddleware)

      await this.$connect()
      this.logger.log('Successfully connected to database')
    } catch (error) {
      this.logger.error('Failed to connect to database', error)
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Disconnected from database')
  }

  async enableShutdownHooks(app: any) {
    // Note: beforeExit event handling for graceful shutdown
    process.on('beforeExit', async () => {
      await app.close()
    })
  }
}
