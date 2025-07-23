import { Injectable } from '@nestjs/common'
import type { UserPreferences } from '@shared/types'
import { UtilsService } from '../common/services/utils.service'
import { PrismaService } from '../database/prisma.service'

export interface UpdateUserPreferencesDto {
  theme?: string
  language?: string
  aiEnabled?: boolean
  autoAnalyze?: boolean
  priorityAnalysis?: boolean
  timeEstimation?: boolean
  subtaskSplitting?: boolean
  aiModel?: string
  aiTemperature?: number
  aiMaxTokens?: number
  searchLanguage?: string
  safeSearch?: boolean
  defaultResultCount?: number
  searchEngine?: string
  searchRegion?: string
  desktopNotifications?: boolean
  emailNotifications?: boolean
  dueReminder?: boolean
  reminderMinutes?: number
  storageMode?: string
  autoSync?: boolean
  syncInterval?: number
  offlineMode?: boolean
  conflictResolution?: string
  retryAttempts?: number
  requestTimeout?: number
}

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService
  ) {}

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    })

    return preferences ? this.mapPrismaPreferencesToUserPreferences(preferences) : null
  }

  async createDefault(userId: string): Promise<UserPreferences> {
    const preferences = await this.prisma.userPreferences.create({
      data: {
        id: this.utilsService.generateId(),
        userId,
      },
    })

    return this.mapPrismaPreferencesToUserPreferences(preferences)
  }

  async update(userId: string, updateDto: UpdateUserPreferencesDto): Promise<UserPreferences> {
    const existingPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    })

    if (!existingPreferences) {
      // 如果偏好设置不存在，先创建默认设置
      await this.createDefault(userId)
    }

    const preferences = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...updateDto,
        updatedAt: new Date(),
      },
      create: {
        id: this.utilsService.generateId(),
        userId,
        ...updateDto,
      },
    })

    return this.mapPrismaPreferencesToUserPreferences(preferences)
  }

  async updateTheme(userId: string, theme: string): Promise<UserPreferences> {
    return this.update(userId, { theme })
  }

  async updateLanguage(userId: string, language: string): Promise<UserPreferences> {
    return this.update(userId, { language })
  }

  async updateAIConfig(
    userId: string,
    aiConfig: Partial<UpdateUserPreferencesDto>
  ): Promise<UserPreferences> {
    const updateData: UpdateUserPreferencesDto = {}

    if (aiConfig.aiEnabled !== undefined) updateData.aiEnabled = aiConfig.aiEnabled
    if (aiConfig.autoAnalyze !== undefined) updateData.autoAnalyze = aiConfig.autoAnalyze
    if (aiConfig.priorityAnalysis !== undefined)
      updateData.priorityAnalysis = aiConfig.priorityAnalysis
    if (aiConfig.timeEstimation !== undefined) updateData.timeEstimation = aiConfig.timeEstimation
    if (aiConfig.subtaskSplitting !== undefined)
      updateData.subtaskSplitting = aiConfig.subtaskSplitting
    if (aiConfig.aiModel !== undefined) updateData.aiModel = aiConfig.aiModel
    if (aiConfig.aiTemperature !== undefined) updateData.aiTemperature = aiConfig.aiTemperature
    if (aiConfig.aiMaxTokens !== undefined) updateData.aiMaxTokens = aiConfig.aiMaxTokens

    return this.update(userId, updateData)
  }

  async updateStorageConfig(
    userId: string,
    storageConfig: Partial<UpdateUserPreferencesDto>
  ): Promise<UserPreferences> {
    const updateData: UpdateUserPreferencesDto = {}

    if (storageConfig.storageMode !== undefined) updateData.storageMode = storageConfig.storageMode
    if (storageConfig.autoSync !== undefined) updateData.autoSync = storageConfig.autoSync
    if (storageConfig.syncInterval !== undefined)
      updateData.syncInterval = storageConfig.syncInterval
    if (storageConfig.offlineMode !== undefined) updateData.offlineMode = storageConfig.offlineMode
    if (storageConfig.conflictResolution !== undefined)
      updateData.conflictResolution = storageConfig.conflictResolution
    if (storageConfig.retryAttempts !== undefined)
      updateData.retryAttempts = storageConfig.retryAttempts
    if (storageConfig.requestTimeout !== undefined)
      updateData.requestTimeout = storageConfig.requestTimeout

    return this.update(userId, updateData)
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
