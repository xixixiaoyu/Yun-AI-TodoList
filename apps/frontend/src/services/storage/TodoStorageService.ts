/**
 * Todo 存储服务抽象接口
 * 定义统一的云端存储操作接口
 */

import type { CreateTodoDto, NetworkStatus, Todo, TodoStats, UpdateTodoDto } from '@shared/types'

export interface StorageOperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  retryable?: boolean
}

export interface BatchOperationResult {
  success: boolean
  successCount: number
  failureCount: number
  errors: Array<{ id: string; error: string }>
}

export interface CloudStorageStatus {
  networkStatus: NetworkStatus
  lastOperationTime?: Date
  pendingOperations: number
}

/**
 * Todo 存储服务抽象基类
 */
export abstract class TodoStorageService {
  protected _status: CloudStorageStatus = {
    networkStatus: {
      isOnline: navigator.onLine,
      isServerReachable: false,
      consecutiveFailures: 0,
    },
    pendingOperations: 0,
  }

  /**
   * 获取存储状态
   */
  get status(): CloudStorageStatus {
    return { ...this._status }
  }

  /**
   * 获取所有 Todo
   */
  abstract getTodos(): Promise<StorageOperationResult<Todo[]>>

  /**
   * 获取单个 Todo
   */
  abstract getTodo(id: string): Promise<StorageOperationResult<Todo>>

  /**
   * 创建 Todo
   */
  abstract createTodo(todo: CreateTodoDto): Promise<StorageOperationResult<Todo>>

  /**
   * 更新 Todo
   */
  abstract updateTodo(id: string, updates: UpdateTodoDto): Promise<StorageOperationResult<Todo>>

  /**
   * 删除 Todo
   */
  abstract deleteTodo(id: string): Promise<StorageOperationResult<void>>

  /**
   * 批量创建 Todo
   */
  abstract createTodos(todos: CreateTodoDto[]): Promise<BatchOperationResult>

  /**
   * 批量更新 Todo
   */
  abstract updateTodos(
    updates: Array<{ id: string; data: UpdateTodoDto }>
  ): Promise<BatchOperationResult>

  /**
   * 批量删除 Todo
   */
  abstract deleteTodos(ids: string[]): Promise<BatchOperationResult>

  /**
   * 重新排序 Todo
   */
  abstract reorderTodos(
    reorders: Array<{ id: string; order: number }>
  ): Promise<StorageOperationResult<void>>

  /**
   * 获取 Todo 统计信息
   */
  abstract getStats(): Promise<StorageOperationResult<TodoStats>>

  /**
   * 清空所有 Todo
   */
  abstract clearAll(): Promise<StorageOperationResult<void>>

  /**
   * 导出所有数据
   */
  abstract exportData(): Promise<StorageOperationResult<Todo[]>>

  /**
   * 导入数据
   */
  abstract importData(todos: Todo[]): Promise<BatchOperationResult>

  /**
   * 检查存储健康状态
   */
  abstract checkHealth(): Promise<boolean>

  /**
   * 保存所有 Todo
   */
  abstract saveTodos(todos: Todo[]): Promise<StorageOperationResult<void>>

  /**
   * 检查网络连接状态
   */
  abstract checkNetworkStatus(): Promise<NetworkStatus>

  /**
   * 设置存储状态
   */
  protected setStatus(updates: Partial<CloudStorageStatus>): void {
    this._status = { ...this._status, ...updates }
  }

  /**
   * 创建成功结果
   */
  protected createSuccessResult<T>(data: T): StorageOperationResult<T> {
    return {
      success: true,
      data,
    }
  }

  /**
   * 创建错误结果
   */
  protected createErrorResult<T = unknown>(
    error: string,
    retryable = false
  ): StorageOperationResult<T> {
    return {
      success: false,
      error,
      retryable,
    } as StorageOperationResult<T>
  }

  /**
   * 创建批量操作成功结果
   */
  protected createBatchSuccessResult(successCount: number): BatchOperationResult {
    return {
      success: true,
      successCount,
      failureCount: 0,
      errors: [],
    }
  }

  /**
   * 创建批量操作错误结果
   */
  protected createBatchErrorResult(
    successCount: number,
    errors: Array<{ id: string; error: string }>
  ): BatchOperationResult {
    return {
      success: successCount > 0,
      successCount,
      failureCount: errors.length,
      errors,
    }
  }
}
