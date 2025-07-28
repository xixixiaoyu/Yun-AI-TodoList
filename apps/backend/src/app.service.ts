import { Injectable } from '@nestjs/common'

interface AppInfo {
  name: string
  version: string
  description: string
  author: string
  environment: string
  timestamp: string
}

interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
  database: {
    status: string
    type: string
  }
  memory: NodeJS.MemoryUsage
  version: string
  environment: string
}
import { ConfigService } from '@nestjs/config'

const APP_CONFIG = {
  NAME: 'Yun AI TodoList API',
  VERSION: '1.0.0',
  DESCRIPTION: '智能 Todo 管理应用的后端 API',
  AUTHOR: 'Yunmu',
}

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo(): AppInfo {
    return {
      name: APP_CONFIG.NAME,
      version: APP_CONFIG.VERSION,
      description: APP_CONFIG.DESCRIPTION,
      author: APP_CONFIG.AUTHOR,
      environment: this.configService.get('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
    }
  }

  getHealthStatus(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        type: 'postgresql',
      },
      memory: process.memoryUsage(),
      version: process.version,
      environment: this.configService.get('NODE_ENV', 'development'),
    }
  }
}
