/**
 * Todo 数据验证工具
 * 提供完整的数据验证和清理功能
 */

import type { Todo } from '../types/todo'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: Todo
}

export class TodoValidator {
  static validateTodo(todo: unknown): ValidationResult {
    const errors: string[] = []

    if (!todo || typeof todo !== 'object') {
      return { isValid: false, errors: ['Invalid todo object'] }
    }

    const todoObj = todo as Record<string, unknown>

    if (typeof todoObj.id !== 'string' || todoObj.id.trim() === '') {
      errors.push('Invalid ID: must be a non-empty string')
    }

    if (typeof todoObj.title !== 'string' || todoObj.title.trim() === '') {
      errors.push('Invalid title: must be a non-empty string')
    }

    if (typeof todoObj.completed !== 'boolean') {
      errors.push('Invalid completed status: must be boolean')
    }

    if (typeof todoObj.createdAt !== 'string' || !this.isValidISOString(todoObj.createdAt)) {
      errors.push('Invalid createdAt: must be a valid ISO string')
    }

    if (typeof todoObj.updatedAt !== 'string' || !this.isValidISOString(todoObj.updatedAt)) {
      errors.push('Invalid updatedAt: must be a valid ISO string')
    }

    if (todoObj.completedAt !== undefined) {
      if (typeof todoObj.completedAt !== 'string' || !this.isValidISOString(todoObj.completedAt)) {
        errors.push('Invalid completedAt: must be a valid ISO string or undefined')
      }
    }

    if (typeof todoObj.order !== 'number' || todoObj.order < 0) {
      errors.push('Invalid order: must be a non-negative number')
    }

    // 验证 AI 分析字段（可选）
    if (todoObj.priority !== undefined && todoObj.priority !== null) {
      if (typeof todoObj.priority !== 'number' || todoObj.priority < 1 || todoObj.priority > 5) {
        errors.push('Invalid priority: must be a number between 1 and 5')
      }
    }

    if (todoObj.estimatedTime !== undefined && todoObj.estimatedTime !== null) {
      // 支持字符串格式（旧数据）和对象格式（新数据）
      if (typeof todoObj.estimatedTime === 'string') {
        // 字符串格式，需要转换为对象格式
        if ((todoObj.estimatedTime as string).trim() === '') {
          errors.push('Invalid estimatedTime: string cannot be empty')
        }
      } else if (typeof todoObj.estimatedTime === 'object') {
        // 对象格式，验证结构
        const estimatedTimeObj = todoObj.estimatedTime as Record<string, unknown>
        if (
          typeof estimatedTimeObj.text !== 'string' ||
          (estimatedTimeObj.text as string).trim() === '' ||
          typeof estimatedTimeObj.minutes !== 'number' ||
          (estimatedTimeObj.minutes as number) < 0
        ) {
          errors.push(
            'Invalid estimatedTime: must be an object with text (non-empty string) and minutes (non-negative number)'
          )
        }
      } else {
        errors.push('Invalid estimatedTime: must be a string or an object with text and minutes')
      }
    }

    if (todoObj.aiAnalyzed !== undefined && todoObj.aiAnalyzed !== null) {
      if (typeof todoObj.aiAnalyzed !== 'boolean') {
        errors.push('Invalid aiAnalyzed: must be boolean')
      }
    }

    // 验证同步相关字段（可选）
    if (todoObj.synced !== undefined && todoObj.synced !== null) {
      if (typeof todoObj.synced !== 'boolean') {
        errors.push('Invalid synced: must be boolean')
      }
    }

    if (todoObj.lastSyncTime !== undefined && todoObj.lastSyncTime !== null) {
      if (
        typeof todoObj.lastSyncTime !== 'string' ||
        !this.isValidISOString(todoObj.lastSyncTime)
      ) {
        errors.push('Invalid lastSyncTime: must be a valid ISO string')
      }
    }

    if (todoObj.syncError !== undefined && todoObj.syncError !== null) {
      if (typeof todoObj.syncError !== 'string') {
        errors.push('Invalid syncError: must be a string')
      }
    }

    if (todoObj.description !== undefined && todoObj.description !== null) {
      if (typeof todoObj.description !== 'string') {
        errors.push('Invalid description: must be a string')
      }
    }

    if (todoObj.dueDate !== undefined && todoObj.dueDate !== null) {
      if (typeof todoObj.dueDate !== 'string' || !this.isValidISOString(todoObj.dueDate)) {
        errors.push('Invalid dueDate: must be a valid ISO string')
      }
    }

    if (todoObj.userId !== undefined && todoObj.userId !== null) {
      if (typeof todoObj.userId !== 'string' || todoObj.userId.trim() === '') {
        errors.push('Invalid userId: must be a non-empty string')
      }
    }

    const isValid = errors.length === 0

    if (isValid) {
      const sanitizedData: Todo = {
        id: todoObj.id as string,
        title: (todoObj.title as string).trim(),
        completed: todoObj.completed as boolean,
        createdAt: todoObj.createdAt as string,
        updatedAt: todoObj.updatedAt as string,
        order: todoObj.order as number,
      }

      if (todoObj.completedAt) {
        sanitizedData.completedAt = todoObj.completedAt as string
      }

      // 添加 AI 分析字段（跳过 null 值）
      if (todoObj.priority !== undefined && todoObj.priority !== null) {
        sanitizedData.priority = todoObj.priority as 1 | 2 | 3 | 4 | 5
      }

      if (todoObj.estimatedTime !== undefined && todoObj.estimatedTime !== null) {
        if (typeof todoObj.estimatedTime === 'string') {
          // 字符串格式，转换为对象格式
          const timeText = (todoObj.estimatedTime as string).trim()
          const minutes = TodoValidator.parseTimeToMinutes(timeText)
          sanitizedData.estimatedTime = {
            text: timeText,
            minutes: minutes,
          }
        } else {
          // 对象格式，直接使用
          const estimatedTime = todoObj.estimatedTime as Record<string, unknown>
          sanitizedData.estimatedTime = {
            text: (estimatedTime.text as string).trim(),
            minutes: estimatedTime.minutes as number,
          }
        }
      }

      if (todoObj.aiAnalyzed !== undefined && todoObj.aiAnalyzed !== null) {
        sanitizedData.aiAnalyzed = todoObj.aiAnalyzed as boolean
      }

      // 添加同步相关字段（跳过 null 值）
      if (todoObj.synced !== undefined && todoObj.synced !== null) {
        sanitizedData.synced = todoObj.synced as boolean
      }

      if (todoObj.lastSyncTime !== undefined && todoObj.lastSyncTime !== null) {
        sanitizedData.lastSyncTime = todoObj.lastSyncTime as string
      }

      if (todoObj.syncError !== undefined && todoObj.syncError !== null) {
        sanitizedData.syncError = todoObj.syncError as string
      }

      if (todoObj.description !== undefined && todoObj.description !== null) {
        sanitizedData.description = (todoObj.description as string).trim()
      }

      if (todoObj.dueDate !== undefined && todoObj.dueDate !== null) {
        sanitizedData.dueDate = todoObj.dueDate as string
      }

      if (todoObj.userId !== undefined && todoObj.userId !== null) {
        sanitizedData.userId = (todoObj.userId as string).trim()
      }

      return { isValid: true, errors: [], sanitizedData }
    }

    return { isValid, errors }
  }

