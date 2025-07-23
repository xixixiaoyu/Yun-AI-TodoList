import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { VerificationService } from './verification.service'

interface SendVerificationCodeDto {
  email: string
  type: 'register' | 'login' | 'reset_password'
  username?: string
}

interface VerifyCodeDto {
  email: string
  code: string
  type: 'register' | 'login' | 'reset_password'
}

@ApiTags('验证码')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async sendVerificationCode(@Body() sendCodeDto: SendVerificationCodeDto) {
    const { email, type, username } = sendCodeDto
    return await this.verificationService.sendVerificationCode(email, type, username)
  }

  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证码验证结果' })
  async verifyCode(@Body() verifyDto: VerifyCodeDto) {
    const { email, code, type } = verifyDto
    return await this.verificationService.verifyCode(email, code, type)
  }
}
