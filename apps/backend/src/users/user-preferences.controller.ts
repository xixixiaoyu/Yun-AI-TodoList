import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { User, UserPreferences } from '@shared/types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import {
  UpdateUserPreferencesDto,
  ThemePreferencesDto,
  AIConfigDto,
  SearchConfigDto,
  NotificationConfigDto,
  StorageConfigDto,
} from './dto/user-preferences.dto'
import { UserPreferencesService } from './user-preferences.service'

@ApiTags('user-preferences')
@Controller('user-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get()
  @ApiOperation({ summary: '获取用户偏好设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPreferences(@CurrentUser() user: User): Promise<UserPreferences> {
    const preferences = await this.userPreferencesService.findByUserId(user.id)
    if (!preferences) {
      return this.userPreferencesService.createDefault(user.id)
    }
    return preferences
  }

  @Patch('theme')
  @ApiOperation({ summary: '更新主题和语言设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateThemePreferences(
    @CurrentUser() user: User,
    @Body() themePrefs: ThemePreferencesDto
  ): Promise<UserPreferences> {
    return this.userPreferencesService.updateThemeAndLanguage(user.id, themePrefs)
  }

  @Patch('ai')
  @ApiOperation({ summary: '更新 AI 配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAIConfig(
    @CurrentUser() user: User,
    @Body() aiConfig: AIConfigDto
  ): Promise<UserPreferences> {
    return this.userPreferencesService.updateAIConfig(user.id, aiConfig)
  }

  @Patch('search')
  @ApiOperation({ summary: '更新搜索配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateSearchConfig(
    @CurrentUser() user: User,
    @Body() searchConfig: SearchConfigDto
  ): Promise<UserPreferences> {
    return this.userPreferencesService.updateSearchConfig(user.id, searchConfig)
  }

  @Patch('notifications')
  @ApiOperation({ summary: '更新通知配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateNotificationConfig(
    @CurrentUser() user: User,
    @Body() notificationConfig: NotificationConfigDto
  ): Promise<UserPreferences> {
    return this.userPreferencesService.updateNotificationConfig(user.id, notificationConfig)
  }

  @Patch('storage')
  @ApiOperation({ summary: '更新存储配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateStorageConfig(
    @CurrentUser() user: User,
    @Body() storageConfig: StorageConfigDto
  ): Promise<UserPreferences> {
    return this.userPreferencesService.updateStorageConfig(user.id, storageConfig)
  }

  @Patch('bulk')
  @ApiOperation({ summary: '批量更新偏好设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateBulkPreferences(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateUserPreferencesDto
  ): Promise<UserPreferences> {
    return this.userPreferencesService.updateBulkPreferences(user.id, updateDto)
  }
}
