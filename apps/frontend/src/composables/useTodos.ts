import { debounceAsync } from '@/utils/debounce'
import { logger } from '@/utils/logger'
import { STORAGE_RETRY_OPTIONS, withRetry } from '@/utils/retryHelper'
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { TodoStorageService } from '../services/storage/TodoStorageService'
import type { CreateTodoDto, Todo, UpdateTodoDto } from '../types/todo'
import { TodoValidator } from '../utils/todoValidator'
import { useAuth } from './useAuth'

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

  const { isAuthenticated } = useAuth()
  const todos = globalTodos

  const setTodos = (newTodos: Todo[]) => {
    todos.value = newTodos.sort((a, b) => a.order - b.order)
    // 只在初始化时保存，避免不必要的全量同步
    if (!isInitialized.value) {
      saveTodos()
    }
  }

  // 初始化方法
  const initializeTodos = async () => {
    if (!isInitialized.value) {
      // 所有用户都需要加载数据（已登录用户从云端，未登录用户从本地）
      await loadTodos()
    }
  }

  const loadTodos = async () => {
    try {
      // 确保存储模式已初始化（仅对已登录用户）
      if (!storageInitialized.value && isAuthenticated.value) {
        await initializeStorageMode()
      }

      const storageService = getCurrentStorageService()
      const result = await storageService.getTodos()

      if (result.success && result.data) {
        logger.info(
          `Loading ${result.data.length} todos from storage`,
          { data: result.data },
          'useTodos'
        )

        const { validTodos, invalidCount, errors } = TodoValidator.validateTodos(result.data)

        if (invalidCount > 0) {
          logger.warn(
            `Found ${invalidCount} invalid todos`,
            { errors, rawData: result.data },
            'useTodos'
          )
        }

        logger.info(`Validated ${validTodos.length} todos`, { validTodos }, 'useTodos')
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
    const seenTitles = new Map<string, Todo>()
    const originalLength = todos.value.length
    const validTodos: Todo[] = []

    todos.value.forEach((todo) => {
      // 检查 ID 重复
      if (seenIds.has(todo.id)) {
        logger.warn(
          `Removed duplicate todo by ID: ${todo.id} - "${todo.title}"`,
          undefined,
          'useTodos'
        )
        return
      }

      // 检查标题重复（忽略大小写和前后空格）
      const titleKey = todo.title.toLowerCase().trim()
      const existingTodo = seenTitles.get(titleKey)

      if (existingTodo) {
        // 发现标题重复，保留创建时间较早的
        const currentTime = new Date(todo.createdAt).getTime()
        const existingTime = new Date(existingTodo.createdAt).getTime()

        if (currentTime < existingTime) {
          // 当前 Todo 更早，替换已存在的
          const existingIndex = validTodos.findIndex((t) => t.id === existingTodo.id)
          if (existingIndex !== -1) {
            validTodos[existingIndex] = todo
            seenIds.delete(existingTodo.id)
            seenIds.add(todo.id)
            seenTitles.set(titleKey, todo)
            logger.warn(
              `Replaced duplicate todo by title: kept "${todo.title}" (${todo.id}), removed (${existingTodo.id})`,
              undefined,
              'useTodos'
            )
          }
        } else {
          // 已存在的 Todo 更早，忽略当前的
          logger.warn(
            `Removed duplicate todo by title: "${todo.title}" (${todo.id}), kept (${existingTodo.id})`,
            undefined,
            'useTodos'
          )
        }
        return
      }

      // 没有重复，添加到有效列表
      seenIds.add(todo.id)
      seenTitles.set(titleKey, todo)
      validTodos.push(todo)
    })

    todos.value = validTodos

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
      // 不需要调用 saveTodos()，因为 HybridTodoStorageService 已经处理了同步
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

  /**
   * 清理 todos 数据（用户登出时调用）
   */
  const clearTodosOnLogout = () => {
    logger.info('Clearing todos data on logout', undefined, 'useTodos')
    todos.value = []
    isInitialized.value = false
  }

  const addTodo = async (createDto: CreateTodoDto): Promise<Todo | null> => {
    try {
      // 确保存储模式已初始化（仅对已登录用户）
      if (!storageInitialized.value && isAuthenticated.value) {
        logger.info(
          'Storage not initialized for authenticated user, initializing now',
          undefined,
          'useTodos'
        )
        await initializeStorageMode()
      }

      // 检查是否存在重复的未完成待办事项（仅在已登录且数据已初始化时检查）
      if (isAuthenticated.value && isInitialized.value) {
        const sanitizedTitle = createDto.title.trim()
        const isDuplicate = todos.value.some(
          (todo) =>
            todo &&
            todo.title &&
            todo.title.toLowerCase() === sanitizedTitle.toLowerCase() &&
            !todo.completed
        )

        if (isDuplicate) {
          logger.warn('Attempted to create duplicate todo', { title: sanitizedTitle }, 'useTodos')
          return null
        }
      }

      // 安全获取存储服务
      let storageService: TodoStorageService
      try {
        storageService = getCurrentStorageService()
      } catch (error) {
        if (isAuthenticated.value) {
          logger.warn(
            'Storage service not available for authenticated user, initializing',
            error,
            'useTodos'
          )
          await initializeStorageMode()
          storageService = getCurrentStorageService()
        } else {
          logger.error('Failed to get storage service for unauthenticated user', error, 'useTodos')
          throw error
        }
      }

      // 统一的存储逻辑，适用于所有模式（本地、混合）
      const result = await withRetry(
        () => storageService.createTodo(createDto),
        STORAGE_RETRY_OPTIONS
      )

      if (result.success && result.data) {
        const newTodo = result.data

        // 验证新 Todo 的数据完整性
        if (!newTodo.title || newTodo.title.trim() === '') {
          logger.error('Created todo has empty title', { todo: newTodo }, 'useTodos')
          return null
        }

        // 使用响应式安全的方式添加到数组
        todos.value = [...todos.value, newTodo]

        // 使用 nextTick 确保 DOM 更新
        await nextTick()

        // 记录成功日志
        logger.info('Todo added successfully (cloud mode)', { todo: newTodo }, 'useTodos')
        return newTodo
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
        // 确保响应式更新：使用响应式安全的方式从数组中移除
        const index = todos.value.findIndex((todo) => todo.id === id)
        if (index !== -1) {
          // 验证要删除的 Todo 存在
          const todoToRemove = todos.value[index]
          logger.info('Removing todo', { id, todo: todoToRemove }, 'useTodos')

          // 使用响应式安全的方式移除元素
          todos.value = todos.value.filter((todo) => todo.id !== id)

          // 使用 nextTick 确保 DOM 更新
          await nextTick()

          logger.info(
            'Todo removed successfully from memory',
            { id, remainingCount: todos.value.length },
            'useTodos'
          )

          // 不需要调用 saveTodos()，因为 HybridTodoStorageService 已经处理了同步
        } else {
          logger.warn('Todo not found in memory for removal', { id }, 'useTodos')
        }
        return true
      } else {
        logger.error('Failed to remove todo from storage', { id, error: result.error }, 'useTodos')
        return false
      }
    } catch (error) {
      logger.error('Error removing todo', error, 'useTodos')
      return false
    }
  }

  const updateTodosOrder = async (newOrder: string[]): Promise<boolean> => {
    try {
      logger.info('Starting updateTodosOrder', { newOrder }, 'useTodos')

      const storageService = getCurrentStorageService()
      const reorders = newOrder.map((id, index) => ({ id, order: index }))

      logger.info('Calling storageService.reorderTodos', { reorders }, 'useTodos')

      const result = await storageService.reorderTodos(reorders)

      logger.info('storageService.reorderTodos result', { result }, 'useTodos')

      if (result.success) {
        // 更新本地状态
        const orderMap = new Map(newOrder.map((id, index) => [id, index]))
        const oldTodos = [...todos.value]

        todos.value = todos.value
          .map((todo) => ({
            ...todo,
            order: orderMap.get(todo.id) ?? todo.order,
            updatedAt: new Date().toISOString(),
          }))
          .sort((a, b) => a.order - b.order)

        logger.info(
          'Local todos updated',
          {
            oldOrders: oldTodos.map((t) => ({ id: t.id, order: t.order })),
            newOrders: todos.value.map((t) => ({ id: t.id, order: t.order })),
          },
          'useTodos'
        )

        // 不需要调用 saveTodos()，因为 reorderTodos 已经处理了存储

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
      logger.info(
        'Starting updateTodosOrderByArray',
        {
          newTodosLength: newTodos?.length,
          currentTodosLength: todos.value.length,
          newTodosIds: newTodos?.map((t) => t.id),
          newTodosOrders: newTodos?.map((t) => ({ id: t.id, order: t.order })),
        },
        'useTodos'
      )

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
      logger.info('Calling updateTodosOrder with newOrder', { newOrder }, 'useTodos')

      const result = await updateTodosOrder(newOrder)

      logger.info('updateTodosOrder result', { result }, 'useTodos')

      return result
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
      // 验证 ID 参数
      if (!id || id === 'undefined') {
        logger.error('Invalid todo ID provided', { id }, 'useTodos')
        return false
      }

      const storageService = getCurrentStorageService()

      // 过滤掉不属于 UpdateTodoDto 的字段，确保与后端 DTO 一致
      const allowedFields: (keyof UpdateTodoDto)[] = [
        'title',
        'description',
        'completed',
        'completedAt',
        'priority',
        'estimatedTime',
        'dueDate',
        'order',
        'aiAnalyzed',
      ]

      const filteredUpdates: UpdateTodoDto = {}
      allowedFields.forEach((field) => {
        if (field in updates && updates[field] !== undefined) {
          ;(filteredUpdates as Record<string, unknown>)[field] = updates[field]
        }
      })

      // 添加重试机制提高可靠性
      const result = await withRetry(
        () => storageService.updateTodo(id, filteredUpdates),
        STORAGE_RETRY_OPTIONS
      )

      if (result.success) {
        // 确保响应式更新：使用响应式安全的方式更新数组
        const todoIndex = todos.value.findIndex((todo) => todo.id === id)
        if (todoIndex !== -1) {
          const updatedTodo = {
            ...todos.value[todoIndex],
            ...filteredUpdates,
            updatedAt: new Date().toISOString(),
          }

          // 验证更新后的 Todo 数据完整性
          if (!updatedTodo.title || updatedTodo.title.trim() === '') {
            logger.error('Updated todo has empty title', { id, todo: updatedTodo }, 'useTodos')
            return false
          }

          // 使用响应式安全的方式更新数组
          const newTodos = [...todos.value]
          newTodos[todoIndex] = updatedTodo
          todos.value = newTodos

          // 使用 nextTick 确保 DOM 更新
          await nextTick()
        }
        logger.info('Todo updated successfully', { id, updates: filteredUpdates }, 'useTodos')
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

  /**
   * 更新 Todo 的 AI 分析状态
   * 专门用于 AI 分析完成后更新相关字段
   */
  const updateTodoAIAnalysis = async (
    id: string,
    analysisData: { priority?: number; estimatedTime?: string; aiAnalyzed?: boolean }
  ): Promise<boolean> => {
    try {
      // 验证 ID 参数
      if (!id || id === 'undefined') {
        logger.error('Invalid todo ID provided for AI analysis update', { id }, 'useTodos')
        return false
      }

      const updates: UpdateTodoDto = {
        priority: analysisData.priority,
        estimatedTime: analysisData.estimatedTime,
        aiAnalyzed: analysisData.aiAnalyzed ?? true,
      }

      return await updateTodo(id, updates)
    } catch (error) {
      logger.error('Error updating todo AI analysis', error, 'useTodos')
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
    updateTodoAIAnalysis,
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

    // 测试辅助方法
    resetState: async () => {
      globalTodos.value = []
      isInitialized.value = true // 允许保存操作
      await saveTodos() // 保存空的待办事项列表
      isInitialized.value = false // 重置初始化状态
    },

    // 数据清理
    cleanupDuplicates: async () => {
      const originalLength = todos.value.length
      validateDataConsistency()
      const removedCount = originalLength - todos.value.length

      if (removedCount > 0) {
        logger.info(`Cleaned up ${removedCount} duplicate todos`, undefined, 'useTodos')
        return { removed: removedCount, remaining: todos.value.length }
      } else {
        logger.info('No duplicate todos found', undefined, 'useTodos')
        return { removed: 0, remaining: todos.value.length }
      }
    },

    // 清理机制
    cleanup: () => {
      // 清理状态
      globalTodos.value = []
      isInitialized.value = false
      logger.info('useTodos cleanup completed', undefined, 'useTodos')
    },

    // 登出时清理数据
    clearTodosOnLogout,
  }

  // 监听认证状态变化，用户登出时清理数据并重新加载本地数据
  watch(
    isAuthenticated,
    async (authenticated) => {
      if (!authenticated) {
        clearTodosOnLogout()
        // 用户登出后，立即从本地存储重新加载数据
        try {
          await loadTodos()
        } catch (error) {
          logger.error('Failed to load local todos after logout', error, 'useTodos')
        }
      }
    },
    { immediate: true }
  ) // 立即执行一次，确保页面加载时也会检查

  // 组件卸载时自动清理
  onUnmounted(() => {
    if (typeof result.cleanup === 'function') {
      result.cleanup()
    }
  })

  return result
}
