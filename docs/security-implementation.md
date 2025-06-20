# 安全实现方案：全栈安全防护体系

## 技术概述

本项目构建了完整的安全防护体系，包括身份认证、授权控制、数据加密、输入验证、安全审计等多个层面，确保用户数据安全和系统稳定运行。

## 🔐 身份认证与授权

### JWT 认证系统

#### JWT 策略实现

```typescript
// apps/backend/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../users/users.service'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],

      // 支持从 Cookie 中提取 JWT
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
        (request) => {
          let token = null
          if (request && request.cookies) {
            token = request.cookies['access_token']
          }
          return token
        },
      ]),
    })
  }

  async validate(payload: JwtPayload) {
    const { sub: userId, email, iat, exp } = payload

    // 验证 token 是否过期
    if (Date.now() >= exp * 1000) {
      throw new UnauthorizedException('Token 已过期')
    }

    // 验证用户是否存在且活跃
    const user = await this.usersService.findById(userId)
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    // 验证 token 签发时间是否在用户密码更改之后
    if (
      user.passwordChangedAt &&
      iat < user.passwordChangedAt.getTime() / 1000
    ) {
      throw new UnauthorizedException('Token 已失效，请重新登录')
    }

    // 检查用户权限
    const permissions = await this.usersService.getUserPermissions(userId)

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions,
      lastLoginAt: user.lastLoginAt,
    }
  }
}
```

#### 认证服务

