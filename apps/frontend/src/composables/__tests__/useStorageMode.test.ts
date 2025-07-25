import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// 清除其他测试文件中的模拟
vi.unmock('../useStorageMode')

// 重新导入真实的实现
const { useStorageMode } = await import('../useStorageMode')

// Mock dependencies
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: ref(true),
    user: ref({
      id: '1',
      email: 'test@example.com',
      preferences: {
        storageConfig: {
          mode: 'cloud',
          retryAttempts: 3,
          requestTimeout: 10000,
        },
      },
    }),
  }),
}))

vi.mock('../../services/storage/RemoteStorageService', () => ({
  RemoteStorageService: vi.fn().mockImplementation(() => ({
    checkNetworkStatus: vi.fn().mockResolvedValue({
      isOnline: true,
      isServerReachable: true,
      consecutiveFailures: 0,
    }),
    checkHealth: vi.fn().mockResolvedValue(true),
    status: {
      networkStatus: { isOnline: true, isServerReachable: true, consecutiveFailures: 0 },
      pendingOperations: 0,
      lastOperationTime: undefined,
    },
  })),
}))

vi.mock('../../services/storage/LocalStorageService', () => ({
  LocalStorageService: vi.fn().mockImplementation(() => ({
    checkNetworkStatus: vi.fn().mockResolvedValue({
      isOnline: true,
      isServerReachable: false,
      consecutiveFailures: 0,
    }),
    checkHealth: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('../../services/api', () => ({
  httpClient: {
    patch: vi.fn().mockResolvedValue({ success: true, message: '更新成功' }),
  },
}))

describe('useStorageMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('初始化', () => {
    it('应该正确初始化云端存储模式', async () => {
      const result = useStorageMode()
      console.log('useStorageMode result keys:', Object.keys(result))

      const { initializeStorageMode, isInitialized, currentMode, canUseCloudStorage } = result

      // 先检查认证状态
      console.log('canUseCloudStorage:', canUseCloudStorage?.value)
      expect(canUseCloudStorage.value).toBe(true)

      await initializeStorageMode()

      expect(isInitialized.value).toBe(true)
      expect(currentMode.value).toBe('cloud')
    })

    it('应该从用户偏好设置加载配置', async () => {
      const { initializeStorageMode, config } = useStorageMode()

      await initializeStorageMode()

      expect(config.value.retryAttempts).toBe(3)
      expect(config.value.requestTimeout).toBe(10000)
    })
  })

  describe('存储服务管理', () => {
    it('应该返回正确的存储服务', async () => {
      const { initializeStorageMode, getCurrentStorageService } = useStorageMode()

      await initializeStorageMode()
      const service = getCurrentStorageService()

      expect(service).toBeDefined()
    })

    it('应该在用户未认证时使用本地存储', () => {
      // 重新 mock useAuth 返回未认证状态
      vi.doMock('../useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: ref(false),
          user: ref(null),
        }),
      }))

      const { getCurrentStorageService } = useStorageMode()
      const service = getCurrentStorageService()

      expect(service).toBeDefined()
    })
  })

  describe('网络状态管理', () => {
    it('应该正确更新网络状态', async () => {
      const { initializeStorageMode, updateNetworkStatus, networkStatus } = useStorageMode()

      await initializeStorageMode()
      await updateNetworkStatus()

      expect(networkStatus.value.isOnline).toBe(true)
      expect(networkStatus.value.isServerReachable).toBe(true)
    })

    it('应该正确处理网络状态变化', async () => {
      const { initializeStorageMode, handleNetworkChange, networkStatus } = useStorageMode()

      await initializeStorageMode()
      await handleNetworkChange(false)

      expect(networkStatus.value.isOnline).toBe(false)
      expect(networkStatus.value.consecutiveFailures).toBeGreaterThan(0)
    })
  })

  describe('存储配置管理', () => {
    it('应该正确更新存储配置', async () => {
      const { updateStorageConfig, config } = useStorageMode()

      const updates = {
        retryAttempts: 5,
        requestTimeout: 15000,
      }

      const result = await updateStorageConfig(updates)

      expect(result).toBe(true)
      expect(config.value.retryAttempts).toBe(5)
      expect(config.value.requestTimeout).toBe(15000)
    })

    it('应该将配置同步到服务器', async () => {
      const { updateStorageConfig } = useStorageMode()
      const { httpClient } = await import('../../services/api')

      const updates = {
        retryAttempts: 5,
        requestTimeout: 15000,
      }

      await updateStorageConfig(updates)

      expect(httpClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/preferences',
        expect.objectContaining({
          storageConfig: expect.objectContaining({
            retryAttempts: 5,
            requestTimeout: 15000,
          }),
        })
      )
    })

    it('应该处理配置同步失败的情况', async () => {
      const { updateStorageConfig } = useStorageMode()
      const { httpClient } = await import('../../services/api')

      // Mock API 失败
      vi.mocked(httpClient.patch).mockRejectedValue(new Error('Network error'))

      const updates = {
        retryAttempts: 5,
      }

      // 应该仍然返回 true，因为本地保存成功
      const result = await updateStorageConfig(updates)
      expect(result).toBe(true)
    })
  })

  describe('健康检查', () => {
    it('应该正确检查存储健康状态', async () => {
      const { initializeStorageMode, checkStorageHealth } = useStorageMode()

      await initializeStorageMode()
      const isHealthy = await checkStorageHealth()

      expect(isHealthy).toBe(true)
    })

    it('应该处理健康检查失败的情况', async () => {
      const { initializeStorageMode, checkStorageHealth, getCurrentStorageService } =
        useStorageMode()

      await initializeStorageMode()

      // 直接模拟当前存储服务的 checkHealth 方法失败
      const storageService = getCurrentStorageService()

      if (storageService) {
        // 模拟健康检查失败
        vi.spyOn(storageService, 'checkHealth').mockRejectedValue(new Error('Health check failed'))
      }

      const isHealthy = await checkStorageHealth()
      expect(isHealthy).toBe(false)
    })
  })

  describe('云端存储重连', () => {
    it('应该成功重新连接云端存储', async () => {
      const {
        initializeStorageMode,
        reconnectCloudStorage,
        networkStatus,
        canUseCloudStorage,
        setNetworkStatusForTesting,
      } = useStorageMode()

      await initializeStorageMode()

      // 直接设置网络状态为可达
      setNetworkStatusForTesting({
        isOnline: true,
        isServerReachable: true,
        consecutiveFailures: 0,
      })

      // 调试信息
      console.log('Before reconnect - canUseCloudStorage:', canUseCloudStorage.value)
      console.log('Before reconnect - networkStatus:', networkStatus.value)

      const result = await reconnectCloudStorage()

      console.log('After reconnect - networkStatus:', networkStatus.value)
      console.log('Reconnect result:', result)

      expect(result).toBe(true)
    })

    it('应该在用户未认证时拒绝重连', async () => {
      // 直接模拟 isAuthenticated 为 false
      const mockIsAuthenticated = ref(false)
      const mockUser = ref(null)

      // 模拟 useAuth 返回未认证状态
      vi.doMock('../useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: mockIsAuthenticated,
          user: mockUser,
        }),
      }))

      // 重新导入模块以应用模拟
      vi.resetModules()
      const { useStorageMode: useStorageModeUnauthenticated } = await import('../useStorageMode')
      const { reconnectCloudStorage, canUseCloudStorage } = useStorageModeUnauthenticated()

      // 验证用户确实未认证
      expect(canUseCloudStorage.value).toBe(false)

      try {
        const result = await reconnectCloudStorage()
        // 如果没有抛出错误，那么应该返回 false
        expect(result).toBe(false)
      } catch (error) {
        // 如果抛出错误，说明正确拒绝了未认证用户
        expect(error.message).toContain('用户未认证')
      }
    })
  })

  describe('状态获取', () => {
    it('应该返回正确的存储状态', async () => {
      const { initializeStorageMode, getStorageStatus } = useStorageMode()

      await initializeStorageMode()
      const status = getStorageStatus()

      expect(status).toHaveProperty('networkStatus')
      expect(status).toHaveProperty('pendingOperations')
      expect(status).toHaveProperty('lastOperationTime')
    })
  })
})
