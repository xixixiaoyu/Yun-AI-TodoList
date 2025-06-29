/**
 * AI分析存储服务
 * 支持本地存储和云端同步的AI分析结果管理
 */

import type { AIAnalysis, CreateAIAnalysisDto, UpdateAIAnalysisDto } from '@shared/types'
import { httpClient } from '../api'
import {
  BaseHybridStorageService,
  type HybridStorageOptions,
  type HybridStorageResult,
} from './BaseHybridStorageService'

export class AIAnalysisStorageService extends BaseHybridStorageService<AIAnalysis> {
  private readonly baseUrl = '/api/v1/ai-analysis'
  private userId?: string

  constructor(userId?: string, options?: Partial<HybridStorageOptions>) {
    super(options)
    this.userId = userId
  }

  /**
   * 设置用户ID（登录后调用）
   */
  setUserId(userId: string): void {
    this.userId = userId
  }

  /**
   * 根据TodoID获取AI分析
   */
  async getAnalysisByTodoId(todoId: string): Promise<HybridStorageResult<AIAnalysis>> {
    try {
      const allAnalyses = await this.getLocalEntities()
      const analysis = allAnalyses.find((a) => a.todoId === todoId && a.userId === this.userId)

      if (!analysis) {
        return {
          success: false,
          error: 'Analysis not found',
        }
      }

      return {
        success: true,
        data: analysis,
        fromCache: true,
      }
    } catch (error) {
      console.error('Failed to get analysis by todo id:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 创建或更新AI分析
   */
  async saveAnalysis(
    todoId: string,
    analysisData: Omit<CreateAIAnalysisDto, 'todoId'>
  ): Promise<HybridStorageResult<AIAnalysis>> {
    try {
      const allAnalyses = await this.getLocalEntities()
      const existingAnalysis = allAnalyses.find(
        (a) => a.todoId === todoId && a.userId === this.userId
      )

      if (existingAnalysis) {
        // 更新现有分析
        return this.update(existingAnalysis.todoId, analysisData as Partial<AIAnalysis>)
      } else {
        // 创建新分析
        const createDto: CreateAIAnalysisDto = { todoId, ...analysisData }
        return this.create(createDto)
      }
    } catch (error) {
      console.error('Failed to save analysis:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取用户的所有AI分析
   */
  async getUserAnalyses(): Promise<HybridStorageResult<AIAnalysis[]>> {
    try {
      const allAnalyses = await this.getLocalEntities()
      const userAnalyses = allAnalyses.filter((a) => a.userId === this.userId)

      return {
        success: true,
        data: userAnalyses,
        fromCache: true,
      }
    } catch (error) {
      console.error('Failed to get user analyses:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 批量创建AI分析
   */
  async batchCreateAnalyses(
    analyses: CreateAIAnalysisDto[]
  ): Promise<HybridStorageResult<AIAnalysis[]>> {
    try {
      const results: AIAnalysis[] = []

      for (const analysisData of analyses) {
        const result = await this.saveAnalysis(analysisData.todoId, analysisData)
        if (result.success && result.data) {
          results.push(result.data)
        }
      }

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Failed to batch create analyses:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 删除AI分析（根据TodoID）
   */
  async deleteAnalysisByTodoId(todoId: string): Promise<HybridStorageResult<void>> {
    try {
      const allAnalyses = await this.getLocalEntities()
      const analysis = allAnalyses.find((a) => a.todoId === todoId && a.userId === this.userId)

      if (!analysis) {
        return {
          success: false,
          error: 'Analysis not found',
        }
      }

      return this.delete(analysis.todoId) // 使用todoId作为主键
    } catch (error) {
      console.error('Failed to delete analysis:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 清理孤立的AI分析（没有对应Todo的分析）
   */
  async cleanupOrphanedAnalyses(existingTodoIds: string[]): Promise<HybridStorageResult<number>> {
    try {
      const allAnalyses = await this.getLocalEntities()
      const userAnalyses = allAnalyses.filter((a) => a.userId === this.userId)
      const orphanedAnalyses = userAnalyses.filter((a) => !existingTodoIds.includes(a.todoId))

      let deletedCount = 0
      for (const analysis of orphanedAnalyses) {
        const result = await this.delete(analysis.todoId)
        if (result.success) {
          deletedCount++
        }
      }

      return {
        success: true,
        data: deletedCount,
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned analyses:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // 实现抽象方法
  protected getLocalStorageKey(): string {
    return 'ai_analyses'
  }

  protected getEntityType(): string {
    return 'ai_analysis'
  }

  protected validateEntity(entity: unknown): entity is AIAnalysis {
    if (typeof entity !== 'object' || entity === null) {
      return false
    }

    const obj = entity as Record<string, unknown>
    return (
      typeof obj.todoId === 'string' &&
      typeof obj.userId === 'string' &&
      typeof obj.analyzedAt === 'string' &&
      (obj.priority === undefined || typeof obj.priority === 'number') &&
      (obj.estimatedTime === undefined || typeof obj.estimatedTime === 'string') &&
      (obj.reasoning === undefined || typeof obj.reasoning === 'string')
    )
  }

  protected async createRemoteEntity(entity: AIAnalysis): Promise<HybridStorageResult<AIAnalysis>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const createDto: CreateAIAnalysisDto = {
        todoId: entity.todoId,
        priority: entity.priority,
        estimatedTime: entity.estimatedTime,
        reasoning: entity.reasoning,
      }

      const remoteAnalysis = await httpClient.post<AIAnalysis>(this.baseUrl, createDto)

      // 更新本地实体的同步状态
      await this.markAsSynced(entity.todoId)

      return {
        success: true,
        data: remoteAnalysis,
      }
    } catch (error: unknown) {
      console.error('Failed to create remote analysis:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected async updateRemoteEntity(
    todoId: string,
    updates: Partial<AIAnalysis>
  ): Promise<HybridStorageResult<AIAnalysis>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const updateDto: UpdateAIAnalysisDto = {
        priority: updates.priority,
        estimatedTime: updates.estimatedTime,
        reasoning: updates.reasoning,
      }

      const remoteAnalysis = await httpClient.patch<AIAnalysis>(
        `${this.baseUrl}/${todoId}`,
        updateDto
      )

      // 更新本地实体的同步状态
      await this.markAsSynced(todoId)

      return {
        success: true,
        data: remoteAnalysis,
      }
    } catch (error: unknown) {
      console.error('Failed to update remote analysis:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected async deleteRemoteEntity(todoId: string): Promise<HybridStorageResult<void>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      await httpClient.delete(`${this.baseUrl}/${todoId}`)

      return {
        success: true,
      }
    } catch (error: unknown) {
      console.error('Failed to delete remote analysis:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected async getRemoteEntities(): Promise<HybridStorageResult<AIAnalysis[]>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const analyses = await httpClient.get<AIAnalysis[]>(this.baseUrl)

      return {
        success: true,
        data: analyses || [],
      }
    } catch (error: unknown) {
      console.error('Failed to fetch remote analyses:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected override async fetchRemote(todoId: string): Promise<HybridStorageResult<AIAnalysis>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const response = await httpClient.get<{ success: boolean; data: AIAnalysis }>(
        `${this.baseUrl}/${todoId}`
      )

      // 验证响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('服务器响应格式无效')
      }

      if (!response.success || !response.data) {
        throw new Error('服务器返回数据格式错误')
      }

      return {
        success: true,
        data: response.data,
      }
    } catch (error: unknown) {
      console.error('Failed to fetch remote analysis:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  // 重写ID生成方法，使用todoId作为主键
  protected generateId(): string {
    // 对于AI分析，ID就是todoId，在create方法中会被正确设置
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 重写create方法以正确处理todoId作为主键
  override async create(
    entityData: Omit<AIAnalysis, 'analyzedAt' | keyof import('@shared/types').SyncableEntity>
  ): Promise<HybridStorageResult<AIAnalysis>> {
    try {
      // 1. 创建本地实体
      const now = new Date().toISOString()
      const entity: AIAnalysis = {
        ...entityData,
        todoId: (entityData as CreateAIAnalysisDto).todoId, // 确保todoId被正确设置
        userId: this.userId || '',
        analyzedAt: now,
        synced: false,
        lastSyncTime: undefined,
        syncError: undefined,
      }

      // 2. 保存到本地
      await this.saveLocalEntity(entity)

      // 3. 如果在线，排队同步
      if (this.isOnline) {
        this.queueSyncOperation('create', this.getEntityType(), entity.todoId, entity)
        this.processSyncQueue()
      }

      return {
        success: true,
        data: entity,
        syncPending: !this.isOnline,
      }
    } catch (error) {
      console.error('Failed to create entity:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // 辅助方法
  private async markAsSynced(todoId: string): Promise<void> {
    try {
      const entities = await this.getLocalEntities()
      const entityIndex = entities.findIndex((e) => e.todoId === todoId)

      if (entityIndex >= 0) {
        entities[entityIndex] = {
          ...entities[entityIndex],
          synced: true,
          lastSyncTime: new Date().toISOString(),
          syncError: undefined,
        }

        await this.saveLocalEntities(entities)
      }
    } catch (error) {
      console.error('Failed to mark entity as synced:', error)
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response
      if (response?.data?.message) {
        return response.data.message
      }
    }
    if (error instanceof Error) {
      return error.message
    }
    return 'Network request failed'
  }
}
