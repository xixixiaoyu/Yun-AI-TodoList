import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { AuthResponse, User } from '@shared/types'
import { UtilsService } from '../common/services/utils.service'
import { MailService } from '../mail/mail.service'
import { UsersService } from '../users/users.service'
import { VerificationService } from '../verification/verification.service'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { SendVerificationCodeDto } from './dto/send-verification-code.dto'
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto'
import { EmailVerificationService } from './email-verification.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly mailService: MailService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly verificationService: VerificationService
  ) {}

  /**
   * 使用独立验证码服务验证验证码
   */
  private async verifyCodeWithStandaloneService(
    email: string,
    code: string,
    type: 'register' | 'login' | 'reset_password'
  ): Promise<void> {
    try {
      // 调用独立验证码服务的验证接口
      const response = await fetch('http://localhost:3000/api/v1/verification/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, type }),
      })

      const result = (await response.json()) as { success: boolean; message?: string }

      if (!result.success) {
        throw new BadRequestException(result.message || '验证码验证失败')
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('验证码验证失败')
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, username, password, verificationCode } = registerDto

    // 验证邮箱验证码（使用内存验证码服务，不删除验证码）
    const verificationResult = await this.verificationService.verifyCodeWithoutDelete(
      email,
      verificationCode,
      'register'
    )
    if (!verificationResult.success) {
      throw new BadRequestException(verificationResult.message)
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.usersService.findByEmail(email)
    if (existingUserByEmail) {
      throw new ConflictException('邮箱已被注册')
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await this.usersService.findByUsername(username)
    if (existingUserByUsername) {
      throw new ConflictException('用户名已被使用')
    }

    // 创建用户
    const hashedPassword = await this.utilsService.hashPassword(password)
    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
      emailVerified: true, // 注册时已验证邮箱
    })

    // 注册成功后删除验证码
    await this.verificationService.deleteCode(email, 'register')

    // 生成令牌
    const tokens = await this.generateTokens(user)

    return {
      user: this.utilsService.sanitizeUser(user),
      ...tokens,
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto

    const user = await this.validateUser(email, password)
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    const tokens = await this.generateTokens(user)

    return {
      user: this.utilsService.sanitizeUser(user),
      ...tokens,
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      return null
    }

    // Google 登录用户没有密码
    if (!user.password) {
      return null
    }

    const isPasswordValid = await this.utilsService.comparePassword(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    return user
  }

  async validateGoogleUser(googleUserData: {
    googleId: string
    email: string
    username: string
    avatarUrl?: string
    emailVerified: boolean
  }): Promise<User> {
    const { googleId, email, username, avatarUrl, emailVerified } = googleUserData

    // 首先尝试通过 Google ID 查找用户
    let user = await this.usersService.findByGoogleId(googleId)

    if (user) {
      // 更新最后活跃时间
      await this.usersService.updateLastActiveTime(user.id)
      return user
    }

    // 如果没有找到，尝试通过邮箱查找
    user = await this.usersService.findByEmail(email)

    if (user) {
      // 如果用户存在但没有 Google ID，则关联 Google 账户
      user = await this.usersService.linkGoogleAccount(user.id, googleId, avatarUrl)
      return user
    }

    // 如果用户不存在，创建新用户
    // 确保用户名唯一
    let uniqueUsername = username
    let counter = 1
    while (await this.usersService.findByUsername(uniqueUsername)) {
      uniqueUsername = `${username}${counter}`
      counter++
    }

    user = await this.usersService.create({
      email,
      username: uniqueUsername,
      password: '', // Google 用户不需要密码，但数据库字段现在是可选的
      googleId,
      avatarUrl,
      emailVerified,
    })

    return user
  }

  async validateGitHubUser(githubUserData: {
    githubId: string
    email: string
    username: string
    avatarUrl?: string
  }): Promise<User> {
    const { githubId, email, username, avatarUrl } = githubUserData

    // 首先尝试通过 GitHub ID 查找用户
    let user = await this.usersService.findByGitHubId(githubId)

    if (user) {
      // 更新最后活跃时间
      await this.usersService.updateLastActiveTime(user.id)
      return user
    }

    // 如果没有找到，尝试通过邮箱查找
    user = await this.usersService.findByEmail(email)

    if (user) {
      // 如果用户存在但没有 GitHub ID，则关联 GitHub 账户
      user = await this.usersService.linkGitHubAccount(user.id, githubId, avatarUrl)
      return user
    }

    // 如果用户不存在，创建新用户
    // 确保用户名唯一
    let uniqueUsername = username
    let counter = 1
    while (await this.usersService.findByUsername(uniqueUsername)) {
      uniqueUsername = `${username}${counter}`
      counter++
    }

    user = await this.usersService.create({
      email,
      username: uniqueUsername,
      password: '', // GitHub 用户不需要密码
      githubId,
      avatarUrl,
      emailVerified: true, // GitHub 用户邮箱默认已验证
    })

    return user
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken } = refreshTokenDto

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      })

      const user = await this.usersService.findById(payload.sub)
      if (!user) {
        throw new UnauthorizedException('用户不存在')
      }

      const tokens = await this.generateTokens(user)

      return {
        user: this.utilsService.sanitizeUser(user),
        ...tokens,
      }
    } catch {
      throw new UnauthorizedException('刷新令牌无效')
    }
  }

  async logout(_userId: string): Promise<{ message: string }> {
    // 这里可以实现令牌黑名单逻辑
    // 目前只是简单返回成功消息
    return { message: '退出登录成功' }
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ])

    return {
      accessToken,
      refreshToken,
    }
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto

    // 查找用户
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new NotFoundException('该邮箱未注册')
    }

    // 生成重置令牌（1小时有效期）
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
      }
    )

    // 异步发送重置邮件，不阻塞响应
    this.mailService.sendPasswordResetEmail(email, resetToken).catch((error) => {
      console.error(`Failed to send password reset email to ${email}:`, error)
    })

    return { message: '重置密码的邮件已发送，请查收' }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto

    try {
      // 验证重置令牌
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })

      // 检查令牌类型
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('无效的重置令牌')
      }

      // 查找用户
      const user = await this.usersService.findById(payload.sub)
      if (!user) {
        throw new NotFoundException('用户不存在')
      }

      // 更新密码
      const hashedPassword = await this.utilsService.hashPassword(password)
      await this.usersService.updatePassword(user.id, hashedPassword)

      return { message: '密码重置成功' }
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('重置链接无效或已过期')
      }
      throw error
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto

    // 查找用户
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 验证当前密码
    const isCurrentPasswordValid = await this.utilsService.comparePassword(
      currentPassword,
      user.password
    )
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('当前密码错误')
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await this.utilsService.comparePassword(newPassword, user.password)
    if (isSamePassword) {
      throw new BadRequestException('新密码不能与当前密码相同')
    }

    // 更新密码
    const hashedNewPassword = await this.utilsService.hashPassword(newPassword)
    await this.usersService.updatePassword(user.id, hashedNewPassword)

    return { message: '密码修改成功' }
  }

  /**
   * 发送邮箱验证码（使用独立服务）
   */
  async sendVerificationCode(sendCodeDto: SendVerificationCodeDto): Promise<{ message: string }> {
    const { email, type, username } = sendCodeDto

    try {
      // 调用独立验证码服务的发送接口
      const response = await fetch('http://localhost:3000/api/v1/verification/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type, username }),
      })

      const result = (await response.json()) as { message: string }
      return { message: result.message || '验证码已发送，请查收邮件' }
    } catch (error) {
      throw new BadRequestException('发送验证码失败，请稍后重试')
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyEmailCode(verifyCodeDto: VerifyEmailCodeDto): Promise<{ message: string }> {
    const { email, code } = verifyCodeDto

    // 使用独立验证码服务验证
    await this.verifyCodeWithStandaloneService(email, code, 'register')

    return { message: '邮箱验证成功' }
  }
}
