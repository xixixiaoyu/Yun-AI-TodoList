/**
 * 双重存储服务基类
 * 提供本地优先的双重存储架构，支持 localStorage + 云端同步
 */

import type {
  ConflictResolution,
  ConflictResolutionStrategy,
  StorageHealth,
  SyncableEntity,
  SyncOperation,
  SyncQueue,
} from '@shared/types'

export interface HybridStorageOptions {
  enableAutoSync: boolean
  syncInterval: number // 分钟
  conflictResolution: ConflictResolutionStrategy
  maxRetries: number
  batchSize: number
}

export interface HybridStorageResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  fromCache?: boolean
  syncPending?: boolean
}

export interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  conflicts: ConflictResolution[]
  errors: Array<{ id: string; error: string }>
}

/**
 * 双重存储服务抽象基类
 */
export abstract class BaseHybridStorageService<T extends SyncableEntity> {
  protected options: HybridStorageOptions
  protected syncQueue: SyncQueue
  protected isOnline: boolean = navigator.onLine
  protected syncTimer?: number

  constructor(options: Partial<HybridStorageOptions> = {}) {
    this.options = {
      enableAutoSync: true,
      syncInterval: 5,
      conflictResolution: 'ask-user',
      maxRetries: 3,
      batchSize: 10,
      ...options,
    }

    this.syncQueue = {
      operations: [],
      isProcessing: false,
    }

    this.setupNetworkListeners()
    this.setupAutoSync()
  }

  // 抽象方法 - 子类必须实现
  protected abstract getLocalStorageKey(): string
  protected abstract validateEntity(entity: unknown): entity is T
  protected abstract createRemoteEntity(entity: T): Promise<HybridStorageResult<T>>
  protected abstract updateRemoteEntity(
    id: string,
    entity: Partial<T>
  ): Promise<HybridStorageResult<T>>
  protected abstract deleteRemoteEntity(id: string): Promise<HybridStorageResult<void>>
  protected abstract getRemoteEntities(): Promise<HybridStorageResult<T[]>>
  protected abstract getRemoteEntity(id: string): Promise<HybridStorageResult<T>>

