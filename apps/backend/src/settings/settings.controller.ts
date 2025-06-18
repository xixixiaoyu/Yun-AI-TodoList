import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { User, UserPreferences } from '@shared/types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UpdatePreferencesDto } from './dto/update-preferences.dto'
import { SettingsService } from './settings.service'

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('preferences')
  @ApiOperation({ summary: '获取用户偏好设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPreferences(@CurrentUser() user: User) {
    return this.settingsService.getPreferences(user.id)
  }

  @Put('preferences')
  @ApiOperation({ summary: '更新用户偏好设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updatePreferences(@CurrentUser() user: User, @Body() updateDto: UpdatePreferencesDto) {
    return this.settingsService.updatePreferences(user.id, updateDto)
  }

  @Post('preferences/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置用户偏好设置为默认值' })
  @ApiResponse({ status: 200, description: '重置成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async resetPreferences(@CurrentUser() user: User) {
    return this.settingsService.resetPreferences(user.id)
  }

  @Get('preferences/export')
  @ApiOperation({ summary: '导出用户偏好设置' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportPreferences(@CurrentUser() user: User) {
    return this.settingsService.exportPreferences(user.id)
  }

  @Post('preferences/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导入用户偏好设置' })
  @ApiResponse({ status: 200, description: '导入成功' })
  @ApiResponse({ status: 400, description: '偏好设置格式错误' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async importPreferences(@CurrentUser() user: User, @Body() preferences: UserPreferences) {
    return this.settingsService.importPreferences(user.id, preferences)
  }
}
