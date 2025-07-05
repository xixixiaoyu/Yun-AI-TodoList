/**
 * 文档相关的 DTO 定义
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator'

export class CreateDocumentDto {
  @ApiProperty({ description: '文件名' })
  @IsString()
  filename: string

  @ApiProperty({ description: '文件类型' })
  @IsString()
  fileType: string

  @ApiProperty({ description: '文件大小（字节）' })
  @IsNumber()
  fileSize: number

  @ApiProperty({ description: '文件内容' })
  @IsString()
  content: string

  @ApiProperty({ description: '文档元数据', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class DocumentSearchDto {
  @ApiProperty({ description: '搜索查询' })
  @IsString()
  query: string

  @ApiProperty({
    description: '返回结果数量',
    minimum: 1,
    maximum: 20,
    default: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number

  @ApiProperty({ description: '相似度阈值', minimum: 0, maximum: 1, default: 0.7, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number
}

export class DocumentQueryDto {
  @ApiProperty({ description: '查询问题' })
  @IsString()
  query: string
}

export class UpdateDocumentDto {
  @ApiProperty({ description: '文件名', required: false })
  @IsOptional()
  @IsString()
  filename?: string

  @ApiProperty({ description: '文档元数据', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class DocumentResponseDto {
  @ApiProperty({ description: '文档ID' })
  id: string

  @ApiProperty({ description: '文件名' })
  filename: string

  @ApiProperty({ description: '文件类型' })
  fileType: string

  @ApiProperty({ description: '文件大小' })
  fileSize: number

  @ApiProperty({ description: '是否已处理' })
  processed: boolean

  @ApiProperty({ description: '创建时间' })
  createdAt: Date

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date

  @ApiProperty({ description: '文档元数据', required: false })
  metadata?: Record<string, any>
}

export class DocumentChunkResponseDto {
  @ApiProperty({ description: '分块ID' })
  id: string

  @ApiProperty({ description: '分块索引' })
  chunkIndex: number

  @ApiProperty({ description: '分块内容' })
  content: string

  @ApiProperty({ description: '分块元数据', required: false })
  metadata?: Record<string, any>
}

export class DocumentDetailResponseDto extends DocumentResponseDto {
  @ApiProperty({ description: '文档内容' })
  content: string

  @ApiProperty({ description: '文档分块', type: [DocumentChunkResponseDto] })
  chunks: DocumentChunkResponseDto[]
}

export class SearchResultDto {
  @ApiProperty({ description: '匹配内容' })
  content: string

  @ApiProperty({ description: '相似度分数' })
  score: number

  @ApiProperty({ description: '分块索引', required: false })
  chunkIndex?: number

  @ApiProperty({ description: '元数据', required: false })
  metadata?: Record<string, any>

  @ApiProperty({ description: '关联文档', required: false })
  document?: DocumentResponseDto
}

export class DocumentSearchResponseDto {
  @ApiProperty({ description: '搜索查询' })
  query: string

  @ApiProperty({ description: '搜索结果', type: [SearchResultDto] })
  results: SearchResultDto[]

  @ApiProperty({ description: '结果总数' })
  total: number
}

export class DocumentQueryResponseDto {
  @ApiProperty({ description: '查询问题' })
  query: string

  @ApiProperty({ description: 'AI 回答' })
  answer: string

  @ApiProperty({ description: '查询时间' })
  timestamp: string
}

export class DocumentStatsResponseDto {
  @ApiProperty({ description: '文档总数' })
  totalDocuments: number

  @ApiProperty({ description: '已处理文档数' })
  processedDocuments: number

  @ApiProperty({ description: '待处理文档数' })
  pendingDocuments: number

  @ApiProperty({ description: '总文件大小' })
  totalSize: number

  @ApiProperty({ description: '索引中的文档数' })
  documentCount: number

  @ApiProperty({ description: '索引中的分块数' })
  chunkCount: number

  @ApiProperty({ description: '索引大小' })
  indexSize: number
}

export class PaginationDto {
  @ApiProperty({ description: '当前页码' })
  page: number

  @ApiProperty({ description: '每页数量' })
  limit: number

  @ApiProperty({ description: '总数量' })
  total: number

  @ApiProperty({ description: '总页数' })
  totalPages: number
}

export class DocumentListResponseDto {
  @ApiProperty({ description: '文档列表', type: [DocumentResponseDto] })
  documents: DocumentResponseDto[]

  @ApiProperty({ description: '分页信息' })
  pagination: PaginationDto
}
