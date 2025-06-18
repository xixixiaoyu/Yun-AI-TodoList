import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsInt, IsString, IsDateString, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchHistoryQueryDto {
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
    description: '搜索关键词过滤',
    example: 'Vue',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string

  @ApiProperty({
    description: '开始日期',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '开始日期格式不正确' })
  dateFrom?: string

  @ApiProperty({
    description: '结束日期',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '结束日期格式不正确' })
  dateTo?: string
}
