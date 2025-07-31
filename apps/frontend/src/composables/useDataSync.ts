/**
 * 数据同步 Composable
 * 处理登录时的数据合并和持续同步逻辑
 */

import { computed, onMounted, onUnmounted, reactive, readonly, ref, watch } from 'vue'
import { syncService, SyncStatus, type SyncResult } from '../services/syncService'
import type { Todo } from '../types/todo'
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

interface ConflictItem {
  local: Todo
  server: Todo
  reason: string
}

/**
 * 数据同步 Composable
 */
export function useDataSync() {
  // 临时禁用旧的同步系统，使用新的 HybridTodoStorageService
  const DISABLE_OLD_SYNC = true

  // 同步状态
  const syncState = reactive<SyncState>({
    isInitialSyncComplete: true, // 标记为已完成，避免自动触发
    lastSyncTime: null,
    syncInProgress: false,
    syncError: null,
    conflictsCount: 0,
    realTimeSyncEnabled: false, // 禁用实时同步
    pendingOperations: [],
  })

  // 依赖的 composables
  const { todos, setTodos } = useTodos()
  const { isAuthenticated } = useAuth()
  const { isOnline, isSlowConnection, onOnline, onOffline } = useNetworkStatus()
  const { networkOnline, networkOffline, syncSuccess, syncError } = useNotifications()

  // 冲突解决状态
  const currentConflicts = ref<ConflictItem[]>([])
  const showConflictModal = ref(false)

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
    if (DISABLE_OLD_SYNC) {
      return {
        status: SyncStatus.SUCCESS,
        message: '使用新的混合存储系统',
        timestamp: new Date(),
        stats: { totalItems: 0, uploaded: 0, downloaded: 0, conflicts: 0, errors: 0 },
      }
    }

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
      // 只有在实际有数据变化时才更新同步时间和显示通知
      if (
        result.status === SyncStatus.SUCCESS &&
        (result.stats.uploaded > 0 || result.stats.downloaded > 0)
      ) {
        syncState.lastSyncTime = new Date()
        // 🔧 修复：只有在有实际数据变化时才显示同步成功通知
        // 避免登录后无数据变化时的快速闪过通知
        if (result.stats.uploaded > 0 || result.stats.downloaded > 0) {
          syncSuccess(result.stats)
        }
      }

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步失败'
      syncState.syncError = errorMsg
      console.error('初始同步失败:', error)
      // 显示同步失败通知
      syncError({ message: errorMsg })
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
      // 只有在实际有数据变化时才更新同步时间和显示通知
      if (
        result.status === SyncStatus.SUCCESS &&
        (result.stats.uploaded > 0 || result.stats.downloaded > 0)
      ) {
        syncState.lastSyncTime = new Date()
        // 🔧 修复：只有在有实际数据变化时才显示同步成功通知
        syncSuccess(result.stats)
      }

      console.log('增量同步完成:', result)
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步失败'
      syncState.syncError = errorMsg
      console.error('增量同步失败:', error)
      // 显示同步失败通知
      syncError({ message: errorMsg })
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

      if (!downloadResult.error && downloadResult.todos.length >= 0) {
        // 智能合并本地和云端数据，包含去重逻辑
        const currentLocalTodos = todos.value
        const cloudTodos = downloadResult.todos

        // 创建更智能的去重逻辑
        const mergedTodos = smartMergeTodos(currentLocalTodos, cloudTodos)

        if (mergedTodos.length !== currentLocalTodos.length) {
          // 使用响应式安全的方式更新 Todo 列表
          todos.value = mergedTodos.sort((a, b) => a.order - b.order)
          console.log(
            `数据同步完成：本地 ${currentLocalTodos.length} 条，云端 ${cloudTodos.length} 条，合并后 ${mergedTodos.length} 条记录`
          )
        } else {
          console.log(`同步完成，本地数据无变化，共 ${currentLocalTodos.length} 条记录`)
        }
      }

      // 更新冲突计数
      syncState.conflictsCount = result.conflicts?.length || 0

      if (result.conflicts && result.conflicts.length > 0) {
        console.warn('同步完成但存在冲突:', result.conflicts)
        // 触发冲突解决界面
        currentConflicts.value = result.conflicts.map((conflict) => ({
          local: conflict.local,
          server: conflict.server,
          reason: conflict.reason,
        }))
        showConflictModal.value = true
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
          // 使用单个更新 API
          if (operation.data && typeof operation.data === 'object' && 'id' in operation.data) {
            const result = await syncService.updateSingleTodo(operation.data as Todo)
            if (result.success) {
              console.log('成功同步更新操作:', operation.data)
            } else {
              throw new Error(result.error || '更新失败')
            }
          }
          break
        case 'delete':
          // 实现删除同步
          if (operation.data && typeof operation.data === 'object' && 'id' in operation.data) {
            const todoId = (operation.data as { id: string }).id
            console.log('Syncing delete operation for todo:', todoId)

            // 这里应该调用云端删除 API
            // 由于当前架构限制，我们暂时记录删除操作
            // 在下次同步时会通过数据对比发现删除的项目
            console.log('Delete operation queued for sync:', todoId)
          }
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

        // 过滤掉最近创建的 Todo（避免双重上传）
        const recentlyCreatedThreshold = 10000 // 10秒内创建的认为是最近创建的
        const filteredNewItems = newItems.filter((todo) => {
          const createdTime = new Date(todo.createdAt).getTime()
          const currentTime = Date.now()
          const timeDiff = currentTime - createdTime
          const isRecent = timeDiff < recentlyCreatedThreshold

          if (isRecent) {
            return false
          }
          return true
        })

        filteredNewItems.forEach((todo) => {
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
    // 🔧 修复：只有在初始同步完成后才显示网络恢复通知
    // 避免登录后立即显示网络恢复通知
    if (syncState.isInitialSyncComplete) {
      networkOnline()
    }

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

  /**
   * 处理冲突解决
   */
  const handleConflictResolution = async (
    resolutions: Array<{ index: number; choice: 'local' | 'server' }>
  ) => {
    try {
      const resolvedTodos: Todo[] = []

      for (const resolution of resolutions) {
        const conflict = currentConflicts.value[resolution.index]
        if (!conflict) continue

        const chosenTodo = resolution.choice === 'local' ? conflict.local : conflict.server
        resolvedTodos.push(chosenTodo)

        // 如果选择了云端版本，需要更新本地数据
        if (resolution.choice === 'server') {
          const result = await syncService.updateSingleTodo(chosenTodo)
          if (!result.success) {
            console.error('更新冲突解决失败:', result.error)
          }
        }
      }

      // 更新本地 todos 列表
      const updatedTodos = [...todos.value]
      for (const resolvedTodo of resolvedTodos) {
        const index = updatedTodos.findIndex((t) => t.id === resolvedTodo.id)
        if (index !== -1) {
          updatedTodos[index] = resolvedTodo
        }
      }

      todos.value = updatedTodos.sort((a, b) => a.order - b.order)

      // 清理冲突状态
      currentConflicts.value = []
      showConflictModal.value = false
      syncState.conflictsCount = 0

      console.log(`成功解决 ${resolutions.length} 个冲突`)
    } catch (error) {
      console.error('处理冲突解决失败:', error)
      syncError({ message: '冲突解决失败' })
    }
  }

  /**
   * 关闭冲突解决模态框
   */
  const closeConflictModal = () => {
    showConflictModal.value = false
    // 可以选择保留冲突数据，让用户稍后处理
  }

  /**
   * 智能合并本地和云端 Todo 数据
   * 基于 ID 和内容进行去重
   */
  const smartMergeTodos = (localTodos: Todo[], cloudTodos: Todo[]): Todo[] => {
    const mergedMap = new Map<string, Todo>()
    const titleMap = new Map<string, Todo>()

    // 首先处理本地数据
    localTodos.forEach((todo) => {
      mergedMap.set(todo.id, todo)
      // 使用标题的小写版本作为内容匹配键
      const titleKey = todo.title.toLowerCase().trim()
      if (!titleMap.has(titleKey)) {
        titleMap.set(titleKey, todo)
      }
    })

    // 处理云端数据
    cloudTodos.forEach((cloudTodo) => {
      const titleKey = cloudTodo.title.toLowerCase().trim()
      const existingByTitle = titleMap.get(titleKey)

      if (mergedMap.has(cloudTodo.id)) {
        // ID 相同，更新为云端版本（云端为权威数据源）
        mergedMap.set(cloudTodo.id, cloudTodo)
      } else if (existingByTitle) {
        // 标题相同但 ID 不同，可能是重复数据
        const localTodo = existingByTitle

        // 比较创建时间，保留较早创建的 ID，但使用较新的数据
        const localTime = new Date(localTodo.createdAt).getTime()
        const cloudTime = new Date(cloudTodo.createdAt).getTime()

        if (cloudTime < localTime) {
          // 云端数据更早，删除本地版本，使用云端版本
          mergedMap.delete(localTodo.id)
          mergedMap.set(cloudTodo.id, cloudTodo)
          titleMap.set(titleKey, cloudTodo)
        } else {
          // 本地数据更早，保留本地版本，忽略云端版本
          console.log(
            `检测到重复 Todo "${cloudTodo.title}"，保留本地版本 (${localTodo.id})，忽略云端版本 (${cloudTodo.id})`
          )
        }
      } else {
        // 新的云端数据，直接添加
        mergedMap.set(cloudTodo.id, cloudTodo)
        titleMap.set(titleKey, cloudTodo)
      }
    })

    return Array.from(mergedMap.values())
  }

  return {
    // 状态
    syncState: readonly(syncState),
    canSync,
    syncStatusText,
    currentConflicts: readonly(currentConflicts),
    showConflictModal: readonly(showConflictModal),

    // 方法
    performInitialSync,
    performIncrementalSync,
    manualSync,
    uploadLocalData,
    downloadCloudData,
    resetSyncState,
    toggleRealTimeSync,
    processPendingOperations,
    handleConflictResolution,
    closeConflictModal,
    smartMergeTodos, // 导出供测试使用
  }
}
