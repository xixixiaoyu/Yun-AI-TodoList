import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { AppService } from './app.service'

describe('AppService', () => {
  let service: AppService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                NODE_ENV: 'test',
              }
              return config[key] || defaultValue
            }),
          },
        },
      ],
    }).compile()

    service = module.get<AppService>(AppService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return app info', () => {
    const result = service.getAppInfo()
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('version')
    expect(result).toHaveProperty('description')
    expect(result).toHaveProperty('environment')
    expect(result).toHaveProperty('timestamp')
    expect(result.name).toBe('Yun AI TodoList API')
  })

  it('should return health status', () => {
    const result = service.getHealthStatus()
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('timestamp')
    expect(result).toHaveProperty('uptime')
    expect(result).toHaveProperty('database')
    expect(result).toHaveProperty('memory')
    expect(result).toHaveProperty('environment')
    expect(result.status).toBe('ok')
    expect(result.environment).toBe('test')
  })
})
