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
import { ChangePasswordDto } from './dto/change-password.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
    private readonly mailService: MailService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, username, password } = registerDto

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
    })

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

    const isPasswordValid = await this.utilsService.comparePassword(password, user.password)
    if (!isPasswordValid) {
      return null
    }

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

  private async generateTokens(user: User) {
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
}
