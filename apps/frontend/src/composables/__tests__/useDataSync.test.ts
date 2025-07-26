import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { syncService } from '../../services/syncService'
import type { Todo } from '../../types/todo'
import { useDataSync } from '../useDataSync'

// Mock dependencies
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: { value: true },
  }),
}))

vi.mock('../useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: { value: true },
    isSlowConnection: { value: false },
    onOnline: vi.fn(() => vi.fn()),
    onOffline: vi.fn(() => vi.fn()),
  }),
}))

vi.mock('../useNotifications', () => ({
  useNotifications: () => ({
    networkOnline: vi.fn(),
    networkOffline: vi.fn(),
    syncSuccess: vi.fn(),
    syncError: vi.fn(),
  }),
}))

vi.mock('../useTodos', () => ({
  useTodos: () => {
    const todos = ref([])
    return {
      todos,
      setTodos: vi.fn((newTodos) => {
        todos.value = newTodos
      }),
    }
  },
}))

vi.mock('../../services/syncService', () => ({
  syncService: {
    updateSingleTodo: vi.fn(),
    syncData: vi.fn(),
    uploadData: vi.fn(),
    downloadData: vi.fn().mockResolvedValue({
      error: null,
      todos: [],
    }),
  },
  SyncStatus: {
    SUCCESS: 'success',
    ERROR: 'error',
    CONFLICT: 'conflict',
  },
}))

describe('useDataSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('冲突解决功能', () => {
    it('应该正确处理冲突解决', async () => {
      const mockTodo1: Todo = {
        id: '1',
        title: 'Test Todo 1',
        completed: false,
        priority: 'medium',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const mockTodo2: Todo = {
        id: '1',
        title: 'Test Todo 1 Updated',
        completed: true,
        priority: 'high',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      // Mock syncService.updateSingleTodo
      const mockUpdateSingleTodo = vi.mocked(syncService.updateSingleTodo)
      mockUpdateSingleTodo.mockResolvedValue({
        success: true,
        data: mockTodo2,
      })

      // Mock syncService.syncData to simulate conflicts
      const mockSyncData = vi.mocked(syncService.syncData)
      mockSyncData.mockResolvedValue({
        status: 'conflict',
        message: '同步完成但存在冲突',
        timestamp: new Date(),
        stats: { totalItems: 1, uploaded: 0, downloaded: 0, conflicts: 1, errors: 0 },
        conflicts: [
          {
            local: mockTodo1,
            server: mockTodo2,
            reason: 'Both versions modified',
          },
        ],
      })

      const { handleConflictResolution, currentConflicts, showConflictModal, manualSync } =
        useDataSync()

      // 触发同步以产生冲突
      await manualSync()

      // 验证冲突已设置
      expect(currentConflicts.value).toHaveLength(1)
      expect(currentConflicts.value[0].local).toEqual(mockTodo1)
      expect(currentConflicts.value[0].server).toEqual(mockTodo2)
      expect(showConflictModal.value).toBe(true)

      // 解决冲突 - 选择服务器版本
      const resolutions = [{ index: 0, choice: 'server' as const }]

      await handleConflictResolution(resolutions)

      // 验证结果
      expect(mockUpdateSingleTodo).toHaveBeenCalledWith(mockTodo2)
      expect(currentConflicts.value).toEqual([])
      expect(showConflictModal.value).toBe(false)
    })

    it('应该正确处理选择本地版本的冲突', async () => {
      const mockTodo1: Todo = {
        id: '1',
        title: 'Local Version',
        completed: false,
        priority: 'medium',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const mockTodo2: Todo = {
        id: '1',
        title: 'Server Version',
        completed: true,
        priority: 'high',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      const mockConflicts = [
        {
          local: mockTodo1,
          server: mockTodo2,
          reason: 'Both versions modified',
        },
      ]

      const { handleConflictResolution, currentConflicts, showConflictModal } = useDataSync()

      // 模拟设置冲突
      currentConflicts.value = mockConflicts
      showConflictModal.value = true

      // 解决冲突 - 选择本地版本
      const resolutions = [{ index: 0, choice: 'local' as const }]
      await handleConflictResolution(resolutions)

      // 验证结果 - 选择本地版本时不应该调用 updateSingleTodo
      expect(syncService.updateSingleTodo).not.toHaveBeenCalled()
      expect(currentConflicts.value).toEqual([])
      expect(showConflictModal.value).toBe(false)
    })
  })

  describe('智能合并功能', () => {
    it('应该正确合并本地和云端数据', () => {
      const localTodos: Todo[] = [
        {
          id: '1',
          title: 'Local Todo 1',
          completed: false,
          priority: 'medium',
          order: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Local Todo 2',
          completed: false,
          priority: 'low',
          order: 2,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      const cloudTodos: Todo[] = [
        {
          id: '1',
          title: 'Local Todo 1',
          completed: true, // 云端版本已完成
          priority: 'medium',
          order: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        {
          id: '3',
          title: 'Cloud Todo 3',
          completed: false,
          priority: 'high',
          order: 3,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      const { smartMergeTodos } = useDataSync()
      const merged = smartMergeTodos(localTodos, cloudTodos)

      expect(merged).toHaveLength(3)
      expect(merged.find((t) => t.id === '1')?.completed).toBe(true) // 应该使用云端版本
      expect(merged.find((t) => t.id === '2')).toBeDefined() // 本地独有的应该保留
      expect(merged.find((t) => t.id === '3')).toBeDefined() // 云端独有的应该添加
    })

    it('应该正确处理重复标题的 Todo', () => {
      const localTodos: Todo[] = [
        {
          id: 'local-1',
          title: 'Duplicate Title',
          completed: false,
          priority: 'medium',
          order: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      const cloudTodos: Todo[] = [
        {
          id: 'cloud-1',
          title: 'Duplicate Title',
          completed: true,
          priority: 'high',
          order: 1,
          createdAt: '2024-01-02T00:00:00Z', // 云端创建时间更晚
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ]

      const { smartMergeTodos } = useDataSync()
      const merged = smartMergeTodos(localTodos, cloudTodos)

      // 应该保留本地版本（创建时间更早）
      expect(merged).toHaveLength(1)
      expect(merged[0].id).toBe('local-1')
    })
  })
})
