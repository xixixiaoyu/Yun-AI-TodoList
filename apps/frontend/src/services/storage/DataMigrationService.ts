/**
 * 数据迁移服务
 * 负责在 localStorage 和 PostgreSQL 之间迁移数据
 */

import type {
  DataMigrationOptions,
  DataImportResult,
  ConflictResolutionStrategy,
} from '@shared/types'

import { LocalStorageService } from './LocalStorageService'
import { RemoteStorageService } from './RemoteStorageService'
import { UserSettingsStorageService } from './UserSettingsStorageService'
import { AIAnalysisStorageService } from './AIAnalysisStorageService'

export interface MigrationProgress {
  stage: 'todos' | 'settings' | 'ai_analyses' | 'complete'
  current: number
  total: number
  percentage: number
  message: string
}

export interface MigrationResult extends DataImportResult {
  migrationId: string
  startTime: string
  endTime?: string
  progress: MigrationProgress[]
}

export class DataMigrationService {
  private userId?: string
  private onProgress?: (progress: MigrationProgress) => void

  constructor(userId?: string) {
    this.userId = userId
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: (progress: MigrationProgress) => void): void {
    this.onProgress = callback
  }

  /**
   * 从本地存储迁移到云端
   */
  async migrateToCloud(
    options: DataMigrationOptions = {
      migrateFromLocal: true,
      migrateToLocal: false,
      preserveLocalData: true,
      mergeStrategy: 'ask-user',
    }
  ): Promise<MigrationResult> {
    const migrationId = this.generateMigrationId()
    const result: MigrationResult = {
      migrationId,
      startTime: new Date().toISOString(),
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      progress: [],
    }

    if (!this.userId) {
      result.success = false
      result.errorCount = 1
      result.errors.push({ type: 'auth', message: 'User not authenticated' })
      return result
    }

    try {
      // 1. 迁移 Todos
      await this.reportProgress({
        stage: 'todos',
        current: 0,
        total: 1,
        percentage: 0,
        message: 'Starting todos migration...',
      })

      const todosResult = await this.migrateTodosToCloud(options.mergeStrategy)
      result.importedCount += todosResult.importedCount
      result.errorCount += todosResult.errorCount
      result.errors.push(...todosResult.errors)

      await this.reportProgress({
        stage: 'todos',
        current: 1,
        total: 1,
        percentage: 33,
        message: `Migrated ${todosResult.importedCount} todos`,
      })

      // 2. 迁移用户设置
      await this.reportProgress({
        stage: 'settings',
        current: 0,
        total: 1,
        percentage: 33,
        message: 'Starting settings migration...',
      })

      const settingsResult = await this.migrateUserSettingsToCloud(options.mergeStrategy)
      result.importedCount += settingsResult.importedCount
      result.errorCount += settingsResult.errorCount
      result.errors.push(...settingsResult.errors)

      await this.reportProgress({
        stage: 'settings',
        current: 1,
        total: 1,
        percentage: 66,
        message: `Migrated ${settingsResult.importedCount} settings`,
      })

      // 3. 迁移 AI 分析
      await this.reportProgress({
        stage: 'ai_analyses',
        current: 0,
        total: 1,
        percentage: 66,
        message: 'Starting AI analyses migration...',
      })

      const aiResult = await this.migrateAIAnalysesToCloud(options.mergeStrategy)
      result.importedCount += aiResult.importedCount
      result.errorCount += aiResult.errorCount
      result.errors.push(...aiResult.errors)

      await this.reportProgress({
        stage: 'ai_analyses',
        current: 1,
        total: 1,
        percentage: 100,
        message: `Migrated ${aiResult.importedCount} AI analyses`,
      })

      // 4. 清理本地数据（如果不保留）
      if (!options.preserveLocalData) {
        await this.clearLocalData()
      }

      result.success = result.errorCount === 0

      await this.reportProgress({
        stage: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
        message: result.success
          ? 'Migration completed successfully'
          : 'Migration completed with errors',
      })
    } catch (error) {
      result.success = false
      result.errorCount++
      result.errors.push({
        type: 'migration',
        message: error instanceof Error ? error.message : 'Unknown migration error',
      })
    } finally {
      result.endTime = new Date().toISOString()
    }

    return result
  }

