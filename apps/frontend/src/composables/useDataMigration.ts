/**
 * 数据迁移和同步管理 Composable
 * 提供数据迁移、同步和冲突解决的统一接口
 */

import type { DataMigrationOptions, ConflictResolutionStrategy } from '@shared/types'
import {
  DataMigrationService,
  type MigrationProgress,
  type MigrationResult,
  type ConflictResolution,
} from '../services/DataMigrationService'
import { DataSyncService, type SyncResult, type SyncStatus } from '../services/DataSyncService'
import { LocalStorageService } from '../services/storage/LocalStorageService'
import { RemoteStorageService } from '../services/storage/RemoteStorageService'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'

// 全局状态
const migrationState = reactive({
  isInProgress: false,
  progress: null as MigrationProgress | null,
  lastResult: null as MigrationResult | null,
  conflicts: [] as Array<{ local: unknown; remote: unknown; reason: string }>,
})

const syncState = reactive({
  isEnabled: false,
  status: {
    isActive: false,
    pendingOperations: 0,
    failedOperations: 0,
  } as SyncStatus,
  lastSyncResult: null as SyncResult | null,
})

// 服务实例
let migrationService: DataMigrationService | null = null
let syncService: DataSyncService | null = null

/**
 * 数据迁移和同步管理 Composable
 */