```typescript
// apps/backend/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../users/users.service'
import { CacheService } from '../cache/cache.service'
import { SecurityService } from '../security/security.service'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto'
import { JwtPayload } from './interfaces/jwt-payload.interface'

@Injectable()
export class AuthService {
  private readonly jwtSecret: string
  private readonly jwtExpiresIn: string
  private readonly refreshTokenExpiresIn: string
  private readonly maxLoginAttempts = 5
  private readonly lockoutDuration = 15 * 60 * 1000 // 15分钟

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private cacheService: CacheService,
    private securityService: SecurityService
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m')
    this.refreshTokenExpiresIn = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
      '7d'
    )
  }

  // 用户注册
  async register(registerDto: RegisterDto, clientInfo: any) {
    const { email, password, name } = registerDto

    // 检查邮箱是否已存在
    const existingUser = await this.usersService.findByEmail(email)
    if (existingUser) {
      throw new BadRequestException('邮箱已被注册')
    }

    // 密码强度验证
    this.validatePasswordStrength(password)

    // 加密密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
      registrationIp: clientInfo.ip,
      registrationUserAgent: clientInfo.userAgent,
    })

    // 生成验证令牌
    const verificationToken = this.generateVerificationToken()
    await this.cacheService.set(
      `email_verification:${user.id}`,
      verificationToken,
      24 * 60 * 60 // 24小时
    )

    // 发送验证邮件
    await this.securityService.sendVerificationEmail(
      user.email,
      verificationToken
    )

    // 记录安全日志
    await this.securityService.logSecurityEvent({
      type: 'USER_REGISTRATION',
      userId: user.id,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      details: { email },
    })

    return {
      message: '注册成功，请检查邮箱完成验证',
      userId: user.id,
    }
  }

  // 用户登录
  async login(loginDto: LoginDto, clientInfo: any) {
    const { email, password, rememberMe = false } = loginDto

    // 检查登录尝试次数
    await this.checkLoginAttempts(email, clientInfo.ip)

    // 查找用户
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      await this.recordFailedLogin(email, clientInfo.ip, 'USER_NOT_FOUND')
      throw new UnauthorizedException('邮箱或密码错误')
    }

    // 检查用户状态
    if (!user.isActive) {
      await this.recordFailedLogin(email, clientInfo.ip, 'USER_INACTIVE')
      throw new UnauthorizedException('账户已被禁用')
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('请先验证邮箱')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      await this.recordFailedLogin(email, clientInfo.ip, 'INVALID_PASSWORD')
      throw new UnauthorizedException('邮箱或密码错误')
    }

    // 检查是否需要强制更改密码
    if (user.forcePasswordChange) {
      return {
        requirePasswordChange: true,
        tempToken: this.generateTempToken(user.id),
      }
    }

    // 生成令牌
    const tokens = await this.generateTokens(user, rememberMe)

    // 更新用户登录信息
    await this.usersService.updateLoginInfo(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: clientInfo.ip,
      lastLoginUserAgent: clientInfo.userAgent,
    })

    // 清除失败登录记录
    await this.clearFailedLogins(email, clientInfo.ip)

    // 记录安全日志
    await this.securityService.logSecurityEvent({
      type: 'USER_LOGIN',
      userId: user.id,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      details: { email, rememberMe },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    }
  }

  // 刷新令牌
  async refreshToken(refreshTokenDto: RefreshTokenDto, clientInfo: any) {
    const { refreshToken } = refreshTokenDto

    try {
      // 验证刷新令牌
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtSecret + '_refresh',
      })

      // 检查令牌是否在黑名单中
      const isBlacklisted = await this.cacheService.exists(
        `blacklist:${refreshToken}`
      )
      if (isBlacklisted) {
        throw new UnauthorizedException('刷新令牌已失效')
      }

      // 获取用户信息
      const user = await this.usersService.findById(payload.sub)
      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户不存在或已被禁用')
      }

      // 生成新令牌
      const tokens = await this.generateTokens(user)

      // 将旧的刷新令牌加入黑名单
      await this.cacheService.set(
        `blacklist:${refreshToken}`,
        true,
        7 * 24 * 60 * 60 // 7天
      )

      // 记录安全日志
      await this.securityService.logSecurityEvent({
        type: 'TOKEN_REFRESH',
        userId: user.id,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
      })

      return tokens
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效')
    }
  }

  // 用户登出
  async logout(
    userId: string,
    accessToken: string,
    refreshToken: string,
    clientInfo: any
  ) {
    // 将令牌加入黑名单
    await Promise.all([
      this.cacheService.set(`blacklist:${accessToken}`, true, 15 * 60), // 15分钟
      this.cacheService.set(
        `blacklist:${refreshToken}`,
        true,
        7 * 24 * 60 * 60
      ), // 7天
    ])

    // 记录安全日志
    await this.securityService.logSecurityEvent({
      type: 'USER_LOGOUT',
      userId,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    })

    return { message: '登出成功' }
  }

  // 生成令牌
  private async generateTokens(user: any, rememberMe: boolean = false) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    }

    const accessTokenExpiry = rememberMe ? '30d' : this.jwtExpiresIn
    const refreshTokenExpiry = rememberMe ? '90d' : this.refreshTokenExpiresIn

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: accessTokenExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret + '_refresh',
        expiresIn: refreshTokenExpiry,
      }),
    ])

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiry,
    }
  }

  // 检查登录尝试次数
  private async checkLoginAttempts(email: string, ip: string) {
    const emailKey = `login_attempts:email:${email}`
    const ipKey = `login_attempts:ip:${ip}`

    const [emailAttempts, ipAttempts] = await Promise.all([
      this.cacheService.get<number>(emailKey) || 0,
      this.cacheService.get<number>(ipKey) || 0,
    ])

    if (emailAttempts >= this.maxLoginAttempts) {
      throw new UnauthorizedException(
        `邮箱登录尝试次数过多，请 ${Math.ceil(this.lockoutDuration / 60000)} 分钟后重试`
      )
    }

    if (ipAttempts >= this.maxLoginAttempts * 3) {
      throw new UnauthorizedException(
        `IP 登录尝试次数过多，请 ${Math.ceil(this.lockoutDuration / 60000)} 分钟后重试`
      )
    }
  }

  // 记录失败登录
  private async recordFailedLogin(email: string, ip: string, reason: string) {
    const emailKey = `login_attempts:email:${email}`
    const ipKey = `login_attempts:ip:${ip}`
    const ttl = this.lockoutDuration / 1000

    await Promise.all([
      this.cacheService.increment(emailKey, 1),
      this.cacheService.increment(ipKey, 1),
    ])

    // 设置过期时间
    await Promise.all([
      this.cacheService.set(
        emailKey,
        await this.cacheService.get(emailKey),
        ttl
      ),
      this.cacheService.set(ipKey, await this.cacheService.get(ipKey), ttl),
    ])

    // 记录安全日志
    await this.securityService.logSecurityEvent({
      type: 'LOGIN_FAILED',
      ip,
      details: { email, reason },
    })
  }

  // 清除失败登录记录
  private async clearFailedLogins(email: string, ip: string) {
    await Promise.all([
      this.cacheService.del(`login_attempts:email:${email}`),
      this.cacheService.del(`login_attempts:ip:${ip}`),
    ])
  }

  // 验证密码强度
  private validatePasswordStrength(password: string) {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (password.length < minLength) {
      throw new BadRequestException('密码长度至少8位')
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new BadRequestException(
        '密码必须包含大写字母、小写字母、数字和特殊字符'
      )
    }
  }

  // 生成验证令牌
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // 生成临时令牌
  private generateTempToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: 'temp' },
      { secret: this.jwtSecret, expiresIn: '10m' }
    )
  }
}
```

