import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { MailService } from '../mail/mail.service'
import * as crypto from 'crypto'

@Injectable()
export class TempEmailVerificationService {
  private readonly logger = new Logger(TempEmailVerificationService.name)
  private readonly codeStorage = new Map<string, { code: string; expiresAt: Date; type: string }>()

  constructor(private readonly mailService: MailService) {}

  /**
   * 生成 6 位数字验证码
   */
  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString()
  }

  /**
   * 发送验证码（临时版本，不使用数据库）
   */
  async sendVerificationCode(
    email: string,
    type: 'register' | 'login' | 'reset_password',
    username?: string
  ): Promise<void> {
    // 生成验证码
    const code = this.generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期

    // 存储到内存中（临时方案）
    const key = `${email}:${type}`
    this.codeStorage.set(key, { code, expiresAt, type })

    // 发送邮件
    try {
      await this.mailService.sendVerificationCodeEmail(email, code, type, username)
      this.logger.log(`Verification code sent to ${email} for ${type}`)

      // 在开发模式下也输出到日志
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`=== VERIFICATION CODE FOR TESTING ===`)
        this.logger.log(`Email: ${email}`)
        this.logger.log(`Code: ${code}`)
        this.logger.log(`Type: ${type}`)
        this.logger.log(`=== END ===`)
      }
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}:`, error)
      // 删除存储的验证码
      this.codeStorage.delete(key)
      throw new BadRequestException('发送验证码失败，请稍后重试')
    }
  }

  /**
   * 验证验证码（临时版本）
   */
  async verifyCode(
    email: string,
    code: string,
    type: 'register' | 'login' | 'reset_password'
  ): Promise<boolean> {
    const key = `${email}:${type}`
    const stored = this.codeStorage.get(key)

    if (!stored) {
      throw new BadRequestException('验证码不存在或已过期')
    }

    if (stored.expiresAt < new Date()) {
      this.codeStorage.delete(key)
      throw new BadRequestException('验证码已过期')
    }

    if (stored.code !== code) {
      throw new BadRequestException('验证码错误')
    }

    // 验证成功，删除验证码
    this.codeStorage.delete(key)
    return true
  }
}
