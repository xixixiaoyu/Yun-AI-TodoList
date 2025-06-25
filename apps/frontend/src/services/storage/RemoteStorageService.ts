/**
 * 远程存储服务实现
 * 使用后端 API 存储 Todo 数据
 */

import type { CreateTodoDto, Todo, TodoStats, UpdateTodoDto } from '@shared/types'
import { httpClient } from '../api'
import {
  TodoStorageService,
  type BatchOperationResult,
  type StorageOperationResult,
} from './TodoStorageService'

export class RemoteStorageService extends TodoStorageService {
  private readonly baseUrl = '/api/v1/todos'

  constructor() {
    super()
    this.setStatus({
      isOnline: navigator.onLine,
      storageMode: 'remote',
      pendingOperations: 0,
    })

    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.setStatus({ isOnline: true })
    })

    window.addEventListener('offline', () => {
      this.setStatus({ isOnline: false })
    })
  }

  async getTodos(): Promise<StorageOperationResult<Todo[]>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      const response = await httpClient.get<{ todos: Todo[]; stats: TodoStats }>(this.baseUrl)
      return this.createSuccessResult(response.todos || [])
    } catch (error: unknown) {
      console.error('Failed to fetch todos from server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
  }

  async getTodo(id: string): Promise<StorageOperationResult<Todo>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      const todo = await httpClient.get<Todo>(`${this.baseUrl}/${id}`)
      return this.createSuccessResult(todo)
    } catch (error: unknown) {
      console.error('Failed to fetch todo from server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
  }

  async createTodo(todoData: CreateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      this.setStatus({ pendingOperations: this._status.pendingOperations + 1 })

      const todo = await httpClient.post<Todo>(this.baseUrl, todoData)

      this.setStatus({
        pendingOperations: Math.max(0, this._status.pendingOperations - 1),
        lastSyncTime: new Date(),
      })

      return this.createSuccessResult(todo)
    } catch (error: unknown) {
      this.setStatus({ pendingOperations: Math.max(0, this._status.pendingOperations - 1) })
      console.error('Failed to create todo on server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
  }

  async updateTodo(id: string, updates: UpdateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      this.setStatus({ pendingOperations: this._status.pendingOperations + 1 })

      const todo = await httpClient.patch<Todo>(`${this.baseUrl}/${id}`, updates)

      this.setStatus({
        pendingOperations: Math.max(0, this._status.pendingOperations - 1),
        lastSyncTime: new Date(),
      })

      return this.createSuccessResult(todo)
    } catch (error: unknown) {
      this.setStatus({ pendingOperations: Math.max(0, this._status.pendingOperations - 1) })
      console.error('Failed to update todo on server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
  }

  async deleteTodo(id: string): Promise<StorageOperationResult<void>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      this.setStatus({ pendingOperations: this._status.pendingOperations + 1 })

      await httpClient.delete(`${this.baseUrl}/${id}`)

      this.setStatus({
        pendingOperations: Math.max(0, this._status.pendingOperations - 1),
        lastSyncTime: new Date(),
      })

      return this.createSuccessResult(undefined)
    } catch (error: unknown) {
      this.setStatus({ pendingOperations: Math.max(0, this._status.pendingOperations - 1) })
      console.error('Failed to delete todo on server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
  }

  async createTodos(todosData: CreateTodoDto[]): Promise<BatchOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0

    // 并发创建，但限制并发数量
    const batchSize = 5
    for (let i = 0; i < todosData.length; i += batchSize) {
      const batch = todosData.slice(i, i + batchSize)
      const promises = batch.map(async (todoData) => {
        const result = await this.createTodo(todoData)
        if (result.success) {
          successCount++
        } else {
          errors.push({
            id: todoData.title,
            error: result.error || '创建失败',
          })
        }
      })

      await Promise.all(promises)
    }

    return this.createBatchErrorResult(successCount, errors)
  }

  async updateTodos(
    updates: Array<{ id: string; data: UpdateTodoDto }>
  ): Promise<BatchOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0

    // 并发更新，但限制并发数量
    const batchSize = 5
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      const promises = batch.map(async (update) => {
        const result = await this.updateTodo(update.id, update.data)
        if (result.success) {
          successCount++
        } else {
          errors.push({
            id: update.id,
            error: result.error || '更新失败',
          })
        }
      })

      await Promise.all(promises)
    }

    return this.createBatchErrorResult(successCount, errors)
  }

  async deleteTodos(ids: string[]): Promise<BatchOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0

    // 并发删除，但限制并发数量
    const batchSize = 5
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      const promises = batch.map(async (id) => {
        const result = await this.deleteTodo(id)
        if (result.success) {
          successCount++
        } else {
          errors.push({
            id,
            error: result.error || '删除失败',
          })
        }
      })

      await Promise.all(promises)
    }

    return this.createBatchErrorResult(successCount, errors)
  }

  async reorderTodos(
    reorders: Array<{ id: string; order: number }>
  ): Promise<StorageOperationResult<void>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      this.setStatus({ pendingOperations: this._status.pendingOperations + 1 })

      await httpClient.post(`${this.baseUrl}/reorder`, { reorders })

      this.setStatus({
        pendingOperations: Math.max(0, this._status.pendingOperations - 1),
        lastSyncTime: new Date(),
      })

      return this.createSuccessResult(undefined)
    } catch (error: unknown) {
      this.setStatus({ pendingOperations: Math.max(0, this._status.pendingOperations - 1) })
      console.error('Failed to reorder todos on server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
  }

  async getStats(): Promise<StorageOperationResult<TodoStats>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      const stats = await httpClient.get<TodoStats>(`${this.baseUrl}/stats`)
      return this.createSuccessResult(stats)
    } catch (error: unknown) {
      console.error('Failed to fetch stats from server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
  }

  async clearAll(): Promise<StorageOperationResult<void>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      // 先获取所有 Todo，然后批量删除
      const todosResult = await this.getTodos()
      if (!todosResult.success) {
        return todosResult as StorageOperationResult<void>
      }

      const ids = (todosResult.data || []).map((todo) => todo.id)
      if (ids.length === 0) {
        return this.createSuccessResult(undefined)
      }

      const deleteResult = await this.deleteTodos(ids)
      if (deleteResult.success) {
        return this.createSuccessResult(undefined)
      } else {
        return this.createErrorResult('清空数据失败')
      }
    } catch (error: unknown) {
      console.error('Failed to clear all todos on server:', error)
      return this.createErrorResult(this.getErrorMessage(error))
    }
  }

  async exportData(): Promise<StorageOperationResult<Todo[]>> {
    return this.getTodos()
  }

  async importData(todos: Todo[]): Promise<BatchOperationResult> {
    // 将 Todo 转换为 CreateTodoDto
    const createDtos: CreateTodoDto[] = todos.map((todo) => ({
      title: todo.title,
      description: todo.description,
      tags: todo.tags,
      priority: todo.priority,
      estimatedTime: todo.estimatedTime,
      dueDate: todo.dueDate,
    }))

    return this.createTodos(createDtos)
  }

  async checkHealth(): Promise<boolean> {
    try {
      if (!this._status.isOnline) {
        return false
      }

      // 简单的健康检查：获取统计信息
      const result = await this.getStats()
      return result.success
    } catch (error) {
      console.error('Remote storage health check failed:', error)
      return false
    }
  }

  async syncData(): Promise<StorageOperationResult<void>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      // 对于远程存储，同步就是刷新数据
      const result = await this.getTodos()
      if (result.success) {
        this.setStatus({ lastSyncTime: new Date() })
        return this.createSuccessResult(undefined)
      } else {
        return result as StorageOperationResult<void>
      }
    } catch (error: unknown) {
      console.error('Failed to sync data:', error)
      return this.createErrorResult(this.getErrorMessage(error))
    }
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response?: { data?: { message?: string } } }
      if (errorWithResponse.response?.data?.message) {
        return errorWithResponse.response.data.message
      }
    }
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string }
      return errorWithMessage.message
    }
    return 'storage.networkRequestFailed'
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: unknown): boolean {
    // 网络错误、超时错误、5xx 服务器错误可重试
    if (!error || typeof error !== 'object' || !('response' in error)) {
      return true // 网络错误
    }

    const errorWithResponse = error as { response?: { status?: number } }
    const status = errorWithResponse.response?.status
    if (typeof status !== 'number') {
      return true
    }
    return status >= 500 || status === 408 || status === 429
  }
}
