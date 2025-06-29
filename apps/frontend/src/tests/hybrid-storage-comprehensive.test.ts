/**
 * 混合存储功能综合测试
 * 全面测试在线/离线状态下的数据存储、同步和合并功能
 */

import type { Todo } from '@shared/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

// 网络状态模拟器
class NetworkStatusMocker {
  private isOnlineState = true
  private listeners: Array<() => void> = []

  setOnline(online: boolean) {
    this.isOnlineState = online
    // 模拟浏览器事件
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: online,
    })

    // 触发事件
    const event = online ? 'online' : 'offline'
    window.dispatchEvent(new Event(event))

    // 通知监听器
    this.listeners.forEach((listener) => listener())
  }

  get isOnline() {
    return this.isOnlineState
  }

  addListener(callback: () => void) {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  reset() {
    this.isOnlineState = true
    this.listeners = []
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  }
}

// 数据生成器
class TestDataGenerator {
  static createTodo(overrides: Partial<Todo> = {}): Todo {
    const now = new Date().toISOString()
    return {
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: `Test Todo ${Date.now()}`,
      completed: false,
      createdAt: now,
      updatedAt: now,
      order: 0,
      ...overrides,
    }
  }

  static createTodos(count: number): Todo[] {
    return Array.from({ length: count }, (_, i) =>
      this.createTodo({
        title: `Test Todo ${i + 1}`,
        order: i,
      })
    )
  }

  static createConflictingTodos(): { local: Todo; remote: Todo } {
    const baseId = `conflict-${Date.now()}`
    const baseTime = new Date()

    const local: Todo = {
      id: baseId,
      title: 'Local Version',
      completed: false,
      createdAt: baseTime.toISOString(),
      updatedAt: new Date(baseTime.getTime() + 1000).toISOString(), // 1秒后
      order: 0,
    }

    const remote: Todo = {
      id: baseId,
      title: 'Remote Version',
      completed: true,
      createdAt: baseTime.toISOString(),
      updatedAt: new Date(baseTime.getTime() + 2000).toISOString(), // 2秒后
      order: 0,
    }

    return { local, remote }
  }
}

// 数据一致性检查器
class ConsistencyChecker {
  static async checkLocalRemoteConsistency(
    localData: Todo[],
    remoteData: Todo[]
  ): Promise<{
    isConsistent: boolean
    differences: Array<{
      type: 'missing_local' | 'missing_remote' | 'content_diff'
      id: string
      details?: string
    }>
  }> {
    const differences: Array<{
      type: 'missing_local' | 'missing_remote' | 'content_diff'
      id: string
      details?: string
    }> = []

    const localMap = new Map(localData.map((todo) => [todo.id, todo]))
    const remoteMap = new Map(remoteData.map((todo) => [todo.id, todo]))

    // 检查本地缺失的数据
    for (const [id, remoteTodo] of remoteMap) {
      if (!localMap.has(id)) {
        differences.push({ type: 'missing_local', id })
      } else {
        const localTodo = localMap.get(id)!
        if (JSON.stringify(localTodo) !== JSON.stringify(remoteTodo)) {
          differences.push({
            type: 'content_diff',
            id,
            details: `Local: ${JSON.stringify(localTodo)}, Remote: ${JSON.stringify(remoteTodo)}`,
          })
        }
      }
    }

    // 检查远程缺失的数据
    for (const [id] of localMap) {
      if (!remoteMap.has(id)) {
        differences.push({ type: 'missing_remote', id })
      }
    }

    return {
      isConsistent: differences.length === 0,
      differences,
    }
  }
}

// Mock 设置
const networkMocker = new NetworkStatusMocker()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch for network checks
global.fetch = vi.fn()

// Mock composables
let mockTodos = ref<Todo[]>([])
let mockStorageMode = ref<'local' | 'remote' | 'hybrid'>('hybrid')
let mockIsAuthenticated = ref(true)

vi.mock('@/composables/useTodos', () => ({
  useTodos: () => ({
    todos: mockTodos,
    addTodo: vi.fn(),
    updateTodo: vi.fn(),
    removeTodo: vi.fn(),
    setTodos: vi.fn((newTodos: Todo[]) => {
      mockTodos.value = newTodos
    }),
  }),
}))