### 权限控制系统

#### RBAC 权限模型

```typescript
// apps/backend/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { Role } from '../enums/role.enum'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    return requiredRoles.some((role) => user.role === role)
  }
}

// 权限装饰器
import { SetMetadata } from '@nestjs/common'
import { Role } from '../enums/role.enum'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

// 权限枚举
export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export enum Permission {
  CREATE_TODO = 'create:todo',
  READ_TODO = 'read:todo',
  UPDATE_TODO = 'update:todo',
  DELETE_TODO = 'delete:todo',
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics',
}
```

#### 资源权限守卫

```typescript
// apps/backend/src/auth/guards/resource.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { TodosService } from '../../todos/todos.service'
import { RESOURCE_KEY } from '../decorators/resource.decorator'

@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private todosService: TodosService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceConfig = this.reflector.get(
      RESOURCE_KEY,
      context.getHandler()
    )

    if (!resourceConfig) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const { user, params } = request
    const { type, idParam } = resourceConfig

    switch (type) {
      case 'todo':
        return this.checkTodoOwnership(user.id, params[idParam])
      default:
        return true
    }
  }

  private async checkTodoOwnership(
    userId: string,
    todoId: string
  ): Promise<boolean> {
    if (!todoId) {
      return true // 创建操作
    }

    const todo = await this.todosService.findOne(todoId)

    if (!todo) {
      throw new ForbiddenException('资源不存在')
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException('无权访问此资源')
    }

    return true
  }
}

// 资源装饰器
import { SetMetadata } from '@nestjs/common'

export const RESOURCE_KEY = 'resource'
export const Resource = (type: string, idParam: string = 'id') =>
  SetMetadata(RESOURCE_KEY, { type, idParam })
```

## 🛡️ 数据安全

### 数据加密服务

```typescript
// apps/backend/src/security/encryption.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32
  private readonly ivLength = 16
  private readonly tagLength = 16
  private readonly saltLength = 32

  constructor(private configService: ConfigService) {}

  // 获取加密密钥
  private getEncryptionKey(): Buffer {
    const secret = this.configService.get<string>('ENCRYPTION_SECRET')
    return crypto.scryptSync(secret, 'salt', this.keyLength)
  }

  // 加密敏感数据
  encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey()
      const iv = crypto.randomBytes(this.ivLength)
      const cipher = crypto.createCipher(this.algorithm, key)

      cipher.setAAD(Buffer.from('yun-todolist', 'utf8'))

      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const tag = cipher.getAuthTag()

      // 组合 IV + Tag + 加密数据
      return iv.toString('hex') + tag.toString('hex') + encrypted
    } catch (error) {
      throw new Error('数据加密失败')
    }
  }

  // 解密敏感数据
  decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey()

      // 提取 IV、Tag 和加密数据
      const iv = Buffer.from(encryptedData.slice(0, this.ivLength * 2), 'hex')
      const tag = Buffer.from(
        encryptedData.slice(
          this.ivLength * 2,
          (this.ivLength + this.tagLength) * 2
        ),
        'hex'
      )
      const encrypted = encryptedData.slice(
        (this.ivLength + this.tagLength) * 2
      )

      const decipher = crypto.createDecipher(this.algorithm, key)
      decipher.setAAD(Buffer.from('yun-todolist', 'utf8'))
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error('数据解密失败')
    }
  }

  // 哈希密码
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  // 验证密码
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // 生成安全随机字符串
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // 生成 HMAC 签名
  generateHMAC(data: string, secret?: string): string {
    const key = secret || this.configService.get<string>('HMAC_SECRET')
    return crypto.createHmac('sha256', key).update(data).digest('hex')
  }

  // 验证 HMAC 签名
  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // 生成 API 密钥
  generateApiKey(): {
    keyId: string
    keySecret: string
    keyHash: string
  } {
    const keyId = this.generateSecureRandom(16)
    const keySecret = this.generateSecureRandom(32)
    const keyHash = crypto.createHash('sha256').update(keySecret).digest('hex')

    return { keyId, keySecret, keyHash }
  }
}
```

### 数据脱敏服务

