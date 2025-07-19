/**
 * 云端存储管理 Composable
 * 管理纯云端存储，提供统一的存储接口和网络状态监控
 */

import type { NetworkStatus, StorageConfig, StorageMode } from '@shared/types'
import { RemoteStorageService } from '../services/storage/RemoteStorageService'
import { TodoStorageService } from '../services/storage/TodoStorageService'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import { useAuth } from './useAuth'

// 全局存储状态
const storageState = reactive({
  currentMode: 'cloud' as StorageMode, // 纯云端存储
  config: {
    mode: 'cloud' as StorageMode,
    retryAttempts: 3, // 网络请求重试次数
    requestTimeout: 10000, // 请求超时时间（毫秒）
  } as StorageConfig,
  networkStatus: {
    isOnline: navigator.onLine,
    isServerReachable: false,
    consecutiveFailures: 0,
  } as NetworkStatus,
  isInitialized: false,
})

// 存储服务实例
let cloudStorageService: RemoteStorageService | null = null
let localStorageService: TodoStorageService | null = null
let currentStorageService: TodoStorageService | null = null

/**
 * 创建本地存储服务实例
 */
function createLocalStorageService(): TodoStorageService {
  return new LocalStorageService()
}

/**
 * 云端存储管理 Composable
 */
export function useStorageMode() {
  const { isAuthenticated, user } = useAuth()

  // 响应式状态
  const currentMode = readonly(toRef(storageState, 'currentMode'))
  const config = readonly(toRef(storageState, 'config'))
  const networkStatus = readonly(toRef(storageState, 'networkStatus'))
  const isInitialized = readonly(toRef(storageState, 'isInitialized'))

  // 计算属性
  const canUseCloudStorage = computed(() => isAuthenticated.value)
  const isOnline = computed(() => storageState.networkStatus.isOnline)
  const isServerReachable = computed(() => storageState.networkStatus.isServerReachable)

  /**
   * 初始化云端存储
   */
  const initializeStorageMode = async (): Promise<void> => {
    if (storageState.isInitialized) {
      return
    }

    try {
      // 检查用户认证状态
      if (!isAuthenticated.value) {
        throw new Error('用户未认证，无法使用云端存储')
      }

      // 创建云端存储服务实例
      cloudStorageService = new RemoteStorageService()
      currentStorageService = cloudStorageService

      // 从用户偏好设置加载配置
      await loadStorageConfig()

      // 检查网络连接状态
      await updateNetworkStatus()

      storageState.isInitialized = true
      console.log('Cloud storage initialized successfully')
    } catch (error) {
      console.error('Failed to initialize cloud storage:', error)
      throw error // 纯云端模式下，初始化失败应该抛出错误
    }
  }

  /**
   * 获取当前存储服务
   */
  const getCurrentStorageService = (): TodoStorageService => {
    // 如果用户已登录且云端存储服务可用，使用云端存储
    if (isAuthenticated.value && currentStorageService) {
      return currentStorageService
    }

    // 如果用户未登录，使用本地存储
    if (!isAuthenticated.value) {
      if (!localStorageService) {
        // 创建本地存储服务实例
        // 由于这是在浏览器环境中，我们可以直接创建一个简单的本地存储实现
        localStorageService = createLocalStorageService()
      }
      return localStorageService
    }

    throw new Error('存储服务未初始化，请先调用 initializeStorageMode()')
  }

  /**
   * 更新网络状态
   */
  const updateNetworkStatus = async (): Promise<void> => {
    if (currentStorageService) {
      const networkStatus = await currentStorageService.checkNetworkStatus()
      storageState.networkStatus = networkStatus
    }
  }

  /**
   * 重新连接云端存储
   */
  const reconnectCloudStorage = async (): Promise<boolean> => {
    try {
      if (!canUseCloudStorage.value) {
        throw new Error('用户未认证，无法连接云端存储')
      }

      await updateNetworkStatus()

      if (storageState.networkStatus.isServerReachable) {
        console.log('云端存储重新连接成功')
        return true
      } else {
        console.warn('服务器不可达，重新连接失败')
        return false
      }
    } catch (error) {
      console.error('重新连接云端存储失败:', error)
      return false
    }
  }

  /**
   * 更新存储配置
   */
  const updateStorageConfig = async (updates: Partial<StorageConfig>): Promise<boolean> => {
    try {
      storageState.config = { ...storageState.config, ...updates }
      await saveStorageConfig()
      return true
    } catch (error) {
      console.error('Failed to update storage config:', error)
      return false
    }
  }

  /**
   * 获取存储状态信息
   */
  const getStorageStatus = () => {
    const service = currentStorageService
    if (!service) {
      return {
        networkStatus: storageState.networkStatus,
        pendingOperations: 0,
        lastOperationTime: undefined,
      }
    }

    return service.status
  }

  /**
   * 检查存储健康状态
   */
  const checkStorageHealth = async (): Promise<boolean> => {
    try {
      const service = getCurrentStorageService()
      const isHealthy = await service.checkHealth()

      // 更新网络状态
      await updateNetworkStatus()

      return isHealthy
    } catch (error) {
      console.error('Storage health check failed:', error)
      return false
    }
  }

  /**
   * 处理网络状态变化
   */
  const handleNetworkChange = async (isOnline: boolean): Promise<void> => {
    storageState.networkStatus.isOnline = isOnline

    if (isOnline) {
      // 网络恢复，尝试重新连接云端存储
      console.log('网络已恢复，检查云端存储连接')
      await reconnectCloudStorage()
    } else {
      // 网络断开
      console.log('网络已断开')
      storageState.networkStatus.isServerReachable = false
      storageState.networkStatus.consecutiveFailures++
    }
  }

  /**
   * 加载存储配置
   */
  const loadStorageConfig = async (): Promise<void> => {
    try {
      if (isAuthenticated.value && user.value?.preferences?.storageConfig) {
        // 从用户偏好设置加载
        const userConfig = user.value.preferences.storageConfig
        storageState.config = {
          ...storageState.config,
          retryAttempts: userConfig.retryAttempts || storageState.config.retryAttempts,
          requestTimeout: userConfig.requestTimeout || storageState.config.requestTimeout,
        }
      } else {
        // 从本地存储加载
        const savedConfig = localStorage.getItem('cloud_storage_config')
        if (savedConfig) {
          const config = JSON.parse(savedConfig)
          storageState.config = { ...storageState.config, ...config }
        }
      }
    } catch (error) {
      console.error('Failed to load storage config:', error)
    }
  }

  /**
   * 保存存储配置
   */
  const saveStorageConfig = async (): Promise<void> => {
    try {
      // 保存到本地存储
      localStorage.setItem('cloud_storage_config', JSON.stringify(storageState.config))

      // 如果用户已登录，同步到服务器
      if (isAuthenticated.value) {
        // TODO: 调用设置 API 更新用户偏好
        console.log('TODO: Sync cloud storage config to server')
      }
    } catch (error) {
      console.error('Failed to save storage config:', error)
    }
  }

  // 监听认证状态变化
  watch(isAuthenticated, async (authenticated) => {
    if (authenticated) {
      // 用户登录，初始化云端存储
      try {
        await initializeStorageMode()
      } catch (error) {
        console.error('Failed to initialize cloud storage after login:', error)
      }
    } else {
      // 用户登出，清理存储服务和数据
      currentStorageService = null
      cloudStorageService = null
      storageState.isInitialized = false

      // 通知需要清理 todos 数据
      console.log('User logged out, todos data should be cleared by useTodos composable')
    }
  })

  // 监听网络状态变化
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => handleNetworkChange(true))
    window.addEventListener('offline', () => handleNetworkChange(false))
  }

  return {
    // 状态
    currentMode,
    config,
    networkStatus,
    isInitialized,
    canUseCloudStorage,
    isOnline,
    isServerReachable,

    // 方法
    initializeStorageMode,
    getCurrentStorageService,
    updateStorageConfig,
    getStorageStatus,
    checkStorageHealth,
    updateNetworkStatus,
    reconnectCloudStorage,
    handleNetworkChange,
  }
}
