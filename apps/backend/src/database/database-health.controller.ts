import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DatabaseHealthService, DatabaseHealthStatus } from './database-health.service'

@ApiTags('database-health')
@Controller('health/database')
export class DatabaseHealthController {
  constructor(private readonly databaseHealthService: DatabaseHealthService) {}

  @Get()
  @ApiOperation({ summary: '获取数据库健康状态' })
  @ApiResponse({ status: 200, description: '健康检查成功' })
  async getHealth(): Promise<DatabaseHealthStatus> {
    return this.databaseHealthService.checkHealth()
  }

  @Get('diagnostics')
  @ApiOperation({ summary: '获取完整的数据库诊断信息' })
  @ApiResponse({ status: 200, description: '诊断信息获取成功' })
  async getDiagnostics() {
    return this.databaseHealthService.performDiagnostics()
  }

  @Get('tables')
  @ApiOperation({ summary: '检查数据库表状态' })
  @ApiResponse({ status: 200, description: '表状态检查成功' })
  async getTablesStatus() {
    return this.databaseHealthService.checkTablesExist()
  }

  @Get('migrations')
  @ApiOperation({ summary: '获取数据库迁移状态' })
  @ApiResponse({ status: 200, description: '迁移状态获取成功' })
  async getMigrationStatus() {
    return this.databaseHealthService.checkMigrationStatus()
  }
}
