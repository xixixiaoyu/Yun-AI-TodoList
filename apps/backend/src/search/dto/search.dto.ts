import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

export enum SearchTimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all',
}

export class SearchDto {
  @ApiProperty({
    description: '搜索关键词',
    example: 'Vue 3 TypeScript 教程',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: '搜索关键词必须是字符串' })
  @MinLength(1, { message: '搜索关键词不能为空' })
  @MaxLength(500, { message: '搜索关键词长度不能超过500字符' })
  query!: string

  @ApiProperty({
    description: '返回结果数量',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '结果数量必须是整数' })
  @Min(1, { message: '结果数量最小为1' })
  @Max(50, { message: '结果数量最大为50' })
  limit?: number = 10

  @ApiProperty({
    description: '搜索语言',
    example: 'zh-CN',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '语言必须是字符串' })
  language?: string = 'zh-CN'

  @ApiProperty({
    description: '安全搜索',
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
  @IsBoolean({ message: '安全搜索标志必须是布尔值' })
  safeSearch?: boolean = true

  @ApiProperty({
    description: '时间范围',
    enum: SearchTimeRange,
    example: SearchTimeRange.ALL,
    required: false,
  })
  @IsOptional()
  @IsEnum(SearchTimeRange, { message: '时间范围无效' })
  timeRange?: SearchTimeRange = SearchTimeRange.ALL

  @ApiProperty({
    description: '地区代码',
    example: 'CN',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '地区代码必须是字符串' })
  region?: string

  @ApiProperty({
    description: '是否保存搜索历史',
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
  @IsBoolean({ message: '保存历史标志必须是布尔值' })
  saveHistory?: boolean = true
}
