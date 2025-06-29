/**
 * 重试机制工具
 * 为关键操作提供自动重试功能
 */

export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: unknown) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
}

/**
 * 执行带重试机制的异步操作
 * @param operation 要执行的操作
 * @param options 重试配置
 * @returns 操作结果
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown
  let currentDelay = config.delay

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // 如果是最后一次尝试或不应该重试，直接抛出错误
      if (attempt === config.maxAttempts || !config.shouldRetry(error)) {
        throw error
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, currentDelay))
      currentDelay *= config.backoffMultiplier
    }
  }

  throw lastError
}

/**
 * 判断是否为网络相关错误，适合重试
 * @param error 错误对象
 * @returns 是否应该重试
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false

  const errorMessage = (error as { message?: string }).message?.toLowerCase() || ''
  const retryablePatterns = [
    'network',
    'timeout',
    'connection',
    'fetch',
    'abort',
    'storage.saveLocalDataFailed',
  ]

  return retryablePatterns.some((pattern) => errorMessage.includes(pattern))
}

/**
 * 为存储操作定制的重试配置
 */
export const STORAGE_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 500,
  backoffMultiplier: 1.5,
  shouldRetry: isRetryableError,
}

/**
 * 为 AI 操作定制的重试配置
 */
export const AI_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 2,
  delay: 2000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    const errorMessage = (error as { message?: string }).message?.toLowerCase() || ''
    // 对于 API 限制错误不重试，对于网络错误重试
    return !errorMessage.includes('rate limit') && isRetryableError(error)
  },
}
