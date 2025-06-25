/**
 * 数据同步服务
 * 处理增量同步和实时数据同步
 */

import type { Todo, ConflictResolutionStrategy } from '@shared/types'
import { LocalStorageService } from './storage/LocalStorageService'
import { RemoteStorageService } from './storage/RemoteStorageService'

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  todoId: string
  data?: unknown
  timestamp: string
  retryCount: number
  maxRetries: number
}

export interface SyncResult {
  success: boolean
  syncedCount: number
  conflictCount: number
  errorCount: number
  conflicts: Array<{
    operation: SyncOperation
    localTodo?: Todo
    remoteTodo?: Todo
    reason: string
  }>
  errors: Array<{ operation: SyncOperation; error: string }>
}

export interface SyncStatus {
  isActive: boolean
  lastSyncTime?: Date
  pendingOperations: number
  failedOperations: number
  nextSyncTime?: Date
}

export class DataSyncService {
  private localService: LocalStorageService
  private remoteService: RemoteStorageService
  private pendingOperations: Map<string, SyncOperation> = new Map()
  private syncInterval?: number
  private isAutoSyncEnabled = false
  private conflictResolutionStrategy: ConflictResolutionStrategy = 'ask-user'

  constructor(localService: LocalStorageService, remoteService: RemoteStorageService) {
    this.localService = localService
    this.remoteService = remoteService
    this.loadPendingOperations()
  }

  /**
   * 启用自动同步
   */
  enableAutoSync(intervalMinutes: number = 5): void {
    this.disableAutoSync()
    this.isAutoSyncEnabled = true

    this.syncInterval = window.setInterval(
      () => {
        this.performIncrementalSync().catch((error) => {
          console.error('Auto sync failed:', error)
        })
      },
      intervalMinutes * 60 * 1000
    )

    console.log(`Auto sync enabled with ${intervalMinutes} minute interval`)
  }

