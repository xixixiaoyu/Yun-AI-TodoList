/**
 * Todo 存储服务抽象接口
 * 定义统一的存储操作接口，支持本地存储和远程存储
 */

import type { Todo, CreateTodoDto, UpdateTodoDto, TodoStats } from '@shared/types'

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

export interface StorageStatus {
  isOnline: boolean
  lastSyncTime?: Date
  pendingOperations: number
  storageMode: 'local' | 'remote' | 'hybrid'
}

/**
 * Todo 存储服务抽象基类
 */
export abstract class TodoStorageService {
  protected _status: StorageStatus = {
    isOnline: true,
    pendingOperations: 0,
    storageMode: 'local',
  }

  /**
   * 获取存储状态
   */
  get status(): StorageStatus {
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
   * 同步数据（仅对支持同步的存储有效）
   */
  async syncData(): Promise<StorageOperationResult<void>> {
    return {
      success: true,
      data: undefined,
    }
  }

  /**
   * 设置存储状态
   */
  protected setStatus(updates: Partial<StorageStatus>): void {
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
  protected createErrorResult(error: string, retryable = false): StorageOperationResult {
    return {
      success: false,
      error,
      retryable,
    }
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
