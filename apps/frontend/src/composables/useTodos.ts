import { ref } from 'vue'
import type { CreateTodoDto, Todo, UpdateTodoDto } from '../types/todo'
import { logger } from '../utils/logger'
import { TodoValidator } from '../utils/todoValidator'
import { useAuth } from './useAuth'
import { useDataMigration } from './useDataMigration'
import { useStorageMode } from './useStorageMode'

// 全局单例状态
const globalTodos = ref<Todo[]>([])
const isInitialized = ref(false)

export function useTodos() {
  const {
    getCurrentStorageService,
    initializeStorageMode,
    isInitialized: storageInitialized,
  } = useStorageMode()
  const { addSyncOperation } = useDataMigration()
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
        await loadFromBackup()
      }
    } catch (error) {
      logger.error('Error loading todos', error, 'useTodos')
      await loadFromBackup()
    }
  }

  const loadFromBackup = async () => {
    try {
      // 尝试从本地存储备份恢复
      const backup = localStorage.getItem('todos_backup')
      if (backup) {
        const parsedBackup = JSON.parse(backup)
        const { validTodos } = TodoValidator.validateTodos(parsedBackup)
        todos.value = validTodos
        logger.info('Restored todos from backup', undefined, 'useTodos')
        isInitialized.value = true
        return
      }
    } catch (error) {
      logger.error('Error loading backup', error, 'useTodos')
    }

    // 如果没有备份，初始化为空数组
    todos.value = []
    isInitialized.value = true
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

  const saveTodos = async () => {
    // 对于本地存储模式，保持原有的 localStorage 逻辑作为备份
    try {
      const todosJson = JSON.stringify(todos.value)
      const currentData = localStorage.getItem('todos')
      if (currentData) {
        localStorage.setItem('todos_backup', currentData)
      }
      localStorage.setItem('todos', todosJson)

      if (process.env.NODE_ENV === 'development') {
        const currentCount = todos.value.length
        const lastCount = parseInt(localStorage.getItem('todos_last_count') || '0')
        if (currentCount !== lastCount) {
          localStorage.setItem('todos_last_count', currentCount.toString())
          logger.info('Todos saved to localStorage', { count: currentCount }, 'useTodos')
        }
      }
    } catch (error) {
      logger.error('Error saving todos to localStorage', error, 'useTodos')
    }
  }

  const addTodo = async (todoData: CreateTodoDto): Promise<Todo | null> => {
    const { title, ...rest } = todoData
    if (!title || title.trim() === '') {
      return null
    }

    const sanitizedTitle = TodoValidator.sanitizeTitle(title)

    if (!TodoValidator.isTitleSafe(sanitizedTitle)) {
      logger.warn('Attempted to add unsafe todo title', { title }, 'useTodos')
      return null
    }

    const isDuplicate = todos.value.some(
      (todo) =>
        todo &&
        todo.title &&
        todo.title.toLowerCase() === sanitizedTitle.toLowerCase() &&
        !todo.completed
    )

    if (isDuplicate) {
      return null
    }

    try {
      const storageService = getCurrentStorageService()
      const createData: CreateTodoDto = {
        title: sanitizedTitle,
        ...rest,
      }

      const result = await storageService.createTodo(createData)

      if (result.success && result.data) {
        // 更新本地状态
        todos.value.push(result.data)
        todos.value.sort((a, b) => a.order - b.order)

        // 保存到本地存储作为备份
        await saveTodos()

        // 如果是远程存储，添加同步操作
        if (isAuthenticated.value) {
          addSyncOperation('create', result.data.id, createData)
        }

        logger.info(
          'Todo added successfully',
          { id: result.data.id, title: sanitizedTitle },
          'useTodos'
        )
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
      const result = await storageService.deleteTodo(id)

      if (result.success) {
        // 更新本地状态
        todos.value = todos.value.filter((todo) => todo && todo.id !== id)

        // 保存到本地存储作为备份
        await saveTodos()

        // 如果是远程存储，添加同步操作
        if (isAuthenticated.value) {
          addSyncOperation('delete', id)
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
      const result = await storageService.updateTodo(id, updates)

      if (result.success && result.data) {
        // 更新本地状态
        const todoIndex = todos.value.findIndex((todo) => todo && todo.id === id)
        if (todoIndex !== -1) {
          todos.value[todoIndex] = result.data
        } else {
          logger.error('Todo not found in local state after storage update', { id }, 'useTodos')
        }

        // 保存到本地存储作为备份
        await saveTodos()

        // 如果是远程存储，添加同步操作
        if (isAuthenticated.value) {
          addSyncOperation('update', id, updates)
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

  return {
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

    // 存储
    saveTodos,
  }
}
