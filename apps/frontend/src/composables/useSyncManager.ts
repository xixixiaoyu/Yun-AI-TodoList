/**
 * 同步状态管理 Composable
 * 提供实时同步状态监控和控制功能
 */

import type { StorageConfig, StorageHealth, SyncStatus } from '@shared/types'
import { computed, getCurrentInstance, onUnmounted, reactive, ref, watch } from 'vue'

import { HybridStorageService, type ExportedData } from '../services/storage/HybridStorageService'
import { useAuth } from './useAuth'

// 全局同步状态
const globalSyncState = reactive({
  isInitialized: false,
  hybridStorage: null as HybridStorageService | null,

  cleanupFunctions: [] as (() => void)[],
  syncStatus: {
    syncInProgress: false,
    pendingChanges: 0,
    conflictsCount: 0,
    failedOperations: 0,
    pendingOperations: 0,
  } as SyncStatus,
  storageHealth: {
    localStorage: true,
    remoteStorage: false,
    lastHealthCheck: new Date().toISOString(),
  } as StorageHealth,
  config: {
    mode: 'hybrid', // 默认混合存储模式
    autoSync: true, // 默认启用自动同步
    syncInterval: 5, // 5分钟自动同步
    offlineMode: true, // 默认启用离线模式
    conflictResolution: 'merge', // 默认自动合并冲突
  } as StorageConfig,
})

