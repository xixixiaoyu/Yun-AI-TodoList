import { describe, it, expect } from 'vitest'
import { TodoValidator } from '../todoValidator'

describe('TodoValidator', () => {
  const validTodo = {
    id: 1,
    text: 'Test todo',
    completed: false,
    tags: ['work'],
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
      const invalidTodo = { ...validTodo, id: 'invalid' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid ID: must be a positive number')
    })

    it('should reject empty text', () => {
      const invalidTodo = { ...validTodo, text: '' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid text: must be a non-empty string')
    })

    it('should reject invalid completed status', () => {
      const invalidTodo = { ...validTodo, completed: 'false' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid completed status: must be boolean')
    })

    it('should reject invalid tags', () => {
      const invalidTodo = { ...validTodo, tags: 'not-array' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid tags: must be an array')
    })

    it('should reject invalid date strings', () => {
      const invalidTodo = { ...validTodo, createdAt: 'invalid-date' }
      const result = TodoValidator.validateTodo(invalidTodo)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid createdAt: must be a valid ISO string')
    })

    it('should sanitize text in valid todo', () => {
      const todoWithExtraSpaces = { ...validTodo, text: '  Test todo  ' }
      const result = TodoValidator.validateTodo(todoWithExtraSpaces)
      expect(result.isValid).toBe(true)
      expect(result.sanitizedData?.text).toBe('Test todo')
    })

    it('should filter empty tags', () => {
      const todoWithEmptyTags = { ...validTodo, tags: ['work', '', 'personal', '  '] }
      const result = TodoValidator.validateTodo(todoWithEmptyTags)
      expect(result.isValid).toBe(true)
      expect(result.sanitizedData?.tags).toEqual(['work', 'personal'])
    })
  })

  describe('validateTodos', () => {
    it('should validate array of todos', () => {
      const todos = [validTodo, { ...validTodo, id: 2 }]
      const result = TodoValidator.validateTodos(todos)
      expect(result.validTodos).toHaveLength(2)
      expect(result.invalidCount).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle mixed valid and invalid todos', () => {
      const todos = [validTodo, { ...validTodo, id: 'invalid' }, { ...validTodo, id: 3 }]
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

  describe('sanitizeText', () => {
    it('should trim and normalize spaces', () => {
      expect(TodoValidator.sanitizeText('  hello   world  ')).toBe('hello world')
    })

    it('should limit text length', () => {
      const longText = 'a'.repeat(600)
      const result = TodoValidator.sanitizeText(longText)
      expect(result.length).toBe(500)
    })
  })

  describe('isTextSafe', () => {
    it('should allow safe text', () => {
      expect(TodoValidator.isTextSafe('Normal todo text')).toBe(true)
    })

    it('should reject script tags', () => {
      expect(TodoValidator.isTextSafe('<script>alert("xss")</script>')).toBe(false)
    })

    it('should reject javascript: URLs', () => {
      const protocol = 'javascript'
      const maliciousUrl = `${protocol}:alert("xss")`
      expect(TodoValidator.isTextSafe(maliciousUrl)).toBe(false)
    })

    it('should reject event handlers', () => {
      expect(TodoValidator.isTextSafe('onclick=alert("xss")')).toBe(false)
    })
  })
})
