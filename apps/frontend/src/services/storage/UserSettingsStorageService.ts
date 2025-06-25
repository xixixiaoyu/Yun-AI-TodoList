/**
 * 用户设置存储服务
 * 支持本地存储和云端同步的用户设置管理
 */

import type { UserSetting, CreateUserSettingDto, UpdateUserSettingDto } from '@shared/types'
import { httpClient } from '../api'
import {
  BaseHybridStorageService,
  type HybridStorageResult,
  type HybridStorageOptions,
} from './BaseHybridStorageService'

export class UserSettingsStorageService extends BaseHybridStorageService<UserSetting> {
  private readonly baseUrl = '/api/v1/user-settings'
  private userId?: string

  constructor(userId?: string, options?: Partial<HybridStorageOptions>) {
    super(options)
    this.userId = userId
  }

  /**
   * 设置用户ID（登录后调用）
   */
  setUserId(userId: string): void {
    this.userId = userId
  }

  /**
   * 获取用户设置（按键名）
   */
  async getSetting(key: string): Promise<HybridStorageResult<UserSetting>> {
    try {
      const allSettings = await this.getLocalEntities()
      const setting = allSettings.find((s) => s.key === key && s.userId === this.userId)

      if (!setting) {
        return {
          success: false,
          error: 'Setting not found',
        }
      }

      return {
        success: true,
        data: setting,
        fromCache: true,
      }
    } catch (error) {
      console.error('Failed to get setting:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 设置用户配置
   */
  async setSetting(key: string, value: string): Promise<HybridStorageResult<UserSetting>> {
    try {
      const allSettings = await this.getLocalEntities()
      const existingSetting = allSettings.find((s) => s.key === key && s.userId === this.userId)

      if (existingSetting) {
        // 更新现有设置
        return this.update(existingSetting.id, { value })
      } else {
        // 创建新设置
        const createDto: CreateUserSettingDto = { key, value }
        return this.create(createDto)
      }
    } catch (error) {
      console.error('Failed to set setting:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取用户的所有设置
   */
  async getUserSettings(): Promise<HybridStorageResult<UserSetting[]>> {
    try {
      const allSettings = await this.getLocalEntities()
      const userSettings = allSettings.filter((s) => s.userId === this.userId)

      return {
        success: true,
        data: userSettings,
        fromCache: true,
      }
    } catch (error) {
      console.error('Failed to get user settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 批量设置用户配置
   */
  async setSettings(settings: Record<string, string>): Promise<HybridStorageResult<UserSetting[]>> {
    try {
      const results: UserSetting[] = []

      for (const [key, value] of Object.entries(settings)) {
        const result = await this.setSetting(key, value)
        if (result.success && result.data) {
          results.push(result.data)
        }
      }

      return {
        success: true,
        data: results,
      }
    } catch (error) {
      console.error('Failed to set settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 删除用户设置
   */
  async deleteSetting(key: string): Promise<HybridStorageResult<void>> {
    try {
      const allSettings = await this.getLocalEntities()
      const setting = allSettings.find((s) => s.key === key && s.userId === this.userId)

      if (!setting) {
        return {
          success: false,
          error: 'Setting not found',
        }
      }

      return this.delete(setting.id)
    } catch (error) {
      console.error('Failed to delete setting:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // 实现抽象方法
  protected getLocalStorageKey(): string {
    return 'user_settings'
  }

  protected getEntityType(): string {
    return 'user_setting'
  }

  protected validateEntity(entity: unknown): entity is UserSetting {
    return (
      typeof entity === 'object' &&
      entity !== null &&
      typeof entity.id === 'string' &&
      typeof entity.userId === 'string' &&
      typeof entity.key === 'string' &&
      typeof entity.value === 'string' &&
      typeof entity.createdAt === 'string' &&
      typeof entity.updatedAt === 'string'
    )
  }

  protected async createRemoteEntity(
    entity: UserSetting
  ): Promise<HybridStorageResult<UserSetting>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const createDto: CreateUserSettingDto = {
        key: entity.key,
        value: entity.value,
      }

      const remoteSetting = await httpClient.post<UserSetting>(this.baseUrl, createDto)

      // 更新本地实体的同步状态
      await this.markAsSynced(entity.id, remoteSetting.id)

      return {
        success: true,
        data: remoteSetting,
      }
    } catch (error: unknown) {
      console.error('Failed to create remote setting:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected async updateRemoteEntity(
    id: string,
    updates: Partial<UserSetting>
  ): Promise<HybridStorageResult<UserSetting>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const updateDto: UpdateUserSettingDto = {
        value: updates.value ?? '',
      }

      const remoteSetting = await httpClient.patch<UserSetting>(`${this.baseUrl}/${id}`, updateDto)

      // 更新本地实体的同步状态
      await this.markAsSynced(id)

      return {
        success: true,
        data: remoteSetting,
      }
    } catch (error: unknown) {
      console.error('Failed to update remote setting:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected async deleteRemoteEntity(id: string): Promise<HybridStorageResult<void>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      await httpClient.delete(`${this.baseUrl}/${id}`)

      return {
        success: true,
      }
    } catch (error: unknown) {
      console.error('Failed to delete remote setting:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected async getRemoteEntities(): Promise<HybridStorageResult<UserSetting[]>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const settings = await httpClient.get<UserSetting[]>(this.baseUrl)

      return {
        success: true,
        data: settings || [],
      }
    } catch (error: unknown) {
      console.error('Failed to fetch remote settings:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  protected async getRemoteEntity(id: string): Promise<HybridStorageResult<UserSetting>> {
    try {
      if (!this.isOnline) {
        return {
          success: false,
          error: 'Network unavailable',
        }
      }

      const setting = await httpClient.get<UserSetting>(`${this.baseUrl}/${id}`)

      return {
        success: true,
        data: setting,
      }
    } catch (error: unknown) {
      console.error('Failed to fetch remote setting:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  // 辅助方法
  private async markAsSynced(localId: string, remoteId?: string): Promise<void> {
    try {
      const entities = await this.getLocalEntities()
      const entityIndex = entities.findIndex((e) => e.id === localId)

      if (entityIndex >= 0) {
        entities[entityIndex] = {
          ...entities[entityIndex],
          id: remoteId || entities[entityIndex].id, // 使用远程ID（如果有）
          synced: true,
          lastSyncTime: new Date().toISOString(),
          syncError: undefined,
        }

        await this.saveLocalEntities(entities)
      }
    } catch (error) {
      console.error('Failed to mark entity as synced:', error)
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }
    if (error?.message) {
      return error.message
    }
    return 'Network request failed'
  }
}