  /**
   * 从云端迁移到本地存储
   */
  async migrateToLocal(
    options: DataMigrationOptions = {
      migrateFromLocal: false,
      migrateToLocal: true,
      preserveLocalData: true,
      mergeStrategy: 'ask-user',
    }
  ): Promise<MigrationResult> {
    const migrationId = this.generateMigrationId()
    const result: MigrationResult = {
      migrationId,
      startTime: new Date().toISOString(),
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      progress: [],
    }

    if (!this.userId) {
      result.success = false
      result.errorCount = 1
      result.errors.push({ type: 'auth', message: 'User not authenticated' })
      return result
    }

    try {
      // 1. 迁移 Todos
      await this.reportProgress({
        stage: 'todos',
        current: 0,
        total: 1,
        percentage: 0,
        message: 'Starting todos migration from cloud...',
      })

      const todosResult = await this.migrateTodosToLocal(options.mergeStrategy)
      result.importedCount += todosResult.importedCount
      result.errorCount += todosResult.errorCount
      result.errors.push(...todosResult.errors)

      await this.reportProgress({
        stage: 'todos',
        current: 1,
        total: 1,
        percentage: 33,
        message: `Downloaded ${todosResult.importedCount} todos`,
      })

      // 2. 迁移用户设置
      await this.reportProgress({
        stage: 'settings',
        current: 0,
        total: 1,
        percentage: 33,
        message: 'Starting settings migration from cloud...',
      })

      const settingsResult = await this.migrateUserSettingsToLocal(options.mergeStrategy)
      result.importedCount += settingsResult.importedCount
      result.errorCount += settingsResult.errorCount
      result.errors.push(...settingsResult.errors)

      await this.reportProgress({
        stage: 'settings',
        current: 1,
        total: 1,
        percentage: 66,
        message: `Downloaded ${settingsResult.importedCount} settings`,
      })

      // 3. 迁移 AI 分析
      await this.reportProgress({
        stage: 'ai_analyses',
        current: 0,
        total: 1,
        percentage: 66,
        message: 'Starting AI analyses migration from cloud...',
      })

      const aiResult = await this.migrateAIAnalysesToLocal(options.mergeStrategy)
      result.importedCount += aiResult.importedCount
      result.errorCount += aiResult.errorCount
      result.errors.push(...aiResult.errors)

      result.success = result.errorCount === 0

      await this.reportProgress({
        stage: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
        message: result.success
          ? 'Migration completed successfully'
          : 'Migration completed with errors',
      })
    } catch (error) {
      result.success = false
      result.errorCount++
      result.errors.push({
        type: 'migration',
        message: error instanceof Error ? error.message : 'Unknown migration error',
      })
    } finally {
      result.endTime = new Date().toISOString()
    }

    return result
  }

  /**
   * 双向同步（合并本地和云端数据）
   */
  async syncBidirectional(
    strategy: ConflictResolutionStrategy = 'merge'
  ): Promise<MigrationResult> {
    const migrationId = this.generateMigrationId()
    const result: MigrationResult = {
      migrationId,
      startTime: new Date().toISOString(),
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      progress: [],
    }

    if (!this.userId) {
      result.success = false
      result.errorCount = 1
      result.errors.push({ type: 'auth', message: 'User not authenticated' })
      return result
    }

    try {
      await this.reportProgress({
        stage: 'todos',
        current: 0,
        total: 1,
        percentage: 0,
        message: 'Starting bidirectional sync...',
      })

      // 实现双向同步逻辑
      // 这里可以扩展更复杂的合并策略
      const toCloudResult = await this.migrateToCloud({
        migrateFromLocal: true,
        migrateToLocal: false,
        preserveLocalData: true,
        mergeStrategy: strategy,
      })

      const toLocalResult = await this.migrateToLocal({
        migrateFromLocal: false,
        migrateToLocal: true,
        preserveLocalData: true,
        mergeStrategy: strategy,
      })

      result.importedCount = toCloudResult.importedCount + toLocalResult.importedCount
      result.errorCount = toCloudResult.errorCount + toLocalResult.errorCount
      result.errors = [...toCloudResult.errors, ...toLocalResult.errors]
      result.success = result.errorCount === 0

      await this.reportProgress({
        stage: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
        message: 'Bidirectional sync completed',
      })
    } catch (error) {
      result.success = false
      result.errorCount++
      result.errors.push({
        type: 'sync',
        message: error instanceof Error ? error.message : 'Unknown sync error',
      })
    } finally {
      result.endTime = new Date().toISOString()
    }

    return result
  }