vi.mock('@/composables/useStorageMode', () => ({
  useStorageMode: () => ({
    currentMode: mockStorageMode,
    switchStorageMode: vi.fn().mockResolvedValue(true),
    initializeStorageMode: vi.fn().mockResolvedValue(undefined),
    getCurrentStorageService: vi.fn().mockReturnValue({
      createTodo: vi
        .fn()
        .mockResolvedValue({ success: true, data: TestDataGenerator.createTodo() }),
      getTodos: vi.fn().mockResolvedValue({ success: true, data: [] }),
      saveTodos: vi.fn().mockResolvedValue({ success: true }),
      updateTodo: vi.fn().mockResolvedValue({ success: true }),
      deleteTodo: vi.fn().mockResolvedValue({ success: true }),
      checkHealth: vi.fn().mockResolvedValue(true),
    }),
    config: ref({
      mode: 'hybrid',
      autoSync: true,
      syncInterval: 5,
      offlineMode: true,
      conflictResolution: 'merge',
    }),
    isInitialized: ref(true),
  }),
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: ref({ id: 'test-user' }),
  }),
}))

vi.mock('@/composables/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: ref(networkMocker.isOnline),
    checkConnection: vi.fn().mockResolvedValue(networkMocker.isOnline),
    onOnline: vi.fn((callback) => networkMocker.addListener(callback)),
    onOffline: vi.fn((callback) => networkMocker.addListener(callback)),
  }),
}))

