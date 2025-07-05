/**
 * 文档控制器
 * 处理文档相关的 HTTP 请求
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '@shared/types'
import { DocumentsService, DocumentSearchDto, DocumentQueryDto } from './documents.service'
import * as multer from 'multer'

// 文件上传配置
const storage = multer.memoryStorage()
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new BadRequestException('Unsupported file type'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传文档' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '文档上传成功' })
  @ApiResponse({ status: 400, description: '文件格式不支持或文件过大' })
  @UseInterceptors(
    FileInterceptor('file', { storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })
  )
  async uploadDocument(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    try {
      // 解析文件内容
      const content = await this.parseFileContent(file)

      // 创建文档
      const document = await this.documentsService.createDocument(user.id, {
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        content,
        metadata: {
          originalName: file.originalname,
          encoding: file.encoding,
          uploadedAt: new Date().toISOString(),
        },
      })

      return {
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          filename: document.filename,
          fileType: document.fileType,
          fileSize: document.fileSize,
          processed: document.processed,
          createdAt: document.createdAt,
        },
      }
    } catch (error) {
      throw new BadRequestException(`Failed to process file: ${error.message}`)
    }
  }

  @Get()
  @ApiOperation({ summary: '获取用户文档列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserDocuments(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10
  ) {
    return this.documentsService.getUserDocuments(user.id, page, limit)
  }

  @Get('stats')
  @ApiOperation({ summary: '获取文档统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDocumentStats(@CurrentUser() user: User) {
    return this.documentsService.getDocumentStats(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文档详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '文档不存在' })
  async getDocument(@CurrentUser() user: User, @Param('id') documentId: string) {
    return this.documentsService.getDocument(user.id, documentId)
  }

  @Post('search')
  @ApiOperation({ summary: '搜索文档' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchDocuments(@CurrentUser() user: User, @Body() searchDto: DocumentSearchDto) {
    return this.documentsService.searchDocuments(user.id, searchDto)
  }

  @Post('query')
  @ApiOperation({ summary: '基于文档内容查询' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async queryDocuments(@CurrentUser() user: User, @Body() queryDto: DocumentQueryDto) {
    return this.documentsService.queryDocuments(user.id, queryDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文档' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '文档不存在' })
  async deleteDocument(@CurrentUser() user: User, @Param('id') documentId: string) {
    return this.documentsService.deleteDocument(user.id, documentId)
  }

  /**
   * 解析文件内容
   */
  private async parseFileContent(file: Express.Multer.File): Promise<string> {
    const buffer = file.buffer
    const mimeType = file.mimetype

    try {
      switch (mimeType) {
        case 'text/plain':
        case 'text/csv':
        case 'text/markdown':
        case 'application/json':
          return buffer.toString('utf-8')

        case 'application/pdf':
          // 这里需要集成 PDF 解析库，暂时返回提示
          return 'PDF content parsing will be implemented with pdf-parse library'

        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          // 这里需要集成 Word 文档解析库，暂时返回提示
          return 'Word document content parsing will be implemented with mammoth library'

        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          // 这里需要集成 Excel 解析库，暂时返回提示
          return 'Excel content parsing will be implemented with xlsx library'

        default:
          throw new Error(`Unsupported file type: ${mimeType}`)
      }
    } catch (error) {
      throw new Error(`Failed to parse file content: ${error.message}`)
    }
  }
}