  /**
   * 获取所有实体（本地优先）
   */
  async getAll(): Promise<HybridStorageResult<T[]>> {
    try {
      // 1. 先从本地获取
      const localResult = await this.getLocalEntities()

      // 2. 如果在线且启用自动同步，尝试同步
      if (this.isOnline && this.options.enableAutoSync) {
        this.queueSyncOperation('sync', 'all', '')
        this.processSyncQueue() // 异步处理，不阻塞返回
      }

      return {
        success: true,
        data: localResult,
        fromCache: true,
      }
    } catch (error) {
      console.error('Failed to get entities:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取单个实体
   */
  async getById(id: string): Promise<HybridStorageResult<T>> {
    try {
      const localEntities = await this.getLocalEntities()
      const entity = localEntities.find((e) => e.id === id)

      if (!entity) {
        return {
          success: false,
          error: 'Entity not found',
        }
      }

      return {
        success: true,
        data: entity,
        fromCache: true,
      }
    } catch (error) {
      console.error('Failed to get entity by id:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 创建实体（本地优先）
   */
  async create(
    entityData: Omit<T, 'id' | 'createdAt' | 'updatedAt' | keyof SyncableEntity>
  ): Promise<HybridStorageResult<T>> {
    try {
      // 1. 创建本地实体
      const now = new Date().toISOString()
      const entity: T = {
        ...entityData,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
        synced: false,
        lastSyncTime: undefined,
        syncError: undefined,
      } as T

      // 2. 保存到本地
      await this.saveLocalEntity(entity)

      // 3. 如果在线，排队同步
      if (this.isOnline) {
        this.queueSyncOperation(
          'create',
          this.getEntityType(),
          (entity as T & { id: string }).id,
          entity
        )
        this.processSyncQueue()
      }

      return {
        success: true,
        data: entity,
        syncPending: !this.isOnline,
      }
    } catch (error) {
      console.error('Failed to create entity:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 更新实体（本地优先）
   */
  async update(id: string, updates: Partial<T>): Promise<HybridStorageResult<T>> {
    try {
      // 1. 获取本地实体
      const localEntities = await this.getLocalEntities()
      const entityIndex = localEntities.findIndex((e) => (e as T & { id: string }).id === id)

      if (entityIndex === -1) {
        return {
          success: false,
          error: 'Entity not found',
        }
      }

      // 2. 更新本地实体
      const updatedEntity: T = {
        ...localEntities[entityIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false,
        syncError: undefined,
      }

      localEntities[entityIndex] = updatedEntity
      await this.saveLocalEntities(localEntities)

      // 3. 如果在线，排队同步
      if (this.isOnline) {
        this.queueSyncOperation('update', this.getEntityType(), id, updates)
        this.processSyncQueue()
      }

      return {
        success: true,
        data: updatedEntity,
        syncPending: !this.isOnline,
      }
    } catch (error) {
      console.error('Failed to update entity:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 删除实体（本地优先）
   */
  async delete(id: string): Promise<HybridStorageResult<void>> {
    try {
      // 1. 从本地删除
      const localEntities = await this.getLocalEntities()
      const filteredEntities = localEntities.filter((e) => e.id !== id)

      if (filteredEntities.length === localEntities.length) {
        return {
          success: false,
          error: 'Entity not found',
        }
      }

      await this.saveLocalEntities(filteredEntities)

      // 2. 如果在线，排队同步
      if (this.isOnline) {
        this.queueSyncOperation('delete', this.getEntityType(), id)
        this.processSyncQueue()
      }

      return {
        success: true,
        syncPending: !this.isOnline,
      }
    } catch (error) {
      console.error('Failed to delete entity:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 手动同步
   */
  async sync(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: [{ id: 'network', error: 'Network unavailable' }],
      }
    }

    return this.performFullSync()
  }

  /**
   * 获取存储健康状态
   */
  async getHealth(): Promise<StorageHealth> {
    const localStorage = await this.checkLocalStorageHealth()
    const remoteStorage = this.isOnline ? await this.checkRemoteStorageHealth() : false

    return {
      localStorage,
      remoteStorage,
      lastHealthCheck: new Date().toISOString(),
    }
  }

  // 受保护的方法
  protected abstract getEntityType(): string

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  protected async getLocalEntities(): Promise<T[]> {
    try {
      const stored = localStorage.getItem(this.getLocalStorageKey())
      if (!stored) return []

      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []

      return parsed.filter((entity) => this.validateEntity(entity))
    } catch (error) {
      console.error('Failed to get local entities:', error)
      return []
    }
  }

  protected async saveLocalEntities(entities: T[]): Promise<void> {
    try {
      localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(entities))
    } catch (error) {
      console.error('Failed to save local entities:', error)
      throw error
    }
  }

  protected async saveLocalEntity(entity: T): Promise<void> {
    const entities = await this.getLocalEntities()
    const existingIndex = entities.findIndex((e) => e.id === entity.id)

    if (existingIndex >= 0) {
      entities[existingIndex] = entity
    } else {
      entities.push(entity)
    }

    await this.saveLocalEntities(entities)
  }

  protected queueSyncOperation(
    type: SyncOperation['type'],
    entityType: SyncOperation['entityType'],
    entityId: string,
    data?: unknown
  ): void {
    const operation: SyncOperation = {
      id: this.generateId(),
      type,
      entityType: entityType as SyncOperation['entityType'],
      entityId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.options.maxRetries,
    }

    this.syncQueue.operations.push(operation)
  }

  protected async processSyncQueue(): Promise<void> {
    if (this.syncQueue.isProcessing || !this.isOnline) {
      return
    }

    this.syncQueue.isProcessing = true

    try {
      const operations = this.syncQueue.operations.splice(0, this.options.batchSize)

      for (const operation of operations) {
        try {
          await this.processSyncOperation(operation)
        } catch (error) {
          console.error('Sync operation failed:', error)
          operation.retryCount++

          if (operation.retryCount < operation.maxRetries) {
            this.syncQueue.operations.unshift(operation) // 重新排队
          }
        }
      }
    } finally {
      this.syncQueue.isProcessing = false
      this.syncQueue.lastProcessedTime = new Date().toISOString()
    }
  }

  protected async processSyncOperation(operation: SyncOperation): Promise<void> {
    // 子类可以重写此方法来处理特定的同步逻辑
    switch (operation.type) {
      case 'create':
        await this.createRemoteEntity(operation.data)
        break
      case 'update':
        await this.updateRemoteEntity(operation.entityId, operation.data)
        break
      case 'delete':
        await this.deleteRemoteEntity(operation.entityId)
        break
    }
  }

  protected async performFullSync(): Promise<SyncResult> {
    // 实现完整同步逻辑
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: [],
      errors: [],
    }

    try {
      // 1. 获取本地和远程数据
      const localEntities = await this.getLocalEntities()
      const remoteResult = await this.getRemoteEntities()

      if (!remoteResult.success) {
        result.success = false
        result.errors.push({
          id: 'remote',
          error: remoteResult.error || 'Failed to fetch remote data',
        })
        return result
      }

      const remoteEntities = remoteResult.data || []

      // 2. 检测冲突并解决
      const conflicts = this.detectConflicts(localEntities, remoteEntities)
      result.conflicts = conflicts

      // 3. 应用冲突解决策略
      const resolvedEntities = await this.resolveConflicts(conflicts)

      // 4. 更新本地数据
      await this.saveLocalEntities(resolvedEntities)

      result.syncedCount = resolvedEntities.length
      result.success = true
    } catch (error) {
      result.success = false
      result.errors.push({
        id: 'sync',
        error: error instanceof Error ? error.message : 'Unknown sync error',
      })
    }

    return result
  }

  protected detectConflicts(localEntities: T[], remoteEntities: T[]): ConflictResolution<T>[] {
    const conflicts: ConflictResolution<T>[] = []

    // 简化的冲突检测逻辑
    for (const localEntity of localEntities) {
      const remoteEntity = remoteEntities.find((r) => r.id === localEntity.id)

      if (remoteEntity && localEntity.updatedAt !== remoteEntity.updatedAt) {
        conflicts.push({
          localData: localEntity,
          remoteData: remoteEntity,
          strategy: this.options.conflictResolution,
        })
      }
    }

    return conflicts
  }

  protected async resolveConflicts(conflicts: ConflictResolution<T>[]): Promise<T[]> {
    // 简化的冲突解决逻辑
    const resolved: T[] = []

    for (const conflict of conflicts) {
      switch (conflict.strategy) {
        case 'local-wins':
          resolved.push(conflict.localData)
          break
        case 'remote-wins':
          resolved.push(conflict.remoteData)
          break
        case 'merge': {
          // 智能合并策略：优先使用最新的数据，但保留重要的本地更改
          const localTime = new Date(conflict.localData.updatedAt).getTime()
          const remoteTime = new Date(conflict.remoteData.updatedAt).getTime()

          // 如果时间差小于5分钟，优先使用本地数据（可能是用户正在编辑）
          const timeDiff = Math.abs(localTime - remoteTime)
          if (timeDiff < 5 * 60 * 1000) {
            // 5分钟
            resolved.push(conflict.localData)
          } else {
            // 否则使用最新的数据
            resolved.push(localTime > remoteTime ? conflict.localData : conflict.remoteData)
          }
          break
        }
        default:
          // 默认策略：优先使用本地数据（离线优先原则）
          resolved.push(conflict.localData)
      }
    }

    return resolved
  }

  protected async checkLocalStorageHealth(): Promise<boolean> {
    try {
      const testKey = `${this.getLocalStorageKey()}_health_check`
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  protected async checkRemoteStorageHealth(): Promise<boolean> {
    try {
      const result = await this.getRemoteEntities()
      return result.success
    } catch {
      return false
    }
  }

  protected setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      if (this.options.enableAutoSync) {
        this.processSyncQueue()
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  protected setupAutoSync(): void {
    if (this.options.enableAutoSync && this.options.syncInterval > 0) {
      this.syncTimer = setInterval(
        () => {
          if (this.isOnline) {
            this.processSyncQueue()
          }
        },
        this.options.syncInterval * 60 * 1000
      )
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
  }
}
