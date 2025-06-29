/**
 * 本地存储服务实现
 * 使用 localStorage 存储 Todo 数据
 */

import type { CreateTodoDto, Todo, TodoStats, UpdateTodoDto } from '@shared/types'
import { IdGenerator } from '../../utils/idGenerator'
import { TodoValidator } from '../../utils/todoValidator'
import {
  TodoStorageService,
  type BatchOperationResult,
  type StorageOperationResult,
} from './TodoStorageService'

const STORAGE_KEYS = {
  TODOS: 'todos',
  LAST_COUNT: 'todos_last_count',
} as const

export class LocalStorageService extends TodoStorageService {
  constructor() {
    super()
    this.setStatus({
      isOnline: true,
      storageMode: 'local',
      pendingOperations: 0,
    })
  }

  async getTodos(): Promise<StorageOperationResult<Todo[]>> {
    try {
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createSuccessResult([])
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const { validTodos, invalidCount } = TodoValidator.validateTodos(parsedTodos)

      if (invalidCount > 0) {
        console.warn(`Found ${invalidCount} invalid todos in localStorage`)
        // 自动清理无效数据
        await this.saveToStorage(validTodos)
      }

      return this.createSuccessResult(validTodos.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('Failed to load todos from localStorage:', error)
      return this.createErrorResult('storage.readLocalDataFailed')
    }
  }

  async getTodo(id: string): Promise<StorageOperationResult<Todo>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createErrorResult('storage.todoNotFound')
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const todos = parsedTodos as Todo[]
      const todo = todos.find((t) => t.id === id)
      if (!todo) {
        return this.createErrorResult('storage.todoNotFound')
      }

      return this.createSuccessResult(todo)
    } catch (error) {
      console.error('Failed to get todo:', error)
      return this.createErrorResult('storage.readLocalDataFailed')
    }
  }

  private async getTodosFromStorage(): Promise<Todo[]> {
    const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
    if (!storedTodos) {
      return []
    }
    try {
      const parsedTodos = JSON.parse(storedTodos)
      if (Array.isArray(parsedTodos)) {
        return parsedTodos as Todo[]
      }
      console.warn('Corrupted todo data in localStorage, not an array.')
      return []
    } catch (error) {
      console.error('Failed to parse todos from localStorage:', error)
      throw new Error('Failed to read corrupted data from local storage')
    }
  }

  async createTodo(todoData: CreateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      const todos = await this.getTodosFromStorage()

      // Validation logic
      if (!todoData.title || todoData.title.trim() === '') {
        return this.createErrorResult('storage.todoTitleEmpty')
      }
      const sanitizedTitle = TodoValidator.sanitizeTitle(todoData.title)
      if (!TodoValidator.isTitleSafe(sanitizedTitle)) {
        return this.createErrorResult('storage.todoTitleEmpty')
      }

      if (
        todos.some((t) => !t.completed && t.title.toLowerCase() === sanitizedTitle.toLowerCase())
      ) {
        return this.createErrorResult('storage.todoAlreadyExists')
      }

      const now = new Date().toISOString()
      const newTodo: Todo = {
        id: IdGenerator.generateStringId(),
        title: sanitizedTitle,
        description: todoData.description,
        completed: false,
        createdAt: now,
        updatedAt: now,
        order: todos.length,
        priority: todoData.priority,
        estimatedTime: todoData.estimatedTime,
        dueDate: todoData.dueDate,
        aiAnalyzed: false,
        synced: false,
        lastSyncTime: undefined,
        syncError: undefined,
      }

      const updatedTodos = [...todos, newTodo]
      await this.saveToStorage(updatedTodos)

      return this.createSuccessResult(newTodo)
    } catch (error) {
      console.error('Failed to create todo:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  async updateTodo(id: string, updates: UpdateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createErrorResult('storage.todoNotFound')
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const todos = parsedTodos as Todo[]
      const todoIndex = todos.findIndex((t) => t.id === id)

      if (todoIndex === -1) {
        return this.createErrorResult('storage.todoNotFound')
      }

      const todo = todos[todoIndex]
      const now = new Date().toISOString()

      // 更新 Todo
      const updatedTodo: Todo = {
        ...todo,
        ...updates,
        updatedAt: now,
        completedAt:
          updates.completed && !todo.completed
            ? now
            : !updates.completed && todo.completed
              ? undefined
              : todo.completedAt,
        // 重置同步状态
        synced: false,
        syncError: undefined,
      }

      // 验证更新后的标题
      if (updates.title !== undefined) {
        const sanitizedTitle = TodoValidator.sanitizeTitle(updates.title)
        if (!TodoValidator.isTitleSafe(sanitizedTitle)) {
          return this.createErrorResult('storage.todoTitleEmpty')
        }
        updatedTodo.title = sanitizedTitle
      }

      todos[todoIndex] = updatedTodo
      await this.saveToStorage(todos)

      return this.createSuccessResult(updatedTodo)
    } catch (error) {
      console.error('Failed to update todo:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  async deleteTodo(id: string): Promise<StorageOperationResult<void>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createErrorResult('storage.todoNotFound')
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const todos = parsedTodos as Todo[]
      const filteredTodos = todos.filter((t) => t.id !== id)

      if (filteredTodos.length === todos.length) {
        return this.createErrorResult('storage.todoNotFound')
      }

      await this.saveToStorage(filteredTodos)
      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to delete todo:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  async createTodos(todosData: CreateTodoDto[]): Promise<BatchOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    const createdTodos: Todo[] = []
    let originalTodos: Todo[] = []

    try {
      // 1. Read existing todos once and backup for rollback
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (storedTodos) {
        try {
          const parsedTodos = JSON.parse(storedTodos)
          if (Array.isArray(parsedTodos)) {
            originalTodos = parsedTodos as Todo[]
          }
        } catch (error) {
          console.warn('Failed to parse stored todos, starting with empty array:', error)
        }
      }

      const existingTitles = new Set(
        originalTodos.filter((t) => !t.completed).map((t) => t.title.toLowerCase())
      )
      let currentOrder = originalTodos.length

      // 2. Process new todos in memory
      for (const todoData of todosData) {
        // Validation logic from createTodo
        if (!todoData.title || todoData.title.trim() === '') {
          errors.push({ id: todoData.title || 'untitled', error: 'storage.todoTitleEmpty' })
          continue
        }
        const sanitizedTitle = TodoValidator.sanitizeTitle(todoData.title)
        if (!TodoValidator.isTitleSafe(sanitizedTitle)) {
          errors.push({ id: todoData.title, error: 'storage.todoTitleEmpty' })
          continue
        }
        if (existingTitles.has(sanitizedTitle.toLowerCase())) {
          errors.push({ id: todoData.title, error: 'storage.todoAlreadyExists' })
          continue
        }

        // Create new todo object
        const now = new Date().toISOString()
        const newTodo: Todo = {
          id: IdGenerator.generateStringId(),
          title: sanitizedTitle,
          description: todoData.description,
          completed: false,
          createdAt: now,
          updatedAt: now,
          order: currentOrder++,
          priority: todoData.priority,
          estimatedTime: todoData.estimatedTime,
          dueDate: todoData.dueDate,
          aiAnalyzed: false,
          synced: false,
          lastSyncTime: undefined,
          syncError: undefined,
        }
        createdTodos.push(newTodo)
        existingTitles.add(sanitizedTitle.toLowerCase()) // Avoid duplicates within the same batch
      }

      // 3. Save all at once with transaction-like behavior
      if (createdTodos.length > 0) {
        const finalTodos = [...originalTodos, ...createdTodos]
        try {
          await this.saveToStorage(finalTodos)
        } catch (saveError) {
          // 回滚：恢复原始数据
          console.error('Failed to save batch created todos, rolling back:', saveError)
          try {
            await this.saveToStorage(originalTodos)
          } catch (rollbackError) {
            console.error('Failed to rollback after batch create failure:', rollbackError)
          }
          throw saveError
        }
      }

      return this.createBatchErrorResult(createdTodos.length, errors)
    } catch (error) {
      console.error('Failed to batch create todos:', error)
      return this.createBatchErrorResult(0, [
        { id: 'batch_create', error: 'storage.saveLocalDataFailed' },
      ])
    }
  }

  async updateTodos(
    updates: Array<{ id: string; data: UpdateTodoDto }>
  ): Promise<BatchOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0
    let originalTodos: Todo[] = []

    try {
      // 1. 备份原始数据
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (storedTodos) {
        originalTodos = JSON.parse(storedTodos) as Todo[]
      }

      // 2. 批量更新处理
      const updatedTodos = [...originalTodos]
      const validUpdates: Array<{ index: number; data: UpdateTodoDto }> = []

      for (const update of updates) {
        const todoIndex = updatedTodos.findIndex((t) => t.id === update.id)
        if (todoIndex === -1) {
          errors.push({ id: update.id, error: 'storage.todoNotFound' })
          continue
        }

        // 验证更新数据
        if (update.data.title !== undefined) {
          const sanitizedTitle = TodoValidator.sanitizeTitle(update.data.title)
          if (!TodoValidator.isTitleSafe(sanitizedTitle)) {
            errors.push({ id: update.id, error: 'storage.todoTitleEmpty' })
            continue
          }
          update.data.title = sanitizedTitle
        }

        validUpdates.push({ index: todoIndex, data: update.data })
      }

      // 3. 应用所有有效更新
      for (const { index, data } of validUpdates) {
        const todo = updatedTodos[index]
        Object.assign(todo, data, { updatedAt: new Date().toISOString() })
        successCount++
      }

      // 4. 原子性保存
      if (successCount > 0) {
        try {
          await this.saveToStorage(updatedTodos)
        } catch (saveError) {
          // 回滚
          console.error('Failed to save batch updates, rolling back:', saveError)
          try {
            await this.saveToStorage(originalTodos)
          } catch (rollbackError) {
            console.error('Failed to rollback after batch update failure:', rollbackError)
          }
          throw saveError
        }
      }

      return this.createBatchErrorResult(successCount, errors)
    } catch (error) {
      console.error('Failed to batch update todos:', error)
      return this.createBatchErrorResult(0, [
        { id: 'batch_update', error: 'storage.saveLocalDataFailed' },
      ])
    }
  }

  async deleteTodos(ids: string[]): Promise<BatchOperationResult> {
    const errors: Array<{ id: string; error: string }> = []
    let successCount = 0
    let originalTodos: Todo[] = []

    try {
      // 1. 备份原始数据
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (storedTodos) {
        originalTodos = JSON.parse(storedTodos) as Todo[]
      }

      // 2. 批量删除处理
      const idsToDelete = new Set(ids)
      const remainingTodos: Todo[] = []
      const deletedIds: string[] = []

      for (const todo of originalTodos) {
        if (idsToDelete.has(todo.id)) {
          deletedIds.push(todo.id)
          successCount++
        } else {
          remainingTodos.push(todo)
        }
      }

      // 3. 检查未找到的 ID
      for (const id of ids) {
        if (!deletedIds.includes(id)) {
          errors.push({ id, error: 'storage.todoNotFound' })
        }
      }

      // 4. 原子性保存
      if (successCount > 0) {
        try {
          await this.saveToStorage(remainingTodos)
        } catch (saveError) {
          // 回滚
          console.error('Failed to save after batch delete, rolling back:', saveError)
          try {
            await this.saveToStorage(originalTodos)
          } catch (rollbackError) {
            console.error('Failed to rollback after batch delete failure:', rollbackError)
          }
          throw saveError
        }
      }

      return this.createBatchErrorResult(successCount, errors)
    } catch (error) {
      console.error('Failed to batch delete todos:', error)
      return this.createBatchErrorResult(0, [
        { id: 'batch_delete', error: 'storage.saveLocalDataFailed' },
      ])
    }
  }

  async reorderTodos(
    reorders: Array<{ id: string; order: number }>
  ): Promise<StorageOperationResult<void>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createErrorResult('storage.noData')
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const todos = parsedTodos as Todo[]

      // 应用新的排序
      reorders.forEach(({ id, order }) => {
        const todo = todos.find((t) => t.id === id)
        if (todo) {
          todo.order = order
          todo.updatedAt = new Date().toISOString()
        }
      })

      await this.saveToStorage(todos)
      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to reorder todos:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  async getStats(): Promise<StorageOperationResult<TodoStats>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        // 如果没有数据，返回空统计
        const emptyStats: TodoStats = {
          total: 0,
          completed: 0,
          active: 0,
          completionRate: 0,
        }
        return this.createSuccessResult(emptyStats)
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const todos = parsedTodos as Todo[]
      const total = todos.length
      const completed = todos.filter((t) => t.completed).length
      const active = total - completed

      const stats: TodoStats = {
        total,
        completed,
        active,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }

      return this.createSuccessResult(stats)
    } catch (error) {
      console.error('Failed to get stats:', error)
      return this.createErrorResult('storage.readLocalDataFailed')
    }
  }

  async clearAll(): Promise<StorageOperationResult<void>> {
    try {
      localStorage.removeItem(STORAGE_KEYS.TODOS)
      localStorage.removeItem(STORAGE_KEYS.LAST_COUNT)
      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to clear all todos:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  async exportData(): Promise<StorageOperationResult<Todo[]>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createSuccessResult([])
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      return this.createSuccessResult(parsedTodos as Todo[])
    } catch (error) {
      console.error('Failed to export data:', error)
      return this.createErrorResult('storage.readLocalDataFailed')
    }
  }

  async importData(todos: Todo[]): Promise<BatchOperationResult> {
    try {
      const { validTodos, invalidCount } = TodoValidator.validateTodos(todos)

      if (invalidCount > 0) {
        console.warn(`Skipped ${invalidCount} invalid todos during import`)
      }

      await this.saveToStorage(validTodos)

      return this.createBatchSuccessResult(validTodos.length)
    } catch (error) {
      console.error('Failed to import todos:', error)
      return this.createBatchErrorResult(0, [{ id: 'import', error: '导入数据失败' }])
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // 测试读写操作
      const testKey = 'health_check_test'
      const testValue = 'test'

      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)

      return retrieved === testValue
    } catch (error) {
      console.error('LocalStorage health check failed:', error)
      return false
    }
  }

  /**
   * 标记Todo为已同步
   */
  async markAsSynced(id: string): Promise<StorageOperationResult<void>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createErrorResult('storage.todoNotFound')
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const todos = parsedTodos as Todo[]
      const todoIndex = todos.findIndex((t) => t.id === id)

      if (todoIndex === -1) {
        return this.createErrorResult('storage.todoNotFound')
      }

      todos[todoIndex] = {
        ...todos[todoIndex],
        synced: true,
        lastSyncTime: new Date().toISOString(),
        syncError: undefined,
      }

      await this.saveToStorage(todos)
      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to mark todo as synced:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  /**
   * 标记Todo同步失败
   */
  async markSyncError(id: string, error: string): Promise<StorageOperationResult<void>> {
    try {
      // 直接从 localStorage 读取，避免触发自动清理
      const storedTodos = localStorage.getItem(STORAGE_KEYS.TODOS)
      if (!storedTodos) {
        return this.createErrorResult('storage.todoNotFound')
      }

      const parsedTodos = JSON.parse(storedTodos)
      if (!Array.isArray(parsedTodos)) {
        return this.createErrorResult('storage.readLocalDataFailed')
      }

      const todos = parsedTodos as Todo[]
      const todoIndex = todos.findIndex((t) => t.id === id)

      if (todoIndex === -1) {
        return this.createErrorResult('storage.todoNotFound')
      }

      todos[todoIndex] = {
        ...todos[todoIndex],
        synced: false,
        syncError: error,
      }

      await this.saveToStorage(todos)
      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to mark sync error:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  /**
   * 获取未同步的Todos
   */
  async getUnsyncedTodos(): Promise<StorageOperationResult<Todo[]>> {
    try {
      const todosResult = await this.getTodos()
      if (!todosResult.success) {
        return todosResult
      }

      const unsyncedTodos = (todosResult.data || []).filter((todo) => !todo.synced)
      return this.createSuccessResult(unsyncedTodos)
    } catch (error) {
      console.error('Failed to get unsynced todos:', error)
      return this.createErrorResult('storage.readLocalDataFailed')
    }
  }

  /**
   * 保存所有 Todo。此方法为公共接口，用于封装底层的存储逻辑。
   */
  async saveTodos(todos: Todo[]): Promise<StorageOperationResult<void>> {
    try {
      await this.saveToStorage(todos)
      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to save todos:', error)
      return this.createErrorResult('storage.saveLocalDataFailed')
    }
  }

  private async saveToStorage(todos: Todo[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos))
      localStorage.setItem(STORAGE_KEYS.LAST_COUNT, todos.length.toString())
      this.setStatus({ lastSyncTime: new Date() })
    } catch (error) {
      console.error('Failed to save todos to localStorage:', error)
      throw error // Re-throw the original error to be caught by the caller
    }
  }
}
