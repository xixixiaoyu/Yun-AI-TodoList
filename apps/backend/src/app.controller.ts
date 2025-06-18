import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AppService } from './app.service'
import { Public } from './auth/decorators/public.decorator'

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get application info' })
  @ApiResponse({ status: 200, description: 'Application information' })
  getHello(): object {
    return this.appService.getAppInfo()
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Application health status' })
  getHealth(): object {
    return this.appService.getHealthStatus()
  }
}
