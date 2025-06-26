import { ref, computed, watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { CreateTodoDto, Todo, UpdateTodoDto } from '../types/todo'
import { logger } from '@/utils/logger'
import { TodoValidator } from '../utils/todoValidator'
import { useAuth } from './useAuth'
import { useDataMigration } from './useDataMigration'
import { useStorageMode } from './useStorageMode'
import { withRetry, STORAGE_RETRY_OPTIONS } from '@/utils/retryHelper'
import { debounceAsync } from '@/utils/debounce'

// 全局单例状态
const globalTodos = ref<Todo[]>([])
const isInitialized = ref(false)

export function useTodos() {
  const {
    getCurrentStorageService,
    initializeStorageMode,
    isInitialized: storageInitialized,
  } = useStorageMode()
  const { addSyncOperation, resolveConflicts, conflicts } = useDataMigration()
  const { isAuthenticated } = useAuth()
  const todos = globalTodos

  const setTodos = (newTodos: Todo[]) => {
    todos.value = newTodos.sort((a, b) => a.order - b.order)
    saveTodos()
  }

  // 初始化方法
  const initializeTodos = async () => {
    if (!isInitialized.value) {
      await loadTodos()
    }
  }

  const loadTodos = async () => {
    try {
      // 确保存储模式已初始化
      if (!storageInitialized.value) {
        await initializeStorageMode()
      }

      const storageService = getCurrentStorageService()
      const result = await storageService.getTodos()

      if (result.success && result.data) {
        const { validTodos, invalidCount, errors } = TodoValidator.validateTodos(result.data)

        if (invalidCount > 0) {
          logger.warn(`Found ${invalidCount} invalid todos`, { errors }, 'useTodos')
        }

        todos.value = validTodos.sort((a, b) => a.order - b.order)
        validateDataConsistency()
        isInitialized.value = true
      } else {
        logger.error('Failed to load todos from storage', result.error, 'useTodos')
        // 初始化为空数组
        todos.value = []
        isInitialized.value = true
      }
    } catch (error) {
      logger.error('Error loading todos', error, 'useTodos')
      // 初始化为空数组
      todos.value = []
      isInitialized.value = true
    }
  }

  const validateDataConsistency = () => {
    const seenIds = new Set<string>()
    const originalLength = todos.value.length
    todos.value = todos.value.filter((todo) => {
      if (seenIds.has(todo.id)) {
        return false
      }
      seenIds.add(todo.id)
      return true
    })

    // 只有在发现重复数据时才保存和记录日志
    if (todos.value.length !== originalLength) {
      logger.warn(
        'Removed duplicate todos',
        {
          removed: originalLength - todos.value.length,
          remaining: todos.value.length,
        },
        'useTodos'
      )
      saveTodos()
    }
  }

  // 创建防抖的保存函数，避免频繁保存
  const debouncedSaveTodos = debounceAsync(async () => {
    if (!isInitialized.value) return

    try {
      const storageService = getCurrentStorageService()
      await withRetry(() => storageService.saveTodos(todos.value), STORAGE_RETRY_OPTIONS)
      logger.info('Todos saved successfully', undefined, 'useTodos')
    } catch (error) {
      logger.error('Error saving todos', error, 'useTodos')
      throw error
    }
  }, 500) // 500ms 防抖延迟

  const saveTodos = async () => {
    return await debouncedSaveTodos()
  }

  const addTodo = async (createDto: CreateTodoDto): Promise<Todo | null> => {
    try {
      const storageService = getCurrentStorageService()

      // 添加重试机制提高可靠性
      const result = await withRetry(
        () => storageService.createTodo(createDto),
        STORAGE_RETRY_OPTIONS
      )

      if (result.success && result.data) {
        // 优化：直接添加到内存状态，避免重新加载
        todos.value.push(result.data)
        logger.info('Todo added successfully', { todo: result.data }, 'useTodos')
        return result.data
      } else {
        logger.error('Failed to add todo', result.error, 'useTodos')
        return null
      }
    } catch (error) {
      logger.error('Error adding todo', error, 'useTodos')
      return null
    }
  }

  const addMultipleTodos = async (newTodos: { title: string }[]): Promise<string[]> => {
    const duplicates: string[] = []
    const createDtos: CreateTodoDto[] = []

    // 验证和准备数据
    newTodos.forEach(({ title }) => {
      const sanitizedText = TodoValidator.sanitizeTitle(title)

      if (!TodoValidator.isTitleSafe(sanitizedText)) {
        logger.warn('Skipped unsafe todo text in batch add', { title }, 'useTodos')
        return
      }

      if (todos.value.some((todo) => todo.title.toLowerCase() === sanitizedText.toLowerCase())) {
        duplicates.push(title)
      } else {
        createDtos.push({
          title: sanitizedText,
        })
      }
    })

    // 批量创建
    try {
      const storageService = getCurrentStorageService()
      const result = await storageService.createTodos(createDtos)

      if (result.success) {
        // 重新加载数据以获取最新状态
        await loadTodos()

        logger.info(
          'Batch todos added successfully',
          {
            added: result.successCount,
            duplicates: duplicates.length,
          },
          'useTodos'
        )
      } else {
        logger.error(
          'Failed to add batch todos',
          {
            errors: result.errors,
          },
          'useTodos'
        )
      }
    } catch (error) {
      logger.error('Error adding batch todos', error, 'useTodos')
    }

    return duplicates
  }

  const toggleTodo = async (id: string): Promise<boolean> => {
    const todo = todos.value.find((todo) => todo && todo.id === id)
    if (!todo) {
      return false
    }

    const updates: UpdateTodoDto = {
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date().toISOString() : undefined,
    }

    return await updateTodo(id, updates)
  }

  const removeTodo = async (id: string): Promise<boolean> => {
    try {
      const storageService = getCurrentStorageService()

      // 添加重试机制提高可靠性
      const result = await withRetry(() => storageService.deleteTodo(id), STORAGE_RETRY_OPTIONS)

      if (result.success) {
        // 优化：直接从内存状态移除，避免重新加载
        const index = todos.value.findIndex((todo) => todo.id === id)
        if (index !== -1) {
          todos.value.splice(index, 1)
        }
        logger.info('Todo removed successfully', { id }, 'useTodos')
        return true
      } else {
        logger.error('Failed to remove todo', result.error, 'useTodos')
        return false
      }
    } catch (error) {
      logger.error('Error removing todo', error, 'useTodos')
      return false
    }
  }

  const updateTodosOrder = async (newOrder: string[]): Promise<boolean> => {
    try {
      const storageService = getCurrentStorageService()
      const reorders = newOrder.map((id, index) => ({ id, order: index }))

      const result = await storageService.reorderTodos(reorders)

      if (result.success) {
        // 更新本地状态
        const orderMap = new Map(newOrder.map((id, index) => [id, index]))
        todos.value = todos.value
          .map((todo) => ({
            ...todo,
            order: orderMap.get(todo.id) ?? todo.order,
            updatedAt: new Date().toISOString(),
          }))
          .sort((a, b) => a.order - b.order)

        await saveTodos()

        logger.info('Todos reordered successfully', { count: newOrder.length }, 'useTodos')
        return true
      } else {
        logger.error('Failed to reorder todos', result.error, 'useTodos')
        return false
      }
    } catch (error) {
      logger.error('Error reordering todos', error, 'useTodos')
      return false
    }
  }

  /**
   * 更新待办事项顺序（通过 Todo 数组）
   * 用于拖拽排序功能
   */
  const updateTodosOrderByArray = async (newTodos: Todo[]): Promise<boolean> => {
    try {
      // 验证新的 todos 数组
      if (!Array.isArray(newTodos) || newTodos.length !== todos.value.length) {
        logger.warn(
          'Invalid todos array for order update',
          {
            newLength: newTodos?.length,
            currentLength: todos.value.length,
          },
          'useTodos'
        )
        return false
      }

      // 确保所有 ID 都存在
      const currentIds = new Set(todos.value.map((todo) => todo.id))
      const newIds = new Set(newTodos.map((todo) => todo.id))

      if (currentIds.size !== newIds.size || ![...currentIds].every((id) => newIds.has(id))) {
        logger.warn(
          'Todo IDs mismatch during order update',
          {
            currentIds: [...currentIds],
            newIds: [...newIds],
          },
          'useTodos'
        )
        return false
      }

      // 使用存储服务更新顺序
      const newOrder = newTodos.map((todo) => todo.id)
      return await updateTodosOrder(newOrder)
    } catch (error) {
      logger.error('Error updating todos order by array', error, 'useTodos')
      return false
    }
  }

  const getCompletedTodosByDate = () => {
    const completedByDate: { [key: string]: number } = {}
    todos.value.forEach((todo) => {
      if (todo && todo.completed && todo.completedAt) {
        const date = new Date(todo.completedAt).toISOString().split('T')[0]
        completedByDate[date] = (completedByDate[date] || 0) + 1
      }
    })
    return completedByDate
  }

  const updateTodo = async (id: string, updates: UpdateTodoDto): Promise<boolean> => {
    try {
      const storageService = getCurrentStorageService()

      // 添加重试机制提高可靠性
      const result = await withRetry(
        () => storageService.updateTodo(id, updates),
        STORAGE_RETRY_OPTIONS
      )

      if (result.success) {
        // 优化：直接更新内存状态，避免重新加载
        const todoIndex = todos.value.findIndex((todo) => todo.id === id)
        if (todoIndex !== -1) {
          todos.value[todoIndex] = {
            ...todos.value[todoIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }
        logger.info('Todo updated successfully', { id, updates }, 'useTodos')
        return true
      } else {
        logger.error('Failed to update todo', result.error, 'useTodos')
        return false
      }
    } catch (error) {
      logger.error('Error updating todo', error, 'useTodos')
      return false
    }
  }

  const batchUpdateTodos = async (
    updates: Array<{ id: string; updates: UpdateTodoDto }>
  ): Promise<boolean> => {
    try {
      const storageService = getCurrentStorageService()
      const updateData = updates.map(({ id, updates: todoUpdates }) => ({
        id,
        data: todoUpdates,
      }))

      const result = await storageService.updateTodos(updateData)

      if (result.success) {
        // 重新加载数据以获取最新状态
        await loadTodos()

        logger.info(
          'Batch todos updated successfully',
          {
            updated: result.successCount,
            failed: result.failureCount,
          },
          'useTodos'
        )

        return result.successCount > 0
      } else {
        logger.error(
          'Failed to batch update todos',
          {
            errors: result.errors,
          },
          'useTodos'
        )
        return false
      }
    } catch (error) {
      logger.error('Error batch updating todos', error, 'useTodos')
      return false
    }
  }

  const result = {
    // 状态
    todos,
    isInitialized,

    // 初始化
    initializeTodos,
    loadTodos,

    // CRUD 操作
    addTodo,
    addMultipleTodos,
    updateTodo,
    removeTodo,
    toggleTodo,

    // 批量操作
    batchUpdateTodos,
    setTodos,

    // 排序
    updateTodosOrder,
    updateTodosOrderByArray,

    // 查询
    getCompletedTodosByDate,

    // 数据迁移
    resolveConflicts,
    conflicts,

    // 存储
    saveTodos,

    // 测试辅助方法
    resetState: async () => {
      globalTodos.value = []
      isInitialized.value = true // 允许保存操作
      await saveTodos() // 保存空的待办事项列表
      isInitialized.value = false // 重置初始化状态
    },

    // 清理机制
    cleanup: () => {
      // 清理状态
      globalTodos.value = []
      isInitialized.value = false
      logger.info('useTodos cleanup completed', undefined, 'useTodos')
    },
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    if (typeof result.cleanup === 'function') {
      result.cleanup()
    }
  })

  return result
}
