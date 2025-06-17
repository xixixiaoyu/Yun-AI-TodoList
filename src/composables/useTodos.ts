import { ref } from 'vue'
import type { Todo } from '../types/todo'
import { IdGenerator } from '../utils/idGenerator'
import { logger } from '../utils/logger'
import { TodoValidator } from '../utils/todoValidator'

export function useTodos() {
  const todos = ref<Todo[]>([])

  const loadTodos = () => {
    try {
      const storedTodos = localStorage.getItem('todos')

      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos)
        if (Array.isArray(parsedTodos)) {
          const { validTodos, invalidCount, errors } = TodoValidator.validateTodos(parsedTodos)

          if (invalidCount > 0) {
            logger.warn(`Found ${invalidCount} invalid todos`, { errors }, 'useTodos')
          }

          todos.value = validTodos.sort((a, b) => a.order - b.order)
        }
      }

      validateDataConsistency()
    } catch (error) {
      logger.error('Error loading todos', error, 'useTodos')

      loadFromBackup()
    }
  }

  const loadFromBackup = () => {
    try {
      const backup = localStorage.getItem('todos_backup')
      if (backup) {
        const parsedBackup = JSON.parse(backup)
        const { validTodos } = TodoValidator.validateTodos(parsedBackup)
        todos.value = validTodos
        logger.info('Restored todos from backup', undefined, 'useTodos')
        return
      }
    } catch (error) {
      logger.error('Error loading backup', error, 'useTodos')
    }

    todos.value = []
  }

  const validateDataConsistency = () => {
    const seenIds = new Set<number>()
    todos.value = todos.value.filter((todo) => {
      if (seenIds.has(todo.id)) {
        return false
      }
      seenIds.add(todo.id)
      return true
    })

    saveTodos()
  }

  const saveTodos = () => {
    try {
      const todosJson = JSON.stringify(todos.value)

      const currentData = localStorage.getItem('todos')
      if (currentData) {
        localStorage.setItem('todos_backup', currentData)
      }

      localStorage.setItem('todos', todosJson)
      logger.debug('Todos saved successfully', { count: todos.value.length }, 'useTodos')
    } catch (error) {
      logger.error('Error saving todos', error, 'useTodos')

      try {
        localStorage.removeItem('todos_backup')
        localStorage.setItem('todos', JSON.stringify(todos.value))
        logger.warn('Saved todos after cleanup', undefined, 'useTodos')
      } catch (retryError) {
        logger.error('Failed to save todos even after cleanup', retryError, 'useTodos')
      }
    }
  }

  const addTodo = (text: string, tags: string[] = []): boolean => {
    if (!text || text.trim() === '') {
      return false
    }

    const sanitizedText = TodoValidator.sanitizeText(text)
    if (!TodoValidator.isTextSafe(sanitizedText)) {
      logger.warn('Attempted to add unsafe todo text', { text }, 'useTodos')
      return false
    }

    const isDuplicate = todos.value.some(
      (todo) =>
        todo &&
        todo.text &&
        todo.text.toLowerCase() === sanitizedText.toLowerCase() &&
        !todo.completed
    )

    if (isDuplicate) {
      return false
    }

    const now = new Date().toISOString()
    const newTodo: Todo = {
      id: IdGenerator.generateId(),
      text: sanitizedText,
      completed: false,
      tags: tags.filter((tag) => tag.trim() !== '').map((tag) => tag.trim()),
      createdAt: now,
      updatedAt: now,
      order: todos.value.length,
    }

    todos.value.push(newTodo)
    saveTodos()
    logger.debug('Todo added', { id: newTodo.id, text: newTodo.text }, 'useTodos')
    return true
  }

  const addMultipleTodos = (newTodos: { text: string }[]) => {
    const duplicates: string[] = []
    const now = new Date().toISOString()
    const validTodos: Todo[] = []

    newTodos.forEach(({ text }) => {
      const sanitizedText = TodoValidator.sanitizeText(text)

      if (!TodoValidator.isTextSafe(sanitizedText)) {
        logger.warn('Skipped unsafe todo text in batch add', { text }, 'useTodos')
        return
      }

      if (todos.value.some((todo) => todo.text.toLowerCase() === sanitizedText.toLowerCase())) {
        duplicates.push(text)
      } else {
        validTodos.push({
          id: IdGenerator.generateId(),
          text: sanitizedText,
          completed: false,
          tags: [],
          createdAt: now,
          updatedAt: now,
          order: todos.value.length + validTodos.length,
        })
      }
    })

    todos.value.push(...validTodos)
    saveTodos()
    logger.debug(
      'Multiple todos added',
      { count: validTodos.length, duplicates: duplicates.length },
      'useTodos'
    )
    return duplicates
  }

  const toggleTodo = (id: number) => {
    const todo = todos.value.find((todo) => todo && todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
      if (todo.completed) {
        todo.completedAt = new Date().toISOString()
      } else {
        delete todo.completedAt
      }
      saveTodos()
    }
  }

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter((todo) => todo && todo.id !== id)
    saveTodos()
  }

  const updateTodosOrder = (newOrder: number[]) => {
    const orderMap = new Map(newOrder.map((id, index) => [id, index]))

    todos.value = todos.value
      .map((todo) => ({
        ...todo,
        order: orderMap.get(todo.id) ?? todo.order,
        updatedAt: new Date().toISOString(),
      }))
      .sort((a, b) => a.order - b.order)

    saveTodos()
  }

  /**
   * 更新待办事项顺序（通过 Todo 数组）
   * 用于拖拽排序功能
   */
  const updateTodosOrderByArray = (newTodos: Todo[]) => {
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

      // 更新顺序
      todos.value = newTodos.map((todo, index) => ({
        ...todo,
        order: index,
        updatedAt: new Date().toISOString(),
      }))

      saveTodos()
      logger.debug(
        'Todos order updated successfully',
        {
          count: newTodos.length,
        },
        'useTodos'
      )
      return true
    } catch (error) {
      logger.error('Error updating todos order', error, 'useTodos')
      return false
    }
  }

  loadTodos()

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

  const updateTodoTags = (id: number, tags: string[]) => {
    const todo = todos.value.find((todo) => todo && todo.id === id)
    if (todo) {
      todo.tags = tags
      saveTodos()
    }
  }

  return {
    todos,
    addTodo,
    addMultipleTodos,
    toggleTodo,
    removeTodo,
    updateTodosOrder,
    updateTodosOrderByArray,
    getCompletedTodosByDate,
    updateTodoTags,
    saveTodos,
    loadTodos,
  }
}
