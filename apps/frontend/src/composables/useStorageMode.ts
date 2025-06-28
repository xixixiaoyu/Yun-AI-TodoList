/**
 * 存储模式管理 Composable
 * 管理本地存储和远程存储的切换，提供统一的存储接口
 */

import type { StorageConfig, StorageMode, SyncStatus } from '@shared/types'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import { RemoteStorageService } from '../services/storage/RemoteStorageService'
import { TodoStorageService } from '../services/storage/TodoStorageService'
import { useAuth } from './useAuth'

// 全局存储状态
const storageState = reactive({
  currentMode: 'hybrid' as StorageMode, // 默认使用混合存储
  config: {
    mode: 'hybrid' as StorageMode, // 默认混合存储模式
    autoSync: true, // 默认启用自动同步
    syncInterval: 5, // 5分钟自动同步，更频繁的同步
    offlineMode: true, // 默认启用离线模式
    conflictResolution: 'merge', // 默认自动合并冲突
  } as StorageConfig,
  syncStatus: {
    syncInProgress: false,
    pendingChanges: 0,
    conflictsCount: 0,
  } as SyncStatus,
  isInitialized: false,
})

// 存储服务实例
let localStorageService: LocalStorageService | null = null
let remoteStorageService: RemoteStorageService | null = null
let currentStorageService: TodoStorageService | null = null

/**
 * 存储模式管理 Composable
 */
