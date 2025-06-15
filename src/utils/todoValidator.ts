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
  /**
   * 验证 Todo 对象是否完整有效
   */
  static validateTodo(todo: unknown): ValidationResult {
    const errors: string[] = []

    // 基础类型检查
    if (!todo || typeof todo !== 'object') {
      return { isValid: false, errors: ['Invalid todo object'] }
    }

    // 类型断言为 Record<string, unknown> 以便访问属性
    const todoObj = todo as Record<string, unknown>

    // ID 验证
    if (typeof todoObj.id !== 'number' || todoObj.id <= 0) {
      errors.push('Invalid ID: must be a positive number')
    }

    // 文本验证
    if (typeof todoObj.text !== 'string' || todoObj.text.trim() === '') {
      errors.push('Invalid text: must be a non-empty string')
    }

    // 完成状态验证
    if (typeof todoObj.completed !== 'boolean') {
      errors.push('Invalid completed status: must be boolean')
    }

    // 标签验证
    if (!Array.isArray(todoObj.tags)) {
      errors.push('Invalid tags: must be an array')
    } else if (!todoObj.tags.every((tag: unknown) => typeof tag === 'string')) {
      errors.push('Invalid tags: all tags must be strings')
    }

    // 时间戳验证
    if (typeof todoObj.createdAt !== 'string' || !this.isValidISOString(todoObj.createdAt)) {
      errors.push('Invalid createdAt: must be a valid ISO string')
    }

    if (typeof todoObj.updatedAt !== 'string' || !this.isValidISOString(todoObj.updatedAt)) {
      errors.push('Invalid updatedAt: must be a valid ISO string')
    }

    // 完成时间验证（可选）
    if (todoObj.completedAt !== undefined) {
      if (typeof todoObj.completedAt !== 'string' || !this.isValidISOString(todoObj.completedAt)) {
        errors.push('Invalid completedAt: must be a valid ISO string or undefined')
      }
    }

    // 排序验证
    if (typeof todoObj.order !== 'number' || todoObj.order < 0) {
      errors.push('Invalid order: must be a non-negative number')
    }

    const isValid = errors.length === 0

    // 如果验证通过，返回清理后的数据
    if (isValid) {
      const sanitizedData: Todo = {
        id: todoObj.id as number,
        text: (todoObj.text as string).trim(),
        completed: todoObj.completed as boolean,
        tags: (todoObj.tags as string[])
          .filter((tag: string) => tag.trim() !== '')
          .map((tag: string) => tag.trim()),
        createdAt: todoObj.createdAt as string,
        updatedAt: todoObj.updatedAt as string,
        order: todoObj.order as number
      }

      // 如果存在 completedAt，则添加到对象中
      if (todoObj.completedAt) {
        sanitizedData.completedAt = todoObj.completedAt as string
      }

      return { isValid: true, errors: [], sanitizedData }
    }

    return { isValid, errors }
  }

  /**
   * 批量验证 Todo 数组
   */
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

  /**
   * 验证 ISO 时间字符串
   */
  private static isValidISOString(dateString: string): boolean {
    try {
      const date = new Date(dateString)
      return date.toISOString() === dateString
    } catch {
      return false
    }
  }

  /**
   * 清理和标准化 Todo 文本
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // 合并多个空格
      .substring(0, 500) // 限制长度
  }

  /**
   * 验证 Todo 文本是否安全
   */
  static isTextSafe(text: string): boolean {
    // 检查是否包含潜在的恶意内容
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ]

    return !dangerousPatterns.some(pattern => pattern.test(text))
  }
}
