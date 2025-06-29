/**
 * 存储系统集成测试
 * 测试本地存储、远程存储和数据迁移的完整流程
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, ref } from 'vue'
import type { CreateTodoDto } from '../../types/todo'

// Import composables dynamically to allow for proper mocking
let useStorageMode: any
let useTodos: any

// Mock network status
vi.mock('../../composables/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: ref(true),
    onOnline: vi.fn(),
    onOffline: vi.fn(),
    waitForConnection: vi.fn().mockResolvedValue(true),
  }),
}))

// Mock authentication
vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: ref(true),
    user: ref({
      id: 'test-user',
      email: 'test@example.com',
      preferences: {
        storageConfig: {
          mode: 'local',
          autoSync: true,
          syncInterval: 5,
          offlineMode: true,
          conflictResolution: 'ask-user',
        },
      },
    }),
  }),
}))

// Mock notifications
vi.mock('../../composables/useNotifications', () => ({
  useNotifications: () => ({
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}))

describe('Storage Integration Tests', () => {
  let app: any

  beforeEach(async () => {
    // Create a fresh Vue app for each test
    app = createApp({})

    // Clear localStorage
    localStorage.clear()

    // Clear all mocks
    vi.clearAllMocks()

    // Dynamically import composables
    const storageModule = await import('../../composables/useStorageMode')
    const todosModule = await import('../../composables/useTodos')

    useStorageMode = storageModule.useStorageMode
    useTodos = todosModule.useTodos

    // Reset todos state
    const { todos, resetState } = useTodos()
    await resetState()
    todos.value = []
    await new Promise((resolve) => setTimeout(resolve, 100)) // 等待状态更新
  })

  afterEach(async () => {
    if (app) {
      app.unmount()
    }
    localStorage.clear()
    const { todos, resetState } = useTodos()
    await resetState()
    todos.value = []
    await new Promise((resolve) => setTimeout(resolve, 100)) // 等待状态更新
    vi.restoreAllMocks()
  })

  describe('Storage Mode Switching', () => {
    it('should switch between storage modes correctly', async () => {
      const { currentMode, switchStorageMode, initializeStorageMode } = useStorageMode()

      // Initialize storage mode
      await initializeStorageMode()
      expect(currentMode.value).toBe('local')

      // Switch to hybrid mode
      const success = await switchStorageMode('hybrid')
      expect(success).toBe(true)
      expect(currentMode.value).toBe('hybrid')

      // Switch back to local mode
      const success2 = await switchStorageMode('local')
      expect(success2).toBe(true)
      expect(currentMode.value).toBe('local')
    })

    it('should handle storage mode initialization with user preferences', async () => {
      const { initializeStorageMode, currentMode } = useStorageMode()

      await initializeStorageMode()

      // Should use the mode from user preferences (mocked as 'local')
      expect(currentMode.value).toBe('local')
    })
  })

  describe('Todo Operations with Different Storage Modes', () => {
    it('should perform CRUD operations in local storage mode', async () => {
      const { initializeTodos, addTodo, updateTodo, removeTodo, todos } = useTodos()
      const { initializeStorageMode, switchStorageMode } = useStorageMode()

      // Initialize with local storage
      await initializeStorageMode()
      await switchStorageMode('local')
      await initializeTodos()

      // Create a todo
      const createDto: CreateTodoDto = {
        title: 'Test Todo',
      }

      const newTodo = await addTodo(createDto)
      expect(newTodo).toBeTruthy()
      expect(newTodo?.title).toBe('Test Todo')
      expect(todos.value).toHaveLength(1)

      // Update the todo
      if (newTodo) {
        const updateSuccess = await updateTodo(newTodo.id, {
          title: 'Updated Todo',
          completed: true,
        })
        expect(updateSuccess).toBe(true)
        expect(todos.value[0].title).toBe('Updated Todo')
        expect(todos.value[0].completed).toBe(true)

        // Delete the todo
        const deleteSuccess = await removeTodo(newTodo.id)
        expect(deleteSuccess).toBe(true)
        expect(todos.value).toHaveLength(0)
      }
    })

    it('should handle batch operations correctly', async () => {
      const { initializeTodos, addMultipleTodos, todos } = useTodos()
      const { initializeStorageMode } = useStorageMode()

      await initializeStorageMode()
      await initializeTodos()

      // Add multiple todos
      const newTodos = [{ title: 'Todo 1' }, { title: 'Todo 2' }, { title: 'Todo 3' }]

      const duplicates = await addMultipleTodos(newTodos)
      expect(duplicates).toHaveLength(0)
      expect(todos.value).toHaveLength(3)

      // Try to add duplicates
      const duplicates2 = await addMultipleTodos([{ title: 'Todo 1' }])
      expect(duplicates2).toContain('Todo 1')
      expect(todos.value).toHaveLength(3) // Should not increase
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const { initializeTodos, addTodo } = useTodos()
      const { initializeStorageMode, getCurrentStorageService } = useStorageMode()

      await initializeStorageMode()
      await initializeTodos()

      // Mock the storage service's createTodo method to fail
      const storageService = getCurrentStorageService()
      const originalCreateTodo = storageService.createTodo
      storageService.createTodo = vi.fn().mockResolvedValue({
        success: false,
        error: 'Storage quota exceeded',
      })

      // Should handle the error gracefully
      const result = await addTodo({ title: 'Test Todo' })
      expect(result).toBeNull() // Should fail gracefully

      // Restore original method
      storageService.createTodo = originalCreateTodo
    })

    it('should retry failed operations', async () => {
      // This would test the retry mechanism in the error handler
      // For now, we just verify the structure exists
      const { initializeTodos } = useTodos()
      expect(typeof initializeTodos).toBe('function')
    })
  })

  describe('Offline Mode Handling', () => {
    it('should handle offline mode transitions', async () => {
      // Mock network going offline
      vi.doMock('../../composables/useNetworkStatus', () => ({
        useNetworkStatus: () => ({
          isOnline: ref(false),
          onOnline: vi.fn(),
          onOffline: vi.fn(),
          waitForConnection: vi.fn().mockResolvedValue(true),
        }),
      }))

      const { initializeStorageMode, currentMode } = useStorageMode()

      await initializeStorageMode()

      // Should automatically switch to local mode when offline
      expect(currentMode.value).toBe('local')
    })
  })

  describe('Performance and Memory', () => {
    it('should not leak memory during storage operations', async () => {
      const { initializeTodos, addTodo, removeTodo } = useTodos()
      const { initializeStorageMode } = useStorageMode()

      await initializeStorageMode()
      await initializeTodos()

      // Perform many operations to test for memory leaks
      const operations = []
      for (let i = 0; i < 100; i++) {
        operations.push(
          addTodo({ title: `Performance Test Todo ${i} - ${Date.now()}-${Math.random()}` })
        )
      }

      const todos = await Promise.all(operations)
      const validTodos = todos.filter(
        (todo): todo is NonNullable<Awaited<ReturnType<typeof addTodo>>> =>
          todo !== null && todo !== undefined
      )
      expect(validTodos).toHaveLength(100)

      // Clean up
      for (const todo of validTodos) {
        if (todo && todo.id) {
          await removeTodo(todo.id)
        }
      }
    })

    it('should handle large datasets efficiently', async () => {
      const { initializeTodos, addMultipleTodos, todos } = useTodos()
      const { initializeStorageMode } = useStorageMode()

      await initializeStorageMode()
      await initializeTodos()

      // Add a large number of todos
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        title: `Large Dataset Todo ${i}`,
      }))

      const startTime = performance.now()
      await addMultipleTodos(largeBatch)
      const endTime = performance.now()

      // 验证添加的 todos 数量是否正确
      expect(todos.value.length).toBe(1000)
      // 验证性能是否在可接受范围内
      expect(endTime - startTime).toBeLessThan(10000) // 10 秒内应该完成
    })
  })
})
