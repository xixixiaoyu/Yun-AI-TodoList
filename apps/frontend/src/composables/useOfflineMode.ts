/**
 * 离线模式管理 Composable
 * 处理离线状态下的数据缓存、同步队列和用户体验
 */

import { computed, onMounted, reactive, readonly, toRef } from 'vue'
import { httpClient } from '../services/api'
import { syncService } from '../services/syncService'
import { useNetworkStatus } from './useNetworkStatus'
import { useNotifications } from './useNotifications'
import { useTodos } from './useTodos'

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
 * 重置离线状态（仅用于测试）
 */
export function resetOfflineState(): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    offlineState.isOfflineMode = false
    offlineState.pendingOperations = []
    offlineState.syncInProgress = false
    offlineState.autoSyncEnabled = true
    delete offlineState.lastSyncAttempt
  }
}

/**
 * 离线模式管理 Composable
 */
export function useOfflineMode() {
  const { isOnline, onOnline, onOffline } = useNetworkStatus()
  const { todos } = useTodos()

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

    // 离线模式下的提示
    showInfo('已进入离线模式，数据将保存在本地')

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

          // 增加重试次数 - 直接修改原始状态中的对象
          const operationIndex = offlineState.pendingOperations.findIndex(
            (op) => op.id === operation.id
          )
          if (operationIndex !== -1) {
            offlineState.pendingOperations[operationIndex].retryCount++

            if (
              offlineState.pendingOperations[operationIndex].retryCount >=
              offlineState.pendingOperations[operationIndex].maxRetries
            ) {
              // 超过最大重试次数，移除操作
              const failedOperation = offlineState.pendingOperations.splice(operationIndex, 1)[0]
              failedOperations.push(failedOperation)
            }
          }
        }
      }

      // 执行完整的数据同步
      const syncResult = await syncService.syncData(todos.value)
      const syncSuccess = syncResult.status === 'success'

      if (failedOperations.length > 0) {
        showWarning(`同步完成，但有 ${failedOperations.length} 个操作失败`)
      } else if (operations.length > 0) {
        showSuccess(`成功同步 ${operations.length} 个离线操作`)
      }

      saveOfflineState()
      return syncSuccess
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
    console.log('Processing offline operation:', operation)

    try {
      switch (operation.type) {
        case 'create': {
          // 创建新的 Todo
          const createResponse = await httpClient.post<{ success: boolean; data: unknown }>(
            '/api/v1/todos',
            operation.data
          )
          if (!createResponse.success) {
            throw new Error('创建操作失败')
          }
          console.log('成功创建 Todo:', createResponse.data)
          break
        }

        case 'update':
          // 更新现有的 Todo
          if (operation.data && typeof operation.data === 'object' && 'id' in operation.data) {
            const updateResponse = await httpClient.put<{ success: boolean; data: unknown }>(
              `/api/v1/todos/${(operation.data as { id: string }).id}`,
              operation.data
            )
            if (!updateResponse.success) {
              throw new Error('更新操作失败')
            }
            console.log('成功更新 Todo:', updateResponse.data)
          }
          break

        case 'delete':
          // 删除 Todo
          if (operation.data && typeof operation.data === 'object' && 'id' in operation.data) {
            const deleteResponse = await httpClient.delete<{ success: boolean }>(
              `/api/v1/todos/${(operation.data as { id: string }).id}`
            )
            if (!deleteResponse.success) {
              throw new Error('删除操作失败')
            }
            console.log('成功删除 Todo:', (operation.data as { id: string }).id)
          }
          break

        default:
          throw new Error(`未知的操作类型: ${operation.type}`)
      }
    } catch (error) {
      console.error(`处理离线操作失败 (${operation.type}):`, error)
      throw error
    }
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
