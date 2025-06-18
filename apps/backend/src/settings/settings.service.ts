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

    // 更新用户偏好设置
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        theme: updatedPreferences.theme,
        language: updatedPreferences.language,
        aiConfig: JSON.stringify(updatedPreferences.aiConfig),
        searchConfig: JSON.stringify(updatedPreferences.searchConfig),
        notifications: JSON.stringify(updatedPreferences.notifications),
        updatedAt: new Date(),
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

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        theme: defaultPreferences.theme,
        language: defaultPreferences.language,
        aiConfig: JSON.stringify(defaultPreferences.aiConfig),
        searchConfig: JSON.stringify(defaultPreferences.searchConfig),
        notifications: JSON.stringify(defaultPreferences.notifications),
        updatedAt: new Date(),
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

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        theme: validatedPreferences.theme,
        language: validatedPreferences.language,
        aiConfig: JSON.stringify(validatedPreferences.aiConfig),
        searchConfig: JSON.stringify(validatedPreferences.searchConfig),
        notifications: JSON.stringify(validatedPreferences.notifications),
        updatedAt: new Date(),
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
        modelConfig: {
          model: 'deepseek-chat',
          temperature: 0.7,
          maxTokens: 1000,
        },
      },
      searchConfig: {
        defaultLanguage: 'zh-CN',
        safeSearch: true,
        defaultResultCount: 10,
        saveHistory: true,
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
    }
  }
}
