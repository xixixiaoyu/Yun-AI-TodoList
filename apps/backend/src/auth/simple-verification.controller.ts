import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import * as crypto from 'crypto'
import { MailService } from '../mail/mail.service'
import { Public } from './decorators/public.decorator'

interface SendVerificationCodeDto {
  email: string
  type: 'register' | 'login' | 'reset_password'
  username?: string
}

@ApiTags('简单验证码')
@Controller('simple-auth')
export class SimpleVerificationController {
  private readonly logger = new Logger(SimpleVerificationController.name)
  private readonly codeStorage = new Map<string, { code: string; expiresAt: Date; type: string }>()

  constructor(private readonly mailService: MailService) {}

  @Public()
  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送邮箱验证码（简化版本）' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async sendVerificationCode(@Body() sendCodeDto: SendVerificationCodeDto) {
    const { email, type, username } = sendCodeDto

    try {
      // 生成 6 位数字验证码
      const code = crypto.randomInt(100000, 999999).toString()
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
      return {
        message: '发送验证码失败，但在开发模式下可以查看日志获取验证码',
        error: error instanceof Error ? error.message : 'Unknown error',
        // 在开发模式下，即使发送失败也生成验证码供测试
        ...(process.env.NODE_ENV === 'development' && {
          code: crypto.randomInt(100000, 999999).toString(),
          note: '这是开发模式下的测试验证码',
        }),
      }
    }
  }

  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证邮箱验证码' })
  async verifyCode(@Body() verifyDto: { email: string; code: string; type: string }) {
    const { email, code, type } = verifyDto
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

    // 验证成功，删除验证码
    this.codeStorage.delete(key)
    return { success: true, message: '验证码验证成功' }
  }
}
