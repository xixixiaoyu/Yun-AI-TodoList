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

    if (typeof todoObj.id !== 'number' || todoObj.id <= 0) {
      errors.push('Invalid ID: must be a positive number')
    }

    if (typeof todoObj.text !== 'string' || todoObj.text.trim() === '') {
      errors.push('Invalid text: must be a non-empty string')
    }

    if (typeof todoObj.completed !== 'boolean') {
      errors.push('Invalid completed status: must be boolean')
    }

    if (!Array.isArray(todoObj.tags)) {
      errors.push('Invalid tags: must be an array')
    } else if (!todoObj.tags.every((tag: unknown) => typeof tag === 'string')) {
      errors.push('Invalid tags: all tags must be strings')
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

    const isValid = errors.length === 0

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
        order: todoObj.order as number,
      }

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
    return text.trim().replace(/\s+/g, ' ').substring(0, 500)
  }

  static isTextSafe(text: string): boolean {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ]

    return !dangerousPatterns.some((pattern) => pattern.test(text))
  }
}
