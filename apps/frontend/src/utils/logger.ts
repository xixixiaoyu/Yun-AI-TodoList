/**
 * 统一的日志记录工具
 * 提供开发和生产环境的日志管理
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: Date
  source?: string
}

class Logger {
  private isDevelopment = (import.meta as unknown as { env: { DEV: boolean } }).env.DEV
  private minLevel = this.getLogLevel()

  // 频繁操作的日志限制
  private logThrottle = new Map<string, number>()
  private readonly THROTTLE_INTERVAL = 2000 // 2秒内相同日志只记录一次

  // 模块级日志控制
  private moduleLogLevels = new Map<string, LogLevel>([
    ['PWA', LogLevel.WARN], // PWA 相关日志默认只显示警告和错误
    ['useTodos', LogLevel.WARN], // 数据操作日志默认只显示警告和错误
  ])

  /**
   * 获取日志级别
   * 优先级：环境变量 > 开发/生产环境默认值
   */
  private getLogLevel(): LogLevel {
    // 从环境变量获取日志级别
    const envLogLevel = (import.meta as unknown as { env: { VITE_LOG_LEVEL?: string } }).env
      .VITE_LOG_LEVEL
    if (envLogLevel) {
      const level = LogLevel[envLogLevel.toUpperCase() as keyof typeof LogLevel]
      if (level !== undefined) {
        return level
      }
    }

    // 默认值：开发环境 INFO，生产环境 WARN
    return this.isDevelopment ? LogLevel.INFO : LogLevel.WARN
  }

  /**
   * 获取模块的日志级别
   */
  private getModuleLogLevel(source?: string): LogLevel {
    if (source && this.moduleLogLevels.has(source)) {
      const level = this.moduleLogLevels.get(source)
      return level !== undefined ? level : this.minLevel
    }
    return this.minLevel
  }

  debug(message: string, data?: unknown, source?: string) {
    // 对频繁的调试日志进行节流
    if (this.shouldThrottle(message, source)) {
      return
    }
    this.log(LogLevel.DEBUG, message, data, source)
  }

  info(message: string, data?: unknown, source?: string) {
    // 对重复的 useTodos 操作进行简单的防重复记录
    if (this.shouldThrottle(message, source)) {
      return
    }
    this.log(LogLevel.INFO, message, data, source)
  }

  warn(message: string, data?: unknown, source?: string) {
    this.log(LogLevel.WARN, message, data, source)
  }

  error(message: string, error?: unknown, source?: string) {
    this.log(LogLevel.ERROR, message, error, source)
  }

  private shouldThrottle(message: string, source?: string): boolean {
    const key = `${source || 'default'}:${message}`
    const now = Date.now()
    const lastLog = this.logThrottle.get(key)

    if (lastLog && now - lastLog < this.THROTTLE_INTERVAL) {
      return true
    }

    this.logThrottle.set(key, now)
    return false
  }

  private log(level: LogLevel, message: string, data?: unknown, source?: string) {
    // 使用模块级日志控制
    const moduleLevel = this.getModuleLogLevel(source)
    if (level < moduleLevel) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      source,
    }

    this.output(entry)
  }

  private output(entry: LogEntry) {
    const prefix = `[${entry.timestamp.toISOString()}]${entry.source ? ` [${entry.source}]` : ''}`
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.warn(`[DEBUG] ${message}`, entry.data || '')
        }
        break
      case LogLevel.INFO:
        if (this.isDevelopment) {
          console.warn(`[INFO] ${message}`, entry.data || '')
        }
        break
      case LogLevel.WARN:
        console.warn(message, entry.data || '')
        break
      case LogLevel.ERROR:
        console.error(message, entry.data || '')
        break
    }
  }
}

export const logger = new Logger()

export function handleError(error: unknown, context: string, source?: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  logger.error(`${context}: ${errorMessage}`, { error, stack: errorStack }, source)
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  context: string,
  source?: string
): Promise<T> {
  return promise.catch((error) => {
    handleError(error, context, source)
    throw error
  })
}
