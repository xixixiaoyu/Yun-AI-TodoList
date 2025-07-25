/**
 * 数据同步服务
 * 处理本地数据与云端数据的同步逻辑
 */

import type { Todo as ServerTodo } from '@shared/types'
import type { Todo as LocalTodo } from '../types/todo'
import {
  createUpdateTodoDto,
  DEFAULT_MERGE_STRATEGY,
  localTodosToServer,
  mergeTodoData,
  serverTodosToLocal,
  type MergeStrategy,
} from '../utils/dataTransform'
import { ApiError, httpClient } from './api'

/**
 * 同步状态枚举
 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  CONFLICT = 'conflict',
}

/**
 * 同步结果接口
 */
export interface SyncResult {
  status: SyncStatus
  message: string
  timestamp: Date
  stats: {
    totalItems: number
    uploaded: number
    downloaded: number
    conflicts: number
    errors: number
  }
  conflicts?: Array<{
    local: LocalTodo
    server: ServerTodo
    reason: string
  }>
  errors?: string[]
}

/**
 * 同步配置接口
 */
export interface SyncConfig {
  mergeStrategy: MergeStrategy
  batchSize: number
  retryAttempts: number
  retryDelay: number
  enableConflictResolution: boolean
}

/**
 * 默认同步配置
 */
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  mergeStrategy: DEFAULT_MERGE_STRATEGY,
  batchSize: 50,
  retryAttempts: 3,
  retryDelay: 1000,
  enableConflictResolution: true,
}

/**
 * 数据同步服务类
 */
class SyncService {
  private readonly baseEndpoint = '/api/v1/todos'
  private config: SyncConfig = DEFAULT_SYNC_CONFIG
  private isOnline = navigator.onLine
  private syncInProgress = false

