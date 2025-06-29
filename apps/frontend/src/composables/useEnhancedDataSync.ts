/**
 * 增强的数据同步 Composable
 * 集成冲突解决和网络状态管理
 */

import type { Todo } from '@shared/types'
import { computed, onUnmounted, readonly, ref } from 'vue'
import {
  ConflictResolutionService,
  type ConflictInfo,
  type ConflictResolution,
} from '../services/ConflictResolutionService'
import { NetworkStatusService, type NetworkStatus } from '../services/NetworkStatusService'
import { logger } from '../utils/logger'
import { useAuth } from './useAuth'
import { useStorageMode } from './useStorageMode'
import { useTodos } from './useTodos'

export interface EnhancedSyncState {
  isOnline: boolean
  isServerReachable: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  syncError: string | null
  networkQuality: number
  connectionType: string
  conflicts: ConflictInfo[]
  resolvedConflicts: ConflictResolution[]
  pendingOperations: Array<{
    id: string
    type: 'create' | 'update' | 'delete'
    data: Todo
    timestamp: Date
    retryCount: number
  }>
  syncStrategy: 'immediate' | 'delayed' | 'batch' | 'disabled'
}

export interface SyncOptions {
  forceSync: boolean
  resolveConflicts: boolean
  batchSize: number
  retryLimit: number
}

