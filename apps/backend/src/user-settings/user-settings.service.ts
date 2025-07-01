import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { UserSetting } from '@shared/types'
import { PrismaService } from '../database/prisma.service'
import { CreateUserSettingDto } from './dto/create-user-setting.dto'
import { UpdateUserSettingDto } from './dto/update-user-setting.dto'

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createDto: CreateUserSettingDto): Promise<UserSetting> {
    // 检查是否已存在相同的键
    const existingSetting = await this.prisma.userSetting.findUnique({
      where: {
        userId_key: {
          userId,
          key: createDto.key,
        },
      },
    })

    if (existingSetting) {
      throw new ConflictException(`Setting with key '${createDto.key}' already exists`)
    }

    const setting = await this.prisma.userSetting.create({
      data: {
        userId,
        key: createDto.key,
        value: createDto.value,
      },
    })

    return this.mapPrismaSettingToUserSetting(setting)
  }

  async findAll(userId: string): Promise<UserSetting[]> {
    const settings = await this.prisma.userSetting.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return settings.map(this.mapPrismaSettingToUserSetting)
  }

  async findByKey(userId: string, key: string): Promise<UserSetting> {
    const setting = await this.prisma.userSetting.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    })

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`)
    }

    return this.mapPrismaSettingToUserSetting(setting)
  }

  async update(userId: string, id: string, updateDto: UpdateUserSettingDto): Promise<UserSetting> {
    // 验证设置是否存在且属于用户
    const existingSetting = await this.prisma.userSetting.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingSetting) {
      throw new NotFoundException('Setting not found')
    }

    const setting = await this.prisma.userSetting.update({
      where: { id },
      data: {
        value: updateDto.value,
        updatedAt: new Date(),
      },
    })

    return this.mapPrismaSettingToUserSetting(setting)
  }

  async remove(userId: string, id: string): Promise<void> {
    // 验证设置是否存在且属于用户
    const existingSetting = await this.prisma.userSetting.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingSetting) {
      throw new NotFoundException('Setting not found')
    }

    await this.prisma.userSetting.delete({
      where: { id },
    })
  }

  async setBatch(userId: string, settings: Record<string, string>): Promise<UserSetting[]> {
    const results: UserSetting[] = []

    // 使用事务批量处理设置
    await this.prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(settings)) {
        const setting = await tx.userSetting.upsert({
          where: {
            userId_key: {
              userId,
              key,
            },
          },
          update: {
            value,
            updatedAt: new Date(),
          },
          create: {
            userId,
            key,
            value,
          },
        })

        results.push(this.mapPrismaSettingToUserSetting(setting))
      }
    })

    return results
  }

  async initializeDefaultSettings(userId: string): Promise<void> {
    const defaultSettings = {
      theme: 'auto',
      language: 'zh-CN',
      notifications_enabled: 'true',
      auto_sync: 'true',
    }

    await this.setBatch(userId, defaultSettings)
  }

  private mapPrismaSettingToUserSetting(prismaSetting: any): UserSetting {
    return {
      id: prismaSetting.id,
      userId: prismaSetting.userId,
      key: prismaSetting.key,
      value: prismaSetting.value,
      createdAt: prismaSetting.createdAt.toISOString(),
      updatedAt: prismaSetting.updatedAt.toISOString(),
    }
  }
}