  // 私有方法
  private async migrateTodosToCloud(
    _strategy: ConflictResolutionStrategy
  ): Promise<DataImportResult> {
    const localService = new LocalStorageService()
    const remoteService = new RemoteStorageService()

    const localResult = await localService.exportData()
    if (!localResult.success || !localResult.data) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errorCount: 1,
        errors: [{ type: 'export', message: 'Failed to export local todos' }],
      }
    }

    return remoteService.importData(localResult.data)
  }

  private async migrateTodosToLocal(
    _strategy: ConflictResolutionStrategy
  ): Promise<DataImportResult> {
    const localService = new LocalStorageService()
    const remoteService = new RemoteStorageService()

    const remoteResult = await remoteService.exportData()
    if (!remoteResult.success || !remoteResult.data) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errorCount: 1,
        errors: [{ type: 'export', message: 'Failed to export remote todos' }],
      }
    }

    return localService.importData(remoteResult.data)
  }

  private async migrateUserSettingsToCloud(
    _strategy: ConflictResolutionStrategy
  ): Promise<DataImportResult> {
    // 用户设置迁移逻辑
    const service = new UserSettingsStorageService(this.userId)
    const syncResult = await service.sync()

    return {
      success: syncResult.success,
      importedCount: syncResult.successCount,
      skippedCount: 0,
      errorCount: syncResult.failureCount,
      errors: syncResult.errors.map((e) => ({ type: 'setting', message: e.error })),
    }
  }

  private async migrateUserSettingsToLocal(
    _strategy: ConflictResolutionStrategy
  ): Promise<DataImportResult> {
    // 从云端下载用户设置到本地
    const service = new UserSettingsStorageService(this.userId)
    const syncResult = await service.sync()

    return {
      success: syncResult.success,
      importedCount: syncResult.successCount,
      skippedCount: 0,
      errorCount: syncResult.failureCount,
      errors: syncResult.errors.map((e) => ({ type: 'setting', message: e.error })),
    }
  }

  private async migrateAIAnalysesToCloud(
    _strategy: ConflictResolutionStrategy
  ): Promise<DataImportResult> {
    // AI分析迁移逻辑
    const service = new AIAnalysisStorageService(this.userId)
    const syncResult = await service.sync()

    return {
      success: syncResult.success,
      importedCount: syncResult.successCount,
      skippedCount: 0,
      errorCount: syncResult.failureCount,
      errors: syncResult.errors.map((e) => ({ type: 'ai_analysis', message: e.error })),
    }
  }

  private async migrateAIAnalysesToLocal(
    _strategy: ConflictResolutionStrategy
  ): Promise<DataImportResult> {
    // 从云端下载AI分析到本地
    const service = new AIAnalysisStorageService(this.userId)
    const syncResult = await service.sync()

    return {
      success: syncResult.success,
      importedCount: syncResult.successCount,
      skippedCount: 0,
      errorCount: syncResult.failureCount,
      errors: syncResult.errors.map((e) => ({ type: 'ai_analysis', message: e.error })),
    }
  }

  private async clearLocalData(): Promise<void> {
    try {
      const localService = new LocalStorageService()
      await localService.clearAll()

      // 清理用户设置和AI分析的本地数据
      localStorage.removeItem('user_settings')
      localStorage.removeItem('ai_analyses')
    } catch (error) {
      console.error('Failed to clear local data:', error)
    }
  }

  private async reportProgress(progress: MigrationProgress): Promise<void> {
    if (this.onProgress) {
      this.onProgress(progress)
    }
  }

  private generateMigrationId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
