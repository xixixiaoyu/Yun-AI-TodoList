import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useOfflineMode } from '../useOfflineMode'

// 导入重置函数
const { resetOfflineState } = await import('../useOfflineMode')

// Mock dependencies
vi.mock('../useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: ref(true),
    onOnline: vi.fn(() => vi.fn()),
    onOffline: vi.fn(() => vi.fn()),
  }),
}))

vi.mock('../useNotifications', () => ({
  useNotifications: () => ({
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('../useStorageMode', () => ({
  useStorageMode: () => ({
    currentMode: ref('cloud'),
  }),
}))

vi.mock('../useTodos', () => ({
  useTodos: () => ({
    todos: ref([
      {
        id: '1',
        title: 'Test Todo',
        completed: false,
        priority: 'medium',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]),
  }),
}))

vi.mock('../../services/syncService', () => ({
  syncService: {
    syncData: vi.fn().mockResolvedValue({
      status: 'success',
      message: '同步成功',
      timestamp: new Date(),
    }),
  },
}))

vi.mock('../../services/api', () => ({
  httpClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useOfflineMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清理 localStorage
    localStorage.clear()
    // 重置离线状态
    resetOfflineState()
  })

  describe('离线操作管理', () => {
    it('应该正确添加离线操作', () => {
      const { addOfflineOperation, pendingOperations } = useOfflineMode()

      const operation = {
        type: 'create' as const,
        resource: 'todos',
        data: { title: 'New Todo', completed: false },
      }

      addOfflineOperation(operation)

      expect(pendingOperations.value).toHaveLength(1)
      expect(pendingOperations.value[0]).toMatchObject({
        type: 'create',
        resource: 'todos',
        data: { title: 'New Todo', completed: false },
        retryCount: 0,
        maxRetries: 3,
      })
    })

    it('应该正确计算待处理操作数量', () => {
      const { addOfflineOperation, pendingOperationsCount } = useOfflineMode()

      expect(pendingOperationsCount.value).toBe(0)

      addOfflineOperation({
        type: 'create',
        resource: 'todos',
        data: { title: 'Todo 1' },
      })

      addOfflineOperation({
        type: 'update',
        resource: 'todos',
        data: { id: '1', title: 'Updated Todo' },
      })

      expect(pendingOperationsCount.value).toBe(2)
    })
  })

  describe('同步功能', () => {
    it('应该成功同步待处理的操作', async () => {
      const { addOfflineOperation, syncPendingOperations, pendingOperations } = useOfflineMode()
      const { httpClient } = await import('../../services/api')

      // 添加一些离线操作
      addOfflineOperation({
        type: 'create',
        resource: 'todos',
        data: { title: 'New Todo' },
      })

      addOfflineOperation({
        type: 'update',
        resource: 'todos',
        data: { id: '1', title: 'Updated Todo' },
      })

      // Mock API 响应
      vi.mocked(httpClient.post).mockResolvedValue({ success: true, data: { id: '2' } })
      vi.mocked(httpClient.put).mockResolvedValue({ success: true, data: { id: '1' } })

      const result = await syncPendingOperations()

      expect(result).toBe(true)
      expect(pendingOperations.value).toHaveLength(0) // 所有操作都应该被清除
    })

    it('应该处理同步失败的情况', async () => {
      const { addOfflineOperation, syncPendingOperations, pendingOperations } = useOfflineMode()
      const { httpClient } = await import('../../services/api')

      // 添加一个离线操作
      addOfflineOperation({
        type: 'create',
        resource: 'todos',
        data: { title: 'New Todo' },
      })

      // Mock API 失败响应
      vi.mocked(httpClient.post).mockRejectedValue(new Error('Network error'))

      const result = await syncPendingOperations()

      expect(result).toBe(true) // 同步过程完成，即使有失败
      // 操作应该增加重试次数但仍在队列中
      expect(pendingOperations.value[0].retryCount).toBe(1)
    })

    it('应该在达到最大重试次数后移除失败的操作', async () => {
      // 先设置 API 失败响应
      const { httpClient } = await import('../../services/api')
      vi.mocked(httpClient.post).mockRejectedValue(new Error('Network error'))

      const { addOfflineOperation, syncPendingOperations, pendingOperations } = useOfflineMode()

      // 添加一个离线操作
      addOfflineOperation({
        type: 'create',
        resource: 'todos',
        data: { title: 'New Todo' },
      })

      // 验证操作已添加
      expect(pendingOperations.value).toHaveLength(1)
      expect(pendingOperations.value[0].retryCount).toBe(0)

      // 第一次同步失败，重试次数应该增加到 1
      await syncPendingOperations()
      expect(pendingOperations.value).toHaveLength(1)
      expect(pendingOperations.value[0].retryCount).toBe(1)

      // 第二次同步失败，重试次数应该增加到 2
      await syncPendingOperations()
      expect(pendingOperations.value).toHaveLength(1)
      expect(pendingOperations.value[0].retryCount).toBe(2)

      // 第三次同步失败，重试次数应该增加到 3，操作应该被移除
      await syncPendingOperations()
      expect(pendingOperations.value).toHaveLength(0)
    })
  })

  describe('离线模式切换', () => {
    it('应该正确进入离线模式', async () => {
      const { enterOfflineMode, isOfflineMode } = useOfflineMode()

      await enterOfflineMode()

      expect(isOfflineMode.value).toBe(true)
    })

    it('应该正确退出离线模式', async () => {
      const { enterOfflineMode, exitOfflineMode, isOfflineMode } = useOfflineMode()

      await enterOfflineMode()
      expect(isOfflineMode.value).toBe(true)

      await exitOfflineMode()
      expect(isOfflineMode.value).toBe(false)
    })
  })

  describe('状态持久化', () => {
    it('应该保存离线状态到本地存储', () => {
      const { addOfflineOperation, toggleAutoSync } = useOfflineMode()

      addOfflineOperation({
        type: 'create',
        resource: 'todos',
        data: { title: 'Test Todo' },
      })

      toggleAutoSync(false)

      const saved = localStorage.getItem('offline_state')
      expect(saved).toBeTruthy()

      if (saved) {
        const state = JSON.parse(saved)
        expect(state.pendingOperations).toHaveLength(1)
        expect(state.autoSyncEnabled).toBe(false)
      }
    })
  })
})
