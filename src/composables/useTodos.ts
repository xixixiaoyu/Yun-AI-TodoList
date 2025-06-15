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
          // 使用增强的验证器
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
      // 尝试从备份恢复
      loadFromBackup()
    }
  }

  // 备份恢复机制
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

    // 如果备份也失败，初始化为空数组
    todos.value = []
  }

  const validateDataConsistency = () => {
    const seenIds = new Set<number>()
    todos.value = todos.value.filter(todo => {
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

      // 先备份当前数据
      const currentData = localStorage.getItem('todos')
      if (currentData) {
        localStorage.setItem('todos_backup', currentData)
      }

      // 保存新数据
      localStorage.setItem('todos', todosJson)
      logger.debug('Todos saved successfully', { count: todos.value.length }, 'useTodos')
    } catch (error) {
      logger.error('Error saving todos', error, 'useTodos')

      // 如果保存失败，尝试清理存储空间
      try {
        // 清理备份，为新数据腾出空间
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

    // 使用安全的文本验证和清理
    const sanitizedText = TodoValidator.sanitizeText(text)
    if (!TodoValidator.isTextSafe(sanitizedText)) {
      logger.warn('Attempted to add unsafe todo text', { text }, 'useTodos')
      return false
    }

    const isDuplicate = todos.value.some(
      todo =>
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
      id: IdGenerator.generateId(), // 使用安全的 ID 生成器
      text: sanitizedText,
      completed: false,
      tags: tags.filter(tag => tag.trim() !== '').map(tag => tag.trim()),
      createdAt: now,
      updatedAt: now,
      order: todos.value.length
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

    // 先验证所有 todos，避免部分添加的情况
    newTodos.forEach(({ text }) => {
      const sanitizedText = TodoValidator.sanitizeText(text)

      if (!TodoValidator.isTextSafe(sanitizedText)) {
        logger.warn('Skipped unsafe todo text in batch add', { text }, 'useTodos')
        return
      }

      if (todos.value.some(todo => todo.text.toLowerCase() === sanitizedText.toLowerCase())) {
        duplicates.push(text)
      } else {
        validTodos.push({
          id: IdGenerator.generateId(), // 使用安全的 ID 生成器
          text: sanitizedText,
          completed: false,
          tags: [],
          createdAt: now,
          updatedAt: now,
          order: todos.value.length + validTodos.length
        })
      }
    })

    // 批量添加有效的 todos
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
    const todo = todos.value.find(todo => todo && todo.id === id)
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
    todos.value = todos.value.filter(todo => todo && todo.id !== id)
    saveTodos()
  }

  const updateTodosOrder = (newOrder: number[]) => {
    const orderMap = new Map(newOrder.map((id, index) => [id, index]))

    todos.value = todos.value
      .map(todo => ({
        ...todo,
        order: orderMap.get(todo.id) ?? todo.order,
        updatedAt: new Date().toISOString()
      }))
      .sort((a, b) => a.order - b.order)

    saveTodos()
  }

  loadTodos()

  const getCompletedTodosByDate = () => {
    const completedByDate: { [key: string]: number } = {}
    todos.value.forEach(todo => {
      if (todo && todo.completed && todo.completedAt) {
        const date = new Date(todo.completedAt).toISOString().split('T')[0]
        completedByDate[date] = (completedByDate[date] || 0) + 1
      }
    })
    return completedByDate
  }

  const updateTodoTags = (id: number, tags: string[]) => {
    const todo = todos.value.find(todo => todo && todo.id === id)
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
    getCompletedTodosByDate,
    updateTodoTags,
    saveTodos,
    loadTodos
  }
}
