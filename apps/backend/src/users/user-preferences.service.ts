import { Injectable, Logger } from '@nestjs/common'
import type { UserPreferences } from '@shared/types'
import { UtilsService } from '../common/services/utils.service'
import { PrismaService } from '../database/prisma.service'
import {
  AIConfigDto,
  NotificationConfigDto,
  SearchConfigDto,
  StorageConfigDto,
  ThemePreferencesDto,
  UpdateUserPreferencesDto,
} from './dto/user-preferences.dto'

/**
 * 用户偏好设置服务
 * 按功能分组管理用户的各种偏好设置
 */

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService
  ) {}

  // ==========================================
  // 基础 CRUD 操作
  // ==========================================

  /**
   * 根据用户ID查找偏好设置
   */
  async findByUserId(userId: string): Promise<UserPreferences | null> {
    try {
      this.logger.debug(`查找用户偏好设置: ${userId}`)

      const preferences = await this.prisma.userPreferences.findUnique({
        where: { userId },
      })

      if (!preferences) {
        this.logger.debug(`用户 ${userId} 的偏好设置不存在`)
        return null
      }

      return this.mapPrismaPreferencesToUserPreferences(preferences)
    } catch (error) {
      this.logger.error(`查找用户偏好设置失败: ${userId}`, error)
      throw error
    }
  }

  /**
   * 为用户创建默认偏好设置
   */
  async createDefault(userId: string): Promise<UserPreferences> {
    try {
      this.logger.debug(`为用户创建默认偏好设置: ${userId}`)

      const preferences = await this.prisma.userPreferences.create({
        data: {
          id: this.utilsService.generateId(),
          userId,
        },
      })

      this.logger.log(`成功为用户 ${userId} 创建默认偏好设置`)
      return this.mapPrismaPreferencesToUserPreferences(preferences)
    } catch (error) {
      this.logger.error(`创建默认偏好设置失败: ${userId}`, error)
      throw error
    }
  }

  /**
   * 确保用户有偏好设置（如果不存在则创建）
   */
  async ensureUserPreferences(userId: string): Promise<UserPreferences> {
    const existing = await this.findByUserId(userId)
    if (existing) {
      return existing
    }
    return this.createDefault(userId)
  }

  // ==========================================
  // 主题和语言偏好设置
  // ==========================================

  /**
   * 更新主题设置
   */
  async updateTheme(userId: string, theme: string): Promise<UserPreferences> {
    try {
      this.logger.debug(`更新用户主题设置: ${userId} -> ${theme}`)

      const preferences = await this.updatePreferences(userId, { theme })

      this.logger.log(`成功更新用户 ${userId} 的主题设置为 ${theme}`)
      return preferences
    } catch (error) {
      this.logger.error(`更新主题设置失败: ${userId}`, error)
      throw error
    }
  }

  /**
   * 更新语言设置
   */
  async updateLanguage(userId: string, language: string): Promise<UserPreferences> {
    try {
      this.logger.debug(`更新用户语言设置: ${userId} -> ${language}`)

      const preferences = await this.updatePreferences(userId, { language })

      this.logger.log(`成功更新用户 ${userId} 的语言设置为 ${language}`)
      return preferences
    } catch (error) {
      this.logger.error(`更新语言设置失败: ${userId}`, error)
      throw error
    }
  }

  /**
   * 批量更新主题和语言设置
   */
  async updateThemeAndLanguage(
    userId: string,
    themePrefs: ThemePreferencesDto
  ): Promise<UserPreferences> {
    try {
      this.logger.debug(`批量更新用户主题和语言设置: ${userId}`, themePrefs)

      const updateData: any = {}
      if (themePrefs.theme !== undefined) updateData.theme = themePrefs.theme
      if (themePrefs.language !== undefined) updateData.language = themePrefs.language

      const preferences = await this.updatePreferences(userId, updateData)

      this.logger.log(`成功批量更新用户 ${userId} 的主题和语言设置`)
      return preferences
    } catch (error) {
      this.logger.error(`批量更新主题和语言设置失败: ${userId}`, error)
      throw error
    }
  }

  // ==========================================
  // AI 配置管理
  // ==========================================

  /**
   * 更新 AI 配置
   */
  async updateAIConfig(userId: string, aiConfig: AIConfigDto): Promise<UserPreferences> {
    try {
      this.logger.debug(`更新用户 AI 配置: ${userId}`, aiConfig)

      const updateData: any = {}
      if (aiConfig.enabled !== undefined) updateData.aiEnabled = aiConfig.enabled
      if (aiConfig.autoAnalyze !== undefined) updateData.autoAnalyze = aiConfig.autoAnalyze
      if (aiConfig.priorityAnalysis !== undefined)
        updateData.priorityAnalysis = aiConfig.priorityAnalysis
      if (aiConfig.timeEstimation !== undefined) updateData.timeEstimation = aiConfig.timeEstimation
      if (aiConfig.subtaskSplitting !== undefined)
        updateData.subtaskSplitting = aiConfig.subtaskSplitting
      if (aiConfig.model !== undefined) updateData.aiModel = aiConfig.model
      if (aiConfig.temperature !== undefined) updateData.aiTemperature = aiConfig.temperature
      if (aiConfig.maxTokens !== undefined) updateData.aiMaxTokens = aiConfig.maxTokens

      const preferences = await this.updatePreferences(userId, updateData)

      this.logger.log(`成功更新用户 ${userId} 的 AI 配置`)
      return preferences
    } catch (error) {
      this.logger.error(`更新 AI 配置失败: ${userId}`, error)
      throw error
    }
  }

  // ==========================================
  // 搜索配置管理
  // ==========================================

  /**
   * 更新搜索配置
   */
  async updateSearchConfig(
    userId: string,
    searchConfig: SearchConfigDto
  ): Promise<UserPreferences> {
    try {
      this.logger.debug(`更新用户搜索配置: ${userId}`, searchConfig)

      const updateData: any = {}
      if (searchConfig.defaultLanguage !== undefined)
        updateData.searchLanguage = searchConfig.defaultLanguage
      if (searchConfig.safeSearch !== undefined) updateData.safeSearch = searchConfig.safeSearch
      if (searchConfig.defaultResultCount !== undefined)
        updateData.defaultResultCount = searchConfig.defaultResultCount
      if (searchConfig.engine !== undefined) updateData.searchEngine = searchConfig.engine
      if (searchConfig.region !== undefined) updateData.searchRegion = searchConfig.region

      const preferences = await this.updatePreferences(userId, updateData)

      this.logger.log(`成功更新用户 ${userId} 的搜索配置`)
      return preferences
    } catch (error) {
      this.logger.error(`更新搜索配置失败: ${userId}`, error)
      throw error
    }
  }

  // ==========================================
  // 通知配置管理
  // ==========================================

  /**
   * 更新通知配置
   */
  async updateNotificationConfig(
    userId: string,
    notificationConfig: NotificationConfigDto
  ): Promise<UserPreferences> {
    try {
      this.logger.debug(`更新用户通知配置: ${userId}`, notificationConfig)

      const updateData: any = {}
      if (notificationConfig.desktop !== undefined)
        updateData.desktopNotifications = notificationConfig.desktop
      if (notificationConfig.email !== undefined)
        updateData.emailNotifications = notificationConfig.email
      if (notificationConfig.dueReminder !== undefined)
        updateData.dueReminder = notificationConfig.dueReminder
      if (notificationConfig.reminderMinutes !== undefined)
        updateData.reminderMinutes = notificationConfig.reminderMinutes

      const preferences = await this.updatePreferences(userId, updateData)

      this.logger.log(`成功更新用户 ${userId} 的通知配置`)
      return preferences
    } catch (error) {
      this.logger.error(`更新通知配置失败: ${userId}`, error)
      throw error
    }
  }

  // ==========================================
  // 存储配置管理
  // ==========================================

  /**
   * 更新存储配置
   */
  async updateStorageConfig(
    userId: string,
    storageConfig: StorageConfigDto
  ): Promise<UserPreferences> {
    try {
      this.logger.debug(`更新用户存储配置: ${userId}`, storageConfig)

      const updateData: any = {}
      if (storageConfig.mode !== undefined) updateData.storageMode = storageConfig.mode
      if (storageConfig.autoSync !== undefined) updateData.autoSync = storageConfig.autoSync
      if (storageConfig.syncInterval !== undefined)
        updateData.syncInterval = storageConfig.syncInterval
      if (storageConfig.offlineMode !== undefined)
        updateData.offlineMode = storageConfig.offlineMode
      if (storageConfig.conflictResolution !== undefined)
        updateData.conflictResolution = storageConfig.conflictResolution
      if (storageConfig.retryAttempts !== undefined)
        updateData.retryAttempts = storageConfig.retryAttempts
      if (storageConfig.requestTimeout !== undefined)
        updateData.requestTimeout = storageConfig.requestTimeout

      const preferences = await this.updatePreferences(userId, updateData)

      this.logger.log(`成功更新用户 ${userId} 的存储配置`)
      return preferences
    } catch (error) {
      this.logger.error(`更新存储配置失败: ${userId}`, error)
      throw error
    }
  }

  // ==========================================
  // 批量更新方法
  // ==========================================

  /**
   * 批量更新用户偏好设置
   */
  async updateBulkPreferences(
    userId: string,
    updateDto: UpdateUserPreferencesDto
  ): Promise<UserPreferences> {
    try {
      this.logger.debug(`批量更新用户偏好设置: ${userId}`, updateDto)

      const updateData: any = {}

      // 主题和语言
      if (updateDto.theme?.theme !== undefined) updateData.theme = updateDto.theme.theme
      if (updateDto.theme?.language !== undefined) updateData.language = updateDto.theme.language

      // AI 配置
      if (updateDto.ai?.enabled !== undefined) updateData.aiEnabled = updateDto.ai.enabled
      if (updateDto.ai?.autoAnalyze !== undefined) updateData.autoAnalyze = updateDto.ai.autoAnalyze
      if (updateDto.ai?.priorityAnalysis !== undefined)
        updateData.priorityAnalysis = updateDto.ai.priorityAnalysis
      if (updateDto.ai?.timeEstimation !== undefined)
        updateData.timeEstimation = updateDto.ai.timeEstimation
      if (updateDto.ai?.subtaskSplitting !== undefined)
        updateData.subtaskSplitting = updateDto.ai.subtaskSplitting
      if (updateDto.ai?.model !== undefined) updateData.aiModel = updateDto.ai.model
      if (updateDto.ai?.temperature !== undefined)
        updateData.aiTemperature = updateDto.ai.temperature
      if (updateDto.ai?.maxTokens !== undefined) updateData.aiMaxTokens = updateDto.ai.maxTokens

      // 搜索配置
      if (updateDto.search?.defaultLanguage !== undefined)
        updateData.searchLanguage = updateDto.search.defaultLanguage
      if (updateDto.search?.safeSearch !== undefined)
        updateData.safeSearch = updateDto.search.safeSearch
      if (updateDto.search?.defaultResultCount !== undefined)
        updateData.defaultResultCount = updateDto.search.defaultResultCount
      if (updateDto.search?.engine !== undefined) updateData.searchEngine = updateDto.search.engine
      if (updateDto.search?.region !== undefined) updateData.searchRegion = updateDto.search.region

      // 通知配置
      if (updateDto.notifications?.desktop !== undefined)
        updateData.desktopNotifications = updateDto.notifications.desktop
      if (updateDto.notifications?.email !== undefined)
        updateData.emailNotifications = updateDto.notifications.email
      if (updateDto.notifications?.dueReminder !== undefined)
        updateData.dueReminder = updateDto.notifications.dueReminder
      if (updateDto.notifications?.reminderMinutes !== undefined)
        updateData.reminderMinutes = updateDto.notifications.reminderMinutes

      // 存储配置
      if (updateDto.storage?.mode !== undefined) updateData.storageMode = updateDto.storage.mode
      if (updateDto.storage?.autoSync !== undefined)
        updateData.autoSync = updateDto.storage.autoSync
      if (updateDto.storage?.syncInterval !== undefined)
        updateData.syncInterval = updateDto.storage.syncInterval
      if (updateDto.storage?.offlineMode !== undefined)
        updateData.offlineMode = updateDto.storage.offlineMode
      if (updateDto.storage?.conflictResolution !== undefined)
        updateData.conflictResolution = updateDto.storage.conflictResolution
      if (updateDto.storage?.retryAttempts !== undefined)
        updateData.retryAttempts = updateDto.storage.retryAttempts
      if (updateDto.storage?.requestTimeout !== undefined)
        updateData.requestTimeout = updateDto.storage.requestTimeout

      const preferences = await this.updatePreferences(userId, updateData)

      this.logger.log(`成功批量更新用户 ${userId} 的偏好设置`)
      return preferences
    } catch (error) {
      this.logger.error(`批量更新偏好设置失败: ${userId}`, error)
      throw error
    }
  }

  // ==========================================
  // 核心更新方法
  // ==========================================

  /**
   * 核心的偏好设置更新方法
   */
  private async updatePreferences(userId: string, updateData: any): Promise<UserPreferences> {
    const preferences = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
      create: {
        id: this.utilsService.generateId(),
        userId,
        ...updateData,
      },
    })

    return this.mapPrismaPreferencesToUserPreferences(preferences)
  }

  private mapPrismaPreferencesToUserPreferences(prismaPrefs: any): UserPreferences {
    return {
      theme: prismaPrefs.theme,
      language: prismaPrefs.language,
      aiConfig: {
        enabled: prismaPrefs.aiEnabled,
        autoAnalyze: prismaPrefs.autoAnalyze,
        priorityAnalysis: prismaPrefs.priorityAnalysis,
        timeEstimation: prismaPrefs.timeEstimation,
        subtaskSplitting: prismaPrefs.subtaskSplitting,
        modelConfig: {
          model: prismaPrefs.aiModel,
          temperature: prismaPrefs.aiTemperature,
          maxTokens: prismaPrefs.aiMaxTokens,
        },
      },
      searchConfig: {
        defaultLanguage: prismaPrefs.searchLanguage,
        safeSearch: prismaPrefs.safeSearch,
        defaultResultCount: prismaPrefs.defaultResultCount,
        engineConfig: {
          engine: prismaPrefs.searchEngine,
          region: prismaPrefs.searchRegion,
        },
      },
      notifications: {
        desktop: prismaPrefs.desktopNotifications,
        email: prismaPrefs.emailNotifications,
        dueReminder: prismaPrefs.dueReminder,
        reminderMinutes: prismaPrefs.reminderMinutes,
      },
      storageConfig: {
        mode: prismaPrefs.storageMode,
        autoSync: prismaPrefs.autoSync,
        syncInterval: prismaPrefs.syncInterval,
        offlineMode: prismaPrefs.offlineMode,
        conflictResolution: prismaPrefs.conflictResolution,
        retryAttempts: prismaPrefs.retryAttempts,
        requestTimeout: prismaPrefs.requestTimeout,
      },
    }
  }
}