  static validateTodos(todos: unknown[]): {
    validTodos: Todo[]
    invalidCount: number
    errors: string[]
  } {
    if (!Array.isArray(todos)) {
      return { validTodos: [], invalidCount: 0, errors: ['Input is not an array'] }
    }

    const validTodos: Todo[] = []
    let invalidCount = 0
    const allErrors: string[] = []

    todos.forEach((todo, index) => {
      const result = this.validateTodo(todo)
      if (result.isValid && result.sanitizedData) {
        validTodos.push(result.sanitizedData)
      } else {
        invalidCount++
        allErrors.push(`Todo ${index}: ${result.errors.join(', ')}`)
      }
    })

    return { validTodos, invalidCount, errors: allErrors }
  }

  private static isValidISOString(dateString: string): boolean {
    try {
      const date = new Date(dateString)
      return date.toISOString() === dateString
    } catch {
      return false
    }
  }

  /**
   * 清理和标准化 Todo 标题
   */
  static sanitizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ').substring(0, 500)
  }

  static isTitleSafe(title: string): boolean {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ]

    return !dangerousPatterns.some((pattern) => pattern.test(title))
  }

  /**
   * 解析时间文本为分钟数
   * @param timeText 时间文本，如 "30分钟", "2小时", "1天"
   * @returns 对应的分钟数
   */
  static parseTimeToMinutes(timeText: string): number {
    const text = timeText.toLowerCase()

    const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*[小时时h]/i)
    const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*[分钟分m]/i)
    const dayMatch = text.match(/(\d+(?:\.\d+)?)\s*[天日d]/i)

    let totalMinutes = 0

    if (dayMatch) {
      totalMinutes += parseFloat(dayMatch[1]) * 24 * 60
    }

    if (hourMatch) {
      totalMinutes += parseFloat(hourMatch[1]) * 60
    }

    if (minuteMatch) {
      totalMinutes += parseFloat(minuteMatch[1])
    }

    // 如果没有匹配到任何时间单位，尝试解析纯数字（默认为分钟）
    if (totalMinutes === 0) {
      const numberMatch = text.match(/^(\d+(?:\.\d+)?)$/)
      if (numberMatch) {
        totalMinutes = parseFloat(numberMatch[1])
      }
    }

    return Math.max(0, Math.round(totalMinutes))
  }
}
