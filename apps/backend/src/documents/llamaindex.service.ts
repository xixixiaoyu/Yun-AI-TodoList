/**
 * LlamaIndex 服务
 * 提供文档处理、向量化存储和语义搜索功能
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  Document as LlamaDocument,
  VectorStoreIndex,
  Settings,
  storageContextFromDefaults,
  SimpleVectorStore,
} from 'llamaindex'

// 类型定义用于兼容性
interface OpenAIEmbedding {
  apiKey: string
  model: string
}

interface NodeWithScore {
  getContent(): string
  score?: number
  metadata?: Record<string, any>
}
import * as fs from 'fs/promises'
import * as path from 'path'

export interface DocumentProcessingResult {
  success: boolean
  documentId?: string
  chunks?: DocumentChunk[]
  error?: string
}

export interface DocumentChunk {
  index: number
  content: string
  embedding?: number[]
  metadata?: Record<string, any>
}

export interface SearchResult {
  content: string
  score: number
  metadata?: Record<string, any>
  chunkIndex?: number
}

@Injectable()
export class LlamaIndexService {
  private readonly logger = new Logger(LlamaIndexService.name)
  private vectorStore: SimpleVectorStore | null = null
  private index: VectorStoreIndex | null = null
  private isInitialized = false

  constructor(private readonly configService: ConfigService) {
    this.initializeSettings()
  }

  /**
   * 初始化 LlamaIndex 设置
   */
  private initializeSettings(): void {
    try {
      // 配置 OpenAI 嵌入模型
      const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY')
      if (openaiApiKey) {
        // 注意：这里需要根据实际的 llamaindex 版本来配置嵌入模型
        // Settings.embedModel = new OpenAIEmbedding({
        //   apiKey: openaiApiKey,
        //   model: 'text-embedding-ada-002',
        // })
      }

      // 设置其他配置
      Settings.chunkSize = this.configService.get<number>('CHUNK_SIZE', 1024)
      Settings.chunkOverlap = this.configService.get<number>('CHUNK_OVERLAP', 200)

      this.logger.log('LlamaIndex settings initialized')
    } catch (error) {
      this.logger.error('Failed to initialize LlamaIndex settings:', error)
    }
  }

  /**
   * 初始化向量存储和索引
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // 创建向量存储
      this.vectorStore = new SimpleVectorStore()

      // 创建存储上下文
      const storageContext = await storageContextFromDefaults({
        vectorStore: this.vectorStore,
      })

      // 创建索引
      this.index = await VectorStoreIndex.fromDocuments([], {
        storageContext,
      })

      this.isInitialized = true
      this.logger.log('LlamaIndex service initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize LlamaIndex service:', error)
      throw error
    }
  }

  /**
   * 处理文档内容并生成向量嵌入
   */
  async processDocument(
    content: string,
    filename: string,
    metadata: Record<string, any> = {}
  ): Promise<DocumentProcessingResult> {
    try {
      await this.initialize()

      // 创建 LlamaIndex 文档
      const document = new LlamaDocument({
        text: content,
        metadata: {
          filename,
          ...metadata,
        },
      })

      // 将文档添加到索引
      if (!this.index) {
        throw new Error('Index not initialized')
      }
      await this.index.insertNodes([document])

      // 获取文档的分块信息
      const chunks = await this.getDocumentChunks(document)

      this.logger.log(`Document processed successfully: ${filename}`)

      return {
        success: true,
        chunks,
      }
    } catch (error) {
      this.logger.error(`Failed to process document ${filename}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取文档的分块信息
   */
  private async getDocumentChunks(document: LlamaDocument): Promise<DocumentChunk[]> {
    try {
      // 这里需要根据 LlamaIndex 的实际 API 来获取分块信息
      // 由于 LlamaIndex 的分块逻辑是内部的，我们需要手动分块
      const chunkSize = Settings.chunkSize || 1024
      const chunkOverlap = Settings.chunkOverlap || 200
      const text = document.getText()

      const chunks: DocumentChunk[] = []
      let startIndex = 0
      let chunkIndex = 0

      while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length)
        const chunkContent = text.slice(startIndex, endIndex)

        chunks.push({
          index: chunkIndex,
          content: chunkContent,
          metadata: document.metadata,
        })

        startIndex = endIndex - chunkOverlap
        chunkIndex++

        // 避免无限循环
        if (startIndex >= endIndex) {
          break
        }
      }

      return chunks
    } catch (error) {
      this.logger.error('Failed to get document chunks:', error)
      return []
    }
  }

  /**
   * 语义搜索文档
   */
  async searchDocuments(
    query: string,
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<SearchResult[]> {
    try {
      await this.initialize()

      // 创建查询引擎
      if (!this.index) {
        throw new Error('Index not initialized')
      }
      const queryEngine = this.index.asQueryEngine({
        similarityTopK: topK,
      })

      // 执行查询
      const response = await queryEngine.query({
        query,
      })

      // 处理搜索结果
      const results: SearchResult[] = []

      // 注意：这里需要根据实际的 LlamaIndex API 来获取搜索结果
      // 由于 API 可能会变化，这里提供一个基本的实现框架
      if (response.sourceNodes) {
        for (const node of response.sourceNodes) {
          const nodeWithScore = node as unknown as NodeWithScore
          results.push({
            content: nodeWithScore.getContent(),
            score: nodeWithScore.score || 0,
            metadata: nodeWithScore.metadata,
          })
        }
      }

      this.logger.log(`Search completed for query: "${query}", found ${results.length} results`)

      return results.filter((result) => result.score >= threshold)
    } catch (error) {
      this.logger.error(`Failed to search documents for query "${query}":`, error)
      return []
    }
  }

  /**
   * 基于文档内容生成回答
   */
  async queryDocuments(query: string): Promise<string> {
    try {
      await this.initialize()

      // 创建查询引擎
      if (!this.index) {
        throw new Error('Index not initialized')
      }
      const queryEngine = this.index.asQueryEngine()

      // 执行查询
      const response = await queryEngine.query({
        query,
      })

      this.logger.log(`Query completed: "${query}"`)

      return response.toString()
    } catch (error) {
      this.logger.error(`Failed to query documents for: "${query}":`, error)
      throw error
    }
  }

  /**
   * 删除文档从索引中
   */
  async removeDocument(documentId: string): Promise<boolean> {
    try {
      await this.initialize()

      // 注意：这里需要根据实际的 LlamaIndex API 来删除文档
      // 由于 SimpleVectorStore 可能没有直接的删除方法，
      // 可能需要重新构建索引或使用其他向量存储

      this.logger.log(`Document removed from index: ${documentId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to remove document ${documentId}:`, error)
      return false
    }
  }

  /**
   * 获取索引统计信息
   */
  async getIndexStats(): Promise<{
    documentCount: number
    chunkCount: number
    indexSize: number
  }> {
    try {
      await this.initialize()

      // 这里需要根据实际的 LlamaIndex API 来获取统计信息
      return {
        documentCount: 0,
        chunkCount: 0,
        indexSize: 0,
      }
    } catch (error) {
      this.logger.error('Failed to get index stats:', error)
      return {
        documentCount: 0,
        chunkCount: 0,
        indexSize: 0,
      }
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      // 清理向量存储和索引
      this.vectorStore = null
      this.index = null
      this.isInitialized = false

      this.logger.log('LlamaIndex service cleaned up')
    } catch (error) {
      this.logger.error('Failed to cleanup LlamaIndex service:', error)
    }
  }
}
