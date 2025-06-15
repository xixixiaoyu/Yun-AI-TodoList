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
  private isDevelopment = import.meta.env.DEV
  private minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN

  /**
   * 调试信息 - 仅在开发环境输出
   */
  debug(message: string, data?: unknown, source?: string) {
    this.log(LogLevel.DEBUG, message, data, source)
  }

  /**
   * 一般信息 - 仅在开发环境输出
   */
  info(message: string, data?: unknown, source?: string) {
    this.log(LogLevel.INFO, message, data, source)
  }

  /**
   * 警告信息 - 开发和生产环境都输出
   */
  warn(message: string, data?: unknown, source?: string) {
    this.log(LogLevel.WARN, message, data, source)
  }

  /**
   * 错误信息 - 开发和生产环境都输出
   */
  error(message: string, error?: unknown, source?: string) {
    this.log(LogLevel.ERROR, message, error, source)
  }

  private log(level: LogLevel, message: string, data?: unknown, source?: string) {
    if (level < this.minLevel) {
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
    const prefix = `[${entry.timestamp.toISOString()}]${
      entry.source ? ` [${entry.source}]` : ''
    }`
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          // eslint-disable-next-line no-console
          console.debug(message, entry.data || '')
        }
        break
      case LogLevel.INFO:
        if (this.isDevelopment) {
          // eslint-disable-next-line no-console
          console.info(message, entry.data || '')
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

// 导出单例实例
export const logger = new Logger()

// 便捷的错误处理函数
export function handleError(error: unknown, context: string, source?: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  logger.error(`${context}: ${errorMessage}`, { error, stack: errorStack }, source)
}

// 便捷的异步错误处理函数
export function handleAsyncError<T>(
  promise: Promise<T>,
  context: string,
  source?: string
): Promise<T> {
  return promise.catch((error) => {
    handleError(error, context, source)
    throw error // 重新抛出错误，让调用者决定如何处理
  })
}
