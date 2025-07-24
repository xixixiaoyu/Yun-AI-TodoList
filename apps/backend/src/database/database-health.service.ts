import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from './prisma.service'

export interface DatabaseHealthStatus {
  isHealthy: boolean
  connectionStatus: 'connected' | 'disconnected' | 'error'
  responseTime: number
  lastCheck: Date
  error?: string
  metrics: {
    totalConnections: number
    activeConnections: number
    idleConnections: number
  }
}

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name)
  private lastHealthStatus: DatabaseHealthStatus | null = null

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 执行数据库健康检查
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now()

    try {
      // 执行简单的查询来测试连接
      await this.prisma.$queryRaw`SELECT 1 as health_check`

      const responseTime = Date.now() - startTime

      // 获取连接池状态（如果可用）
      const metrics = await this.getConnectionMetrics()

      const healthStatus: DatabaseHealthStatus = {
        isHealthy: true,
        connectionStatus: 'connected',
        responseTime,
        lastCheck: new Date(),
        metrics,
      }

      this.lastHealthStatus = healthStatus
      this.logger.debug(`数据库健康检查通过，响应时间: ${responseTime}ms`)

      return healthStatus
    } catch (error) {
      const responseTime = Date.now() - startTime

      const healthStatus: DatabaseHealthStatus = {
        isHealthy: false,
        connectionStatus: 'error',
        responseTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          totalConnections: 0,
          activeConnections: 0,
          idleConnections: 0,
        },
      }

      this.lastHealthStatus = healthStatus
      this.logger.error(
        `数据库健康检查失败: ${error instanceof Error ? error.message : String(error)}`
      )

      return healthStatus
    }
  }

  /**
   * 获取连接池指标
   */
  private async getConnectionMetrics(): Promise<DatabaseHealthStatus['metrics']> {
    try {
      // 尝试获取 PostgreSQL 连接信息
      const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
      `

      const totalConnections = Number(result[0]?.count || 0)

      return {
        totalConnections,
        activeConnections: totalConnections, // 简化处理
        idleConnections: 0,
      }
    } catch (error) {
      this.logger.warn(
        '无法获取连接池指标:',
        error instanceof Error ? error.message : String(error)
      )
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
      }
    }
  }

  /**
   * 获取最后一次健康检查结果
   */
  getLastHealthStatus(): DatabaseHealthStatus | null {
    return this.lastHealthStatus
  }

  /**
   * 检查数据库表是否存在
   */
  async checkTablesExist(): Promise<{ [tableName: string]: boolean }> {
    try {
      const expectedTables = ['users', 'user_preferences', 'todos', 'email_verification_codes']
      const result: { [tableName: string]: boolean } = {}

      for (const tableName of expectedTables) {
        try {
          await this.prisma.$queryRawUnsafe(`SELECT 1 FROM ${tableName} LIMIT 1`)
          result[tableName] = true
        } catch (error) {
          result[tableName] = false
          this.logger.warn(
            `表 ${tableName} 不存在或无法访问:`,
            error instanceof Error ? error.message : String(error)
          )
        }
      }

      return result
    } catch (error) {
      this.logger.error('检查表存在性时出错:', error)
      throw error
    }
  }

  /**
   * 执行数据库迁移状态检查
   */
  async checkMigrationStatus(): Promise<{
    appliedMigrations: number
    pendingMigrations: number
    lastMigration?: string
  }> {
    try {
      const migrations = await this.prisma.$queryRaw<
        Array<{
          migration_name: string
          applied_at: Date
        }>
      >`
        SELECT migration_name, applied_at
        FROM _prisma_migrations
        ORDER BY applied_at DESC
      `

      return {
        appliedMigrations: migrations.length,
        pendingMigrations: 0, // 简化处理，实际需要比较文件系统中的迁移文件
        lastMigration: migrations[0]?.migration_name,
      }
    } catch (error) {
      this.logger.warn('无法获取迁移状态:', error instanceof Error ? error.message : String(error))
      return {
        appliedMigrations: 0,
        pendingMigrations: 0,
      }
    }
  }

  /**
   * 执行完整的数据库诊断
   */
  async performDiagnostics(): Promise<{
    health: DatabaseHealthStatus
    tables: { [tableName: string]: boolean }
    migrations: {
      appliedMigrations: number
      pendingMigrations: number
      lastMigration?: string
    }
  }> {
    const [health, tables, migrations] = await Promise.all([
      this.checkHealth(),
      this.checkTablesExist(),
      this.checkMigrationStatus(),
    ])

    return {
      health,
      tables,
      migrations,
    }
  }
}