export function useSyncManager() {
  // 临时禁用旧的同步管理器，使用新的 HybridTodoStorageService
  const DISABLE_OLD_SYNC_MANAGER = true

  const { user, isAuthenticated } = useAuth()

  // 响应式状态
  const isOnline = ref(navigator.onLine)

  const autoSyncTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // 计算属性
  const canUseCloudSync = computed(() => isAuthenticated.value && isOnline.value)
  const syncStatusText = computed(() => {
    if (globalSyncState.syncStatus.syncInProgress) {
      return 'Syncing...'
    }
    if (globalSyncState.syncStatus.syncError) {
      return `Sync Error: ${globalSyncState.syncStatus.syncError}`
    }
    if (globalSyncState.syncStatus.lastSyncTime) {
      const lastSync = new Date(globalSyncState.syncStatus.lastSyncTime)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60))

      if (diffMinutes < 1) {
        return 'Just synced'
      } else if (diffMinutes < 60) {
        return `Synced ${diffMinutes}m ago`
      } else {
        const diffHours = Math.floor(diffMinutes / 60)
        return `Synced ${diffHours}h ago`
      }
    }
    return 'Not synced'
  })

  const pendingChangesText = computed(() => {
    const count = globalSyncState.syncStatus.pendingChanges
    if (count === 0) return 'All changes synced'
    return `${count} change${count > 1 ? 's' : ''} pending`
  })

  /**
   * 初始化同步管理器
   */
  const initialize = async (config?: Partial<StorageConfig>): Promise<void> => {
    if (DISABLE_OLD_SYNC_MANAGER) {
      console.log('🚫 旧同步管理器已禁用，使用新的 HybridTodoStorageService')
      globalSyncState.isInitialized = true
      return
    }

    if (globalSyncState.isInitialized) return

    try {
      // 合并配置
      if (config) {
        globalSyncState.config = { ...globalSyncState.config, ...config }
      }

      // 初始化混合存储服务
      globalSyncState.hybridStorage = new HybridStorageService(globalSyncState.config)

      // 如果用户已登录，设置用户ID
      if (user.value?.id) {
        await globalSyncState.hybridStorage.setUserId(user.value.id)
      }

      // 设置网络状态监听
      setupNetworkListeners()

      // 设置自动同步
      setupAutoSync()

      // 初始健康检查
      await updateHealthStatus()

      globalSyncState.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize sync manager:', error)
      throw error
    }
  }

  /**
   * 更新存储配置
   */
  const updateConfig = async (newConfig: Partial<StorageConfig>): Promise<void> => {
    if (!globalSyncState.hybridStorage) {
      throw new Error('Sync manager not initialized')
    }

    globalSyncState.config = { ...globalSyncState.config, ...newConfig }
    await globalSyncState.hybridStorage.updateConfig(newConfig)

    // 重新设置自动同步
    setupAutoSync()
  }

  /**
   * 手动同步所有数据
   */
  const syncAll = async (): Promise<void> => {
    if (!globalSyncState.hybridStorage) {
      throw new Error('Sync manager not initialized')
    }

    if (!canUseCloudSync.value) {
      throw new Error('Cloud sync not available')
    }

    try {
      globalSyncState.syncStatus.syncInProgress = true
      globalSyncState.syncStatus.syncError = undefined

      const result = await globalSyncState.hybridStorage.syncAll()

      if (result.success) {
        // 只有在实际有数据变化时才更新同步时间
        if (result.syncedCount > 0) {
          globalSyncState.syncStatus.lastSyncTime = new Date().toISOString()
        }
        globalSyncState.syncStatus.pendingChanges = 0
        globalSyncState.syncStatus.conflictsCount = result.conflicts.length
      } else {
        globalSyncState.syncStatus.syncError = result.errors[0]?.error || 'Sync failed'
      }
    } catch (error) {
      globalSyncState.syncStatus.syncError =
        error instanceof Error ? error.message : 'Unknown sync error'
      throw error
    } finally {
      globalSyncState.syncStatus.syncInProgress = false
    }
  }

  /**
   * 导出所有数据
   */
  const exportAllData = async (
    options = {
      includeTodos: true,
      includeSettings: true,
      includeAIAnalysis: true,
      format: 'json' as const,
      compressed: false,
    }
  ) => {
    if (!globalSyncState.hybridStorage) {
      throw new Error('Sync manager not initialized')
    }

    return globalSyncState.hybridStorage.exportAllData(options)
  }

  /**
   * 导入所有数据
   */
  const importAllData = async (data: unknown) => {
    if (!globalSyncState.hybridStorage) {
      throw new Error('Sync manager not initialized')
    }

    return globalSyncState.hybridStorage.importAllData(data as ExportedData)
  }

  /**
   * 更新健康状态
   */
  const updateHealthStatus = async (): Promise<void> => {
    if (!globalSyncState.hybridStorage) return

    try {
      const health = await globalSyncState.hybridStorage.getHealth()
      globalSyncState.storageHealth = health
    } catch (error) {
      console.error('Failed to update health status:', error)
    }
  }

  /**
   * 获取存储服务
   */
  const getStorageServices = () => {
    if (!globalSyncState.hybridStorage) {
      throw new Error('Sync manager not initialized')
    }
    return globalSyncState.hybridStorage.getServices()
  }

  /**
   * 销毁同步管理器，清理所有资源
   */
  const destroy = (): void => {
    // 清理自动同步定时器
    if (autoSyncTimer.value) {
      clearInterval(autoSyncTimer.value)
      autoSyncTimer.value = null
    }

    // 执行所有清理函数
    globalSyncState.cleanupFunctions.forEach((cleanup) => cleanup())
    globalSyncState.cleanupFunctions = []

    // 重置状态
    globalSyncState.isInitialized = false
    globalSyncState.hybridStorage = null
    globalSyncState.migrationService = null
  }

  // 私有方法
  const setupNetworkListeners = (): void => {
    const updateOnlineStatus = () => {
      isOnline.value = navigator.onLine
      if (isOnline.value && globalSyncState.config.autoSync) {
        // 网络恢复时自动同步
        setTimeout(() => {
          if (canUseCloudSync.value) {
            syncAll().catch(console.error)
          }
        }, 1000)
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // 清理函数 - 只在组件上下文中使用 onUnmounted
    const instance = getCurrentInstance()
    if (instance) {
      onUnmounted(() => {
        window.removeEventListener('online', updateOnlineStatus)
        window.removeEventListener('offline', updateOnlineStatus)
      })
    } else {
      // 如果不在组件上下文中，将清理函数存储到全局状态
      if (!globalSyncState.cleanupFunctions) {
        globalSyncState.cleanupFunctions = []
      }
      globalSyncState.cleanupFunctions.push(() => {
        window.removeEventListener('online', updateOnlineStatus)
        window.removeEventListener('offline', updateOnlineStatus)
      })
    }
  }

  const setupAutoSync = (): void => {
    // 清除现有定时器
    if (autoSyncTimer.value) {
      clearInterval(autoSyncTimer.value)
      autoSyncTimer.value = null
    }

    // 设置新的自动同步定时器
    if (globalSyncState.config.autoSync && globalSyncState.config.syncInterval > 0) {
      autoSyncTimer.value = setInterval(
        () => {
          if (canUseCloudSync.value && !globalSyncState.syncStatus.syncInProgress) {
            syncAll().catch(console.error)
          }
        },
        globalSyncState.config.syncInterval * 60 * 1000
      )
    }
  }

  // 监听用户登录状态变化
  watch(user, async (newUser) => {
    if (newUser?.id && globalSyncState.hybridStorage) {
      await globalSyncState.hybridStorage.setUserId(newUser.id)
    }
  })

  // 清理资源
  onUnmounted(() => {
    if (autoSyncTimer.value) {
      clearInterval(autoSyncTimer.value)
    }
    if (globalSyncState.hybridStorage) {
      globalSyncState.hybridStorage.destroy()
    }
  })

  return {
    // 状态
    isOnline: readonly(isOnline),
    syncStatus: readonly(globalSyncState.syncStatus),
    storageHealth: readonly(globalSyncState.storageHealth),
    config: readonly(globalSyncState.config),

    // 计算属性
    canUseCloudSync,
    syncStatusText,
    pendingChangesText,
    isInProgress: computed(() => globalSyncState.syncStatus.syncInProgress),
    isSyncEnabled: computed(() => globalSyncState.config.autoSync),

    // 方法
    initialize,
    updateConfig,
    syncAll,

    exportAllData,
    importAllData,
    updateHealthStatus,
    getStorageServices,
    destroy,
    performManualSync: syncAll,
    enableAutoSync: () => updateConfig({ autoSync: true }),
    disableAutoSync: () => updateConfig({ autoSync: false }),
  }
}
