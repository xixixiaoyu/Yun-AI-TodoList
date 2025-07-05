/**
 * 文档服务 API 客户端
 * 提供文档上传、搜索、查询等功能
 */

import { httpClient } from './api'
import { handleError } from '@/utils/logger'
import type { ApiResponse } from '@/types/api'

export interface Document {
  id: string
  filename: string
  fileType: string
  fileSize: number
  processed: boolean
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface DocumentDetail extends Document {
  content: string
  chunks: DocumentChunk[]
}

export interface DocumentChunk {
  id: string
  chunkIndex: number
  content: string
  metadata?: Record<string, any>
}

export interface SearchResult {
  content: string
  score: number
  chunkIndex?: number
  metadata?: Record<string, any>
  document?: Document
}

export interface DocumentSearchResponse {
  query: string
  results: SearchResult[]
  total: number
}

export interface DocumentQueryResponse {
  query: string
  answer: string
  timestamp: string
}

export interface DocumentStats {
  totalDocuments: number
  processedDocuments: number
  pendingDocuments: number
  totalSize: number
  documentCount: number
  chunkCount: number
  indexSize: number
}

export interface DocumentListResponse {
  documents: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 上传文档
 */
export async function uploadDocument(file: File): Promise<ApiResponse<Document>> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await httpClient.post<{
      message: string
      document: Document
    }>('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return {
      success: true,
      data: response.document,
      message: response.message,
    }
  } catch (error) {
    handleError(error, 'DocumentService.uploadDocument')
    return {
      success: false,
      error: error instanceof Error ? error.message : '文档上传失败',
    }
  }
}

/**
 * 获取用户文档列表
 */
export async function getUserDocuments(
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<DocumentListResponse>> {
  try {
    const response = await httpClient.get<DocumentListResponse>('/api/v1/documents', {
      params: { page, limit },
    })

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.getUserDocuments')
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取文档列表失败',
    }
  }
}

/**
 * 获取文档详情
 */
export async function getDocument(documentId: string): Promise<ApiResponse<DocumentDetail>> {
  try {
    const response = await httpClient.get<DocumentDetail>(`/api/v1/documents/${documentId}`)

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.getDocument')
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取文档详情失败',
    }
  }
}

/**
 * 搜索文档
 */
export async function searchDocuments(
  query: string,
  topK: number = 5,
  threshold: number = 0.7
): Promise<ApiResponse<DocumentSearchResponse>> {
  try {
    const response = await httpClient.post<DocumentSearchResponse>('/api/v1/documents/search', {
      query,
      topK,
      threshold,
    })

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.searchDocuments')
    return {
      success: false,
      error: error instanceof Error ? error.message : '文档搜索失败',
    }
  }
}

/**
 * 基于文档内容查询
 */
export async function queryDocuments(query: string): Promise<ApiResponse<DocumentQueryResponse>> {
  try {
    const response = await httpClient.post<DocumentQueryResponse>('/api/v1/documents/query', {
      query,
    })

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.queryDocuments')
    return {
      success: false,
      error: error instanceof Error ? error.message : '文档查询失败',
    }
  }
}

/**
 * 删除文档
 */
export async function deleteDocument(
  documentId: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await httpClient.delete<{ message: string }>(`/api/v1/documents/${documentId}`)

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.deleteDocument')
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除文档失败',
    }
  }
}

/**
 * 获取文档统计信息
 */
export async function getDocumentStats(): Promise<ApiResponse<DocumentStats>> {
  try {
    const response = await httpClient.get<DocumentStats>('/api/v1/documents/stats')

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.getDocumentStats')
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取文档统计失败',
    }
  }
}

/**
 * 基于文档的 AI 分析
 */
export async function createDocumentBasedAnalysis(
  todoId: string,
  query?: string
): Promise<ApiResponse<any>> {
  try {
    const response = await httpClient.post(`/api/v1/ai-analysis/document-based/${todoId}`, {
      query,
    })

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.createDocumentBasedAnalysis')
    return {
      success: false,
      error: error instanceof Error ? error.message : '基于文档的 AI 分析失败',
    }
  }
}

/**
 * 批量基于文档的 AI 分析
 */
export async function batchDocumentBasedAnalysis(todoIds: string[]): Promise<ApiResponse<any>> {
  try {
    const response = await httpClient.post('/api/v1/ai-analysis/batch-document-based', {
      todoIds,
    })

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    handleError(error, 'DocumentService.batchDocumentBasedAnalysis')
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量文档 AI 分析失败',
    }
  }
}
