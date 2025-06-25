/**
 * 数据同步 Composable
 * 处理登录时的数据合并和持续同步逻辑
 */

import { computed, onMounted, onUnmounted, reactive, readonly, watch } from 'vue'
import { syncService, SyncStatus, type SyncResult } from '../services/syncService'
import { useAuth } from './useAuth'
import { useNetworkStatus } from './useNetworkStatus'
import { useNotifications } from './useNotifications'
import { useTodos } from './useTodos'

/**
 * 同步状态接口
 */
interface SyncState {
  isInitialSyncComplete: boolean
  lastSyncTime: Date | null
  syncInProgress: boolean
  syncError: string | null
  conflictsCount: number
  realTimeSyncEnabled: boolean
  pendingOperations: Array<{
    id: string
    type: 'create' | 'update' | 'delete'
    data: Record<string, unknown>
    timestamp: Date
  }>
}

/**
 * 数据同步 Composable
 */
export function useDataSync() {
  // 同步状态
  const syncState = reactive<SyncState>({
    isInitialSyncComplete: false,
    lastSyncTime: null,
    syncInProgress: false,
    syncError: null,
    conflictsCount: 0,
    realTimeSyncEnabled: true,
    pendingOperations: [],
  })

  // 依赖的 composables
  const { todos, setTodos } = useTodos()
  const { isAuthenticated } = useAuth()
  const { isOnline, isSlowConnection, onOnline, onOffline } = useNetworkStatus()
  const { networkOnline, networkOffline } = useNotifications()

  // 计算属性
  const canSync = computed(() => {
    return isAuthenticated.value && isOnline.value
  })

  const syncStatusText = computed(() => {
    if (!isAuthenticated.value) return '未登录'
    if (!isOnline.value) return '离线'
    if (syncState.syncInProgress) {
      return isSlowConnection.value ? '同步中（慢速网络）...' : '同步中...'
    }
    if (syncState.syncError) return '同步失败'
    if (syncState.lastSyncTime) {
      const timeAgo = formatTimeAgo(syncState.lastSyncTime)
      return `上次同步：${timeAgo}`
    }
    return '尚未同步'
  })

  /**
   * 格式化时间差
   */
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return '刚刚'
    if (diffMinutes < 60) return `${diffMinutes}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString()
  }

  /**
   * 执行初始同步（登录时调用）
   */
  const performInitialSync = async (): Promise<SyncResult> => {
    if (!canSync.value) {
      throw new Error('无法执行同步：用户未登录或网络不可用')
    }

    syncState.syncInProgress = true
    syncState.syncError = null

    try {
      console.log('开始初始数据同步...')

      // 获取当前本地数据
      const localTodos = todos.value

      // 执行同步
      const result = await syncService.syncData(localTodos)

      // 处理同步结果
      await handleSyncResult(result)

      // 标记初始同步完成
      syncState.isInitialSyncComplete = true
      syncState.lastSyncTime = new Date()

      console.log('初始同步完成:', result)
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步失败'
      syncState.syncError = errorMsg
      console.error('初始同步失败:', error)
      throw error
    } finally {
      syncState.syncInProgress = false
    }
  }

  /**
   * 执行增量同步
   */
  const performIncrementalSync = async (): Promise<SyncResult> => {
    if (!canSync.value) {
      throw new Error('无法执行同步：用户未登录或网络不可用')
    }

    syncState.syncInProgress = true
    syncState.syncError = null

    try {
      console.log('开始增量同步...')

      const localTodos = todos.value
      const result = await syncService.syncData(localTodos)

      await handleSyncResult(result)
      syncState.lastSyncTime = new Date()

      console.log('增量同步完成:', result)
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步失败'
      syncState.syncError = errorMsg
      console.error('增量同步失败:', error)
      throw error
    } finally {
      syncState.syncInProgress = false
    }
  }

  /**
   * 处理同步结果
   */
  const handleSyncResult = async (result: SyncResult): Promise<void> => {
    if (result.status === SyncStatus.SUCCESS || result.status === SyncStatus.CONFLICT) {
      // 重新获取合并后的数据
      const downloadResult = await syncService.downloadData()

      if (!downloadResult.error && downloadResult.todos.length > 0) {
        // 更新本地数据
        setTodos(downloadResult.todos)
        console.log(`本地数据已更新，共 ${downloadResult.todos.length} 条记录`)
      }

      // 更新冲突计数
      syncState.conflictsCount = result.conflicts?.length || 0

      if (result.conflicts && result.conflicts.length > 0) {
        console.warn('同步完成但存在冲突:', result.conflicts)
        // TODO: 可以在这里触发冲突解决界面
      }
    }

    if (result.status === SyncStatus.ERROR) {
      syncState.syncError = result.message
    }
  }

  /**
   * 手动触发同步
   */
  const manualSync = async (): Promise<SyncResult> => {
    if (syncState.isInitialSyncComplete) {
      return await performIncrementalSync()
    } else {
      return await performInitialSync()
    }
  }

  /**
   * 仅上传本地数据
   */
  const uploadLocalData = async (): Promise<void> => {
    if (!canSync.value) {
      throw new Error('无法上传：用户未登录或网络不可用')
    }

    syncState.syncInProgress = true
    syncState.syncError = null

    try {
      const localTodos = todos.value
      const result = await syncService.uploadData(localTodos)

      if (result.success) {
        console.log(`成功上传 ${result.uploaded} 条数据`)
        syncState.lastSyncTime = new Date()
      } else {
        throw new Error(result.errors.join(', '))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '上传失败'
      syncState.syncError = errorMsg
      throw error
    } finally {
      syncState.syncInProgress = false
    }
  }

  /**
   * 仅下载云端数据
   */
  const downloadCloudData = async (): Promise<void> => {
    if (!canSync.value) {
      throw new Error('无法下载：用户未登录或网络不可用')
    }

    syncState.syncInProgress = true
    syncState.syncError = null

    try {
      const result = await syncService.downloadData()

      if (result.error) {
        throw new Error(result.error)
      }

      setTodos(result.todos)
      console.log(`成功下载 ${result.todos.length} 条数据`)
      syncState.lastSyncTime = new Date()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '下载失败'
      syncState.syncError = errorMsg
      throw error
    } finally {
      syncState.syncInProgress = false
    }
  }

  /**
   * 重置同步状态
   */
  const resetSyncState = (): void => {
    syncState.isInitialSyncComplete = false
    syncState.lastSyncTime = null
    syncState.syncInProgress = false
    syncState.syncError = null
    syncState.conflictsCount = 0
    syncState.pendingOperations = []
  }

  /**
   * 添加待处理操作
   */
  const addPendingOperation = (
    type: 'create' | 'update' | 'delete',
    data: Record<string, unknown>
  ): void => {
    const operation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      data,
      timestamp: new Date(),
    }

    syncState.pendingOperations.push(operation)

    // 如果启用实时同步且在线，立即处理
    if (syncState.realTimeSyncEnabled && canSync.value) {
      processPendingOperations()
    }
  }

  /**
   * 处理待处理的操作
   */
  const processPendingOperations = async (): Promise<void> => {
    if (syncState.pendingOperations.length === 0 || !canSync.value) {
      return
    }

    const operations = [...syncState.pendingOperations]
    syncState.pendingOperations = []

    try {
      for (const operation of operations) {
        await processOperation(operation)
      }

      console.log(`Processed ${operations.length} pending operations`)
    } catch (error) {
      // 处理失败，重新加入队列
      syncState.pendingOperations.unshift(...operations)
      console.error('Failed to process pending operations:', error)
    }
  }

  /**
   * 处理单个操作
   */
  const processOperation = async (operation: {
    type: string
    data?: unknown
    todoId?: string
  }): Promise<void> => {
    try {
      switch (operation.type) {
        case 'create':
          await syncService.uploadData([operation.data as Todo])
          break
        case 'update':
          // TODO: 实现单个更新 API
          console.log('Update operation:', operation.data)
          break
        case 'delete':
          // TODO: 实现删除 API
          console.log('Delete operation:', operation.data)
          break
      }
    } catch (error) {
      console.error(`Failed to process ${operation.type} operation:`, error)
      throw error
    }
  }

  /**
   * 启用/禁用实时同步
   */
  const toggleRealTimeSync = (enabled: boolean): void => {
    syncState.realTimeSyncEnabled = enabled

    if (enabled && canSync.value && syncState.pendingOperations.length > 0) {
      // 启用时处理待处理的操作
      processPendingOperations()
    }
  }

  /**
   * 监听 Todo 数据变化进行实时同步
   */
  const setupRealTimeSync = (): void => {
    // 监听 todos 数组的变化
    watch(
      todos,
      (newTodos, oldTodos) => {
        if (!syncState.realTimeSyncEnabled || !syncState.isInitialSyncComplete) {
          return
        }

        // 检测新增的 todos
        const newItems = newTodos.filter(
          (newTodo) => !oldTodos.some((oldTodo) => oldTodo.id === newTodo.id)
        )

        newItems.forEach((todo) => {
          addPendingOperation('create', todo)
        })

        // 检测更新的 todos
        const updatedItems = newTodos.filter((newTodo) => {
          const oldTodo = oldTodos.find((old) => old.id === newTodo.id)
          return (
            oldTodo &&
            (oldTodo.title !== newTodo.title ||
              oldTodo.completed !== newTodo.completed ||
              oldTodo.priority !== newTodo.priority)
          )
        })

        updatedItems.forEach((todo) => {
          addPendingOperation('update', todo)
        })

        // 检测删除的 todos
        const deletedItems = oldTodos.filter(
          (oldTodo) => !newTodos.some((newTodo) => newTodo.id === oldTodo.id)
        )

        deletedItems.forEach((todo) => {
          addPendingOperation('delete', { id: todo.id })
        })
      },
      { deep: true }
    )
  }

  /**
   * 监听认证状态变化
   */
  watch(
    isAuthenticated,
    async (newValue, oldValue) => {
      if (newValue && !oldValue) {
        // 用户刚登录，执行初始同步
        try {
          await performInitialSync()
        } catch (error) {
          console.error('登录后自动同步失败:', error)
        }
      } else if (!newValue && oldValue) {
        // 用户登出，重置同步状态
        resetSyncState()
      }
    },
    { immediate: false }
  )

  /**
   * 处理网络恢复
   */
  const handleNetworkOnline = async () => {
    // 显示网络恢复通知
    networkOnline()

    if (isAuthenticated.value && syncState.isInitialSyncComplete) {
      // 网络恢复且用户已登录，先处理待处理的操作，然后执行增量同步
      try {
        console.log('Network restored, processing pending operations and syncing...')

        // 先处理待处理的操作
        await processPendingOperations()

        // 然后执行增量同步
        await performIncrementalSync()
      } catch (error) {
        console.error('网络恢复后自动同步失败:', error)
      }
    }
  }

  /**
   * 处理网络断开
   */
  const handleNetworkOffline = () => {
    console.log('Network lost, sync operations will be queued')
    // 显示离线通知
    networkOffline()
  }

  // 监听网络状态变化和初始化实时同步
  onMounted(() => {
    // 注册网络状态变化回调
    const unsubscribeOnline = onOnline(handleNetworkOnline)
    const unsubscribeOffline = onOffline(handleNetworkOffline)

    // 设置实时同步
    setupRealTimeSync()

    // 清理函数
    onUnmounted(() => {
      unsubscribeOnline()
      unsubscribeOffline()
    })
  })

  return {
    // 状态
    syncState: readonly(syncState),
    canSync,
    syncStatusText,

    // 方法
    performInitialSync,
    performIncrementalSync,
    manualSync,
    uploadLocalData,
    downloadCloudData,
    resetSyncState,
    toggleRealTimeSync,
    processPendingOperations,
  }
}
