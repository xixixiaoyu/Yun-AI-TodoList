import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum Language {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
}

export enum StorageMode {
  LOCAL = 'local',
  HYBRID = 'hybrid',
}

export enum ConflictResolutionStrategy {
  LOCAL_WINS = 'local-wins',
  REMOTE_WINS = 'remote-wins',
  MERGE = 'merge',
  ASK_USER = 'ask-user',
}

export class AIConfigDto {
  @ApiProperty({
    description: '是否启用 AI 分析',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'AI 分析开关必须是布尔值' })
  enabled?: boolean

  @ApiProperty({
    description: '是否自动分析新 Todo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '自动分析开关必须是布尔值' })
  autoAnalyze?: boolean

  @ApiProperty({
    description: '是否启用优先级分析',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '优先级分析开关必须是布尔值' })
  priorityAnalysis?: boolean

  @ApiProperty({
    description: '是否启用时间估算',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '时间估算开关必须是布尔值' })
  timeEstimation?: boolean

  @ApiProperty({
    description: '是否启用子任务拆分',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '子任务拆分开关必须是布尔值' })
  subtaskSplitting?: boolean

  @ApiProperty({
    description: 'AI 模型配置',
    example: { model: 'deepseek-chat', temperature: 0.3 },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: '模型配置必须是对象' })
  modelConfig?: Record<string, any>
}

export class SearchConfigDto {
  @ApiProperty({
    description: '默认搜索语言',
    example: 'zh-CN',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '搜索语言必须是字符串' })
  defaultLanguage?: string

  @ApiProperty({
    description: '是否启用安全搜索',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '安全搜索开关必须是布尔值' })
  safeSearch?: boolean

  @ApiProperty({
    description: '默认结果数量',
    example: 10,
    required: false,
  })
  @IsOptional()
  defaultResultCount?: number

  @ApiProperty({
    description: '是否保存搜索历史',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '保存历史开关必须是布尔值' })
  saveHistory?: boolean

  @ApiProperty({
    description: '搜索引擎配置',
    example: { engine: 'google', region: 'CN' },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: '搜索引擎配置必须是对象' })
  engineConfig?: Record<string, any>
}

export class NotificationConfigDto {
  @ApiProperty({
    description: '是否启用桌面通知',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '桌面通知开关必须是布尔值' })
  desktop?: boolean

  @ApiProperty({
    description: '是否启用邮件通知',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '邮件通知开关必须是布尔值' })
  email?: boolean

  @ApiProperty({
    description: '是否启用到期提醒',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '到期提醒开关必须是布尔值' })
  dueReminder?: boolean

  @ApiProperty({
    description: '提醒提前时间（分钟）',
    example: 30,
    required: false,
  })
  @IsOptional()
  reminderMinutes?: number
}

export class StorageConfigDto {
  @ApiProperty({
    description: '存储模式',
    enum: StorageMode,
    example: StorageMode.LOCAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(StorageMode, { message: '存储模式无效' })
  mode?: StorageMode

  @ApiProperty({
    description: '是否启用自动同步',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '自动同步开关必须是布尔值' })
  autoSync?: boolean

  @ApiProperty({
    description: '同步间隔（分钟）',
    example: 5,
    minimum: 1,
    maximum: 60,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '同步间隔必须是数字' })
  syncInterval?: number

  @ApiProperty({
    description: '是否启用离线模式',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '离线模式开关必须是布尔值' })
  offlineMode?: boolean

  @ApiProperty({
    description: '冲突解决策略',
    enum: ConflictResolutionStrategy,
    example: ConflictResolutionStrategy.ASK_USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(ConflictResolutionStrategy, { message: '冲突解决策略无效' })
  conflictResolution?: ConflictResolutionStrategy
}

export class UpdatePreferencesDto {
  @ApiProperty({
    description: '主题设置',
    enum: Theme,
    example: Theme.AUTO,
    required: false,
  })
  @IsOptional()
  @IsEnum(Theme, { message: '主题设置无效' })
  theme?: Theme

  @ApiProperty({
    description: '语言设置',
    enum: Language,
    example: Language.ZH_CN,
    required: false,
  })
  @IsOptional()
  @IsEnum(Language, { message: '语言设置无效' })
  language?: Language

  @ApiProperty({
    description: 'AI 配置',
    type: AIConfigDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AIConfigDto)
  aiConfig?: AIConfigDto

  @ApiProperty({
    description: '搜索配置',
    type: SearchConfigDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchConfigDto)
  searchConfig?: SearchConfigDto

  @ApiProperty({
    description: '通知配置',
    type: NotificationConfigDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notifications?: NotificationConfigDto

  @ApiProperty({
    description: '存储配置',
    type: StorageConfigDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StorageConfigDto)
  storageConfig?: StorageConfigDto
}