```typescript
// apps/backend/src/security/data-masking.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class DataMaskingService {
  // 邮箱脱敏
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***'
    }

    const [username, domain] = email.split('@')
    const maskedUsername =
      username.length > 2
        ? username.charAt(0) +
          '*'.repeat(username.length - 2) +
          username.charAt(username.length - 1)
        : '*'.repeat(username.length)

    return `${maskedUsername}@${domain}`
  }

  // 手机号脱敏
  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) {
      return '***'
    }

    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  // 身份证号脱敏
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 8) {
      return '***'
    }

    return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2')
  }

  // 银行卡号脱敏
  maskBankCard(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) {
      return '***'
    }

    return cardNumber.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
  }

  // IP 地址脱敏
  maskIpAddress(ip: string): string {
    if (!ip) {
      return '***'
    }

    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***.`
    }

    return '***'
  }

  // 通用敏感信息脱敏
  maskSensitiveData(data: any, fields: string[]): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    const masked = { ...data }

    fields.forEach((field) => {
      if (masked[field]) {
        if (field.includes('email')) {
          masked[field] = this.maskEmail(masked[field])
        } else if (field.includes('phone')) {
          masked[field] = this.maskPhone(masked[field])
        } else if (field.includes('ip')) {
          masked[field] = this.maskIpAddress(masked[field])
        } else {
          // 通用脱敏：保留前后各2位字符
          const value = String(masked[field])
          if (value.length > 4) {
            masked[field] =
              value.substring(0, 2) +
              '*'.repeat(value.length - 4) +
              value.substring(value.length - 2)
          } else {
            masked[field] = '*'.repeat(value.length)
          }
        }
      }
    })

    return masked
  }

  // 日志脱敏
  maskLogData(logData: any): any {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'email',
      'phone',
      'idCard',
      'bankCard',
      'ip',
      'userAgent',
    ]

    return this.maskSensitiveData(logData, sensitiveFields)
  }
}
```

## 🔍 输入验证与防护

### 输入验证管道

```typescript
// apps/backend/src/common/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { sanitize } from 'class-sanitizer'

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value
    }

    // 转换为类实例
    const object = plainToClass(metatype, value)

    // 数据清理
    sanitize(object)

    // 验证
    const errors = await validate(object, {
      whitelist: true, // 只保留装饰器标记的属性
      forbidNonWhitelisted: true, // 禁止非白名单属性
      transform: true, // 自动类型转换
      validateCustomDecorators: true,
    })

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors)
      throw new BadRequestException({
        message: '输入验证失败',
        errors: errorMessages,
      })
    }

    return object
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object]
    return !types.includes(metatype)
  }

  private formatErrors(errors: any[]): any[] {
    return errors.map((error) => ({
      field: error.property,
      value: error.value,
      constraints: Object.values(error.constraints || {}),
    }))
  }
}
```

### XSS 防护

```typescript
// apps/backend/src/security/xss-protection.service.ts
import { Injectable } from '@nestjs/common'
import * as DOMPurify from 'isomorphic-dompurify'
import { JSDOM } from 'jsdom'

@Injectable()
export class XSSProtectionService {
  private readonly window: Window
  private readonly purify: any

  constructor() {
    this.window = new JSDOM('').window as unknown as Window
    this.purify = DOMPurify(this.window)

    // 配置 DOMPurify
    this.purify.setConfig({
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
    })
  }

  // 清理 HTML 内容
  sanitizeHtml(dirty: string): string {
    if (!dirty || typeof dirty !== 'string') {
      return ''
    }

    return this.purify.sanitize(dirty)
  }

