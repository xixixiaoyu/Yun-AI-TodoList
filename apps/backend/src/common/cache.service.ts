import { Injectable, Logger } from '@nestjs/common'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private cache = new Map<string, CacheItem<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5分钟

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    }

    this.cache.set(key, item)
    this.logger.debug(`Cache set: ${key}`)
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.logger.debug(`Cache expired and removed: ${key}`)
      return null
    }

    this.logger.debug(`Cache hit: ${key}`)
    return item.data
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key)
    if (result) {
      this.logger.debug(`Cache deleted: ${key}`)
    }
    return result
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.logger.debug('All cache cleared')
  }

  /**
   * 获取或设置缓存（如果不存在则执行函数并缓存结果）
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    try {
      const data = await fn()
      this.set(key, data, ttl)
      return data
    } catch (error) {
      this.logger.error(`Error executing function for cache key ${key}:`, error)
      throw error
    }
  }

  /**
   * 批量删除缓存（支持模式匹配）
   */
  deletePattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    this.logger.debug(`Deleted ${count} cache entries matching pattern: ${pattern}`)
    return count
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    keys: string[]
    memoryUsage: number
  } {
    const keys = Array.from(this.cache.keys())

    return {
      size: this.cache.size,
      keys,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    let count = 0
    const now = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        count++
      }
    }

    if (count > 0) {
      this.logger.debug(`Cleaned up ${count} expired cache entries`)
    }

    return count
  }

  /**
   * 估算内存使用量（简单估算）
   */
  private estimateMemoryUsage(): number {
    let size = 0

    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2 // 字符串大小（UTF-16）
      size += JSON.stringify(item.data).length * 2
      size += 16 // 时间戳和TTL
    }

    return size
  }

  /**
   * 定期清理过期缓存
   */
  startPeriodicCleanup(intervalMs = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanup()
    }, intervalMs)

    this.logger.log(`Started periodic cache cleanup with interval: ${intervalMs}ms`)
  }
}

// 缓存键生成器
export class CacheKeyGenerator {
  /**
   * 生成用户相关的缓存键
   */
  static user(userId: string, suffix?: string): string {
    return suffix ? `user:${userId}:${suffix}` : `user:${userId}`
  }

  /**
   * 生成待办事项相关的缓存键
   */
  static todo(userId: string, suffix?: string): string {
    return suffix ? `todo:${userId}:${suffix}` : `todo:${userId}`
  }

  /**
   * 生成统计信息缓存键
   */
  static stats(userId: string): string {
    return `stats:${userId}`
  }

  /**
   * 生成文档相关的缓存键
   */
  static document(userId: string, suffix?: string): string {
    return suffix ? `document:${userId}:${suffix}` : `document:${userId}`
  }

  /**
   * 生成用户偏好缓存键
   */
  static preferences(userId: string): string {
    return `preferences:${userId}`
  }
}
