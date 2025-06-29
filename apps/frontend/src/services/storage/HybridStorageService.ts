/**
 * 混合存储服务
 * 统一管理所有数据类型的双重存储（本地优先 + 云端同步）
 */

import type {
  DataExportOptions,
  DataImportResult,
  StorageConfig,
  StorageHealth,
  SyncStatus,
} from '@shared/types'

import { AIAnalysisStorageService } from './AIAnalysisStorageService'
import type { HybridStorageOptions, SyncResult } from './BaseHybridStorageService'
import { LocalStorageService } from './LocalStorageService'
import { RemoteStorageService } from './RemoteStorageService'
import { UserSettingsStorageService } from './UserSettingsStorageService'

export interface HybridStorageServices {
  todos: LocalStorageService | RemoteStorageService
  userSettings: UserSettingsStorageService
  aiAnalyses: AIAnalysisStorageService
}

export interface ExportedData {
  todos?: unknown
  userSettings?: unknown
  aiAnalyses?: unknown
  metadata: {
    exportedAt: string
    version: string
    userId?: string
    storageMode: string
  }
}

export class HybridStorageService {
  private services: HybridStorageServices
  private config: StorageConfig
  private syncStatus: SyncStatus
  private userId?: string
  private isInitialized = false

  constructor(config: StorageConfig) {
    this.config = config
    this.syncStatus = {
      syncInProgress: false,
      pendingChanges: 0,
      conflictsCount: 0,
    }

    // 初始化存储服务
    this.services = this.initializeServices()
  }

  /**
   * 初始化存储服务
   */
  private initializeServices(): HybridStorageServices {
    const hybridOptions: Partial<HybridStorageOptions> = {
      enableAutoSync: this.config.autoSync,
      syncInterval: this.config.syncInterval,
      conflictResolution: this.config.conflictResolution,
      maxRetries: 3,
      batchSize: 10,
    }

    return {
      todos: new LocalStorageService(),
      userSettings: new UserSettingsStorageService(this.userId, hybridOptions),
      aiAnalyses: new AIAnalysisStorageService(this.userId, hybridOptions),
    }
  }

  /**
   * 设置用户ID（登录后调用）
   */
  async setUserId(userId: string): Promise<void> {
    this.userId = userId

    // 更新所有服务的用户ID
    this.services.userSettings.setUserId(userId)
    this.services.aiAnalyses.setUserId(userId)

    // 如果启用混合存储，切换到远程服务
    if (this.config.mode === 'hybrid') {
      this.services.todos = new RemoteStorageService()
    }

    this.isInitialized = true
  }

  /**
   * 更新存储配置
   */
  async updateConfig(newConfig: Partial<StorageConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig }

    // 重新初始化服务
    this.services = this.initializeServices()

    if (this.userId) {
      await this.setUserId(this.userId)
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): StorageConfig {
    return { ...this.config }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  /**
   * 获取存储服务
   */
  getServices(): HybridStorageServices {
    return this.services
  }

  /**
   * 手动同步所有数据
   */
  async syncAll(): Promise<SyncResult> {
    if (this.syncStatus.syncInProgress) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: [{ id: 'sync', error: 'Sync already in progress' }],
      }
    }

    this.syncStatus.syncInProgress = true
    this.syncStatus.syncError = undefined