  /**
   * 禁用自动同步
   */
  disableAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = undefined
    }
    this.isAutoSyncEnabled = false
    console.log('Auto sync disabled')
  }

  /**
   * 设置冲突解决策略
   */
  setConflictResolutionStrategy(strategy: ConflictResolutionStrategy): void {
    this.conflictResolutionStrategy = strategy
  }

  /**
   * 添加待同步操作
   */
  addPendingOperation(
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
  ): void {
    const syncOperation: SyncOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
    }

    this.pendingOperations.set(syncOperation.id, syncOperation)
    this.savePendingOperations()

    // 如果在线，立即尝试同步
    if (navigator.onLine) {
      this.processPendingOperation(syncOperation).catch((error) => {
        console.error('Failed to process pending operation:', error)
      })
    }
  }

  /**
   * 执行增量同步
   */
  async performIncrementalSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      conflicts: [],
      errors: [],
    }

    try {
      // 处理所有待同步操作
      const operations = Array.from(this.pendingOperations.values())

      for (const operation of operations) {
        try {
          const success = await this.processPendingOperation(operation)
          if (success) {
            result.syncedCount++
            this.pendingOperations.delete(operation.id)
          } else {
            result.errorCount++
            result.errors.push({ operation, error: '同步失败' })
          }
        } catch (error) {
          result.errorCount++
          result.errors.push({ operation, error: `同步异常: ${error}` })

          // 增加重试次数
          operation.retryCount++
          if (operation.retryCount >= operation.maxRetries) {
            console.error(`Operation ${operation.id} exceeded max retries, removing`)
            this.pendingOperations.delete(operation.id)
          }
        }
      }

      // 保存更新后的待同步操作
      this.savePendingOperations()

      // 执行双向同步检查
      await this.performBidirectionalSync(result)

      result.success = result.errorCount === 0 && result.conflictCount === 0
      return result
    } catch (error) {
      console.error('Incremental sync failed:', error)
      result.success = false
      result.errors.push({
        operation: {
          id: 'sync',
          type: 'update',
          todoId: 'all',
          timestamp: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 0,
        },
        error: `同步失败: ${error}`,
      })
      return result
    }
  }

  /**
   * 执行双向同步检查
   */
  private async performBidirectionalSync(result: SyncResult): Promise<void> {
    try {
      // 获取本地和远程数据
      const [localResult, remoteResult] = await Promise.all([
        this.localService.getTodos(),
        this.remoteService.getTodos(),
      ])

      if (!localResult.success || !remoteResult.success) {
        throw new Error('Failed to fetch data for bidirectional sync')
      }

      const localTodos = localResult.data || []
      const remoteTodos = remoteResult.data || []

      // 检查远程是否有本地没有的新数据
      const localTodoMap = new Map(localTodos.map((todo) => [todo.id, todo]))
      const remoteTodoMap = new Map(remoteTodos.map((todo) => [todo.id, todo]))

      // 检查远程新增的 Todo
      for (const remoteTodo of remoteTodos) {
        if (!localTodoMap.has(remoteTodo.id)) {
          // 远程有新的 Todo，添加到本地
          try {
            await this.localService.createTodo({
              title: remoteTodo.title,
              description: remoteTodo.description,
              priority: remoteTodo.priority,
              estimatedTime: remoteTodo.estimatedTime,
              dueDate: remoteTodo.dueDate,
            })
            result.syncedCount++
          } catch (error) {
            result.errorCount++
            result.errors.push({
              operation: {
                id: 'bidirectional-create',
                type: 'create',
                todoId: remoteTodo.id,
                timestamp: new Date().toISOString(),
                retryCount: 0,
                maxRetries: 0,
              },
              error: `创建本地 Todo 失败: ${error}`,
            })
          }
        }
      }

      // 检查本地删除的 Todo（远程存在但本地不存在）
      for (const localTodo of localTodos) {
        if (!remoteTodoMap.has(localTodo.id)) {
          // 本地有但远程没有，可能是本地新增或远程删除
          // 这里需要更复杂的逻辑来判断，暂时跳过
        }
      }

      // 检查数据冲突
      for (const localTodo of localTodos) {
        const remoteTodo = remoteTodoMap.get(localTodo.id)
        if (remoteTodo && this.hasDataConflict(localTodo, remoteTodo)) {
          result.conflictCount++
          result.conflicts.push({
            operation: {
              id: 'conflict-check',
              type: 'update',
              todoId: localTodo.id,
              timestamp: new Date().toISOString(),
              retryCount: 0,
              maxRetries: 0,
            },
            localTodo,
            remoteTodo,
            reason: '本地和远程数据不一致',
          })
        }
      }
    } catch (error) {
      console.error('Bidirectional sync failed:', error)
      result.errorCount++
      result.errors.push({
        operation: {
          id: 'bidirectional-sync',
          type: 'update',
          todoId: 'all',
          timestamp: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 0,
        },
        error: `双向同步失败: ${error}`,
      })
    }
  }

  /**
   * 处理单个待同步操作
   */
  private async processPendingOperation(operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'create': {
          const createResult = await this.remoteService.createTodo(operation.data)
          return createResult.success
        }

        case 'update': {
          const updateResult = await this.remoteService.updateTodo(operation.todoId, operation.data)
          return updateResult.success
        }

        case 'delete': {
          const deleteResult = await this.remoteService.deleteTodo(operation.todoId)
          return deleteResult.success
        }

        default:
          console.error('Unknown operation type:', operation.type)
          return false
      }
    } catch (error) {
      console.error('Failed to process operation:', operation, error)
      return false
    }
  }

  /**
   * 检查两个 Todo 是否有数据冲突
   */
  private hasDataConflict(todo1: Todo, todo2: Todo): boolean {
    // 比较更新时间
    const time1 = new Date(todo1.updatedAt).getTime()
    const time2 = new Date(todo2.updatedAt).getTime()

    // 如果更新时间相差很小（1秒内），认为是同一次更新
    if (Math.abs(time1 - time2) < 1000) {
      return false
    }

    // 比较关键字段
    return (
      todo1.title !== todo2.title ||
      todo1.completed !== todo2.completed ||
      todo1.priority !== todo2.priority ||
      todo1.estimatedTime !== todo2.estimatedTime ||
      todo1.description !== todo2.description
    )
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return {
      isActive: this.isAutoSyncEnabled,
      lastSyncTime: this.getLastSyncTime(),
      pendingOperations: this.pendingOperations.size,
      failedOperations: this.getFailedOperationsCount(),
      nextSyncTime: this.getNextSyncTime(),
    }
  }

  /**
   * 清除所有待同步操作
   */
  clearPendingOperations(): void {
    this.pendingOperations.clear()
    this.savePendingOperations()
  }

  /**
   * 生成操作 ID
   */
  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 保存待同步操作到本地存储
   */
  private savePendingOperations(): void {
    try {
      const operations = Array.from(this.pendingOperations.values())
      localStorage.setItem('pending_sync_operations', JSON.stringify(operations))
    } catch (error) {
      console.error('Failed to save pending operations:', error)
    }
  }

  /**
   * 从本地存储加载待同步操作
   */
  private loadPendingOperations(): void {
    try {
      const saved = localStorage.getItem('pending_sync_operations')
      if (saved) {
        const operations: SyncOperation[] = JSON.parse(saved)
        this.pendingOperations.clear()
        operations.forEach((op) => {
          this.pendingOperations.set(op.id, op)
        })
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error)
    }
  }

  /**
   * 获取最后同步时间
   */
  private getLastSyncTime(): Date | undefined {
    const saved = localStorage.getItem('last_sync_time')
    return saved ? new Date(saved) : undefined
  }

  /**
   * 设置最后同步时间
   */
  private setLastSyncTime(): void {
    localStorage.setItem('last_sync_time', new Date().toISOString())
  }

  /**
   * 获取失败操作数量
   */
  private getFailedOperationsCount(): number {
    return Array.from(this.pendingOperations.values()).filter(
      (op) => op.retryCount >= op.maxRetries
    ).length
  }

  /**
   * 获取下次同步时间
   */
  private getNextSyncTime(): Date | undefined {
    if (!this.isAutoSyncEnabled || !this.syncInterval) {
      return undefined
    }

    const lastSync = this.getLastSyncTime()
    if (!lastSync) {
      return new Date(Date.now() + 5 * 60 * 1000) // 5分钟后
    }

    return new Date(lastSync.getTime() + 5 * 60 * 1000) // 最后同步时间 + 5分钟
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.disableAutoSync()
    this.savePendingOperations()
  }
}
