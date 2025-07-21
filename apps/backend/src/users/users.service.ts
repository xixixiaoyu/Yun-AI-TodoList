import { Injectable, NotFoundException } from '@nestjs/common'
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
    createUserDto: CreateUserDto & { emailVerified?: boolean; googleId?: string }
  ): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        id: this.utilsService.generateId(),
        email: createUserDto.email.toLowerCase(),
        username: createUserDto.username.toLowerCase(),
        password: createUserDto.password || null,
        googleId: createUserDto.googleId || null,
        avatarUrl: createUserDto.avatarUrl || null,
        emailVerified: createUserDto.emailVerified ?? false,
        lastActiveAt: new Date(),
        preferences: {
          create: {
            id: this.utilsService.generateId(),
          },
        },
      },
      include: {
        preferences: true,
      },
    })

    return this.mapPrismaUserToUser(user)
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null, // 排除软删除的用户
      },
      include: {
        preferences: true,
      },
    })

    return user ? this.mapPrismaUserToUser(user) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
      include: {
        preferences: true,
      },
    })

    return user ? this.mapPrismaUserToUser(user) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
        deletedAt: null,
      },
      include: {
        preferences: true,
      },
    })

    return user ? this.mapPrismaUserToUser(user) : null
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.findById(id)
    if (!existingUser) {
      throw new NotFoundException('用户不存在')
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: updateUserDto.username?.toLowerCase(),
        avatarUrl: updateUserDto.avatarUrl,
        lastActiveAt: new Date(), // 更新最后活跃时间
      },
      include: {
        preferences: true,
      },
    })

    return this.mapPrismaUserToUser(user)
  }

  async delete(id: string): Promise<void> {
    const existingUser = await this.findById(id)
    if (!existingUser) {
      throw new NotFoundException('用户不存在')
    }

    // 软删除用户
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        accountStatus: 'deleted',
      },
    })
  }

  async updateLastActiveTime(id: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        lastActiveAt: new Date(),
      },
    })
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
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        googleId,
        deletedAt: null,
      },
      include: {
        preferences: true,
      },
    })

    return user ? this.mapPrismaUserToUser(user) : null
  }

  async linkGoogleAccount(userId: string, googleId: string, avatarUrl?: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        avatarUrl: avatarUrl || undefined,
        lastActiveAt: new Date(),
      },
      include: {
        preferences: true,
      },
    })

    return this.mapPrismaUserToUser(user)
  }
}