  // 清理用户输入
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input)
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeInput(item))
    }

    if (input && typeof input === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value)
      }
      return sanitized
    }

    return input
  }

  // 清理字符串
  private sanitizeString(str: string): string {
    return str
      .replace(/[<>"'&]/g, (match) => {
        const entityMap: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        }
        return entityMap[match]
      })
      .trim()
  }

  // 验证是否包含恶意脚本
  containsMaliciousScript(input: string): boolean {
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ]

    return maliciousPatterns.some((pattern) => pattern.test(input))
  }
}
```

### SQL 注入防护

```typescript
// apps/backend/src/security/sql-injection.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class SQLInjectionService {
  // SQL 注入检测模式
  private readonly sqlInjectionPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i,
    /(\<|\>|\%3C|\%3E)/i,
    /(\%27)|(\%22)|(\%3D)|(\%3B)|(\%2B)/i,
  ]

  // 检测 SQL 注入
  detectSQLInjection(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false
    }

    const decodedInput = decodeURIComponent(input.toLowerCase())

    return this.sqlInjectionPatterns.some((pattern) =>
      pattern.test(decodedInput)
    )
  }

  // 清理 SQL 输入
  sanitizeSQLInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    return input
      .replace(/[';"\-\-]/g, '') // 移除危险字符
      .replace(
        /\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b/gi,
        ''
      ) // 移除 SQL 关键字
      .trim()
  }

  // 验证查询参数
  validateQueryParams(params: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && this.detectSQLInjection(value)) {
        return false
      }
    }
    return true
  }
}
```

## 🔒 安全中间件

### 安全头中间件

```typescript
// apps/backend/src/security/security-headers.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY')

    // 防止 MIME 类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // XSS 保护
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // 强制 HTTPS
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )

    // 内容安全策略
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' https:",
        "connect-src 'self' https:",
        "media-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    )

    // 权限策略
    res.setHeader(
      'Permissions-Policy',
      [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
      ].join(', ')
    )

    // 引用策略
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // 移除服务器信息
    res.removeHeader('X-Powered-By')

    next()
  }
}
```

### 速率限制中间件

```typescript
// apps/backend/src/security/rate-limit.middleware.ts
import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { CacheService } from '../cache/cache.service'

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private cacheService: CacheService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIp(req)
    const key = `rate_limit:${ip}`

    // 获取当前请求计数
    const current = (await this.cacheService.get<number>(key)) || 0

    // 速率限制配置
    const limit = this.getLimit(req.path)
    const window = this.getWindow(req.path)

    if (current >= limit) {
      throw new HttpException(
        {
          message: '请求过于频繁，请稍后重试',
          retryAfter: window,
        },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    // 增加计数
    await this.cacheService.increment(key, 1)

    // 设置过期时间（仅在第一次请求时）
    if (current === 0) {
      await this.cacheService.set(key, 1, window)
    }

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', limit)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current - 1))
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + window * 1000).toISOString()
    )

    next()
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      ''
    )
      .split(',')[0]
      .trim()
  }

  private getLimit(path: string): number {
    // 根据路径设置不同的限制
    if (path.includes('/auth/login')) {
      return 5 // 登录接口：5次/分钟
    }
    if (path.includes('/auth/register')) {
      return 3 // 注册接口：3次/分钟
    }
    if (path.includes('/ai/')) {
      return 20 // AI 接口：20次/分钟
    }
    return 100 // 默认：100次/分钟
  }

  private getWindow(path: string): number {
    // 时间窗口（秒）
    if (path.includes('/auth/')) {
      return 60 // 认证接口：1分钟
    }
    return 60 // 默认：1分钟
  }
}
```

## 🎯 核心学习要点

### 1. 身份认证安全

- **JWT 令牌管理**：安全生成、验证、刷新机制
- **密码安全**：强度验证、安全哈希、防暴力破解
- **多因素认证**：邮箱验证、短信验证
- **会话管理**：令牌黑名单、会话超时

### 2. 授权控制

- **RBAC 模型**：角色权限分离
- **资源权限**：细粒度权限控制
- **动态权限**：基于上下文的权限判断
- **权限缓存**：提升权限检查性能

### 3. 数据安全

- **数据加密**：敏感数据加密存储
- **传输安全**：HTTPS、证书管理
- **数据脱敏**：日志和接口数据脱敏
- **备份安全**：加密备份、访问控制

### 4. 输入验证

- **参数验证**：类型、格式、范围验证
- **XSS 防护**：输入清理、输出编码
- **SQL 注入防护**：参数化查询、输入过滤
- **CSRF 防护**：令牌验证、同源检查

### 5. 安全监控

- **安全日志**：操作审计、异常检测
- **入侵检测**：异常行为识别
- **安全告警**：实时威胁通知
- **合规审计**：安全合规检查

## 📝 简历技术亮点

### 安全架构亮点

- **JWT 认证体系**：完整的令牌生命周期管理
- **RBAC 权限模型**：细粒度权限控制系统
- **数据加密方案**：AES-256 + HMAC 双重保护
- **多层防护体系**：认证、授权、加密、监控

### 安全防护亮点

- **输入验证框架**：XSS、SQL注入、CSRF 全面防护
- **速率限制系统**：防止暴力攻击和 DDoS
- **安全审计日志**：完整的操作追踪和异常检测
- **数据脱敏机制**：隐私保护和合规要求

### 安全运维亮点

- **安全头配置**：CSP、HSTS 等安全策略
- **威胁检测**：实时安全监控和告警
- **合规管理**：GDPR、等保合规实现
- **安全测试**：渗透测试、漏洞扫描集成
