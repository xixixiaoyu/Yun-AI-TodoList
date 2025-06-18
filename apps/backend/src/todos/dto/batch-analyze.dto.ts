import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, IsOptional, IsBoolean } from 'class-validator'

export class BatchAnalyzeDto {
  @ApiProperty({
    description: 'Todo ID 列表',
    example: ['clx1234567890', 'clx0987654321'],
    type: [String],
  })
  @IsArray({ message: 'Todo ID 列表必须是数组' })
  @IsString({ each: true, message: '每个 Todo ID 必须是字符串' })
  todoIds!: string[]

  @ApiProperty({
    description: '是否启用优先级分析',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '优先级分析标志必须是布尔值' })
  enablePriorityAnalysis?: boolean = true

  @ApiProperty({
    description: '是否启用时间估算',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '时间估算标志必须是布尔值' })
  enableTimeEstimation?: boolean = true

  @ApiProperty({
    description: '是否强制重新分析',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '强制分析标志必须是布尔值' })
  forceReanalyze?: boolean = false
}
