/**
 * 文档服务
 * 管理文档的存储、处理和检索
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import * as multer from 'multer'
import * as path from 'path'
import * as fs from 'fs/promises'

export interface CreateDocumentDto {
  filename: string
  fileType: string
  fileSize: number
  content: string
  metadata?: Record<string, any>
}

export interface DocumentSearchDto {
  query: string
  topK?: number
  threshold?: number
}

export interface DocumentQueryDto {
  query: string
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)
  private readonly uploadPath: string

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_DEST', './uploads')
    this.ensureUploadDirectory()
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath)
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true })
      this.logger.log(`Created upload directory: ${this.uploadPath}`)
    }
  }

  /**
   * 创建文档
   */
  async createDocument(userId: string, createDto: CreateDocumentDto) {
    try {
      const document = await this.prisma.document.create({
        data: {
          userId,
          filename: createDto.filename,
          fileType: createDto.fileType,
          fileSize: createDto.fileSize,
          content: createDto.content,
          metadata: createDto.metadata || {},
          processed: true, // 简化处理，直接标记为已处理
        },
      })

      this.logger.log(`Document created: ${document.id} - ${createDto.filename}`)

      return document
    } catch (error) {
      this.logger.error('Failed to create document:', error)
      throw error
    }
  }

  /**
   * 获取用户的文档列表
   */
  async getUserDocuments(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit

      const [documents, total] = await Promise.all([
        this.prisma.document.findMany({
          where: {
            userId,
            deletedAt: null,
          },
          select: {
            id: true,
            filename: true,
            fileType: true,
            fileSize: true,
            processed: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
            _count: {
              select: {
                chunks: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.document.count({
          where: {
            userId,
            deletedAt: null,
          },
        }),
      ])

      return {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      this.logger.error('Failed to get user documents:', error)
      throw error
    }
  }

  /**
   * 获取文档详情
   */
  async getDocument(userId: string, documentId: string) {
    try {
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId,
          deletedAt: null,
        },
        include: {
          chunks: {
            select: {
              id: true,
              chunkIndex: true,
              content: true,
              metadata: true,
            },
            orderBy: { chunkIndex: 'asc' },
          },
        },
      })

      if (!document) {
        throw new NotFoundException('Document not found')
      }

      return document
    } catch (error) {
      this.logger.error(`Failed to get document ${documentId}:`, error)
      throw error
    }
  }

  /**
   * 搜索文档
   */
  async searchDocuments(userId: string, searchDto: DocumentSearchDto) {
    try {
      const { query, topK = 5 } = searchDto

      // 基于文件名和内容的简单文本搜索
      const documents = await this.prisma.document.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            {
              filename: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          filename: true,
          fileType: true,
          content: true,
          createdAt: true,
          metadata: true,
        },
        take: topK,
        orderBy: { createdAt: 'desc' },
      })

      const results = documents.map((doc) => ({
        content: doc.content.substring(0, 200) + '...', // 返回内容摘要
        document: {
          id: doc.id,
          filename: doc.filename,
          fileType: doc.fileType,
          createdAt: doc.createdAt,
          metadata: doc.metadata,
        },
      }))

      this.logger.log(
        `Search completed for user ${userId}, query: "${query}", found ${results.length} results`
      )

      return {
        query,
        results,
        total: results.length,
      }
    } catch (error) {
      this.logger.error(`Failed to search documents for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * 基于文档查询
   */
  async queryDocuments(userId: string, queryDto: DocumentQueryDto) {
    try {
      const { query } = queryDto

      // 简单的文档搜索，返回相关文档内容
      const searchResults = await this.searchDocuments(userId, { query, topK: 3 })

      const answer =
        searchResults.results.length > 0
          ? `找到 ${searchResults.results.length} 个相关文档：\n${searchResults.results.map((r) => `- ${r.document.filename}: ${r.content}`).join('\n')}`
          : '未找到相关文档内容。'

      this.logger.log(`Document query completed for user ${userId}, query: "${query}"`)

      return {
        query,
        answer,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`Failed to query documents for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(userId: string, documentId: string) {
    try {
      // 验证文档所有权
      const document = await this.prisma.document.findFirst({
        where: {
          id: documentId,
          userId,
          deletedAt: null,
        },
      })

      if (!document) {
        throw new NotFoundException('Document not found')
      }

      // 软删除文档
      await this.prisma.document.update({
        where: { id: documentId },
        data: { deletedAt: new Date() },
      })

      this.logger.log(`Document deleted: ${documentId}`)

      return { message: 'Document deleted successfully' }
    } catch (error) {
      this.logger.error(`Failed to delete document ${documentId}:`, error)
      throw error
    }
  }

  /**
   * 获取文档统计信息
   */
  async getDocumentStats(userId: string) {
    try {
      const [totalDocuments, totalSize] = await Promise.all([
        this.prisma.document.count({
          where: { userId, deletedAt: null },
        }),
        this.prisma.document.aggregate({
          where: { userId, deletedAt: null },
          _sum: { fileSize: true },
        }),
      ])

      return {
        totalDocuments,
        processedDocuments: totalDocuments, // 所有文档都标记为已处理
        pendingDocuments: 0,
        totalSize: totalSize._sum.fileSize || 0,
      }
    } catch (error) {
      this.logger.error(`Failed to get document stats for user ${userId}:`, error)
      throw error
    }
  }
}
