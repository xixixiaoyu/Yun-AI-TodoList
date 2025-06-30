/**
 * AI 分析 API 服务
 * 与后端 AI 分析接口交互
 */

import type { AIAnalysis, AIAnalysisResult } from '@shared/types'
import { apiClient } from './apiClient'

export interface CreateAIAnalysisRequest {
  todoId: string
  priority?: number
  estimatedTime?: string
  reasoning?: string
  modelName?: string
  modelVersion?: string
  analysisType?: string
  inputText: string
  rawResponse?: string
}

export interface UpdateAIAnalysisRequest {
  priority?: number
  estimatedTime?: string
  reasoning?: string
}

export interface AIAnalysisStats {
  totalAnalyses: number
  recentAnalyses: number
  analysisByType: Array<{
    type: string
    count: number
  }>
  analysisByModel: Array<{
    model: string
    count: number
  }>
}

/**
 * AI 分析 API 服务类
 */
export class AIAnalysisApiService {
  /**
   * 创建 AI 分析记录
   */
  static async createAnalysis(data: CreateAIAnalysisRequest): Promise<AIAnalysis> {
    const response = await apiClient.post('/ai-analysis', data)
    return response.data
  }

  /**
   * 获取 Todo 的最新 AI 分析
   */
  static async getLatestAnalysis(todoId: string): Promise<AIAnalysis | null> {
    try {
      const response = await apiClient.get(`/ai-analysis/todo/${todoId}/latest`)
      return response.data
    } catch (error: unknown) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * 获取 Todo 的 AI 分析历史
   */
  static async getAnalysisHistory(todoId: string): Promise<AIAnalysis[]> {
    const response = await apiClient.get(`/ai-analysis/todo/${todoId}/history`)
    return response.data
  }

  /**
   * 获取用户的所有 AI 分析
   */
  static async getUserAnalyses(limit = 50, offset = 0): Promise<AIAnalysis[]> {
    const response = await apiClient.get('/ai-analysis/user', {
      params: { limit, offset },
    })
    return response.data
  }

  /**
   * 获取 AI 分析统计
   */
  static async getAnalysisStats(): Promise<AIAnalysisStats> {
    const response = await apiClient.get('/ai-analysis/stats')
    return response.data
  }

  /**
   * 更新 AI 分析
   */
  static async updateAnalysis(
    analysisId: string,
    data: UpdateAIAnalysisRequest
  ): Promise<AIAnalysis> {
    const response = await apiClient.put(`/ai-analysis/${analysisId}`, data)
    return response.data
  }

  /**
   * 删除 AI 分析
   */
  static async deleteAnalysis(analysisId: string): Promise<void> {
    await apiClient.delete(`/ai-analysis/${analysisId}`)
  }

  /**
   * 清理旧的 AI 分析记录
   */
  static async cleanupOldAnalyses(keepDays = 90): Promise<{ deletedCount: number }> {
    const response = await apiClient.post('/ai-analysis/cleanup', null, {
      params: { keepDays },
    })
    return response.data
  }

  /**
   * 批量创建 AI 分析记录
   */
  static async batchCreateAnalyses(analyses: CreateAIAnalysisRequest[]): Promise<AIAnalysis[]> {
    const results = await Promise.allSettled(
      analyses.map((analysis) => this.createAnalysis(analysis))
    )

    const successful: AIAnalysis[] = []
    const failed: { index: number; error: unknown }[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value)
      } else {
        failed.push({
          index,
          error: result.reason,
          data: analyses[index],
        })
      }
    })

    if (failed.length > 0) {
      console.warn('Some AI analyses failed to create:', failed)
    }

    return successful
  }

  /**
   * 获取 Todo 的分析摘要
   */
  static async getTodoAnalysisSummary(todoId: string): Promise<{
    hasAnalysis: boolean
    latestAnalysis?: AIAnalysis
    analysisCount: number
  }> {
    try {
      const [latestAnalysis, history] = await Promise.all([
        this.getLatestAnalysis(todoId),
        this.getAnalysisHistory(todoId),
      ])

      return {
        hasAnalysis: latestAnalysis !== null,
        latestAnalysis: latestAnalysis || undefined,
        analysisCount: history.length,
      }
    } catch (error) {
      console.error('Failed to get todo analysis summary:', error)
      return {
        hasAnalysis: false,
        analysisCount: 0,
      }
    }
  }

  /**
   * 检查分析结果的质量
   */
  static validateAnalysisQuality(analysis: AIAnalysisResult): {
    isValid: boolean
    issues: string[]
    score: number
  } {
    const issues: string[] = []
    let score = 100

    // 检查优先级
    if (!analysis.priority || analysis.priority < 1 || analysis.priority > 5) {
      issues.push('优先级应该在 1-5 之间')
      score -= 20
    }

    // 检查时间估算
    if (!analysis.estimatedTime || analysis.estimatedTime.trim() === '') {
      issues.push('缺少时间估算')
      score -= 15
    }

    // 检查推理过程
    if (!analysis.reasoning || analysis.reasoning.trim().length < 10) {
      issues.push('推理过程过于简单')
      score -= 15
    }

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, score),
    }
  }
}
