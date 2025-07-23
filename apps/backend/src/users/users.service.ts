import { Injectable } from '@nestjs/common'
import type { CreateUserDto, UpdateUserDto, User } from '@shared/types'
import { UtilsService } from '../common/services/utils.service'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService
  ) {}

  async create(
    createUserDto: CreateUserDto & { emailVerified?: boolean; googleId?: string; githubId?: string }
  ): Promise<User> {
    try {
      const prismaUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          username: createUserDto.username,
          password: createUserDto.password,
          emailVerified: createUserDto.emailVerified ?? false,
          accountStatus: 'active',
        },
        include: {
          preferences: true,
        },
      })

      return this.mapPrismaUserToUser(prismaUser)
    } catch (error) {
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          preferences: true,
        },
      })

      return prismaUser ? this.mapPrismaUserToUser(prismaUser) : null
    } catch (error) {
      return null
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { email },
        include: {
          preferences: true,
        },
      })

      return prismaUser ? this.mapPrismaUserToUser(prismaUser) : null
    } catch (error) {
      return null
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { username },
        include: {
          preferences: true,
        },
      })

      return prismaUser ? this.mapPrismaUserToUser(prismaUser) : null
    } catch (error) {
      return null
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      // 分离 preferences 和其他字段
      const { preferences, ...userData } = updateUserDto

      const prismaUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...userData,
          // 如果有 preferences 更新，使用 upsert 操作
          ...(preferences && {
            preferences: {
              upsert: {
                create: preferences,
                update: preferences,
              },
            },
          }),
        },
        include: {
          preferences: true,
        },
      })

      return this.mapPrismaUserToUser(prismaUser)
    } catch (error) {
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          accountStatus: 'deleted',
        },
      })
    } catch (error) {
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async updateLastActiveTime(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          lastActiveAt: new Date(),
        },
      })
    } catch (error) {
      // 不抛出错误，因为这不是关键操作
    }
  }

  private mapPrismaUserToUser(prismaUser: any): User {
    const prefs = prismaUser.preferences || {}

    return {
      id: prismaUser.id,
      email: prismaUser.email,
      username: prismaUser.username,
      password: prismaUser.password,
      avatarUrl: prismaUser.avatarUrl,
      emailVerified: prismaUser.emailVerified ?? false,
      preferences: {
        theme: prefs.theme || 'light',
        language: prefs.language || 'zh-CN',
        aiConfig: {
          enabled: prefs.aiEnabled ?? true,
          autoAnalyze: prefs.autoAnalyze ?? true,
          priorityAnalysis: prefs.priorityAnalysis ?? true,
          timeEstimation: prefs.timeEstimation ?? true,
          subtaskSplitting: prefs.subtaskSplitting ?? true,
          modelConfig: {
            model: prefs.aiModel || 'deepseek-chat',
            temperature: prefs.aiTemperature ?? 0.3,
            maxTokens: prefs.aiMaxTokens || 1000,
          },
        },
        searchConfig: {
          defaultLanguage: prefs.searchLanguage || 'zh-CN',
          safeSearch: prefs.safeSearch ?? true,
          defaultResultCount: prefs.defaultResultCount || 10,
          engineConfig: {
            engine: prefs.searchEngine || 'google',
            region: prefs.searchRegion || 'CN',
          },
        },
        notifications: {
          desktop: prefs.desktopNotifications ?? true,
          email: prefs.emailNotifications ?? false,
          dueReminder: prefs.dueReminder ?? true,
          reminderMinutes: prefs.reminderMinutes || 30,
        },
        storageConfig: {
          mode: prefs.storageMode || 'hybrid',
          autoSync: prefs.autoSync ?? true,
          syncInterval: prefs.syncInterval || 5,
          offlineMode: prefs.offlineMode ?? true,
          conflictResolution: prefs.conflictResolution || 'merge',
          retryAttempts: prefs.retryAttempts || 3,
          requestTimeout: prefs.requestTimeout || 10000,
        },
      },
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt.toISOString(),
    }
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      throw new Error(
        `Failed to update password: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    // 暂时禁用 OAuth 功能以修复 Prisma 客户端问题
    return null
  }

  async linkGoogleAccount(userId: string, googleId: string, avatarUrl?: string): Promise<User> {
    // 暂时禁用 OAuth 功能以修复 Prisma 客户端问题
    throw new Error('OAuth functionality temporarily disabled')
  }

  async findByGitHubId(githubId: string): Promise<User | null> {
    // 暂时禁用 OAuth 功能以修复 Prisma 客户端问题
    return null
  }

  async linkGitHubAccount(userId: string, githubId: string, avatarUrl?: string): Promise<User> {
    // 暂时禁用 OAuth 功能以修复 Prisma 客户端问题
    throw new Error('OAuth functionality temporarily disabled')
  }
}