export function useDataMigration() {
  const { isAuthenticated } = useAuth()
  const { showSuccess, showError, showWarning } = useNotifications()

  // 响应式状态
  const isInProgress = readonly(toRef(migrationState, 'isInProgress'))
  const progress = readonly(toRef(migrationState, 'progress'))
  const lastResult = readonly(toRef(migrationState, 'lastResult'))
  const conflicts = readonly(toRef(migrationState, 'conflicts'))
  const syncStatus = readonly(toRef(syncState, 'status'))
  const isSyncEnabled = readonly(toRef(syncState, 'isEnabled'))

  // 计算属性
  const canMigrate = computed(() => isAuthenticated.value && !migrationState.isInProgress)
  const hasConflicts = computed(() => migrationState.conflicts.length > 0)
  const hasPendingOperations = computed(() => syncState.status.pendingOperations > 0)

  /**
   * 初始化服务
   */
  const initializeServices = (): void => {
    if (!migrationService || !syncService) {
      const localService = new LocalStorageService()
      const remoteService = new RemoteStorageService()

      migrationService = new DataMigrationService(localService, remoteService)
      syncService = new DataSyncService(localService, remoteService)

      // 设置进度回调
      migrationService.setProgressCallback((progress) => {
        migrationState.progress = progress
      })

      console.log('Migration and sync services initialized')
    }
  }

  /**
   * 从本地迁移到云端
   */
  const migrateToCloud = async (options: DataMigrationOptions = {}): Promise<boolean> => {
    if (!canMigrate.value) {
      showError('无法执行迁移：用户未登录或正在进行其他迁移')
      return false
    }

    try {
      initializeServices()
      migrationState.isInProgress = true
      migrationState.progress = null
      migrationState.conflicts = []

      const result = await migrationService.migrateLocalToRemote(options)
      migrationState.lastResult = result

      if (result.success) {
        showSuccess(`成功迁移 ${result.migratedCount} 个待办事项到云端`)
        return true
      } else {
        if (result.conflictCount > 0) {
          migrationState.conflicts = result.conflicts
          showWarning(`迁移完成，但有 ${result.conflictCount} 个冲突需要解决`)
        }
        if (result.errorCount > 0) {
          showError(`迁移过程中有 ${result.errorCount} 个错误`)
        }
        return false
      }
    } catch (error) {
      console.error('Migration to cloud failed:', error)
      showError(`迁移失败: ${error}`)
      return false
    } finally {
      migrationState.isInProgress = false
    }
  }

  /**
   * 从云端迁移到本地
   */
  const migrateToLocal = async (options: DataMigrationOptions = {}): Promise<boolean> => {
    if (!canMigrate.value) {
      showError('无法执行迁移：用户未登录或正在进行其他迁移')
      return false
    }

    try {
      initializeServices()
      migrationState.isInProgress = true
      migrationState.progress = null
      migrationState.conflicts = []

      const result = await migrationService.migrateRemoteToLocal(options)
      migrationState.lastResult = result

      if (result.success) {
        showSuccess(`成功下载 ${result.migratedCount} 个待办事项到本地`)
        return true
      } else {
        if (result.conflictCount > 0) {
          migrationState.conflicts = result.conflicts
          showWarning(`下载完成，但有 ${result.conflictCount} 个冲突需要解决`)
        }
        if (result.errorCount > 0) {
          showError(`下载过程中有 ${result.errorCount} 个错误`)
        }
        return false
      }
    } catch (error) {
      console.error('Migration to local failed:', error)
      showError(`下载失败: ${error}`)
      return false
    } finally {
      migrationState.isInProgress = false
    }
  }

  /**
   * 解决数据冲突
   */
  const resolveConflicts = async (resolutions: ConflictResolution[]): Promise<boolean> => {
    if (!migrationService || migrationState.conflicts.length === 0) {
      return false
    }

    try {
      migrationState.isInProgress = true

      const result = await migrationService.resolveConflicts(migrationState.conflicts, resolutions)

      if (result.success) {
        migrationState.conflicts = []
        showSuccess(`成功解决 ${result.migratedCount} 个冲突`)
        return true
      } else {
        showError(`解决冲突时发生 ${result.errorCount} 个错误`)
        return false
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error)
      showError(`解决冲突失败: ${error}`)
      return false
    } finally {
      migrationState.isInProgress = false
    }
  }

  /**
   * 启用自动同步
   */
  const enableAutoSync = (
    intervalMinutes: number = 5,
    strategy: ConflictResolutionStrategy = 'ask-user'
  ): void => {
    if (!isAuthenticated.value) {
      showError('自动同步需要登录')
      return
    }

    initializeServices()
    syncService.setConflictResolutionStrategy(strategy)
    syncService.enableAutoSync(intervalMinutes)

    syncState.isEnabled = true
    updateSyncStatus()

    showSuccess(`已启用自动同步，间隔 ${intervalMinutes} 分钟`)
  }

  /**
   * 禁用自动同步
   */
  const disableAutoSync = (): void => {
    if (syncService) {
      syncService.disableAutoSync()
    }

    syncState.isEnabled = false
    updateSyncStatus()

    showSuccess('已禁用自动同步')
  }

  /**
   * 手动执行同步
   */
  const performSync = async (): Promise<boolean> => {
    if (!isAuthenticated.value) {
      showError('同步需要登录')
      return false
    }

    try {
      initializeServices()

      const result = await syncService.performIncrementalSync()
      syncState.lastSyncResult = result
      updateSyncStatus()

      if (result.success) {
        if (result.syncedCount > 0) {
          showSuccess(`同步完成，处理了 ${result.syncedCount} 个变更`)
        } else {
          showSuccess('同步完成，没有需要同步的变更')
        }
        return true
      } else {
        if (result.conflictCount > 0) {
          showWarning(`同步完成，但有 ${result.conflictCount} 个冲突`)
        }
        if (result.errorCount > 0) {
          showError(`同步过程中有 ${result.errorCount} 个错误`)
        }
        return false
      }
    } catch (error) {
      console.error('Manual sync failed:', error)
      showError(`同步失败: ${error}`)
      return false
    }
  }

  /**
   * 添加待同步操作
   */
  const addSyncOperation = (
    type: 'create' | 'update' | 'delete',
    todoId: string,
    data?: unknown
  ): void => {
    if (!syncService || !isAuthenticated.value) {
      return
    }

    syncService.addPendingOperation({ type, todoId, data })
    updateSyncStatus()
  }

  /**
   * 清除待同步操作
   */
  const clearPendingOperations = (): void => {
    if (syncService) {
      syncService.clearPendingOperations()
      updateSyncStatus()
      showSuccess('已清除所有待同步操作')
    }
  }

  /**
   * 更新同步状态
   */
  const updateSyncStatus = (): void => {
    if (syncService) {
      syncState.status = syncService.getSyncStatus()
    }
  }

  /**
   * 获取迁移进度百分比
   */
  const getProgressPercentage = computed(() => {
    return migrationState.progress?.percentage || 0
  })

  /**
   * 获取当前操作描述
   */
  const getCurrentOperation = computed(() => {
    return migrationState.progress?.currentOperation || ''
  })

  /**
   * 检查是否有失败的操作
   */
  const hasFailedOperations = computed(() => {
    return syncState.status.failedOperations > 0
  })

  // 监听认证状态变化
  watch(isAuthenticated, (authenticated) => {
    if (!authenticated && syncState.isEnabled) {
      // 用户登出，禁用自动同步
      disableAutoSync()
    }
  })

  // 定期更新同步状态
  let statusUpdateInterval: number | undefined
  onMounted(() => {
    statusUpdateInterval = window.setInterval(updateSyncStatus, 30000) // 每30秒更新一次
  })

  onUnmounted(() => {
    if (statusUpdateInterval) {
      clearInterval(statusUpdateInterval)
    }
    if (syncService) {
      syncService.destroy()
    }
  })

  return {
    // 状态
    isInProgress,
    progress,
    lastResult,
    conflicts,
    syncStatus,
    isSyncEnabled,
    canMigrate,
    hasConflicts,
    hasPendingOperations,
    hasFailedOperations,

    // 计算属性
    getProgressPercentage,
    getCurrentOperation,

    // 方法
    migrateToCloud,
    migrateToLocal,
    resolveConflicts,
    enableAutoSync,
    disableAutoSync,
    performSync,
    addSyncOperation,
    clearPendingOperations,
    updateSyncStatus,
  }
}
