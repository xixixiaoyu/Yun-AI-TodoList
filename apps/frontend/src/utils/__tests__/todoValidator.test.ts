import { describe, expect, it } from 'vitest'
import { TodoValidator } from '../todoValidator'

describe('TodoValidator', () => {
  const validTodo = {
    id: 'test-todo-1',
    title: 'Test todo',
    completed: false,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    order: 0,
  }

  describe('validateTodo', () => {
    it('should validate a correct todo', () => {
      const result = TodoValidator.validateTodo(validTodo)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitizedData).toBeDefined()
    })

    it('should reject invalid ID', () => {
      const invalidTodo = { ...validTodo, id: '' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid ID: must be a non-empty string')
    })

    it('should reject empty title', () => {
      const invalidTodo = { ...validTodo, title: '' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid title: must be a non-empty string')
    })

    it('should reject invalid completed status', () => {
      const invalidTodo = { ...validTodo, completed: 'false' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid completed status: must be boolean')
    })

    // Tags validation test removed as tags field is no longer used

    it('should reject invalid date strings', () => {
      const invalidTodo = { ...validTodo, createdAt: 'invalid-date' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid createdAt: must be a valid ISO string')
    })

    it('should sanitize title in valid todo', () => {
      const todoWithExtraSpaces = { ...validTodo, title: '  Test todo  ' }
      const result = TodoValidator.validateTodo(todoWithExtraSpaces)
      expect(result.isValid).toBe(true)
      expect(result.sanitizedData?.title).toBe('Test todo')
    })

    // Empty tags filtering test removed as tags field is no longer used
  })

  describe('validateTodos', () => {
    it('should validate array of todos', () => {
      const todos = [validTodo, { ...validTodo, id: 'test-todo-2' }]
      const result = TodoValidator.validateTodos(todos)
      expect(result.validTodos).toHaveLength(2)
      expect(result.invalidCount).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle mixed valid and invalid todos', () => {
      const todos = [validTodo, { ...validTodo, id: 'test-todo-2' }, { ...validTodo, id: '' }]
      const result = TodoValidator.validateTodos(todos)
      expect(result.validTodos).toHaveLength(2)
      expect(result.invalidCount).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('should handle non-array input', () => {
      const result = TodoValidator.validateTodos('not-array' as unknown as unknown[])
      expect(result.validTodos).toHaveLength(0)
      expect(result.invalidCount).toBe(0)
      expect(result.errors).toContain('Input is not an array')
    })
  })

  describe('sanitizeTitle', () => {
    it('should trim and normalize spaces', () => {
      expect(TodoValidator.sanitizeTitle('  hello   world  ')).toBe('hello world')
    })

    it('should limit title length', () => {
      const longTitle = 'a'.repeat(600)
      const result = TodoValidator.sanitizeTitle(longTitle)
      expect(result.length).toBe(500)
    })
  })

  describe('isTitleSafe', () => {
    it('should allow safe title', () => {
      expect(TodoValidator.isTitleSafe('Normal todo title')).toBe(true)
    })

    it('should reject script tags', () => {
      expect(TodoValidator.isTitleSafe('<script>alert("xss")</script>')).toBe(false)
    })

    it('should reject javascript: URLs', () => {
      const protocol = 'javascript'
      const maliciousUrl = `${protocol}:alert("xss")`
      expect(TodoValidator.isTitleSafe(maliciousUrl)).toBe(false)
    })

    it('should reject event handlers', () => {
      expect(TodoValidator.isTitleSafe('onclick=alert("xss")')).toBe(false)
    })
  })
})
