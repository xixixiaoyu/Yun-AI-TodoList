/**
 * 混合 Todo 存储服务
 * 实现本地优先的双重存储：本地存储 + 远程同步
 */

import type { CreateTodoDto, Todo, TodoStats, UpdateTodoDto } from '@shared/types'
import { LocalStorageService } from './LocalStorageService'
import { RemoteStorageService } from './RemoteStorageService'
import {
  TodoStorageService,
  type BatchOperationResult,
  type StorageOperationResult,
} from './TodoStorageService'

export class HybridTodoStorageService extends TodoStorageService {
  private localService: LocalStorageService
  private remoteService: RemoteStorageService
  private isOnline: boolean = navigator.onLine
  private syncQueue: Array<{
    operation: string
    data: Record<string, unknown>
    timestamp: number
  }> = []
  private syncInProgress = false

  constructor() {
    super()
    this.localService = new LocalStorageService()
    this.remoteService = new RemoteStorageService()

    this.setStatus({
      isOnline: this.isOnline,
      storageMode: 'hybrid',
      pendingOperations: 0,
    })

    this.setupNetworkListeners()
    this.startAutoSync()
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.setStatus({ isOnline: true })
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.setStatus({ isOnline: false })
    })
  }

  private startAutoSync(): void {
    // 每5分钟自动同步一次
    setInterval(
      () => {
        if (this.isOnline && !this.syncInProgress) {
          this.processSyncQueue()
        }
      },
      5 * 60 * 1000
    )
  }

  async getTodos(): Promise<StorageOperationResult<Todo[]>> {
    try {
      // 优先从本地获取数据（快速响应）
      const localResult = await this.localService.getTodos()

      // 如果在线，后台同步远程数据
      if (this.isOnline && !this.syncInProgress) {
        this.syncRemoteData().catch((error) => {
          console.warn('Background sync failed:', error)
        })
      }

      return localResult
    } catch (error) {
      console.error('Failed to get todos:', error)
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async getTodo(id: string): Promise<StorageOperationResult<Todo>> {
    // 优先从本地获取
    return await this.localService.getTodo(id)
  }

  async createTodo(todoData: CreateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      // 1. 如果在线且有权限，优先尝试远程创建以获得服务器生成的 ID
      if (this.isOnline && (await this.checkRemoteAccess())) {
        try {
          const remoteResult = await this.remoteService.createTodo(todoData)
          if (remoteResult.success && remoteResult.data) {
            const remoteTodo = remoteResult.data

            // 2. 将远程创建的 todo 保存到本地，标记为已同步
            const syncedTodo = {
              ...remoteTodo,
              synced: true,
              lastSyncTime: new Date().toISOString(),
              syncError: undefined,
            }

            // 直接保存到本地存储，不通过 createTodo 避免重复验证
            const localTodos = await this.localService.getTodos()
            if (localTodos.success && localTodos.data) {
              const updatedTodos = [...localTodos.data, syncedTodo]
              await this.localService.saveTodos(updatedTodos)
            }

            return this.createSuccessResult(syncedTodo)
          } else {
            // 远程创建失败，降级到本地创建
            console.warn('Remote create failed, falling back to local:', remoteResult.error)
            return await this.createLocalTodo(todoData)
          }
        } catch (error) {
          // 网络错误或权限错误，降级到本地创建
          console.warn('Remote create failed, falling back to local:', error)
          return await this.createLocalTodo(todoData)
        }
      } else {
        // 离线状态或无权限，直接本地创建
        return await this.createLocalTodo(todoData)
      }
    } catch (error) {
      console.error('Failed to create todo:', error)
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private async checkRemoteAccess(): Promise<boolean> {
    try {
      // 简单的权限检查：尝试获取统计信息
      const result = await this.remoteService.getStats()
      return result.success
    } catch (error) {
      // 如果是 403 或其他权限错误，返回 false
      return false
    }
  }

  private async createLocalTodo(todoData: CreateTodoDto): Promise<StorageOperationResult<Todo>> {
    // 本地创建 todo
    const localResult = await this.localService.createTodo(todoData)
    if (!localResult.success) {
      return localResult
    }

    const newTodo = localResult.data as Todo

    // 标记为待同步
    this.addToSyncQueue('create', { localId: newTodo.id, data: todoData })
    const pendingTodo = {
      ...newTodo,
      synced: false,
      syncError: undefined,
    }
    await this.localService.updateTodo(newTodo.id, pendingTodo)
    return this.createSuccessResult(pendingTodo)
  }

  async updateTodo(id: string, updates: UpdateTodoDto): Promise<StorageOperationResult<Todo>> {
    try {
      // 1. 先更新本地存储
      const localResult = await this.localService.updateTodo(id, updates)
      if (!localResult.success) {
        return localResult
      }

      const updatedTodo = localResult.data as Todo

      // 2. 如果在线，尝试同步到远程
      if (this.isOnline) {
        try {
          const remoteResult = await this.remoteService.updateTodo(id, updates)
          if (remoteResult.success) {
            // 更新本地数据的同步状态
            const syncedTodo = {
              ...updatedTodo,
              synced: true,
              lastSyncTime: new Date().toISOString(),
              syncError: undefined,
            }
            await this.localService.updateTodo(id, syncedTodo)
            return this.createSuccessResult(syncedTodo)
          } else {
            // 远程同步失败，标记为待同步
            this.addToSyncQueue('update', { id, data: updates })
            const pendingTodo = {
              ...updatedTodo,
              synced: false,
              syncError: remoteResult.error,
            }
            await this.localService.updateTodo(id, pendingTodo)
            return this.createSuccessResult(pendingTodo)
          }
        } catch (error) {
          // 网络错误，标记为待同步
          this.addToSyncQueue('update', { id, data: updates })
          const pendingTodo = {
            ...updatedTodo,
            synced: false,
            syncError: 'Network error',
          }
          await this.localService.updateTodo(id, pendingTodo)
          return this.createSuccessResult(pendingTodo)
        }
      } else {
        // 离线状态，标记为待同步
        this.addToSyncQueue('update', { id, data: updates })
        const offlineTodo = { ...updatedTodo, synced: false }
        await this.localService.updateTodo(id, offlineTodo)
        return this.createSuccessResult(offlineTodo)
      }
    } catch (error) {
      console.error('Failed to update todo:', error)
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async deleteTodo(id: string): Promise<StorageOperationResult<void>> {
    try {
      // 1. 先从本地删除
      const localResult = await this.localService.deleteTodo(id)
      if (!localResult.success) {
        return localResult
      }

      // 2. 如果在线且有权限，智能删除远程 todo
      if (this.isOnline && (await this.checkRemoteAccess())) {
        try {
          // 先检查远程是否存在这个 todo
          const remoteTodo = await this.remoteService.getTodo(id)
          if (remoteTodo.success && remoteTodo.data) {
            // 远程存在，尝试删除
            const remoteResult = await this.remoteService.deleteTodo(id)
            if (!remoteResult.success) {
              // 远程删除失败，标记为待同步
              console.warn(`Failed to delete todo ${id} from remote:`, remoteResult.error)
              this.addToSyncQueue('delete', { id })
            }
          } else {
            // 远程不存在，说明已经被删除了或者从未同步过，无需处理
            console.log(`Todo ${id} does not exist on remote, skipping remote delete`)
          }
        } catch (error) {
          // 网络错误或其他错误，标记为待同步
          console.warn(`Error checking/deleting todo ${id} from remote:`, error)
          this.addToSyncQueue('delete', { id })
        }
      } else {
        // 离线状态或无权限，标记为待同步
        this.addToSyncQueue('delete', { id })
      }

      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to delete todo:', error)
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 同步队列管理
  private addToSyncQueue(operation: string, data: Record<string, unknown>): void {
    this.syncQueue.push({
      operation,
      data,
      timestamp: Date.now(),
    })
    this.setStatus({ pendingOperations: this.syncQueue.length })
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    // 检查远程访问权限
    if (!(await this.checkRemoteAccess())) {
      console.warn('No remote access, skipping sync queue processing')
      return
    }

    this.syncInProgress = true
    console.log(`🔄 Processing ${this.syncQueue.length} pending sync operations`)

    // 调试：打印同步队列内容
    this.syncQueue.forEach((item, index) => {
      console.log(`📋 Queue item ${index}: ${item.operation}`, {
        localId: item.data.localId || item.data.id,
        hasData: !!item.data.data,
        timestamp: item.timestamp,
      })
    })

    const processedItems: number[] = []

    for (let i = 0; i < this.syncQueue.length; i++) {
      const item = this.syncQueue[i]
      try {
        let success = false

        switch (item.operation) {
          case 'create': {
            // 对于本地创建的 todo，需要在远程创建并处理 ID 映射
            const createResult = await this.remoteService.createTodo(item.data.data)
            success = createResult.success
            if (success && createResult.data) {
              // 远程创建成功，需要处理 ID 映射
              const localId = item.data.localId || item.data.id // 兼容不同的数据结构
              const remoteTodo = createResult.data

              if (localId) {
                // 安全地替换本地 todo，避免重复数据
                await this.replaceLocalTodoWithRemote(localId, remoteTodo)
                console.log(
                  `Successfully synced local todo ${localId} to remote todo ${remoteTodo.id}`
                )
              } else {
                console.warn('No local ID found for create operation, cannot replace local todo')
              }
            } else {
              // 如果是重复数据错误，也标记为成功处理
              if (
                createResult.error?.includes('已存在') ||
                createResult.error?.includes('already exists')
              ) {
                console.warn('Todo already exists on server, marking as synced:', item.data.localId)
                success = true
                // 只更新本地同步状态，不删除数据
                const localTodos = await this.localService.getTodos()
                if (localTodos.success && localTodos.data) {
                  const updatedTodos = localTodos.data.map((todo) =>
                    todo.id === item.data.localId
                      ? {
                          ...todo,
                          synced: true,
                          lastSyncTime: new Date().toISOString(),
                          syncError: undefined,
                        }
                      : todo
                  )
                  await this.localService.saveTodos(updatedTodos)
                }
              }
            }
            break
          }

          case 'update': {
            const updateResult = await this.remoteService.updateTodo(item.data.id, item.data.data)
            success = updateResult.success
            if (success) {
              // 更新本地同步状态
              const localTodos = await this.localService.getTodos()
              if (localTodos.success && localTodos.data) {
                const updatedTodos = localTodos.data.map((todo) =>
                  todo.id === item.data.id
                    ? {
                        ...todo,
                        synced: true,
                        lastSyncTime: new Date().toISOString(),
                        syncError: undefined,
                      }
                    : todo
                )
                await this.localService.saveTodos(updatedTodos)
              }
            }
            break
          }

          case 'delete': {
            // 先检查远程是否存在这个 todo
            const remoteTodo = await this.remoteService.getTodo(item.data.id)
            if (remoteTodo.success && remoteTodo.data) {
              // 远程存在，尝试删除
              const deleteResult = await this.remoteService.deleteTodo(item.data.id)
              success = deleteResult.success
            } else {
              // 远程不存在，说明已经被删除了，标记为成功
              console.log(
                `Todo ${item.data.id} does not exist on remote, marking delete as successful`
              )
              success = true
            }
            break
          }

          case 'reorder': {
            // 对于重排序操作，过滤出有效的 todo 再执行
            const validReorders = await this.filterValidReorders(item.data.reorders)
            if (validReorders.length > 0) {
              const reorderResult = await this.remoteService.reorderTodos(validReorders)
              success = reorderResult.success
              if (success) {
                console.log(`Successfully synced reorder for ${validReorders.length} todos`)
              }
            } else {
              // 没有有效的 todo 需要重排序，标记为成功
              console.log('No valid todos to reorder in sync queue, marking as successful')
              success = true
            }
            break
          }
        }

        if (success) {
          processedItems.push(i)
        }
      } catch (error) {
        console.warn(`Failed to sync operation ${item.operation}:`, error)
      }
    }

    // 移除已成功同步的项目（从后往前删除以避免索引问题）
    for (let i = processedItems.length - 1; i >= 0; i--) {
      this.syncQueue.splice(processedItems[i], 1)
    }

    this.setStatus({ pendingOperations: this.syncQueue.length })
    this.syncInProgress = false

    console.log(
      `Sync completed. ${processedItems.length} operations synced, ${this.syncQueue.length} pending`
    )
  }

  // 远程数据同步
  private async syncRemoteData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return
    }

    // 检查远程访问权限
    if (!(await this.checkRemoteAccess())) {
      console.warn('No remote access, skipping remote data sync')
      return
    }

    this.syncInProgress = true
    try {
      // 获取远程数据
      const remoteResult = await this.remoteService.getTodos()
      if (!remoteResult.success || !remoteResult.data) {
        console.warn('Failed to get remote todos:', remoteResult.error)
        return
      }

      const remoteTodos = remoteResult.data
      const localResult = await this.localService.getTodos()
      if (!localResult.success || !localResult.data) {
        console.warn('Failed to get local todos:', localResult.error)
        return
      }

      const localTodos = localResult.data

      // 合并数据（以最新时间戳为准）
      const mergedTodos = this.mergeData(localTodos, remoteTodos)

      // 保存合并后的数据到本地
      await this.localService.saveTodos(mergedTodos)

      this.setStatus({ lastSyncTime: new Date() })
      console.log('Remote data sync completed successfully')
    } catch (error) {
      console.error('Failed to sync remote data:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  private mergeData(localTodos: Todo[], remoteTodos: Todo[]): Todo[] {
    const merged = new Map<string, Todo>()

    // 先添加本地数据
    localTodos.forEach((todo) => {
      merged.set(todo.id, todo)
    })

    // 合并远程数据（以最新时间戳为准）
    remoteTodos.forEach((remoteTodo) => {
      const localTodo = merged.get(remoteTodo.id)
      if (!localTodo) {
        // 远程有但本地没有，直接添加
        merged.set(remoteTodo.id, { ...remoteTodo, synced: true })
      } else {
        // 两边都有，比较时间戳
        const remoteTime = new Date(remoteTodo.updatedAt).getTime()
        const localTime = new Date(localTodo.updatedAt).getTime()

        if (remoteTime > localTime) {
          // 远程更新，使用远程数据
          merged.set(remoteTodo.id, { ...remoteTodo, synced: true })
        } else {
          // 本地更新或相同，保持本地数据
          merged.set(remoteTodo.id, localTodo)
        }
      }
    })

    return Array.from(merged.values())
  }

  // 实现其他必需的方法
  async createTodos(todos: CreateTodoDto[]): Promise<BatchOperationResult> {
    const results = await Promise.allSettled(todos.map((todo) => this.createTodo(todo)))

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failureCount = results.length - successCount
    const errors = results
      .map((r, index) => ({
        id: `todo-${index}`,
        error:
          r.status === 'rejected'
            ? r.reason
            : r.status === 'fulfilled' && !r.value.success
              ? r.value.error || 'Unknown error'
              : '',
      }))
      .filter((e) => e.error)

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    }
  }

  async updateTodos(
    updates: Array<{ id: string; data: UpdateTodoDto }>
  ): Promise<BatchOperationResult> {
    const results = await Promise.allSettled(
      updates.map((update) => this.updateTodo(update.id, update.data))
    )

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failureCount = results.length - successCount
    const errors = results
      .map((r, index) => ({
        id: updates[index].id,
        error:
          r.status === 'rejected'
            ? r.reason
            : r.status === 'fulfilled' && !r.value.success
              ? r.value.error || 'Unknown error'
              : '',
      }))
      .filter((e) => e.error)

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    }
  }

  async deleteTodos(ids: string[]): Promise<BatchOperationResult> {
    const results = await Promise.allSettled(ids.map((id) => this.deleteTodo(id)))

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failureCount = results.length - successCount
    const errors = results
      .map((r, index) => ({
        id: ids[index],
        error:
          r.status === 'rejected'
            ? r.reason
            : r.status === 'fulfilled' && !r.value.success
              ? r.value.error || 'Unknown error'
              : '',
      }))
      .filter((e) => e.error)

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    }
  }

  async reorderTodos(
    reorders: Array<{ id: string; order: number }>
  ): Promise<StorageOperationResult<void>> {
    // 先更新本地
    const localResult = await this.localService.reorderTodos(reorders)
    if (!localResult.success) {
      return localResult
    }

    // 如果在线且有权限，智能同步到远程
    if (this.isOnline && (await this.checkRemoteAccess())) {
      try {
        // 过滤出在远程存在的 todo
        const validReorders = await this.filterValidReorders(reorders)

        if (validReorders.length > 0) {
          await this.remoteService.reorderTodos(validReorders)
          console.log(`Successfully reordered ${validReorders.length} todos on remote`)
        } else {
          console.log('No valid todos to reorder on remote')
        }

        // 对于无效的 todo，添加到同步队列等待后续处理
        const invalidReorders = reorders.filter((r) => !validReorders.some((v) => v.id === r.id))
        if (invalidReorders.length > 0) {
          console.log(`${invalidReorders.length} todos not found on remote, adding to sync queue`)
          this.addToSyncQueue('reorder', { reorders: invalidReorders })
        }
      } catch (error) {
        // 远程同步失败，标记为待同步
        console.warn('Failed to reorder todos on remote:', error)
        this.addToSyncQueue('reorder', { reorders })
      }
    } else {
      // 离线状态或无权限，标记为待同步
      this.addToSyncQueue('reorder', { reorders })
    }

    return this.createSuccessResult(undefined)
  }

  private async filterValidReorders(
    reorders: Array<{ id: string; order: number }>
  ): Promise<Array<{ id: string; order: number }>> {
    try {
      // 获取远程现有的 todos
      const remoteResult = await this.remoteService.getTodos()
      if (!remoteResult.success || !remoteResult.data) {
        console.warn('Failed to get remote todos for reorder validation')
        return []
      }

      const remoteIds = new Set(remoteResult.data.map((todo) => todo.id))

      // 只保留在远程存在的 todo
      const validReorders = reorders.filter((reorder) => remoteIds.has(reorder.id))

      console.log(`Filtered reorders: ${validReorders.length}/${reorders.length} valid`)
      return validReorders
    } catch (error) {
      console.error('Error filtering valid reorders:', error)
      return []
    }
  }

  /**
   * 安全地用远程 todo 替换本地 todo，避免重复数据
   */
  private async replaceLocalTodoWithRemote(localId: string, remoteTodo: Todo): Promise<void> {
    try {
      const localTodos = await this.localService.getTodos()
      if (!localTodos.success || !localTodos.data) {
        console.error('Failed to get local todos for replacement')
        return
      }

      // 创建同步后的 todo
      const syncedTodo = {
        ...remoteTodo,
        synced: true,
        lastSyncTime: new Date().toISOString(),
        syncError: undefined,
      }

      // 检查本地是否存在要替换的 todo
      const localTodoExists = localTodos.data.some((todo) => todo.id === localId)

      if (localTodoExists) {
        // 本地 todo 存在，进行替换
        const updatedTodos = localTodos.data.map((todo) =>
          todo.id === localId ? syncedTodo : todo
        )
        await this.localService.saveTodos(updatedTodos)
        console.log(`Replaced local todo ${localId} with remote todo ${remoteTodo.id}`)
      } else {
        // 本地 todo 不存在，检查是否已经有相同的远程 todo
        const remoteAlreadyExists = localTodos.data.some((todo) => todo.id === remoteTodo.id)
        if (!remoteAlreadyExists) {
          // 远程 todo 不存在，添加它
          const updatedTodos = [...localTodos.data, syncedTodo]
          await this.localService.saveTodos(updatedTodos)
          console.log(
            `Added remote todo ${remoteTodo.id} to local storage (local todo ${localId} not found)`
          )
        } else {
          console.log(`Remote todo ${remoteTodo.id} already exists in local storage, skipping`)
        }
      }
    } catch (error) {
      console.error('Error replacing local todo with remote:', error)
    }
  }

  async getStats(): Promise<StorageOperationResult<TodoStats>> {
    // 从本地获取统计信息
    return await this.localService.getStats()
  }

  async clearAll(): Promise<StorageOperationResult<void>> {
    // 先清空本地
    const localResult = await this.localService.clearAll()
    if (!localResult.success) {
      return localResult
    }

    // 如果在线，清空远程
    if (this.isOnline) {
      try {
        await this.remoteService.clearAll()
      } catch (error) {
        console.warn('Failed to clear remote data:', error)
      }
    }

    // 清空同步队列
    this.syncQueue = []
    this.setStatus({ pendingOperations: 0 })

    return this.createSuccessResult(undefined)
  }

  async exportData(): Promise<StorageOperationResult<Todo[]>> {
    // 从本地导出数据
    return await this.localService.exportData()
  }

  async importData(todos: Todo[]): Promise<BatchOperationResult> {
    // 导入到本地
    const localResult = await this.localService.importData(todos)

    // 如果在线，同步到远程
    if (this.isOnline && localResult.success) {
      try {
        await this.remoteService.importData(todos)
      } catch (error) {
        console.warn('Failed to sync imported data to remote:', error)
        // 标记所有导入的数据为待同步
        todos.forEach((todo) => {
          this.addToSyncQueue('create', { localId: todo.id, data: todo })
        })
      }
    } else if (localResult.success) {
      // 离线状态，标记为待同步
      todos.forEach((todo) => {
        this.addToSyncQueue('create', { localId: todo.id, data: todo })
      })
    }

    return localResult
  }

  async checkHealth(): Promise<boolean> {
    const localHealth = await this.localService.checkHealth()
    const remoteHealth = this.isOnline ? await this.remoteService.checkHealth() : true
    return localHealth && remoteHealth
  }

  async saveTodos(todos: Todo[]): Promise<StorageOperationResult<void>> {
    // 保存到本地
    const localResult = await this.localService.saveTodos(todos)
    if (!localResult.success) {
      return localResult
    }

    // 如果在线且有权限，智能同步到远程
    if (this.isOnline && (await this.checkRemoteAccess())) {
      try {
        // 不直接调用 saveTodos，而是分别处理每个 todo
        await this.smartSyncTodos(todos)
      } catch (error) {
        console.warn('Failed to sync saved todos to remote:', error)
      }
    }

    return this.createSuccessResult(undefined)
  }

  private async smartSyncTodos(todos: Todo[]): Promise<void> {
    // 获取远程现有的 todos
    const remoteResult = await this.remoteService.getTodos()
    const remoteTodos = remoteResult.success && remoteResult.data ? remoteResult.data : []
    const remoteIds = new Set(remoteTodos.map((todo) => todo.id))

    for (const todo of todos) {
      try {
        if (remoteIds.has(todo.id)) {
          // 远程存在，尝试更新
          await this.remoteService.updateTodo(todo.id, todo)
        } else {
          // 远程不存在，尝试创建
          // 但要注意，这个 todo 可能有本地生成的 ID，需要特殊处理
          if (todo.synced === false) {
            // 这是一个待同步的本地 todo，添加到同步队列
            this.addToSyncQueue('create', { localId: todo.id, data: todo })
          }
          // 如果 synced 不是 false，说明这个 todo 之前是同步过的，
          // 但现在远程没有了，可能是被删除了，我们保持本地状态
        }
      } catch (error) {
        console.warn(`Failed to sync todo ${todo.id}:`, error)
        // 同步失败的 todo 添加到队列
        if (remoteIds.has(todo.id)) {
          this.addToSyncQueue('update', { id: todo.id, data: todo })
        } else {
          this.addToSyncQueue('create', { localId: todo.id, data: todo })
        }
      }
    }
  }

  override async syncData(): Promise<StorageOperationResult<void>> {
    try {
      if (!this.isOnline) {
        return this.createErrorResult('Network unavailable', true)
      }

      // 处理同步队列
      await this.processSyncQueue()

      // 同步远程数据
      await this.syncRemoteData()

      return this.createSuccessResult(undefined)
    } catch (error) {
      console.error('Failed to sync data:', error)
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 获取同步状态
  getSyncStatus() {
    return {
      pendingOperations: this.syncQueue.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this._status.lastSyncTime,
    }
  }

  // 手动触发同步
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue()
      await this.syncRemoteData()
    }
  }
}
