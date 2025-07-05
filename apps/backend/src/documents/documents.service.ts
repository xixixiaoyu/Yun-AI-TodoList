/**
 * 文档服务
 * 管理文档的存储、处理和检索
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import { LlamaIndexService, DocumentProcessingResult } from './llamaindex.service'
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
    private readonly llamaIndexService: LlamaIndexService,
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
      // 1. 保存文档到数据库
      const document = await this.prisma.document.create({
        data: {
          userId,
          filename: createDto.filename,
          fileType: createDto.fileType,
          fileSize: createDto.fileSize,
          content: createDto.content,
          metadata: createDto.metadata || {},
          processed: false,
        },
      })

      // 2. 异步处理文档（向量化）
      this.processDocumentAsync(
        document.id,
        createDto.content,
        createDto.filename,
        createDto.metadata
      )

      this.logger.log(`Document created: ${document.id} - ${createDto.filename}`)

      return document
    } catch (error) {
      this.logger.error('Failed to create document:', error)
      throw error
    }
  }

  /**
   * 异步处理文档
   */
  private async processDocumentAsync(
    documentId: string,
    content: string,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // 使用 LlamaIndex 处理文档
      const result: DocumentProcessingResult = await this.llamaIndexService.processDocument(
        content,
        filename,
        { documentId, ...metadata }
      )

      if (result.success && result.chunks) {
        // 保存分块到数据库
        const chunkData = result.chunks.map((chunk, index) => ({
          documentId,
          chunkIndex: index,
          content: chunk.content,
          embedding: chunk.embedding ? JSON.stringify(chunk.embedding) : null,
          metadata: chunk.metadata || {},
        }))

        await this.prisma.documentChunk.createMany({
          data: chunkData,
        })

        // 更新文档处理状态
        await this.prisma.document.update({
          where: { id: documentId },
          data: { processed: true },
        })

        this.logger.log(`Document processed successfully: ${documentId}`)
      } else {
        this.logger.error(`Failed to process document ${documentId}: ${result.error}`)
      }
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}:`, error)
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
      const { query, topK = 5, threshold = 0.7 } = searchDto

      // 使用 LlamaIndex 进行语义搜索
      const searchResults = await this.llamaIndexService.searchDocuments(query, topK, threshold)

      // 获取相关文档的详细信息
      const documentIds = searchResults
        .map((result) => result.metadata?.documentId)
        .filter((id) => id)

      const documents = await this.prisma.document.findMany({
        where: {
          id: { in: documentIds },
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
          filename: true,
          fileType: true,
          createdAt: true,
          metadata: true,
        },
      })

      // 合并搜索结果和文档信息
      const results = searchResults.map((result) => {
        const document = documents.find((doc) => doc.id === result.metadata?.documentId)
        return {
          ...result,
          document,
        }
      })

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

      // 使用 LlamaIndex 进行文档查询
      const answer = await this.llamaIndexService.queryDocuments(query)

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

      // 从 LlamaIndex 索引中删除
      await this.llamaIndexService.removeDocument(documentId)

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
      const [totalDocuments, processedDocuments, totalSize] = await Promise.all([
        this.prisma.document.count({
          where: { userId, deletedAt: null },
        }),
        this.prisma.document.count({
          where: { userId, deletedAt: null, processed: true },
        }),
        this.prisma.document.aggregate({
          where: { userId, deletedAt: null },
          _sum: { fileSize: true },
        }),
      ])

      const indexStats = await this.llamaIndexService.getIndexStats()

      return {
        totalDocuments,
        processedDocuments,
        pendingDocuments: totalDocuments - processedDocuments,
        totalSize: totalSize._sum.fileSize || 0,
        ...indexStats,
      }
    } catch (error) {
      this.logger.error(`Failed to get document stats for user ${userId}:`, error)
      throw error
    }
  }
}
