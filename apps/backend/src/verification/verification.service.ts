import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import * as crypto from 'crypto'
import { MailService } from '../mail/mail.service'

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name)
  private readonly codeStorage = new Map<string, { code: string; expiresAt: Date; type: string }>()

  constructor(private readonly mailService: MailService) {}

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
  ): Promise<{ message: string; code?: string; note?: string }> {
    try {
      // 生成验证码
      const code = this.generateCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期

      // 存储到内存中
      const key = `${email}:${type}`
      this.codeStorage.set(key, { code, expiresAt, type })

      // 发送邮件
      await this.mailService.sendVerificationCodeEmail(email, code, type, username)

      this.logger.log(`Verification code sent to ${email} for ${type}`)

      // 在开发模式下输出验证码到日志
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`=== VERIFICATION CODE FOR TESTING ===`)
        this.logger.log(`Email: ${email}`)
        this.logger.log(`Code: ${code}`)
        this.logger.log(`Type: ${type}`)
        this.logger.log(`Expires: ${expiresAt.toISOString()}`)
        this.logger.log(`=== END ===`)
      }

      return {
        message: '验证码已发送，请查收邮件',
        // 在开发模式下返回验证码用于测试
        ...(process.env.NODE_ENV === 'development' && { code }),
      }
    } catch (error) {
      this.logger.error('发送验证码失败:', error)

      // 在开发模式下，即使发送失败也生成验证码供测试
      if (process.env.NODE_ENV === 'development') {
        const testCode = this.generateCode()
        const key = `${email}:${type}`
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        this.codeStorage.set(key, { code: testCode, expiresAt, type })

        this.logger.log(`=== TEST VERIFICATION CODE (EMAIL FAILED) ===`)
        this.logger.log(`Email: ${email}`)
        this.logger.log(`Code: ${testCode}`)
        this.logger.log(`Type: ${type}`)
        this.logger.log(`Note: Email sending failed, but code generated for testing`)
        this.logger.log(`=== END ===`)

        return {
          message: '邮件发送失败，但已生成测试验证码（请查看后端日志）',
          code: testCode,
          note: '这是开发模式下的测试验证码',
        }
      }

      throw new BadRequestException('发送验证码失败，请稍后重试')
    }
  }

  /**
   * 验证验证码（验证后删除）
   */
  async verifyCode(
    email: string,
    code: string,
    type: 'register' | 'login' | 'reset_password'
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.verifyCodeWithoutDelete(email, code, type)

    if (result.success) {
      // 验证成功，删除验证码
      const key = `${email}:${type}`
      this.codeStorage.delete(key)
      this.logger.log(`Verification code verified and deleted for ${email}`)
    }

    return result
  }

  /**
   * 验证验证码（不删除验证码）
   */
  async verifyCodeWithoutDelete(
    email: string,
    code: string,
    type: 'register' | 'login' | 'reset_password'
  ): Promise<{ success: boolean; message: string }> {
    const key = `${email}:${type}`
    const stored = this.codeStorage.get(key)

    if (!stored) {
      return { success: false, message: '验证码不存在或已过期' }
    }

    if (stored.expiresAt < new Date()) {
      this.codeStorage.delete(key)
      return { success: false, message: '验证码已过期' }
    }

    if (stored.code !== code) {
      return { success: false, message: '验证码错误' }
    }

    this.logger.log(`Verification code verified successfully for ${email}`)
    return { success: true, message: '验证码验证成功' }
  }

  /**
   * 删除验证码
   */
  async deleteCode(email: string, type: 'register' | 'login' | 'reset_password'): Promise<void> {
    const key = `${email}:${type}`
    this.codeStorage.delete(key)
    this.logger.log(`Verification code deleted for ${email}`)
  }
}
