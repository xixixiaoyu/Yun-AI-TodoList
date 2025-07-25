/**
 * 云端存储服务实现
 * 使用后端 API 存储 Todo 数据，支持网络错误处理和重试机制
 */

import type { CreateTodoDto, NetworkStatus, Todo, TodoStats, UpdateTodoDto } from '@shared/types'
import { httpClient } from '../api'
import {
  TodoStorageService,
  type BatchOperationResult,
  type StorageOperationResult,
} from './TodoStorageService'

export class RemoteStorageService extends TodoStorageService {
  private readonly baseUrl = '/api/v1/todos'
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // 1秒

  constructor() {
    super()
    this.initializeNetworkStatus()
    this.setupNetworkListeners()
  }

  private initializeNetworkStatus(): void {
    this.setStatus({
      networkStatus: {
        isOnline: navigator.onLine,
        isServerReachable: false,
        consecutiveFailures: 0,
      },
      pendingOperations: 0,
    })

    // 初始化时检查服务器连接
    this.checkServerReachability()
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.updateNetworkStatus({ isOnline: true })
      this.checkServerReachability()
    })

    window.addEventListener('offline', () => {
      this.updateNetworkStatus({
        isOnline: false,
        isServerReachable: false,
        consecutiveFailures: this._status.networkStatus.consecutiveFailures + 1,
      })
    })
  }

  private updateNetworkStatus(updates: Partial<NetworkStatus>): void {
    this.setStatus({
      networkStatus: { ...this._status.networkStatus, ...updates },
    })
  }

  private async checkServerReachability(): Promise<void> {
    try {
      // 使用正确的后端 API URL
      const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8888/api/v1'
      const healthUrl = `${apiBaseUrl}/health`

      const response = await fetch(healthUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5秒超时
      })

      this.updateNetworkStatus({
        isServerReachable: response.ok,
        consecutiveFailures: response.ok ? 0 : this._status.networkStatus.consecutiveFailures + 1,
        lastCheckTime: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Server reachability check failed:', error)
      this.updateNetworkStatus({
        isServerReachable: false,
        consecutiveFailures: this._status.networkStatus.consecutiveFailures + 1,
        lastCheckTime: new Date().toISOString(),
      })
    }
  }

  async checkNetworkStatus(): Promise<NetworkStatus> {
    await this.checkServerReachability()
    return this._status.networkStatus
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<StorageOperationResult<T>> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // 检查网络状态
        if (!this._status.networkStatus.isOnline) {
          return this.createErrorResult('网络连接不可用', true)
        }

        const result = await operation()

        // 操作成功，重置失败计数
        this.updateNetworkStatus({ consecutiveFailures: 0 })
        this.setStatus({ lastOperationTime: new Date() })

        return this.createSuccessResult(result)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // 更新失败计数
        this.updateNetworkStatus({
          consecutiveFailures: this._status.networkStatus.consecutiveFailures + 1,
        })

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt) // 指数退避
          continue
        }
      }
    }

    // 所有重试都失败了
    const isRetryable = this.isRetryableError(lastError as Error)
    return this.createErrorResult(
      `${operationName}失败: ${(lastError as Error).message}`,
      isRetryable
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private isRetryableError(error: Error): boolean {
    // 网络错误通常是可重试的
    return (
      error.name === 'TypeError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    )
  }

  async getTodos(): Promise<StorageOperationResult<Todo[]>> {
    return this.executeWithRetry(async () => {
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

      return response.data.todos || []
    }, '获取Todo列表')
  }

  async getTodo(id: string): Promise<StorageOperationResult<Todo>> {
    return this.executeWithRetry(async () => {
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

      return response.data
    }, `获取Todo(${id})`)
  }

  async createTodo(todoData: CreateTodoDto): Promise<StorageOperationResult<Todo>> {
    // 验证标题不能为空
    const trimmedTitle = todoData.title.trim()
    if (!trimmedTitle) {
      return this.createErrorResult('storage.todoTitleEmpty')
    }

    return this.executeWithRetry(async () => {
      // 添加调用栈信息来调试双重请求
      const stack = new Error().stack
      console.log('🔍 RemoteStorageService.createTodo called', {
        title: todoData.title,
        caller: stack?.split('\n')[2]?.trim() || 'unknown',
      })

      this.setStatus({ pendingOperations: this._status.pendingOperations + 1 })

      try {
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

        this.setStatus({
          pendingOperations: Math.max(0, this._status.pendingOperations - 1),
        })

        return response.data
      } catch (error) {
        this.setStatus({ pendingOperations: Math.max(0, this._status.pendingOperations - 1) })
        throw error
      }
    }, `创建Todo(${todoData.title})`)
  }

  async updateTodo(id: string, updates: UpdateTodoDto): Promise<StorageOperationResult<Todo>> {
    return this.executeWithRetry(async () => {
      this.setStatus({ pendingOperations: this._status.pendingOperations + 1 })

      try {
        const response = await httpClient.patch<{
          success: boolean
          data: Todo
          timestamp: string
        }>(`${this.baseUrl}/${id}`, updates)

        // 验证响应格式
        if (!response || typeof response !== 'object') {
          throw new Error('服务器响应格式无效')
        }

        if (!response.success || !response.data) {
          throw new Error('服务器返回数据格式错误')
        }

        this.setStatus({
          pendingOperations: Math.max(0, this._status.pendingOperations - 1),
        })

        return response.data
      } catch (error) {
        this.setStatus({ pendingOperations: Math.max(0, this._status.pendingOperations - 1) })
        throw error
      }
    }, `更新Todo(${id})`)
  }

  async deleteTodo(id: string): Promise<StorageOperationResult<void>> {
    return this.executeWithRetry(async () => {
      this.setStatus({ pendingOperations: this._status.pendingOperations + 1 })

      try {
        await httpClient.delete(`${this.baseUrl}/${id}`)

        this.setStatus({
          pendingOperations: Math.max(0, this._status.pendingOperations - 1),
        })

        return undefined
      } catch (error) {
        this.setStatus({ pendingOperations: Math.max(0, this._status.pendingOperations - 1) })
        throw error
      }
    }, `删除Todo(${id})`)
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

      // 转换数据格式以匹配后端 DTO
      const items = reorders.map(({ id, order }) => ({
        todoId: id,
        newOrder: order,
      }))

      await httpClient.post(`${this.baseUrl}/reorder`, { items })

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
    return this.executeWithRetry(async () => {
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

      return response.data
    }, '获取统计信息')
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
      await this.checkServerReachability()
      return this._status.networkStatus.isServerReachable
    } catch (error) {
      console.error('Cloud storage health check failed:', error)
      return false
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
}
