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

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        id: this.utilsService.generateId(),
        email: createUserDto.email.toLowerCase(),
        username: createUserDto.username.toLowerCase(),
        password: createUserDto.password,
      },
    })

    return this.mapPrismaUserToUser(user)
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    return user ? this.mapPrismaUserToUser(user) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    return user ? this.mapPrismaUserToUser(user) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
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
        ...updateUserDto,
        updatedAt: new Date(),
      },
    })

    return this.mapPrismaUserToUser(user)
  }

  async delete(id: string): Promise<void> {
    const existingUser = await this.findById(id)
    if (!existingUser) {
      throw new NotFoundException('用户不存在')
    }

    await this.prisma.user.delete({
      where: { id },
    })
  }

  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      username: prismaUser.username,
      password: prismaUser.password,
      avatarUrl: prismaUser.avatarUrl,
      preferences: {
        theme: prismaUser.theme,
        language: prismaUser.language,
        aiConfig: prismaUser.aiConfig,
        searchConfig: prismaUser.searchConfig,
        notifications: prismaUser.notifications,
      },
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt.toISOString(),
    }
  }
}