export function useStorageMode() {
  const { isAuthenticated, user } = useAuth()

  // 响应式状态
  const currentMode = readonly(toRef(storageState, 'currentMode'))
  const config = readonly(toRef(storageState, 'config'))
  const syncStatus = readonly(toRef(storageState, 'syncStatus'))
  const isInitialized = readonly(toRef(storageState, 'isInitialized'))

  // 计算属性
  const canUseRemoteStorage = computed(() => isAuthenticated.value)
  const isOfflineMode = computed(() => storageState.currentMode === 'local')
  const isHybridMode = computed(() => storageState.currentMode === 'hybrid')

  /**
   * 初始化存储模式
   */
  const initializeStorageMode = async (): Promise<void> => {
    if (storageState.isInitialized) {
      return
    }

    try {
      // 创建存储服务实例
      localStorageService = new LocalStorageService()
      remoteStorageService = new RemoteStorageService()

      // 从用户偏好设置加载配置
      await loadStorageConfig()

      // 根据配置和认证状态确定存储模式
      await determineStorageMode()

      // 确保 currentStorageService 已设置
      if (!currentStorageService) {
        await switchToLocalStorage()
      }

      storageState.isInitialized = true
      console.log('Storage mode initialized:', storageState.currentMode)
    } catch (error) {
      console.error('Failed to initialize storage mode:', error)
      // 降级到本地存储
      await switchToLocalStorage()
      storageState.isInitialized = true
    }
  }

  /**
   * 获取当前存储服务
   */
  const getCurrentStorageService = (): TodoStorageService => {
    if (!currentStorageService) {
      throw new Error('Storage service not initialized')
    }
    return currentStorageService
  }

  /**
   * 切换存储模式
   */
  const switchStorageMode = async (mode: StorageMode): Promise<boolean> => {
    try {
      if (mode === 'hybrid' && !canUseRemoteStorage.value) {
        throw new Error('Hybrid storage requires authentication')
      }

      const oldMode = storageState.currentMode

      // 更新配置
      storageState.config.mode = mode
      await saveStorageConfig()

      // 切换存储服务
      await setStorageMode(mode)

      console.log(`Storage mode switched from ${oldMode} to ${mode}`)
      return true
    } catch (error) {
      console.error('Failed to switch storage mode:', error)
      return false
    }
  }

  /**
   * 切换到本地存储
   */
  const switchToLocalStorage = async (): Promise<void> => {
    storageState.currentMode = 'local'
    if (localStorageService) {
      currentStorageService = localStorageService
    }

    // 更新同步状态
    storageState.syncStatus = {
      ...storageState.syncStatus,
      syncInProgress: false,
    }
  }

  /**
   * 切换到混合模式
   */
  const switchToHybridMode = async (): Promise<void> => {
    if (!canUseRemoteStorage.value) {
      throw new Error('Hybrid mode requires authentication')
    }

    storageState.currentMode = 'hybrid'
    // 混合模式优先使用远程存储，本地作为缓存
    if (remoteStorageService) {
      currentStorageService = remoteStorageService
    }
  }

  /**
   * 更新存储配置
   */
  const updateStorageConfig = async (updates: Partial<StorageConfig>): Promise<boolean> => {
    try {
      storageState.config = { ...storageState.config, ...updates }
      await saveStorageConfig()

      // 如果模式发生变化，切换存储服务
      if (updates.mode && updates.mode !== storageState.currentMode) {
        await setStorageMode(updates.mode)
      }

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
        isOnline: false,
        storageMode: storageState.currentMode,
        pendingOperations: 0,
      }
    }

    return {
      ...service.status,
      ...storageState.syncStatus,
    }
  }

  /**
   * 检查存储健康状态
   */
  const checkStorageHealth = async (): Promise<boolean> => {
    try {
      const service = getCurrentStorageService()
      return await service.checkHealth()
    } catch (error) {
      console.error('Storage health check failed:', error)
      return false
    }
  }

  /**
   * 手动同步数据
   */
  const syncData = async (): Promise<boolean> => {
    try {
      storageState.syncStatus.syncInProgress = true

      const service = getCurrentStorageService()
      const result = await service.syncData()

      if (result.success) {
        storageState.syncStatus.lastSyncTime = new Date().toISOString()
        return true
      } else {
        storageState.syncStatus.syncError = result.error
        return false
      }
    } catch (error) {
      console.error('Data sync failed:', error)
      storageState.syncStatus.syncError = '同步失败'
      return false
    } finally {
      storageState.syncStatus.syncInProgress = false
    }
  }

  /**
   * 处理网络状态变化
   */
  const handleNetworkChange = async (isOnline: boolean): Promise<void> => {
    if (!isOnline && storageState.config.offlineMode) {
      // 网络断开，混合模式切换到本地存储
      if (storageState.currentMode === 'hybrid') {
        console.log('Network offline, switching to local storage')
        await switchToLocalStorage()
      }
    } else if (isOnline && storageState.config.mode === 'hybrid') {
      // 网络恢复，切换回混合存储
      if (storageState.currentMode === 'local') {
        console.log('Network online, switching back to hybrid storage')
        await setStorageMode('hybrid')
      }
    }
  }

  /**
   * 设置存储模式
   */
  const setStorageMode = async (mode: StorageMode): Promise<void> => {
    switch (mode) {
      case 'local':
        await switchToLocalStorage()
        break
      case 'hybrid':
        await switchToHybridMode()
        break
      default:
        throw new Error(`Unknown storage mode: ${mode}`)
    }
  }

  /**
   * 确定存储模式
   */
  const determineStorageMode = async (): Promise<void> => {
    const configMode = storageState.config.mode

    // 优先尝试使用混合存储模式
    if (configMode === 'hybrid' && canUseRemoteStorage.value) {
      await setStorageMode('hybrid')
    } else if (configMode === 'local') {
      await switchToLocalStorage()
    } else if (canUseRemoteStorage.value) {
      // 如果用户已登录，默认使用混合存储
      await setStorageMode('hybrid')
    } else {
      // 用户未登录，使用本地存储但保持混合模式配置
      await switchToLocalStorage()
      // 保持配置为混合模式，等用户登录后自动切换
      storageState.config.mode = 'hybrid'
    }
  }

  /**
   * 加载存储配置
   */
  const loadStorageConfig = async (): Promise<void> => {
    try {
      if (isAuthenticated.value && user.value?.preferences?.storageConfig) {
        // 从用户偏好设置加载
        storageState.config = { ...storageState.config, ...user.value.preferences.storageConfig }
      } else {
        // 从本地存储加载
        const savedConfig = localStorage.getItem('storage_config')
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
      localStorage.setItem('storage_config', JSON.stringify(storageState.config))

      // 如果用户已登录，同步到服务器
      if (isAuthenticated.value) {
        // TODO: 调用设置 API 更新用户偏好
        console.log('TODO: Sync storage config to server')
      }
    } catch (error) {
      console.error('Failed to save storage config:', error)
    }
  }

  // 监听认证状态变化
  watch(isAuthenticated, async (authenticated) => {
    if (authenticated && storageState.config.mode !== 'local') {
      // 用户登录，可以使用远程存储
      await determineStorageMode()
    } else if (!authenticated && storageState.currentMode !== 'local') {
      // 用户登出，切换到本地存储
      await switchToLocalStorage()
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
    syncStatus,
    isInitialized,
    canUseRemoteStorage,
    isOfflineMode,
    isHybridMode,

    // 方法
    initializeStorageMode,
    getCurrentStorageService,
    switchStorageMode,
    updateStorageConfig,
    getStorageStatus,
    checkStorageHealth,
    syncData,
    handleNetworkChange,
  }
}
