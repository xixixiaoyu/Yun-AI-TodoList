import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { randomBytes, randomUUID } from 'crypto'

@Injectable()
export class UtilsService {
  constructor(private readonly configService: ConfigService) {}

  // 密码哈希
  async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get('BCRYPT_ROUNDS', 12)
    return bcrypt.hash(password, rounds)
  }

  // 验证密码
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // 生成 UUID
  generateId(): string {
    return randomUUID()
  }

  // 生成随机字符串
  generateRandomString(length = 32): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  }

  // 格式化日期
  formatDate(date: Date | string, format?: 'short' | 'long' | 'time'): string {
    const d = new Date(date)

    switch (format) {
      case 'short':
        return d.toLocaleDateString()
      case 'long':
        return d.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      case 'time':
        return d.toLocaleTimeString()
      default:
        return d.toISOString()
    }
  }

  // 验证邮箱
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 验证密码强度
  isValidPassword(password: string): boolean {
    // 至少8个字符，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
    return passwordRegex.test(password)
  }

  // 清理敏感信息
  sanitizeUser(user: { password?: string; [key: string]: any }): Omit<typeof user, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitized } = user
    return sanitized
  }

  // 分页计算
  calculatePagination(
    page: number,
    limit: number,
    total: number
  ): {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } {
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    }
  }

  // 生成文件名
  generateFileName(originalName: string, extension?: string): string {
    const timestamp = Date.now()
    const random = this.generateRandomString(8)
    const ext = extension || originalName.split('.').pop() || ''
    return `${timestamp}-${random}.${ext}`
  }

  // 获取客户端 IP
  getClientIp(request: {
    headers: Record<string, string | string[]>
    connection?: { remoteAddress?: string; socket?: { remoteAddress?: string } }
    socket?: { remoteAddress?: string }
  }): string {
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.connection.socket ? request.connection.socket.remoteAddress : null) ||
      '0.0.0.0'
    )
  }

  // 延迟执行
  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // 重试机制
  async retry<T>(fn: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (attempt === maxAttempts) break
        await this.delay(delay * attempt)
      }
    }

    throw lastError || new Error('All retry attempts failed')
  }
}
