/**
 * LocalStorageService 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LocalStorageService } from '../../services/storage/LocalStorageService'
import type { CreateTodoDto, Todo } from '@shared/types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('LocalStorageService', () => {
  let service: LocalStorageService

  beforeEach(() => {
    service = new LocalStorageService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getTodos', () => {
    it('should return empty array when no todos exist', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = await service.getTodos()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should return todos when they exist', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTodos))

      const result = await service.getTodos()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTodos)
    })

    it('should handle invalid JSON gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = await service.getTodos()

      expect(result.success).toBe(false)
      expect(result.error).toBe('storage.readLocalDataFailed')
    })
  })

  describe('createTodo', () => {
    it('should create a new todo successfully', async () => {
      localStorageMock.getItem.mockReturnValue('[]')

      const createDto: CreateTodoDto = {
        title: 'New Todo',
      }

      const result = await service.createTodo(createDto)

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('New Todo')
      expect(result.data?.completed).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should reject empty title', async () => {
      const createDto: CreateTodoDto = {
        title: '',
      }

      const result = await service.createTodo(createDto)

      expect(result.success).toBe(false)
      expect(result.error).toBe('storage.todoTitleEmpty')
    })

    it('should reject duplicate titles', async () => {
      const existingTodos: Todo[] = [
        {
          id: '1',
          title: 'Existing Todo',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTodos))

      const createDto: CreateTodoDto = {
        title: 'Existing Todo',
      }

      const result = await service.createTodo(createDto)

      expect(result.success).toBe(false)
      expect(result.error).toBe('storage.todoAlreadyExists')
    })
  })

  describe('updateTodo', () => {
    it('should update an existing todo', async () => {
      const existingTodos: Todo[] = [
        {
          id: '1',
          title: 'Original Title',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTodos))

      const result = await service.updateTodo('1', {
        title: 'Updated Title',
        completed: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Updated Title')
      expect(result.data?.completed).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should return error for non-existent todo', async () => {
      localStorageMock.getItem.mockReturnValue('[]')

      const result = await service.updateTodo('nonexistent', {
        title: 'Updated Title',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('storage.todoNotFound')
    })
  })

  describe('deleteTodo', () => {
    it('should delete an existing todo', async () => {
      const existingTodos: Todo[] = [
        {
          id: '1',
          title: 'Todo to Delete',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTodos))

      const result = await service.deleteTodo('1')

      expect(result.success).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should return error for non-existent todo', async () => {
      localStorageMock.getItem.mockReturnValue('[]')

      const result = await service.deleteTodo('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('storage.todoNotFound')
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Completed Todo',
          completed: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 0,
        },
        {
          id: '2',
          title: 'Active Todo',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          order: 1,
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(todos))

      const result = await service.getStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total: 2,
        completed: 1,
        active: 1,
        completionRate: 50,
      })
    })
  })

  describe('checkHealth', () => {
    it('should return true when localStorage is working', async () => {
      // Mock getItem to return the same value that was set
      localStorageMock.getItem.mockReturnValue('test')

      const result = await service.checkHealth()

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
      expect(localStorageMock.getItem).toHaveBeenCalled()
      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })

    it('should return false when localStorage throws error', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const result = await service.checkHealth()

      expect(result).toBe(false)
    })
  })
})
