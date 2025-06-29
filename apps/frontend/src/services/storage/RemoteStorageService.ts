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

      const response = await httpClient.get<{
        success: boolean
        data: { todos: Todo[]; total: number; page: number; limit: number; stats: TodoStats }
      }>(this.baseUrl)

      // 验证响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('服务器响应格式无效')
      }

      if (!response.success || !response.data) {
        throw new Error('服务器返回数据格式错误')
      }

      return this.createSuccessResult(response.data.todos || [])
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

      const response = await httpClient.get<{ success: boolean; data: Todo }>(
        `${this.baseUrl}/${id}`
      )

      // 验证响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('服务器响应格式无效')
      }

      if (!response.success || !response.data) {
        throw new Error('服务器返回数据格式错误')
      }

      return this.createSuccessResult(response.data)
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

      const response = await httpClient.post<{ success: boolean; data: Todo; timestamp: string }>(
        this.baseUrl,
        todoData
      )

      // 验证响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('服务器响应格式无效')
      }

      if (!response.success || !response.data) {
        throw new Error('服务器返回数据格式错误')
      }

      const todo = response.data

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

      const response = await httpClient.patch<{ success: boolean; data: Todo; timestamp: string }>(
        `${this.baseUrl}/${id}`,
        updates
      )

      // 验证响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('服务器响应格式无效')
      }

      if (!response.success || !response.data) {
        throw new Error('服务器返回数据格式错误')
      }

      const todo = response.data

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

      const response = await httpClient.get<{ success: boolean; data: TodoStats }>(
        `${this.baseUrl}/stats`
      )

      // 验证响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('服务器响应格式无效')
      }

      if (!response.success || !response.data) {
        throw new Error('服务器返回数据格式错误')
      }

      return this.createSuccessResult(response.data)
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
      priority: todo.priority,
      estimatedTime: todo.estimatedTime,
      dueDate: todo.dueDate,
    }))

    return this.createTodos(createDtos)
  }

  async saveTodos(todos: Todo[]): Promise<StorageOperationResult<void>> {
    try {
      if (!this._status.isOnline) {
        return this.createErrorResult('storage.networkUnavailable', true)
      }

      // 对于远程存储，保存所有 Todo 意味着批量更新
      const updates = todos.map((todo) => ({
        id: todo.id,
        data: {
          title: todo.title,
          description: todo.description,
          completed: todo.completed,
          priority: todo.priority,
          estimatedTime: todo.estimatedTime,
          dueDate: todo.dueDate,
          order: todo.order,
        } as UpdateTodoDto,
      }))

      const result = await this.updateTodos(updates)
      if (result.success) {
        return this.createSuccessResult(undefined)
      } else {
        return this.createErrorResult('批量保存失败')
      }
    } catch (error: unknown) {
      console.error('Failed to save todos to server:', error)
      return this.createErrorResult(this.getErrorMessage(error), this.isRetryableError(error))
    }
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

  override async syncData(): Promise<StorageOperationResult<void>> {
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
