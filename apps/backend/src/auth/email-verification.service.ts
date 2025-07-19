import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { MailService } from '../mail/mail.service'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name)
  private readonly CODE_EXPIRY_MINUTES = 10 // 验证码有效期 10 分钟
  private readonly MAX_ATTEMPTS = 5 // 最大尝试次数
  private readonly RATE_LIMIT_MINUTES = 1 // 发送频率限制 1 分钟

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 生成 6 位数字验证码
   */
  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString()
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(
    email: string,
    type: 'register' | 'login' | 'reset_password',
    username?: string
  ): Promise<void> {
    // 检查发送频率限制
    await this.checkRateLimit(email, type)

    // 对于注册类型，检查邮箱是否已存在
    if (type === 'register') {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      })
      if (existingUser) {
        throw new ConflictException('该邮箱已被注册')
      }
    }

    // 对于登录和重置密码类型，检查邮箱是否存在
    if (type === 'login' || type === 'reset_password') {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      })
      if (!existingUser) {
        throw new BadRequestException('该邮箱尚未注册')
      }
    }

    // 生成验证码
    const code = this.generateCode()
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000)

    // 清理该邮箱的旧验证码
    await this.prisma.emailVerificationCode.deleteMany({
      where: {
        email,
        type,
      },
    })

    // 保存新验证码
    await this.prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    })

    // 发送邮件
    try {
      await this.mailService.sendVerificationCodeEmail(email, code, type, username)
      this.logger.log(`Verification code sent to ${email} for ${type}`)
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}:`, error)
      // 如果邮件发送失败，删除已保存的验证码
      await this.prisma.emailVerificationCode.deleteMany({
        where: { email, code, type },
      })
      throw new BadRequestException('发送验证码失败，请稍后重试')
    }
  }

  /**
   * 验证验证码
   */
  async verifyCode(
    email: string,
    code: string,
    type: 'register' | 'login' | 'reset_password'
  ): Promise<boolean> {
    const verificationRecord = await this.prisma.emailVerificationCode.findFirst({
      where: {
        email,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verificationRecord) {
      throw new BadRequestException('验证码不存在或已过期')
    }

    // 检查尝试次数
    if (verificationRecord.attempts >= this.MAX_ATTEMPTS) {
      await this.prisma.emailVerificationCode.update({
        where: { id: verificationRecord.id },
        data: { used: true },
      })
      throw new BadRequestException('验证码尝试次数过多，请重新获取')
    }

    // 增加尝试次数
    await this.prisma.emailVerificationCode.update({
      where: { id: verificationRecord.id },
      data: { attempts: verificationRecord.attempts + 1 },
    })

    // 验证码错误
    if (verificationRecord.code !== code) {
      throw new BadRequestException('验证码错误')
    }

    // 验证成功，标记为已使用
    await this.prisma.emailVerificationCode.update({
      where: { id: verificationRecord.id },
      data: { used: true },
    })

    this.logger.log(`Email verification successful for ${email} (${type})`)
    return true
  }

  /**
   * 检查发送频率限制
   */
  private async checkRateLimit(
    email: string,
    type: 'register' | 'login' | 'reset_password'
  ): Promise<void> {
    const rateLimitTime = new Date(Date.now() - this.RATE_LIMIT_MINUTES * 60 * 1000)

    const recentCode = await this.prisma.emailVerificationCode.findFirst({
      where: {
        email,
        type,
        createdAt: {
          gt: rateLimitTime,
        },
      },
    })

    if (recentCode) {
      throw new BadRequestException(`请等待 ${this.RATE_LIMIT_MINUTES} 分钟后再次发送验证码`)
    }
  }

  /**
   * 清理过期的验证码
   */
  async cleanupExpiredCodes(): Promise<void> {
    const result = await this.prisma.emailVerificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired verification codes`)
    }
  }

  /**
   * 获取验证码统计信息（用于监控）
   */
  async getCodeStats(): Promise<{
    total: number
    active: number
    expired: number
    used: number
  }> {
    const now = new Date()

    const [total, active, expired, used] = await Promise.all([
      this.prisma.emailVerificationCode.count(),
      this.prisma.emailVerificationCode.count({
        where: {
          used: false,
          expiresAt: { gt: now },
        },
      }),
      this.prisma.emailVerificationCode.count({
        where: {
          used: false,
          expiresAt: { lte: now },
        },
      }),
      this.prisma.emailVerificationCode.count({
        where: { used: true },
      }),
    ])

    return { total, active, expired, used }
  }
}
