/**
 * 本地存储服务
 * 用于未登录用户的本地数据存储
 */

import { logger } from '@/utils/logger'
import { TodoValidator } from '@/utils/todoValidator'
import type { CreateTodoDto, NetworkStatus, Todo, TodoStats, UpdateTodoDto } from '@shared/types'
import {
  TodoStorageService,
  type BatchOperationResult,
  type StorageOperationResult,
} from './TodoStorageService'

export class LocalStorageService extends TodoStorageService {
  private readonly storageKey = 'local_todos'
  private readonly legacyStorageKey = 'todos' // 兼容旧的存储键名

  constructor() {
    super()
    this.initializeLocalStorage()
    this.migrateLegacyData()
  }

  private initializeLocalStorage(): void {
    this.setStatus({
      networkStatus: {
        isOnline: false, // 本地存储不需要网络
        isServerReachable: false,
        consecutiveFailures: 0,
      },
      pendingOperations: 0,
    })
  }

  /**
   * 迁移旧的存储数据
   */
  private migrateLegacyData(): void {
    try {
      // 检查是否有新的存储数据
      const newData = localStorage.getItem(this.storageKey)
      if (newData) {
        return // 已有新数据，无需迁移
      }

      // 检查是否有旧的存储数据
      const legacyData = localStorage.getItem(this.legacyStorageKey)
      if (legacyData) {
        // 迁移数据
        localStorage.setItem(this.storageKey, legacyData)
      }
    } catch (error) {
      logger.error('Failed to migrate legacy todos data', error, 'LocalStorageService')
    }
  }

  private getLocalTodos(): Todo[] {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) return []

      const todos = JSON.parse(data)
      if (!Array.isArray(todos)) return []

