/**
 * 离线模式管理 Composable
 * 处理离线状态下的数据缓存、同步队列和用户体验
 */

import { useNetworkStatus } from './useNetworkStatus'
import { useNotifications } from './useNotifications'
import { useStorageMode } from './useStorageMode'

export interface OfflineOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  resource: string
  data: unknown
  timestamp: Date
  retryCount: number
  maxRetries: number
}

export interface OfflineState {
  isOfflineMode: boolean
  pendingOperations: OfflineOperation[]
  lastSyncAttempt?: Date
  syncInProgress: boolean
  autoSyncEnabled: boolean
}

// 全局离线状态
const offlineState = reactive<OfflineState>({
  isOfflineMode: false,
  pendingOperations: [],
  syncInProgress: false,
  autoSyncEnabled: true,
})

/**
 * 离线模式管理 Composable
 */
export function useOfflineMode() {
  const { isOnline, onOnline, onOffline } = useNetworkStatus()
  const { currentMode, switchStorageMode } = useStorageMode()

  const {
    info: showInfo,
    warning: showWarning,
    success: showSuccess,
    error: showError,
  } = useNotifications()

  // 响应式状态
  const isOfflineMode = readonly(toRef(offlineState, 'isOfflineMode'))
  const pendingOperations = readonly(toRef(offlineState, 'pendingOperations'))
  const syncInProgress = readonly(toRef(offlineState, 'syncInProgress'))
  const autoSyncEnabled = readonly(toRef(offlineState, 'autoSyncEnabled'))

  // 计算属性
  const hasPendingOperations = computed(() => offlineState.pendingOperations.length > 0)
  const pendingOperationsCount = computed(() => offlineState.pendingOperations.length)
  const canSync = computed(() => isOnline.value && !offlineState.syncInProgress)

  /**
   * 进入离线模式
   */
  const enterOfflineMode = async () => {
    if (offlineState.isOfflineMode) return

    console.log('Entering offline mode')
    offlineState.isOfflineMode = true

    // 离线模式下确保使用本地存储
    if (currentMode.value === 'hybrid') {
      try {
        await switchStorageMode('local')
        showInfo('已切换到离线模式，数据将保存在本地')
      } catch (error) {
        console.error('Failed to switch to local storage:', error)
        showWarning('切换到离线模式失败，部分功能可能不可用')
      }
    }

    // 保存离线状态到本地存储
    saveOfflineState()
  }

  /**
   * 退出离线模式
   */
  const exitOfflineMode = async () => {
    if (!offlineState.isOfflineMode) return

    console.log('Exiting offline mode')
    offlineState.isOfflineMode = false

    // 如果有待同步的操作，尝试同步
    if (hasPendingOperations.value && offlineState.autoSyncEnabled) {
      await syncPendingOperations()
    }

    // 保存离线状态到本地存储
    saveOfflineState()
  }

  /**
   * 添加离线操作到队列
   */
  const addOfflineOperation = (
    operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
  ) => {
    const offlineOp: OfflineOperation = {
      ...operation,
      id: generateOperationId(),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
    }

    offlineState.pendingOperations.push(offlineOp)
    saveOfflineState()

    console.log('Added offline operation:', offlineOp)
  }

  /**
   * 同步待处理的操作
   */
  const syncPendingOperations = async (): Promise<boolean> => {
    if (!canSync.value || !hasPendingOperations.value) {
      return false
    }

    offlineState.syncInProgress = true
    offlineState.lastSyncAttempt = new Date()

    try {
      showInfo(`正在同步 ${pendingOperationsCount.value} 个离线操作...`)

      const operations = [...offlineState.pendingOperations]
      const failedOperations: OfflineOperation[] = []

      for (const operation of operations) {
        try {
          await processOfflineOperation(operation)

          // 从队列中移除成功的操作
          const index = offlineState.pendingOperations.findIndex((op) => op.id === operation.id)
          if (index !== -1) {
            offlineState.pendingOperations.splice(index, 1)
          }
        } catch (error) {
          console.error('Failed to sync operation:', operation, error)

          // 增加重试次数
          operation.retryCount++

          if (operation.retryCount >= operation.maxRetries) {
            // 超过最大重试次数，移除操作
            const index = offlineState.pendingOperations.findIndex((op) => op.id === operation.id)
            if (index !== -1) {
              offlineState.pendingOperations.splice(index, 1)
            }
            failedOperations.push(operation)
          }
        }
      }

      // 执行完整的数据同步
      // TODO: 实现同步逻辑
      const syncResult = { success: true }

      if (failedOperations.length > 0) {
        showWarning(`同步完成，但有 ${failedOperations.length} 个操作失败`)
      } else if (operations.length > 0) {
        showSuccess(`成功同步 ${operations.length} 个离线操作`)
      }

      saveOfflineState()
      return syncResult
    } catch (error) {
      console.error('Sync failed:', error)
      showError('同步失败，请稍后重试')
      return false
    } finally {
      offlineState.syncInProgress = false
    }
  }

  /**
   * 处理单个离线操作
   */
  const processOfflineOperation = async (operation: OfflineOperation): Promise<void> => {
    // TODO: 实现离线操作处理逻辑
    console.log('Processing offline operation:', operation)
  }

  /**
   * 清除所有待处理的操作
   */
  const clearPendingOperations = () => {
    offlineState.pendingOperations = []
    saveOfflineState()
    showInfo('已清除所有待同步操作')
  }

  /**
   * 切换自动同步
   */
  const toggleAutoSync = (enabled: boolean) => {
    offlineState.autoSyncEnabled = enabled
    saveOfflineState()

    if (enabled && isOnline.value && hasPendingOperations.value) {
      syncPendingOperations()
    }
  }

  /**
   * 生成操作ID
   */
  const generateOperationId = (): string => {
    return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * 保存离线状态到本地存储
   */
  const saveOfflineState = () => {
    try {
      const stateToSave = {
        isOfflineMode: offlineState.isOfflineMode,
        pendingOperations: offlineState.pendingOperations,
        autoSyncEnabled: offlineState.autoSyncEnabled,
        lastSyncAttempt: offlineState.lastSyncAttempt?.toISOString(),
      }
      localStorage.setItem('offline_state', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Failed to save offline state:', error)
    }
  }

  /**
   * 从本地存储加载离线状态
   */
  const loadOfflineState = () => {
    try {
      const saved = localStorage.getItem('offline_state')
      if (saved) {
        const state = JSON.parse(saved)
        offlineState.isOfflineMode = state.isOfflineMode || false
        offlineState.pendingOperations = state.pendingOperations || []
        offlineState.autoSyncEnabled = state.autoSyncEnabled !== false
        offlineState.lastSyncAttempt = state.lastSyncAttempt
          ? new Date(state.lastSyncAttempt)
          : undefined
      }
    } catch (error) {
      console.error('Failed to load offline state:', error)
    }
  }

  /**
   * 获取离线状态摘要
   */
  const getOfflineStatus = () => {
    return {
      isOfflineMode: offlineState.isOfflineMode,
      pendingOperations: pendingOperationsCount.value,
      canSync: canSync.value,
      autoSyncEnabled: offlineState.autoSyncEnabled,
      lastSyncAttempt: offlineState.lastSyncAttempt,
    }
  }

  // 监听网络状态变化
  onOnline(() => {
    console.log('Network online, exiting offline mode')
    exitOfflineMode()
  })

  onOffline(() => {
    console.log('Network offline, entering offline mode')
    enterOfflineMode()
  })

  // 初始化
  onMounted(() => {
    loadOfflineState()

    // 如果网络离线，进入离线模式
    if (!isOnline.value) {
      enterOfflineMode()
    }
  })

  return {
    // 状态
    isOfflineMode,
    pendingOperations,
    syncInProgress,
    autoSyncEnabled,
    hasPendingOperations,
    pendingOperationsCount,
    canSync,

    // 方法
    enterOfflineMode,
    exitOfflineMode,
    addOfflineOperation,
    syncPendingOperations,
    clearPendingOperations,
    toggleAutoSync,
    getOfflineStatus,
  }
}