export function useEnhancedDataSync() {
  const { todos, loadTodos: _loadTodos, saveTodos } = useTodos()
  const { getCurrentStorageService } = useStorageMode()
  const { isAuthenticated } = useAuth()

  // 服务实例
  const conflictResolver = new ConflictResolutionService()
  const networkService = new NetworkStatusService()

  // 状态管理
  const syncState = ref<EnhancedSyncState>({
    isOnline: true,
    isServerReachable: false,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
    networkQuality: 0,
    connectionType: 'unknown',
    conflicts: [],
    resolvedConflicts: [],
    pendingOperations: [],
    syncStrategy: 'immediate',
  })

  // 计算属性
  const canSync = computed(() => {
    return (
      isAuthenticated.value &&
      syncState.value.isOnline &&
      syncState.value.isServerReachable &&
      !syncState.value.isSyncing
    )
  })

  const hasConflicts = computed(() => syncState.value.conflicts.length > 0)
  const hasPendingOperations = computed(() => syncState.value.pendingOperations.length > 0)

  const syncStatusText = computed(() => {
    if (!syncState.value.isOnline) return '离线'
    if (!syncState.value.isServerReachable) return '服务器不可达'
    if (syncState.value.isSyncing) return '同步中...'
    if (hasConflicts.value) return `有 ${syncState.value.conflicts.length} 个冲突需要解决`
    if (hasPendingOperations.value)
      return `有 ${syncState.value.pendingOperations.length} 个操作待同步`
    if (syncState.value.lastSyncTime) {
      const timeDiff = Date.now() - syncState.value.lastSyncTime.getTime()
      const minutes = Math.floor(timeDiff / 60000)
      return `${minutes} 分钟前同步`
    }
    return '未同步'
  })

  // 网络状态监听
  const networkStatusUnsubscribe = networkService.addListener((status: NetworkStatus) => {
    syncState.value.isOnline = status.isOnline
    syncState.value.isServerReachable = status.isServerReachable
    syncState.value.networkQuality = networkService.getConnectionQuality()
    syncState.value.connectionType = status.connectionType
    syncState.value.syncStrategy = networkService.getRecommendedSyncStrategy()

    // 网络恢复时自动同步
    if (status.isOnline && status.isServerReachable && hasPendingOperations.value) {
      processPendingOperations()
    }
  })

  /**
   * 执行智能同步
   */
  async function performIntelligentSync(options: Partial<SyncOptions> = {}): Promise<void> {
    if (!canSync.value) {
      logger.warn(
        'Cannot sync: conditions not met',
        { syncState: syncState.value },
        'useEnhancedDataSync'
      )
      return
    }

    const opts: SyncOptions = {
      forceSync: false,
      resolveConflicts: true,
      batchSize: 10,
      retryLimit: 3,
      ...options,
    }

    syncState.value.isSyncing = true
    syncState.value.syncError = null

    try {
      const storageService = getCurrentStorageService()

      // 1. 获取远程数据
      const remoteResult = await storageService.getAllTodos()
      if (remoteResult.error) {
        throw new Error(remoteResult.error)
      }

      const remoteTodos = remoteResult.todos || []
      const localTodos = todos.value

      // 2. 检测冲突
      const conflicts = detectConflicts(localTodos, remoteTodos)
      syncState.value.conflicts = conflicts

      // 3. 解决冲突
      let mergedTodos = localTodos
      if (conflicts.length > 0 && opts.resolveConflicts) {
        const resolutions = conflictResolver.resolveBatchConflicts(conflicts)
        syncState.value.resolvedConflicts = resolutions
        mergedTodos = applyConflictResolutions(localTodos, remoteTodos, resolutions)
      } else if (conflicts.length === 0) {
        // 没有冲突，执行智能合并
        mergedTodos = smartMergeTodos(localTodos, remoteTodos)
      }

      // 4. 更新本地数据
      if (mergedTodos.length !== localTodos.length || hasDataChanged(localTodos, mergedTodos)) {
        todos.value = mergedTodos
        await saveTodos()
      }

      // 5. 处理待处理操作
      await processPendingOperations()

      syncState.value.lastSyncTime = new Date()
      logger.info(
        'Intelligent sync completed',
        {
          localCount: localTodos.length,
          remoteCount: remoteTodos.length,
          mergedCount: mergedTodos.length,
          conflictsResolved: syncState.value.resolvedConflicts.length,
        },
        'useEnhancedDataSync'
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败'
      syncState.value.syncError = errorMessage
      logger.error('Intelligent sync failed', { error: errorMessage }, 'useEnhancedDataSync')
    } finally {
      syncState.value.isSyncing = false
    }
  }

  /**
   * 检测冲突
   */
  function detectConflicts(localTodos: Todo[], remoteTodos: Todo[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    const remoteMap = new Map(remoteTodos.map((todo) => [todo.id, todo]))
    const titleMap = new Map<string, Todo[]>()

    // 按标题分组远程数据
    remoteTodos.forEach((todo) => {
      const titleKey = todo.title.toLowerCase().trim()
      if (!titleMap.has(titleKey)) {
        titleMap.set(titleKey, [])
      }
      titleMap.get(titleKey)?.push(todo)
    })

    // 检查本地数据的冲突
    localTodos.forEach((localTodo) => {
      const remoteTodo = remoteMap.get(localTodo.id)

      if (remoteTodo) {
        // ID匹配，检查数据冲突
        const conflict = conflictResolver.detectConflict(localTodo, remoteTodo)
        if (conflict) {
          conflicts.push(conflict)
        }
      } else {
        // ID不匹配，检查标题冲突
        const titleKey = localTodo.title.toLowerCase().trim()
        const remoteTodosWithSameTitle = titleMap.get(titleKey) || []

        remoteTodosWithSameTitle.forEach((remoteTodo) => {
          const conflict = conflictResolver.detectConflict(localTodo, remoteTodo)
          if (conflict) {
            conflicts.push(conflict)
          }
        })
      }
    })

    return conflicts
  }

  /**
   * 应用冲突解决方案
   */
  function applyConflictResolutions(
    localTodos: Todo[],
    remoteTodos: Todo[],
    resolutions: ConflictResolution[]
  ): Todo[] {
    const resolvedMap = new Map<string, Todo>()
    const processedIds = new Set<string>()

    // 应用解决方案
    resolutions.forEach((resolution) => {
      const { resolvedData } = resolution
      resolvedMap.set(resolvedData.id, resolvedData)
      processedIds.add(resolvedData.id)
    })

    // 添加未冲突的本地数据
    localTodos.forEach((todo) => {
      if (!processedIds.has(todo.id)) {
        resolvedMap.set(todo.id, todo)
      }
    })

    // 添加未冲突的远程数据
    remoteTodos.forEach((todo) => {
      if (!processedIds.has(todo.id) && !resolvedMap.has(todo.id)) {
        resolvedMap.set(todo.id, todo)
      }
    })

    return Array.from(resolvedMap.values()).sort((a, b) => a.order - b.order)
  }

  /**
   * 智能合并数据（无冲突情况）
   */
  function smartMergeTodos(localTodos: Todo[], remoteTodos: Todo[]): Todo[] {
    const mergedMap = new Map<string, Todo>()
    const titleMap = new Map<string, Todo>()

    // 处理本地数据
    localTodos.forEach((todo) => {
      mergedMap.set(todo.id, todo)
      const titleKey = todo.title.toLowerCase().trim()
      if (!titleMap.has(titleKey)) {
        titleMap.set(titleKey, todo)
      }
    })

    // 处理远程数据
    remoteTodos.forEach((remoteTodo) => {
      const titleKey = remoteTodo.title.toLowerCase().trim()
      const existingByTitle = titleMap.get(titleKey)

      if (mergedMap.has(remoteTodo.id)) {
        // ID相同，使用远程版本（权威数据源）
        mergedMap.set(remoteTodo.id, remoteTodo)
      } else if (existingByTitle) {
        // 标题相同但ID不同，比较时间
        const localTime = new Date(existingByTitle.createdAt).getTime()
        const remoteTime = new Date(remoteTodo.createdAt).getTime()

        if (remoteTime < localTime) {
          // 远程数据更早，替换本地版本
          mergedMap.delete(existingByTitle.id)
          mergedMap.set(remoteTodo.id, remoteTodo)
          titleMap.set(titleKey, remoteTodo)
        }
      } else {
        // 新的远程数据
        mergedMap.set(remoteTodo.id, remoteTodo)
        titleMap.set(titleKey, remoteTodo)
      }
    })

    return Array.from(mergedMap.values())
  }

  /**
   * 检查数据是否发生变化
   */
  function hasDataChanged(oldTodos: Todo[], newTodos: Todo[]): boolean {
    if (oldTodos.length !== newTodos.length) return true

    const oldMap = new Map(oldTodos.map((todo) => [todo.id, todo]))

    return newTodos.some((newTodo) => {
      const oldTodo = oldMap.get(newTodo.id)
      if (!oldTodo) return true

      return (
        oldTodo.updatedAt !== newTodo.updatedAt ||
        oldTodo.title !== newTodo.title ||
        oldTodo.completed !== newTodo.completed
      )
    })
  }

  /**
   * 处理待处理操作
   */
  async function processPendingOperations(): Promise<void> {
    if (!canSync.value || syncState.value.pendingOperations.length === 0) {
      return
    }

    const operations = [...syncState.value.pendingOperations]
    const batchSize = syncState.value.syncStrategy === 'batch' ? 5 : 1

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)

      for (const operation of batch) {
        try {
          await processOperation(operation)
          // 成功处理，从队列中移除
          const index = syncState.value.pendingOperations.findIndex((op) => op.id === operation.id)
          if (index > -1) {
            syncState.value.pendingOperations.splice(index, 1)
          }
        } catch (error) {
          operation.retryCount++
          if (operation.retryCount >= 3) {
            // 超过重试限制，移除操作
            const index = syncState.value.pendingOperations.findIndex(
              (op) => op.id === operation.id
            )
            if (index > -1) {
              syncState.value.pendingOperations.splice(index, 1)
            }
            logger.error(
              'Operation failed after max retries',
              { operation, error },
              'useEnhancedDataSync'
            )
          }
        }
      }

      // 批处理间隔
      if (i + batchSize < operations.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  /**
   * 处理单个操作
   */
  async function processOperation(
    operation: EnhancedSyncState['pendingOperations'][0]
  ): Promise<void> {
    const storageService = getCurrentStorageService()

    switch (operation.type) {
      case 'create':
        await storageService.createTodo(operation.data)
        break
      case 'update':
        await storageService.updateTodo(operation.data.id, operation.data)
        break
      case 'delete':
        await storageService.deleteTodo(operation.data.id)
        break
    }
  }

  /**
   * 添加待处理操作
   */
  function addPendingOperation(type: 'create' | 'update' | 'delete', data: Todo): void {
    syncState.value.pendingOperations.push({
      id: `${type}_${data.id}_${Date.now()}`,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
    })
  }

  /**
   * 手动解决冲突
   */
  function resolveConflictManually(
    conflictId: string,
    resolution: 'use_local' | 'use_remote' | 'merge'
  ): void {
    const conflictIndex = syncState.value.conflicts.findIndex((c) => c.id === conflictId)
    if (conflictIndex === -1) return

    const conflict = syncState.value.conflicts[conflictIndex]
    let resolvedData: Todo

    switch (resolution) {
      case 'use_local':
        resolvedData = conflict.localData
        break
      case 'use_remote':
        resolvedData = conflict.remoteData
        break
      case 'merge':
        resolvedData = conflictResolver.resolveConflict(conflict).resolvedData
        break
    }

    // 更新本地数据
    const todoIndex = todos.value.findIndex((t) => t.id === resolvedData.id)
    if (todoIndex > -1) {
      todos.value[todoIndex] = resolvedData
    } else {
      todos.value.push(resolvedData)
    }

    // 移除冲突
    syncState.value.conflicts.splice(conflictIndex, 1)

    // 保存数据
    saveTodos()
  }

  /**
   * 清除所有冲突
   */
  function clearAllConflicts(): void {
    syncState.value.conflicts = []
    syncState.value.resolvedConflicts = []
  }

  /**
   * 强制网络检查
   */
  async function forceNetworkCheck(): Promise<void> {
    await networkService.forceCheck()
  }

  // 清理资源
  onUnmounted(() => {
    networkStatusUnsubscribe()
    networkService.destroy()
  })

  return {
    // 状态
    syncState: readonly(syncState),
    canSync,
    hasConflicts,
    hasPendingOperations,
    syncStatusText,

    // 方法
    performIntelligentSync,
    processPendingOperations,
    addPendingOperation,
    resolveConflictManually,
    clearAllConflicts,
    forceNetworkCheck,

    // 服务实例（供测试使用）
    conflictResolver,
    networkService,
  }
}
