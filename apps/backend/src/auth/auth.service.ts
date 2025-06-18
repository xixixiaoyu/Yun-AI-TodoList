import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { AuthResponse, User } from '@shared/types'
import { UtilsService } from '../common/services/utils.service'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService
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
}
