import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsArray, IsInt, IsEnum, IsBoolean, Min, Max } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export enum TodoSortField {
  CREATED_AT = 'createdAt',
  COMPLETED_AT = 'completedAt',
  TITLE = 'title',
  PRIORITY = 'priority',
  DUE_DATE = 'dueDate',
  ORDER = 'order',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export enum TodoFilterType {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  TODAY = 'today',
  WEEK = 'week',
}

export class QueryTodosDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为1' })
  page?: number = 1

  @ApiProperty({
    description: '每页数量',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为1' })
  @Max(100, { message: '每页数量最大为100' })
  limit?: number = 20

  @ApiProperty({
    description: '搜索关键词',
    example: '项目',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string

  @ApiProperty({
    description: '过滤类型',
    enum: TodoFilterType,
    example: TodoFilterType.ALL,
    required: false,
  })
  @IsOptional()
  @IsEnum(TodoFilterType, { message: '过滤类型无效' })
  type?: TodoFilterType = TodoFilterType.ALL

  @ApiProperty({
    description: '标签过滤',
    example: ['工作', '重要'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    }
    return value
  })
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '每个标签必须是字符串' })
  tags?: string[]

  @ApiProperty({
    description: '优先级过滤',
    example: [3, 4, 5],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((p) => parseInt(p.trim()))
        .filter((p) => !isNaN(p))
    }
    return value
  })
  @IsArray({ message: '优先级必须是数组' })
  @IsInt({ each: true, message: '每个优先级必须是整数' })
  priority?: number[]

  @ApiProperty({
    description: '排序字段',
    enum: TodoSortField,
    example: TodoSortField.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(TodoSortField, { message: '排序字段无效' })
  sortBy?: TodoSortField = TodoSortField.ORDER

  @ApiProperty({
    description: '排序方向',
    enum: SortDirection,
    example: SortDirection.ASC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortDirection, { message: '排序方向无效' })
  sortOrder?: SortDirection = SortDirection.ASC

  @ApiProperty({
    description: '是否包含统计信息',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true'
    }
    return value
  })
  @IsBoolean({ message: '统计信息标志必须是布尔值' })
  includeStats?: boolean = true
}
