import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * 主题和语言偏好设置 DTO
 */
export class ThemePreferencesDto {
  @ApiProperty({ description: '主题设置', enum: ['light', 'dark', 'auto'], example: 'light' })
  @IsOptional()
  @IsString()
  theme?: string

  @ApiProperty({ description: '语言设置', example: 'zh-CN' })
  @IsOptional()
  @IsString()
  language?: string
}

/**
 * AI 配置 DTO
 */
export class AIConfigDto {
  @ApiProperty({ description: 'AI功能是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiProperty({ description: '自动分析任务', example: true })
  @IsOptional()
  @IsBoolean()
  autoAnalyze?: boolean

  @ApiProperty({ description: '优先级分析', example: true })
  @IsOptional()
  @IsBoolean()
  priorityAnalysis?: boolean

  @ApiProperty({ description: '时间估算', example: true })
  @IsOptional()
  @IsBoolean()
  timeEstimation?: boolean

  @ApiProperty({ description: '子任务拆分', example: true })
  @IsOptional()
  @IsBoolean()
  subtaskSplitting?: boolean

  @ApiProperty({ description: 'AI模型选择', example: 'deepseek-chat' })
  @IsOptional()
  @IsString()
  model?: string

  @ApiProperty({ description: 'AI温度参数', minimum: 0, maximum: 2, example: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number

  @ApiProperty({ description: 'AI最大token数', minimum: 100, maximum: 8000, example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(8000)
  maxTokens?: number
}

/**
 * 搜索配置 DTO
 */
export class SearchConfigDto {
  @ApiProperty({ description: '搜索语言', example: 'zh-CN' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string

  @ApiProperty({ description: '安全搜索', example: true })
  @IsOptional()
  @IsBoolean()
  safeSearch?: boolean

  @ApiProperty({ description: '默认结果数量', minimum: 1, maximum: 100, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  defaultResultCount?: number

  @ApiProperty({ description: '搜索引擎', example: 'google' })
  @IsOptional()
  @IsString()
  engine?: string

  @ApiProperty({ description: '搜索区域', example: 'CN' })
  @IsOptional()
  @IsString()
  region?: string
}

/**
 * 通知配置 DTO
 */
export class NotificationConfigDto {
  @ApiProperty({ description: '桌面通知', example: true })
  @IsOptional()
  @IsBoolean()
  desktop?: boolean

  @ApiProperty({ description: '邮件通知', example: false })
  @IsOptional()
  @IsBoolean()
  email?: boolean

  @ApiProperty({ description: '到期提醒', example: true })
  @IsOptional()
  @IsBoolean()
  dueReminder?: boolean

  @ApiProperty({ description: '提醒提前时间（分钟）', minimum: 1, example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  reminderMinutes?: number
}

/**
 * 存储配置 DTO
 */
export class StorageConfigDto {
  @ApiProperty({ description: '存储模式', enum: ['local', 'cloud', 'hybrid'], example: 'hybrid' })
  @IsOptional()
  @IsString()
  mode?: string

  @ApiProperty({ description: '自动同步', example: true })
  @IsOptional()
  @IsBoolean()
  autoSync?: boolean

  @ApiProperty({ description: '同步间隔（分钟）', minimum: 1, example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  syncInterval?: number

  @ApiProperty({ description: '离线模式', example: true })
  @IsOptional()
  @IsBoolean()
  offlineMode?: boolean

  @ApiProperty({
    description: '冲突解决策略',
    enum: ['merge', 'local', 'remote'],
    example: 'merge',
  })
  @IsOptional()
  @IsString()
  conflictResolution?: string

  @ApiProperty({ description: '重试次数', minimum: 0, maximum: 10, example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  retryAttempts?: number

  @ApiProperty({ description: '请求超时时间（毫秒）', minimum: 1000, example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  requestTimeout?: number
}

/**
 * 完整的用户偏好设置更新 DTO
 */
export class UpdateUserPreferencesDto {
  @ApiProperty({ description: '主题和语言偏好', type: ThemePreferencesDto })
  @IsOptional()
  theme?: ThemePreferencesDto

  @ApiProperty({ description: 'AI配置', type: AIConfigDto })
  @IsOptional()
  ai?: AIConfigDto

  @ApiProperty({ description: '搜索配置', type: SearchConfigDto })
  @IsOptional()
  search?: SearchConfigDto

  @ApiProperty({ description: '通知配置', type: NotificationConfigDto })
  @IsOptional()
  notifications?: NotificationConfigDto

  @ApiProperty({ description: '存储配置', type: StorageConfigDto })
  @IsOptional()
  storage?: StorageConfigDto
}
