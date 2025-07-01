import type { CreateTodoDto, Todo, UpdateTodoDto } from '@shared/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RemoteStorageService } from '../../services/storage/RemoteStorageService'

// Mock httpClient
const mockHttpClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}

vi.mock('../../services/api', () => ({
  httpClient: mockHttpClient,
}))

// Mock fetch for health checks
global.fetch = vi.fn()

describe('RemoteStorageService (Cloud Storage)', () => {
  let service: RemoteStorageService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new RemoteStorageService()

    // Mock successful health check by default
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
    })
  })

  describe('Network Status Management', () => {
    it('should initialize with correct network status', () => {
      const status = service.status
      expect(status.networkStatus.isOnline).toBe(navigator.onLine)
      expect(status.networkStatus.consecutiveFailures).toBe(0)
      expect(status.pendingOperations).toBe(0)
    })

    it('should check network status', async () => {
      const networkStatus = await service.checkNetworkStatus()
      expect(networkStatus.isOnline).toBe(navigator.onLine)
      expect(typeof networkStatus.isServerReachable).toBe('boolean')
      expect(typeof networkStatus.consecutiveFailures).toBe('number')
    })

    it('should handle server health check failure', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const isHealthy = await service.checkHealth()
      expect(isHealthy).toBe(false)
      expect(service.status.networkStatus.isServerReachable).toBe(false)
      expect(service.status.networkStatus.consecutiveFailures).toBeGreaterThan(0)
    })
  })

  describe('CRUD Operations with Retry Logic', () => {
    const mockTodo: Todo = {
      id: '1',
      title: 'Test Todo',
      description: 'Test Description',
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it('should successfully get todos', async () => {
      const mockResponse = {
        success: true,
        data: {
          todos: [mockTodo],
          total: 1,
          page: 1,
          limit: 10,
          stats: { total: 1, completed: 0, pending: 1 },
        },
      }
      mockHttpClient.get.mockResolvedValue(mockResponse)

      const result = await service.getTodos()
      expect(result.success).toBe(true)
      expect(result.data).toEqual([mockTodo])
      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/todos')
    })

    it('should retry failed requests', async () => {
      // First two calls fail, third succeeds
      mockHttpClient.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: { todos: [mockTodo], total: 1, page: 1, limit: 10, stats: {} },
        })

      const result = await service.getTodos()
      expect(result.success).toBe(true)
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Persistent network error'))

      const result = await service.getTodos()
      expect(result.success).toBe(false)
      expect(result.error).toContain('获取Todo列表失败')
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3) // maxRetries = 3
    })

    it('should successfully create todo', async () => {
      const createDto: CreateTodoDto = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high',
      }

      const mockResponse = {
        success: true,
        data: { ...mockTodo, ...createDto },
        timestamp: new Date().toISOString(),
      }
      mockHttpClient.post.mockResolvedValue(mockResponse)

      const result = await service.createTodo(createDto)
      expect(result.success).toBe(true)
      expect(result.data?.title).toBe(createDto.title)
      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/todos', createDto)
    })

    it('should successfully update todo', async () => {
      const updateDto: UpdateTodoDto = {
        title: 'Updated Todo',
        completed: true,
      }

      const mockResponse = {
        success: true,
        data: { ...mockTodo, ...updateDto },
        timestamp: new Date().toISOString(),
      }
      mockHttpClient.patch.mockResolvedValue(mockResponse)

      const result = await service.updateTodo('1', updateDto)
      expect(result.success).toBe(true)
      expect(result.data?.title).toBe(updateDto.title)
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/v1/todos/1', updateDto)
    })

    it('should successfully delete todo', async () => {
      mockHttpClient.delete.mockResolvedValue({})

      const result = await service.deleteTodo('1')
      expect(result.success).toBe(true)
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/todos/1')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid server responses', async () => {
      mockHttpClient.get.mockResolvedValue(null)

      const result = await service.getTodos()
      expect(result.success).toBe(false)
      expect(result.error).toContain('服务器响应格式无效')
    })

    it('should handle server errors', async () => {
      mockHttpClient.get.mockResolvedValue({
        success: false,
        data: null,
      })

      const result = await service.getTodos()
      expect(result.success).toBe(false)
      expect(result.error).toContain('服务器返回数据格式错误')
    })

    it('should track pending operations correctly', async () => {
      const createPromise = service.createTodo({
        title: 'Test',
        priority: 'medium',
      })

      // Check that pending operations increased
      expect(service.status.pendingOperations).toBe(1)

      // Mock successful response
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockTodo,
        timestamp: new Date().toISOString(),
      })

      await createPromise

      // Check that pending operations decreased
      expect(service.status.pendingOperations).toBe(0)
    })
  })

  describe('Network Status Updates', () => {
    it('should update network status on successful operations', async () => {
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: { todos: [], total: 0, page: 1, limit: 10, stats: {} },
      })

      await service.getTodos()

      const status = service.status
      expect(status.networkStatus.consecutiveFailures).toBe(0)
      expect(status.lastOperationTime).toBeDefined()
    })

    it('should update failure count on network errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'))

      await service.getTodos()

      const status = service.status
      expect(status.networkStatus.consecutiveFailures).toBeGreaterThan(0)
    })
  })
})