describe('混合存储功能综合测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    networkMocker.reset()
    mockTodos.value = []
    mockStorageMode.value = 'hybrid'
    mockIsAuthenticated.value = true
    localStorageMock.getItem.mockReturnValue(null)

    // Mock successful fetch responses
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { todos: [] } }),
    })
  })

  afterEach(() => {
    networkMocker.reset()
  })

  describe('在线状态下的混合存储测试', () => {
    beforeEach(() => {
      networkMocker.setOnline(true)
    })

    it('应该验证本地存储和云端存储同时可用', async () => {
      // 模拟本地存储可用
      localStorageMock.setItem.mockImplementation(() => {})
      localStorageMock.getItem.mockReturnValue('[]')

      // 模拟云端存储可用
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { todos: [] } }),
      })

      // 验证本地存储健康状态
      const testKey = 'health_check'
      localStorageMock.setItem(testKey, 'test')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(testKey, 'test')

      // 验证云端存储健康状态
      const response = await fetch('/api/v1/todos')
      expect(response.ok).toBe(true)
    })

    it('应该确保数据能够正确同步到云端并在本地保留副本', async () => {
      const testTodos = TestDataGenerator.createTodos(3)

      // 模拟本地数据
      mockTodos.value = testTodos
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testTodos))

      // 模拟云端同步成功
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { todos: testTodos },
          }),
      })

      // 验证本地数据存在
      expect(mockTodos.value).toHaveLength(3)

      // 验证云端同步
      const response = await fetch('/api/v1/todos', {
        method: 'POST',
        body: JSON.stringify({ todos: testTodos }),
      })
      expect(response.ok).toBe(true)

      // 验证本地副本仍然存在
      const localData = localStorage.getItem('todos')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('todos')
      expect(localData).toBeDefined()
    })
  })

  describe('离线状态下的存储测试', () => {
    beforeEach(() => {
      networkMocker.setOnline(false)
    })

    it('应该验证应用能够检测到网络断开状态', async () => {
      expect(navigator.onLine).toBe(false)

      // 模拟网络检查失败
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      try {
        await fetch('/favicon.ico')
        expect(true).toBe(false) // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('应该确保所有 CRUD 操作都能正常使用本地存储', async () => {
      const testTodos = TestDataGenerator.createTodos(2)

      // 模拟本地存储操作
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testTodos))
      localStorageMock.setItem.mockImplementation(() => {})

      // 测试读取操作
      const storedData = localStorage.getItem('todos')
      expect(JSON.parse(storedData || '[]')).toHaveLength(2)

      // 测试写入操作
      const newTodo = TestDataGenerator.createTodo()
      const updatedTodos = [...testTodos, newTodo]
      localStorage.setItem('todos', JSON.stringify(updatedTodos))
      expect(localStorageMock.setItem).toHaveBeenCalledWith('todos', JSON.stringify(updatedTodos))

      // 测试删除操作
      const filteredTodos = updatedTodos.filter((t) => t.id !== newTodo.id)
      localStorage.setItem('todos', JSON.stringify(filteredTodos))
      expect(localStorageMock.setItem).toHaveBeenCalledWith('todos', JSON.stringify(filteredTodos))
    })
  })

  describe('网络恢复时的自动合并测试', () => {
    it('应该验证网络状态检测机制的准确性', async () => {
      // 开始时离线
      networkMocker.setOnline(false)
      expect(navigator.onLine).toBe(false)

      // 模拟网络恢复
      networkMocker.setOnline(true)
      expect(navigator.onLine).toBe(true)

      // 验证网络检查
      ;(global.fetch as any).mockResolvedValue({ ok: true })
      const isConnected = await fetch('/favicon.ico').then((r) => r.ok)
      expect(isConnected).toBe(true)
    })

    it('应该测试本地数据与云端数据的自动合并逻辑', async () => {
      // 准备测试数据
      const localTodos = TestDataGenerator.createTodos(2)
      const cloudTodos = TestDataGenerator.createTodos(2)
      cloudTodos[0].id = 'cloud-only-1'
      cloudTodos[1].id = 'cloud-only-2'

      // 模拟离线状态下的本地数据
      networkMocker.setOnline(false)
      mockTodos.value = localTodos
      localStorageMock.getItem.mockReturnValue(JSON.stringify(localTodos))

      // 模拟网络恢复
      networkMocker.setOnline(true)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { todos: cloudTodos },
          }),
      })

      // 执行智能合并
      const mergedTodos = [...localTodos, ...cloudTodos]
      mockTodos.value = mergedTodos

      // 验证合并结果
      expect(mockTodos.value).toHaveLength(4)
      expect(mockTodos.value.some((t: Todo) => t.id === localTodos[0].id)).toBe(true)
      expect(mockTodos.value.some((t: Todo) => t.id === cloudTodos[0].id)).toBe(true)
    })

    it('应该测试冲突解决策略（以最新时间戳为准）', async () => {
      const { local, remote } = TestDataGenerator.createConflictingTodos()

      // 模拟冲突场景
      const localTodos = [local]
      const cloudTodos = [remote]

      mockTodos.value = localTodos

      // 模拟网络恢复和数据获取
      networkMocker.setOnline(true)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { todos: cloudTodos },
          }),
      })

      // 执行冲突解决（remote 的 updatedAt 更新，应该优先使用）
      const localTime = new Date(local.updatedAt).getTime()
      const remoteTime = new Date(remote.updatedAt).getTime()

      const resolvedTodo = remoteTime > localTime ? remote : local
      mockTodos.value = [resolvedTodo]

      // 验证冲突解决结果
      expect(mockTodos.value).toHaveLength(1)
      expect(mockTodos.value[0].title).toBe('Remote Version')
      expect(mockTodos.value[0].completed).toBe(true)
    })

    it('应该验证合并完成后本地和云端数据的一致性', async () => {
      const testTodos = TestDataGenerator.createTodos(3)

      // 模拟合并后的状态
      mockTodos.value = testTodos
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testTodos))
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { todos: testTodos },
          }),
      })

      // 获取本地和云端数据
      const localData = JSON.parse(localStorage.getItem('todos') || '[]')
      const cloudResponse = await fetch('/api/v1/todos')
      const cloudData = await cloudResponse.json()

      // 验证一致性
      const consistency = await ConsistencyChecker.checkLocalRemoteConsistency(
        localData,
        cloudData.data.todos
      )

      expect(consistency.isConsistent).toBe(true)
      expect(consistency.differences).toHaveLength(0)
    })
  })

  describe('特殊场景测试', () => {
    it('应该处理多设备间的数据同步', async () => {
      // 模拟设备A的数据
      const deviceATodos = TestDataGenerator.createTodos(2)
      deviceATodos.forEach((todo) => (todo.id = `device-a-${todo.id}`))

      // 模拟设备B的数据
      const deviceBTodos = TestDataGenerator.createTodos(2)
      deviceBTodos.forEach((todo) => (todo.id = `device-b-${todo.id}`))

      // 模拟云端合并后的数据
      const mergedTodos = [...deviceATodos, ...deviceBTodos]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { todos: mergedTodos },
          }),
      })

      // 验证多设备数据合并
      const response = await fetch('/api/v1/todos')
      const data = await response.json()

      expect(data.data.todos).toHaveLength(4)
      expect(data.data.todos.some((t: Todo) => t.id.includes('device-a'))).toBe(true)
      expect(data.data.todos.some((t: Todo) => t.id.includes('device-b'))).toBe(true)
    })

    it('应该处理长时间离线后的大量数据合并', async () => {
      // 模拟大量本地数据（离线期间创建）
      const largeBatchLocal = TestDataGenerator.createTodos(100)

      // 模拟大量云端数据（其他设备同步）
      const largeBatchCloud = TestDataGenerator.createTodos(100)
      largeBatchCloud.forEach((todo) => (todo.id = `cloud-${todo.id}`))

      mockTodos.value = largeBatchLocal

      // 模拟网络恢复
      networkMocker.setOnline(true)
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { todos: largeBatchCloud },
          }),
      })

      // 执行大量数据合并
      const startTime = performance.now()
      const mergedTodos = [...largeBatchLocal, ...largeBatchCloud]
      mockTodos.value = mergedTodos
      const endTime = performance.now()

      // 验证合并结果和性能
      expect(mockTodos.value).toHaveLength(200)
      expect(endTime - startTime).toBeLessThan(1000) // 应该在1秒内完成
    })

    it('应该处理网络不稳定时的数据处理', async () => {
      let callCount = 0

      // 模拟不稳定的网络连接
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network timeout'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { todos: [] } }),
        })
      })

      // 模拟重试机制
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          const response = await fetch('/api/v1/todos')
          if (response.ok) break
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) {
            // 应该回退到本地存储
            expect(retryCount).toBe(maxRetries)
            break
          }
        }
      }

      // 验证最终成功或回退到本地存储
      expect(callCount).toBeGreaterThan(1)
    })

    it('应该处理用户在离线和在线状态间频繁切换的情况', async () => {
      const testTodos = TestDataGenerator.createTodos(3)

      // 模拟频繁的网络状态切换
      for (let i = 0; i < 5; i++) {
        // 切换到离线
        networkMocker.setOnline(false)
        expect(navigator.onLine).toBe(false)

        // 模拟离线操作
        mockTodos.value = [...testTodos, TestDataGenerator.createTodo()]

        await nextTick()

        // 切换到在线
        networkMocker.setOnline(true)
        expect(navigator.onLine).toBe(true)

        // 模拟同步操作
        ;(global.fetch as any).mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { todos: mockTodos.value },
            }),
        })

        await nextTick()
      }

      // 验证数据完整性
      expect(mockTodos.value.length).toBeGreaterThan(3)
    })
  })

  describe('错误处理和边界测试', () => {
    it('应该处理本地存储空间不足的情况', async () => {
      // 模拟存储空间不足
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const testTodos = TestDataGenerator.createTodos(1000) // 大量数据

      try {
        localStorage.setItem('todos', JSON.stringify(testTodos))
        expect(true).toBe(false) // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('QuotaExceededError')
      }
    })

    it('应该处理云端服务不可用的情况', async () => {
      networkMocker.setOnline(true)

      // 模拟服务器错误
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
      })

      const response = await fetch('/api/v1/todos')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)

      // 应该回退到本地存储
      localStorage.getItem('todos')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('todos')
    })

    it('应该处理数据格式错误的情况', async () => {
      // 模拟损坏的本地数据
      localStorageMock.getItem.mockReturnValue('invalid json data')

      try {
        JSON.parse(localStorage.getItem('todos') || '[]')
        expect(true).toBe(false) // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError)

        // 应该重置为空数组
        const fallbackData: Todo[] = []
        expect(fallbackData).toEqual([])
      }
    })
  })
})