  constructor() {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('Network connection restored')
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('Network connection lost')
    })
  }

  /**
   * 更新同步配置
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 检查是否可以同步
   */
  canSync(): boolean {
    return this.isOnline && !this.syncInProgress
  }

  /**
   * 获取所有云端 Todo 数据
   */
  private async fetchServerTodos(): Promise<ServerTodo[]> {
    try {
      // 后端返回的是 {success: boolean, data: {todos: Todo[], total: number, page?: number, limit?: number, stats: TodoStats}} 格式
      const response = await httpClient.get<{
        success: boolean
        data: {
          todos: ServerTodo[]
          total: number
          page?: number
          limit?: number
          stats?: Record<string, unknown>
        }
      }>(this.baseEndpoint)

      // 验证响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('服务器响应格式无效')
      }

      if (!response.success || !response.data) {
        throw new Error('服务器返回数据格式错误')
      }

      if (!Array.isArray(response.data.todos)) {
        throw new Error('服务器返回数据格式错误')
      }

      return response.data.todos
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error('用户未登录或令牌已过期')
      }
      throw new Error(`获取云端数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量上传 Todo 数据到服务器
   */
  private async uploadTodos(todos: LocalTodo[]): Promise<ServerTodo[]> {
    const uploaded: ServerTodo[] = []
    const errors: string[] = []

    // 分批上传
    for (let i = 0; i < todos.length; i += this.config.batchSize) {
      const batch = todos.slice(i, i + this.config.batchSize)

      try {
        const createDtos = localTodosToServer(batch)

        // 批量创建（如果后端支持批量接口）
        // 暂时使用单个创建的方式
        const batchResults: ServerTodo[] = []
        for (const createDto of createDtos) {
          const response = await httpClient.post<{ success: boolean; data: ServerTodo }>(
            this.baseEndpoint,
            createDto
          )
          if (!response.success || !response.data) {
            throw new Error('服务器响应格式无效')
          }
          batchResults.push(response.data)
        }
        const response = batchResults

        uploaded.push(...response)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '批量上传失败'
        errors.push(`批次 ${Math.floor(i / this.config.batchSize) + 1}: ${errorMsg}`)

        // 如果批量失败，尝试单个上传
        for (const todo of batch) {
          try {
            const createDto = localTodosToServer([todo])[0]
            const response = await httpClient.post<{ success: boolean; data: ServerTodo }>(
              this.baseEndpoint,
              createDto
            )
            if (response.success && response.data) {
              uploaded.push(response.data)
            }
          } catch (singleError) {
            const singleErrorMsg =
              singleError instanceof Error ? singleError.message : '单个上传失败'
            errors.push(`Todo "${todo.title}": ${singleErrorMsg}`)
          }
        }
      }
    }

    if (errors.length > 0) {
      console.warn('部分上传失败:', errors)
    }

    return uploaded
  }

  /**
   * 批量更新 Todo 数据到服务器
   */
  private async updateTodos(todos: Array<{ id: string; data: LocalTodo }>): Promise<ServerTodo[]> {
    const updated: ServerTodo[] = []
    const errors: string[] = []

    for (const { id, data } of todos) {
      try {
        const updateDto = createUpdateTodoDto(data)
        const response = await httpClient.put<{ success: boolean; data: ServerTodo }>(
          `${this.baseEndpoint}/${id}`,
          updateDto
        )
        if (!response.success || !response.data) {
          throw new Error('服务器响应格式无效')
        }
        updated.push(response.data)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '更新失败'
        errors.push(`Todo "${data.title}" (ID: ${id}): ${errorMsg}`)
      }
    }

    if (errors.length > 0) {
      console.warn('部分更新失败:', errors)
    }

    return updated
  }

  /**
   * 执行完整的数据同步
   */
  async syncData(localTodos: LocalTodo[]): Promise<SyncResult> {
    if (!this.canSync()) {
      return {
        status: SyncStatus.ERROR,
        message: this.isOnline ? '同步正在进行中' : '网络连接不可用',
        timestamp: new Date(),
        stats: {
          totalItems: 0,
          uploaded: 0,
          downloaded: 0,
          conflicts: 0,
          errors: 1,
        },
        errors: [this.isOnline ? '同步正在进行中' : '网络连接不可用'],
      }
    }

    this.syncInProgress = true
    const startTime = Date.now()

    try {
      console.log('开始数据同步...')

      // 1. 获取服务器数据
      const serverTodos = await this.fetchServerTodos()
      console.log(`获取到 ${serverTodos.length} 条云端数据`)

      // 2. 合并数据
      const mergeResult = mergeTodoData(localTodos, serverTodos, this.config.mergeStrategy)
      console.log('数据合并完成:', {
        merged: mergeResult.merged.length,
        toUpload: mergeResult.toUpload.length,
        conflicts: mergeResult.conflicts.length,
      })

      // 3. 过滤掉最近创建的 Todo（避免双重上传）
      const recentlyCreatedThreshold = 5000 // 5秒内创建的认为是最近创建的
      console.log(`开始过滤最近创建的 Todo，阈值：${recentlyCreatedThreshold}ms`)
      console.log(`待上传的 Todo 数量：${mergeResult.toUpload.length}`)

      const filteredToUpload = mergeResult.toUpload.filter((todo) => {
        const createdTime = new Date(todo.createdAt).getTime()
        const currentTime = Date.now()
        const timeDiff = currentTime - createdTime
        const isRecent = timeDiff < recentlyCreatedThreshold

        console.log(
          `Todo "${todo.title}": 创建时间=${new Date(todo.createdAt).toISOString()}, 时间差=${timeDiff}ms, 是否最近创建=${isRecent}`
        )

        if (isRecent) {
          console.log(`🚫 跳过最近创建的 Todo "${todo.title}"，避免双重上传`)
          return false
        }
        console.log(`✅ 允许上传 Todo "${todo.title}"`)
        return true
      })

      console.log(`过滤后待上传的 Todo 数量：${filteredToUpload.length}`)

      // 4. 上传过滤后的本地独有数据
      let uploadedCount = 0
      if (filteredToUpload.length > 0) {
        const uploaded = await this.uploadTodos(filteredToUpload)
        uploadedCount = uploaded.length
        console.log(`上传了 ${uploadedCount} 条数据`)
      }

      // 5. 计算统计信息
      const stats = {
        totalItems: mergeResult.merged.length,
        uploaded: uploadedCount,
        downloaded: serverTodos.length,
        conflicts: mergeResult.conflicts.length,
        errors: 0,
      }

      const duration = Date.now() - startTime
      console.log(`同步完成，耗时 ${duration}ms`)

      // 5. 返回结果
      const result: SyncResult = {
        status: mergeResult.conflicts.length > 0 ? SyncStatus.CONFLICT : SyncStatus.SUCCESS,
        message:
          mergeResult.conflicts.length > 0
            ? `同步完成，但有 ${mergeResult.conflicts.length} 个冲突需要处理`
            : '同步成功完成',
        timestamp: new Date(),
        stats,
        conflicts: mergeResult.conflicts.length > 0 ? mergeResult.conflicts : undefined,
      }

      return result
    } catch (error) {
      console.error('同步失败:', error)

      return {
        status: SyncStatus.ERROR,
        message: error instanceof Error ? error.message : '同步过程中发生未知错误',
        timestamp: new Date(),
        stats: {
          totalItems: 0,
          uploaded: 0,
          downloaded: 0,
          conflicts: 0,
          errors: 1,
        },
        errors: [error instanceof Error ? error.message : '未知错误'],
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * 仅下载服务器数据（不上传本地数据）
   */
  async downloadData(): Promise<{ todos: LocalTodo[]; error?: string }> {
    if (!this.isOnline) {
      return { todos: [], error: '网络连接不可用' }
    }

    try {
      const serverTodos = await this.fetchServerTodos()
      const localTodos = serverTodosToLocal(serverTodos)

      return { todos: localTodos }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '下载数据失败'
      return { todos: [], error: errorMsg }
    }
  }

  /**
   * 仅上传本地数据（不下载服务器数据）
   */
  async uploadData(
    localTodos: LocalTodo[]
  ): Promise<{ success: boolean; uploaded: number; errors: string[] }> {
    if (!this.isOnline) {
      return { success: false, uploaded: 0, errors: ['网络连接不可用'] }
    }

    try {
      const uploaded = await this.uploadTodos(localTodos)
      return {
        success: true,
        uploaded: uploaded.length,
        errors: uploaded.length < localTodos.length ? ['部分数据上传失败'] : [],
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '上传数据失败'
      return { success: false, uploaded: 0, errors: [errorMsg] }
    }
  }

  /**
   * 单个更新 Todo 到服务器
   */
  async updateSingleTodo(
    todo: LocalTodo
  ): Promise<{ success: boolean; data?: ServerTodo; error?: string }> {
    if (!this.isOnline) {
      return { success: false, error: '网络连接不可用' }
    }

    try {
      const updateDto = createUpdateTodoDto(todo)
      const response = await httpClient.put<{ success: boolean; data: ServerTodo }>(
        `${this.baseEndpoint}/${todo.id}`,
        updateDto
      )

      if (!response.success || !response.data) {
        throw new Error('服务器响应格式无效')
      }

      console.log(`成功更新单个 Todo: ${todo.title} (ID: ${todo.id})`)
      return { success: true, data: response.data }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '更新失败'
      console.error(`更新 Todo 失败: ${todo.title} (ID: ${todo.id})`, error)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    }
  }
}

// 创建单例实例
export const syncService = new SyncService()

// 导出类型
export type { MergeStrategy }
