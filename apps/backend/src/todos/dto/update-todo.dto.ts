import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class UpdateTodoDto {
  @ApiProperty({
    description: 'Todo 标题',
    example: '完成项目文档',
    required: false,
    minLength: 1,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: '标题必须是字符串' })
  @MinLength(1, { message: '标题不能为空' })
  @MaxLength(500, { message: '标题长度不能超过500字符' })
  title?: string

  @ApiProperty({
    description: 'Todo 描述',
    example: '编写项目的技术文档和用户手册',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  @MaxLength(2000, { message: '描述长度不能超过2000字符' })
  description?: string

  @ApiProperty({
    description: '是否完成',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '完成状态必须是布尔值' })
  completed?: boolean

  @ApiProperty({
    description: '优先级 (1-5 星)',
    example: 3,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '优先级必须是整数' })
  @Min(1, { message: '优先级最小为1' })
  @Max(5, { message: '优先级最大为5' })
  priority?: number

  @ApiProperty({
    description: '时间估算',
    example: '2小时',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '时间估算必须是字符串' })
  estimatedTime?: string

  @ApiProperty({
    description: '截止日期',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '截止日期格式不正确' })
  dueDate?: string

  @ApiProperty({
    description: '排序位置',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '排序位置必须是整数' })
  @Min(0, { message: '排序位置不能小于0' })
  order?: number

  @ApiProperty({
    description: '是否已进行 AI 分析',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'AI 分析状态必须是布尔值' })
  aiAnalyzed?: boolean
}
