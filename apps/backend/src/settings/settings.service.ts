import { Injectable, NotFoundException } from '@nestjs/common'
import type { UserPreferences } from '@shared/types'
import { PrismaService } from '../database/prisma.service'
import { UsersService } from '../users/users.service'
import { UpdatePreferencesDto } from './dto/update-preferences.dto'

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}

  async getPreferences(userId: string): Promise<UserPreferences> {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return user.preferences
  }

  async updatePreferences(
    userId: string,
    updateDto: UpdatePreferencesDto
  ): Promise<UserPreferences> {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 合并现有偏好设置和新设置
    const updatedPreferences = this.mergePreferences(user.preferences, updateDto)

    // 更新用户偏好设置 - 使用 UserPreferences 表
    await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        theme: updatedPreferences.theme,
        language: updatedPreferences.language,
        aiEnabled: updatedPreferences.aiConfig.enabled,
        autoAnalyze: updatedPreferences.aiConfig.autoAnalyze,
        priorityAnalysis: updatedPreferences.aiConfig.priorityAnalysis,
        timeEstimation: updatedPreferences.aiConfig.timeEstimation,
        subtaskSplitting: updatedPreferences.aiConfig.subtaskSplitting,
        aiModel: updatedPreferences.aiConfig.modelConfig.model,
        aiTemperature: updatedPreferences.aiConfig.modelConfig.temperature,
        aiMaxTokens: updatedPreferences.aiConfig.modelConfig.maxTokens,
        searchLanguage: updatedPreferences.searchConfig.defaultLanguage,
        safeSearch: updatedPreferences.searchConfig.safeSearch,
        defaultResultCount: updatedPreferences.searchConfig.defaultResultCount,
        searchEngine: updatedPreferences.searchConfig.engineConfig.engine,
        searchRegion: updatedPreferences.searchConfig.engineConfig.region,
        desktopNotifications: updatedPreferences.notifications.desktop,
        emailNotifications: updatedPreferences.notifications.email,
        dueReminder: updatedPreferences.notifications.dueReminder,
        reminderMinutes: updatedPreferences.notifications.reminderMinutes,
        storageMode: updatedPreferences.storageConfig.mode,
        autoSync: updatedPreferences.storageConfig.autoSync || true,
        syncInterval: updatedPreferences.storageConfig.syncInterval || 5,
        offlineMode: updatedPreferences.storageConfig.offlineMode || true,
        conflictResolution: updatedPreferences.storageConfig.conflictResolution || 'merge',
        retryAttempts: updatedPreferences.storageConfig.retryAttempts,
        requestTimeout: updatedPreferences.storageConfig.requestTimeout,
        updatedAt: new Date(),
      },
      create: {
        userId,
        theme: updatedPreferences.theme,
        language: updatedPreferences.language,
        aiEnabled: updatedPreferences.aiConfig.enabled,
        autoAnalyze: updatedPreferences.aiConfig.autoAnalyze,
        priorityAnalysis: updatedPreferences.aiConfig.priorityAnalysis,
        timeEstimation: updatedPreferences.aiConfig.timeEstimation,
        subtaskSplitting: updatedPreferences.aiConfig.subtaskSplitting,
        aiModel: updatedPreferences.aiConfig.modelConfig.model,
        aiTemperature: updatedPreferences.aiConfig.modelConfig.temperature,
        aiMaxTokens: updatedPreferences.aiConfig.modelConfig.maxTokens,
        searchLanguage: updatedPreferences.searchConfig.defaultLanguage,
        safeSearch: updatedPreferences.searchConfig.safeSearch,
        defaultResultCount: updatedPreferences.searchConfig.defaultResultCount,
        searchEngine: updatedPreferences.searchConfig.engineConfig.engine,
        searchRegion: updatedPreferences.searchConfig.engineConfig.region,
        desktopNotifications: updatedPreferences.notifications.desktop,
        emailNotifications: updatedPreferences.notifications.email,
        dueReminder: updatedPreferences.notifications.dueReminder,
        reminderMinutes: updatedPreferences.notifications.reminderMinutes,
        storageMode: updatedPreferences.storageConfig.mode,
        autoSync: updatedPreferences.storageConfig.autoSync || true,
        syncInterval: updatedPreferences.storageConfig.syncInterval || 5,
        offlineMode: updatedPreferences.storageConfig.offlineMode || true,
        conflictResolution: updatedPreferences.storageConfig.conflictResolution || 'merge',
        retryAttempts: updatedPreferences.storageConfig.retryAttempts,
        requestTimeout: updatedPreferences.storageConfig.requestTimeout,
      },
    })

    return updatedPreferences
  }

  async resetPreferences(userId: string): Promise<UserPreferences> {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 重置为默认偏好设置
    const defaultPreferences = this.getDefaultPreferences()

    await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        theme: defaultPreferences.theme,
        language: defaultPreferences.language,
        aiEnabled: defaultPreferences.aiConfig.enabled,
        autoAnalyze: defaultPreferences.aiConfig.autoAnalyze,
        priorityAnalysis: defaultPreferences.aiConfig.priorityAnalysis,
        timeEstimation: defaultPreferences.aiConfig.timeEstimation,
        subtaskSplitting: defaultPreferences.aiConfig.subtaskSplitting,
        aiModel: defaultPreferences.aiConfig.modelConfig.model,
        aiTemperature: defaultPreferences.aiConfig.modelConfig.temperature,
        aiMaxTokens: defaultPreferences.aiConfig.modelConfig.maxTokens,
        searchLanguage: defaultPreferences.searchConfig.defaultLanguage,
        safeSearch: defaultPreferences.searchConfig.safeSearch,
        defaultResultCount: defaultPreferences.searchConfig.defaultResultCount,
        searchEngine: defaultPreferences.searchConfig.engineConfig.engine,
        searchRegion: defaultPreferences.searchConfig.engineConfig.region,
        desktopNotifications: defaultPreferences.notifications.desktop,
        emailNotifications: defaultPreferences.notifications.email,
        dueReminder: defaultPreferences.notifications.dueReminder,
        reminderMinutes: defaultPreferences.notifications.reminderMinutes,
        storageMode: defaultPreferences.storageConfig.mode,
        autoSync: defaultPreferences.storageConfig.autoSync || true,
        syncInterval: defaultPreferences.storageConfig.syncInterval || 5,
        offlineMode: defaultPreferences.storageConfig.offlineMode || true,
        conflictResolution: defaultPreferences.storageConfig.conflictResolution || 'merge',
        retryAttempts: defaultPreferences.storageConfig.retryAttempts,
        requestTimeout: defaultPreferences.storageConfig.requestTimeout,
        updatedAt: new Date(),
      },
      create: {
        userId,
        theme: defaultPreferences.theme,
        language: defaultPreferences.language,
        aiEnabled: defaultPreferences.aiConfig.enabled,
        autoAnalyze: defaultPreferences.aiConfig.autoAnalyze,
        priorityAnalysis: defaultPreferences.aiConfig.priorityAnalysis,
        timeEstimation: defaultPreferences.aiConfig.timeEstimation,
        subtaskSplitting: defaultPreferences.aiConfig.subtaskSplitting,
        aiModel: defaultPreferences.aiConfig.modelConfig.model,
        aiTemperature: defaultPreferences.aiConfig.modelConfig.temperature,
        aiMaxTokens: defaultPreferences.aiConfig.modelConfig.maxTokens,
        searchLanguage: defaultPreferences.searchConfig.defaultLanguage,
        safeSearch: defaultPreferences.searchConfig.safeSearch,
        defaultResultCount: defaultPreferences.searchConfig.defaultResultCount,
        searchEngine: defaultPreferences.searchConfig.engineConfig.engine,
        searchRegion: defaultPreferences.searchConfig.engineConfig.region,
        desktopNotifications: defaultPreferences.notifications.desktop,
        emailNotifications: defaultPreferences.notifications.email,
        dueReminder: defaultPreferences.notifications.dueReminder,
        reminderMinutes: defaultPreferences.notifications.reminderMinutes,
        storageMode: defaultPreferences.storageConfig.mode,
        autoSync: defaultPreferences.storageConfig.autoSync || true,
        syncInterval: defaultPreferences.storageConfig.syncInterval || 5,
        offlineMode: defaultPreferences.storageConfig.offlineMode || true,
        conflictResolution: defaultPreferences.storageConfig.conflictResolution || 'merge',
        retryAttempts: defaultPreferences.storageConfig.retryAttempts,
        requestTimeout: defaultPreferences.storageConfig.requestTimeout,
      },
    })

    return defaultPreferences
  }

  async exportPreferences(
    userId: string
  ): Promise<{ preferences: UserPreferences; exportedAt: string }> {
    const preferences = await this.getPreferences(userId)

    return {
      preferences,
      exportedAt: new Date().toISOString(),
    }
  }

  async importPreferences(userId: string, preferences: UserPreferences): Promise<UserPreferences> {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 验证导入的偏好设置格式
    const validatedPreferences = this.validatePreferences(preferences)

    await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        theme: validatedPreferences.theme,
        language: validatedPreferences.language,
        aiEnabled: validatedPreferences.aiConfig.enabled,
        autoAnalyze: validatedPreferences.aiConfig.autoAnalyze,
        priorityAnalysis: validatedPreferences.aiConfig.priorityAnalysis,
        timeEstimation: validatedPreferences.aiConfig.timeEstimation,
        subtaskSplitting: validatedPreferences.aiConfig.subtaskSplitting,
        aiModel: validatedPreferences.aiConfig.modelConfig.model,
        aiTemperature: validatedPreferences.aiConfig.modelConfig.temperature,
        aiMaxTokens: validatedPreferences.aiConfig.modelConfig.maxTokens,
        searchLanguage: validatedPreferences.searchConfig.defaultLanguage,
        safeSearch: validatedPreferences.searchConfig.safeSearch,
        defaultResultCount: validatedPreferences.searchConfig.defaultResultCount,
        searchEngine: validatedPreferences.searchConfig.engineConfig.engine,
        searchRegion: validatedPreferences.searchConfig.engineConfig.region,
        desktopNotifications: validatedPreferences.notifications.desktop,
        emailNotifications: validatedPreferences.notifications.email,
        dueReminder: validatedPreferences.notifications.dueReminder,
        reminderMinutes: validatedPreferences.notifications.reminderMinutes,
        storageMode: validatedPreferences.storageConfig.mode,
        autoSync: validatedPreferences.storageConfig.autoSync || true,
        syncInterval: validatedPreferences.storageConfig.syncInterval || 5,
        offlineMode: validatedPreferences.storageConfig.offlineMode || true,
        conflictResolution: validatedPreferences.storageConfig.conflictResolution || 'merge',
        retryAttempts: validatedPreferences.storageConfig.retryAttempts,
        requestTimeout: validatedPreferences.storageConfig.requestTimeout,
        updatedAt: new Date(),
      },
      create: {
        userId,
        theme: validatedPreferences.theme,
        language: validatedPreferences.language,
        aiEnabled: validatedPreferences.aiConfig.enabled,
        autoAnalyze: validatedPreferences.aiConfig.autoAnalyze,
        priorityAnalysis: validatedPreferences.aiConfig.priorityAnalysis,
        timeEstimation: validatedPreferences.aiConfig.timeEstimation,
        subtaskSplitting: validatedPreferences.aiConfig.subtaskSplitting,
        aiModel: validatedPreferences.aiConfig.modelConfig.model,
        aiTemperature: validatedPreferences.aiConfig.modelConfig.temperature,
        aiMaxTokens: validatedPreferences.aiConfig.modelConfig.maxTokens,
        searchLanguage: validatedPreferences.searchConfig.defaultLanguage,
        safeSearch: validatedPreferences.searchConfig.safeSearch,
        defaultResultCount: validatedPreferences.searchConfig.defaultResultCount,
        searchEngine: validatedPreferences.searchConfig.engineConfig.engine,
        searchRegion: validatedPreferences.searchConfig.engineConfig.region,
        desktopNotifications: validatedPreferences.notifications.desktop,
        emailNotifications: validatedPreferences.notifications.email,
        dueReminder: validatedPreferences.notifications.dueReminder,
        reminderMinutes: validatedPreferences.notifications.reminderMinutes,
        storageMode: validatedPreferences.storageConfig.mode,
        autoSync: validatedPreferences.storageConfig.autoSync || true,
        syncInterval: validatedPreferences.storageConfig.syncInterval || 5,
        offlineMode: validatedPreferences.storageConfig.offlineMode || true,
        conflictResolution: validatedPreferences.storageConfig.conflictResolution || 'merge',
        retryAttempts: validatedPreferences.storageConfig.retryAttempts,
        requestTimeout: validatedPreferences.storageConfig.requestTimeout,
      },
    })

    return validatedPreferences
  }

  private mergePreferences(
    current: UserPreferences,
    updates: UpdatePreferencesDto
  ): UserPreferences {
    return {
      theme: updates.theme || current.theme,
      language: updates.language || current.language,
      aiConfig: {
        ...current.aiConfig,
        ...updates.aiConfig,
        modelConfig: {
          ...current.aiConfig.modelConfig,
          ...(updates.aiConfig?.modelConfig || {}),
        },
      },
      searchConfig: {
        ...current.searchConfig,
        ...updates.searchConfig,
        engineConfig: {
          ...current.searchConfig.engineConfig,
          ...(updates.searchConfig?.engineConfig || {}),
        },
      },
      notifications: {
        ...current.notifications,
        ...updates.notifications,
      },
      storageConfig: {
        ...current.storageConfig,
        ...(updates.storageConfig || {}),
      },
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      language: 'zh-CN',
      aiConfig: {
        enabled: true,
        autoAnalyze: true,
        priorityAnalysis: true,
        timeEstimation: true,
        subtaskSplitting: true,
        modelConfig: {
          model: 'deepseek-chat',
          temperature: 0.3,
          maxTokens: 1000,
        },
      },
      searchConfig: {
        defaultLanguage: 'zh-CN',
        safeSearch: true,
        defaultResultCount: 10,
        engineConfig: {
          engine: 'google',
          region: 'CN',
        },
      },
      notifications: {
        desktop: true,
        email: false,
        dueReminder: true,
        reminderMinutes: 30,
      },
      storageConfig: {
        mode: 'cloud', // 默认云端存储模式
        retryAttempts: 3, // 默认重试3次
        requestTimeout: 10000, // 默认超时10秒
        autoSync: true, // 默认启用自动同步
        syncInterval: 5, // 5分钟自动同步
        offlineMode: true, // 默认启用离线模式
        conflictResolution: 'merge', // 默认自动合并冲突
      },
    }
  }

  private validatePreferences(preferences: any): UserPreferences {
    const defaultPreferences = this.getDefaultPreferences()

    // 基本验证和默认值填充
    return {
      theme: preferences.theme || defaultPreferences.theme,
      language: preferences.language || defaultPreferences.language,
      aiConfig: {
        ...defaultPreferences.aiConfig,
        ...(preferences.aiConfig || {}),
      },
      searchConfig: {
        ...defaultPreferences.searchConfig,
        ...(preferences.searchConfig || {}),
      },
      notifications: {
        ...defaultPreferences.notifications,
        ...(preferences.notifications || {}),
      },
      storageConfig: {
        ...defaultPreferences.storageConfig,
        ...(preferences.storageConfig || {}),
      },
    }
  }
}