      const { validTodos } = TodoValidator.validateTodos(todos)
      return validTodos.sort((a, b) => a.order - b.order)
    } catch (error) {
      logger.error('Failed to load todos from localStorage', error, 'LocalStorageService')
      return []
    }
  }

  private saveLocalTodos(todos: Todo[]): boolean {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(todos))
      return true
    } catch (error) {
      logger.error('Failed to save todos to localStorage', error, 'LocalStorageService')
      return false
    }
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getTodos(): Promise<StorageOperationResult<Todo[]>> {
    try {
      const todos = this.getLocalTodos()
      return this.createSuccessResult(todos)
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async getTodo(id: string): Promise<StorageOperationResult<Todo>> {
    try {
      const todos = this.getLocalTodos()
      const todo = todos.find((t) => t.id === id)

      if (!todo) {
        return this.createErrorResult('Todo not found')
      }

      return this.createSuccessResult(todo)
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async createTodo(createDto: CreateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      const todos = this.getLocalTodos()

      // 检查重复标题（只检查未完成的待办事项）
      const duplicateExists = todos.some(
        (t) => !t.completed && t.title.toLowerCase().trim() === createDto.title.toLowerCase().trim()
      )

      if (duplicateExists) {
        return this.createErrorResult('该待办事项已存在')
      }

      // 获取最大排序值
      const maxOrder = todos.length > 0 ? Math.max(...todos.map((t) => t.order)) : 0

      const now = new Date().toISOString()
      const newTodo: Todo = {
        id: this.generateId(),
        title: createDto.title.trim(),
        completed: false,
        createdAt: now,
        updatedAt: now,
        order: maxOrder + 1,
        description: createDto.description,
        priority: createDto.priority,
        estimatedTime: createDto.estimatedTime,
        dueDate: createDto.dueDate,
      }

      todos.push(newTodo)

      if (this.saveLocalTodos(todos)) {
        return this.createSuccessResult(newTodo)
      } else {
        return this.createErrorResult('Failed to save todo')
      }
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async updateTodo(id: string, updates: UpdateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      const todos = this.getLocalTodos()
      const todoIndex = todos.findIndex((t) => t.id === id)

      if (todoIndex === -1) {
        return this.createErrorResult('Todo not found')
      }

      // 如果更新标题，检查重复
      if (updates.title) {
        const duplicateExists = todos.some(
          (t, index) =>
            index !== todoIndex &&
            !t.completed &&
            t.title.toLowerCase().trim() === (updates.title || '').toLowerCase().trim()
        )

        if (duplicateExists) {
          return this.createErrorResult('该待办事项已存在')
        }
      }

      const updatedTodo: Todo = {
        ...todos[todoIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        completedAt:
          updates.completed && !todos[todoIndex].completed
            ? new Date().toISOString()
            : !updates.completed && todos[todoIndex].completed
              ? undefined
              : todos[todoIndex].completedAt,
      }

      todos[todoIndex] = updatedTodo

      if (this.saveLocalTodos(todos)) {
        return this.createSuccessResult(updatedTodo)
      } else {
        return this.createErrorResult('Failed to update todo')
      }
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async deleteTodo(id: string): Promise<StorageOperationResult<void>> {
    try {
      const todos = this.getLocalTodos()
      const filteredTodos = todos.filter((t) => t.id !== id)

      if (filteredTodos.length === todos.length) {
        return this.createErrorResult('Todo not found')
      }

      if (this.saveLocalTodos(filteredTodos)) {
        return this.createSuccessResult(undefined)
      } else {
        return this.createErrorResult('Failed to delete todo')
      }
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async createTodos(todos: CreateTodoDto[]): Promise<BatchOperationResult> {
    let successCount = 0
    let failureCount = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const todoDto of todos) {
      const result = await this.createTodo(todoDto)
      if (result.success) {
        successCount++
      } else {
        failureCount++
        errors.push({ id: todoDto.title, error: result.error || 'Unknown error' })
      }
    }

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    }
  }

  async updateTodos(
    updates: Array<{ id: string; data: UpdateTodoDto }>
  ): Promise<BatchOperationResult> {
    let successCount = 0
    let failureCount = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const update of updates) {
      const result = await this.updateTodo(update.id, update.data)
      if (result.success) {
        successCount++
      } else {
        failureCount++
        errors.push({ id: update.id, error: result.error || 'Unknown error' })
      }
    }

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    }
  }

  async deleteTodos(ids: string[]): Promise<BatchOperationResult> {
    let successCount = 0
    let failureCount = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const id of ids) {
      const result = await this.deleteTodo(id)
      if (result.success) {
        successCount++
      } else {
        failureCount++
        errors.push({ id, error: result.error || 'Unknown error' })
      }
    }

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    }
  }

  async reorderTodos(
    reorders: Array<{ id: string; order: number }>
  ): Promise<StorageOperationResult<void>> {
    try {
      const todos = this.getLocalTodos()

      // 更新排序
      for (const reorder of reorders) {
        const todo = todos.find((t) => t.id === reorder.id)
        if (todo) {
          todo.order = reorder.order
          todo.updatedAt = new Date().toISOString()
        }
      }

      // 按新的顺序排序
      todos.sort((a, b) => a.order - b.order)

      if (this.saveLocalTodos(todos)) {
        return this.createSuccessResult(undefined)
      } else {
        return this.createErrorResult('Failed to reorder todos')
      }
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async getStats(): Promise<StorageOperationResult<TodoStats>> {
    try {
      const todos = this.getLocalTodos()
      const completed = todos.filter((t) => t.completed).length
      const pending = todos.length - completed

      const stats: TodoStats = {
        total: todos.length,
        completed,
        active: pending,
        completionRate: todos.length > 0 ? (completed / todos.length) * 100 : 0,
      }

      return this.createSuccessResult(stats)
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async clearAll(): Promise<StorageOperationResult<void>> {
    try {
      localStorage.removeItem(this.storageKey)
      return this.createSuccessResult(undefined)
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async exportData(): Promise<StorageOperationResult<Todo[]>> {
    return this.getTodos()
  }

  async importData(todos: Todo[]): Promise<BatchOperationResult> {
    try {
      const { validTodos } = TodoValidator.validateTodos(todos)

      if (this.saveLocalTodos(validTodos)) {
        return {
          success: true,
          successCount: validTodos.length,
          failureCount: todos.length - validTodos.length,
          errors: [],
        }
      } else {
        return {
          success: false,
          successCount: 0,
          failureCount: todos.length,
          errors: [{ id: 'import', error: 'Failed to save imported data' }],
        }
      }
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failureCount: todos.length,
        errors: [{ id: 'import', error: error instanceof Error ? error.message : 'Unknown error' }],
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // 测试 localStorage 是否可用
      const testKey = 'health_check'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  async saveTodos(todos: Todo[]): Promise<StorageOperationResult<void>> {
    try {
      if (this.saveLocalTodos(todos)) {
        return this.createSuccessResult(undefined)
      } else {
        return this.createErrorResult('Failed to save todos')
      }
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async checkNetworkStatus(): Promise<NetworkStatus> {
    return {
      isOnline: false, // 本地存储不需要网络
      isServerReachable: false,
      consecutiveFailures: 0,
    }
  }

  protected override createErrorResult(
    error: string,
    retryable: boolean = false
  ): StorageOperationResult<never> {
    return {
      success: false,
      error,
      retryable,
    }
  }
}