    try {
      const results: SyncResult[] = []

      // 同步用户设置
      if (this.config.mode !== 'local') {
        const userSettingsResult = await this.services.userSettings.sync()
        results.push(userSettingsResult)

        // 同步AI分析
        const aiAnalysesResult = await this.services.aiAnalyses.sync()
        results.push(aiAnalysesResult)

        // 同步Todos（如果使用远程服务）
        if (this.services.todos instanceof RemoteStorageService) {
          const todosResult = await this.services.todos.syncData()
          if (todosResult.success) {
            results.push({
              success: true,
              syncedCount: 1,
              failedCount: 0,
              conflicts: [],
              errors: [],
            })
          } else {
            results.push({
              success: false,
              syncedCount: 0,
              failedCount: 1,
              conflicts: [],
              errors: [{ id: 'todos', error: todosResult.error || 'Sync failed' }],
            })
          }
        }
      }

      // 合并结果
      const combinedResult: SyncResult = {
        success: results.every((r) => r.success),
        syncedCount: results.reduce((sum, r) => sum + r.syncedCount, 0),
        failedCount: results.reduce((sum, r) => sum + r.failedCount, 0),
        conflicts: results.flatMap((r) => r.conflicts),
        errors: results.flatMap((r) => r.errors),
      }

      // 只有在实际有数据变化时才更新同步时间
      if (combinedResult.syncedCount > 0) {
        this.syncStatus.lastSyncTime = new Date().toISOString()
      }
      this.syncStatus.conflictsCount = combinedResult.conflicts.length

      return combinedResult
    } catch (error) {
      console.error('Sync failed:', error)
      this.syncStatus.syncError = error instanceof Error ? error.message : 'Unknown sync error'

      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        conflicts: [],
        errors: [{ id: 'sync', error: this.syncStatus.syncError }],
      }
    } finally {
      this.syncStatus.syncInProgress = false
    }
  }

  /**
   * 获取存储健康状态
   */
  async getHealth(): Promise<StorageHealth> {
    const healthChecks = await Promise.allSettled([
      this.services.userSettings.getHealth(),
      this.services.aiAnalyses.getHealth(),
    ])

    const userSettingsHealth = healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : null
    const aiAnalysesHealth = healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : null

    return {
      localStorage: (userSettingsHealth?.localStorage && aiAnalysesHealth?.localStorage) || false,
      remoteStorage:
        (userSettingsHealth?.remoteStorage && aiAnalysesHealth?.remoteStorage) || false,
      lastHealthCheck: new Date().toISOString(),
    }
  }

  /**
   * 导出所有数据
   */
  async exportAllData(options: DataExportOptions): Promise<ExportedData> {
    const exportData: Partial<ExportedData> = {}

    try {
      if (options.includeTodos) {
        const todosResult = await this.services.todos.exportData()
        if (todosResult.success) {
          exportData.todos = todosResult.data
        }
      }

      if (options.includeSettings) {
        const settingsResult = await this.services.userSettings.getUserSettings()
        if (settingsResult.success) {
          exportData.userSettings = settingsResult.data
        }
      }

      if (options.includeAIAnalysis) {
        const analysesResult = await this.services.aiAnalyses.getUserAnalyses()
        if (analysesResult.success) {
          exportData.aiAnalyses = analysesResult.data
        }
      }

      // 添加元数据
      exportData.metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        userId: this.userId,
        storageMode: this.config.mode,
      }

      return exportData as ExportedData
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }

  /**
   * 导入所有数据
   */
  async importAllData(data: ExportedData): Promise<DataImportResult> {
    const result: DataImportResult = {
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
    }

    try {
      // 导入Todos
      if (data.todos && Array.isArray(data.todos)) {
        const importResult = await this.services.todos.importData(data.todos)
        if (importResult.success) {
          result.importedCount += importResult.successCount
        } else {
          result.errorCount += importResult.failureCount
          result.errors.push(
            ...importResult.errors.map((e) => ({ type: 'todo', message: e.error }))
          )
        }
      }

      // 导入用户设置
      if (data.userSettings && Array.isArray(data.userSettings)) {
        for (const setting of data.userSettings) {
          const settingResult = await this.services.userSettings.setSetting(
            setting.key,
            setting.value
          )
          if (settingResult.success) {
            result.importedCount++
          } else {
            result.errorCount++
            result.errors.push({
              type: 'setting',
              message: settingResult.error || 'Failed to import setting',
            })
          }
        }
      }

      // 导入AI分析
      if (data.aiAnalyses && Array.isArray(data.aiAnalyses)) {
        const batchResult = await this.services.aiAnalyses.batchCreateAnalyses(data.aiAnalyses)
        if (batchResult.success && batchResult.data) {
          result.importedCount += batchResult.data.length
        } else {
          result.errorCount++
          result.errors.push({
            type: 'ai_analysis',
            message: batchResult.error || 'Failed to import AI analyses',
          })
        }
      }

      result.success = result.errorCount === 0
    } catch (error) {
      result.success = false
      result.errorCount++
      result.errors.push({
        type: 'import',
        message: error instanceof Error ? error.message : 'Unknown import error',
      })
    }

    return result
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 清理所有服务
    if (this.services.userSettings) {
      this.services.userSettings.destroy()
    }
    if (this.services.aiAnalyses) {
      this.services.aiAnalyses.destroy()
    }
  }
}
