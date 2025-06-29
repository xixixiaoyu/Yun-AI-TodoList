/**
 * 防抖工具
 * 用于优化频繁操作的性能
 */

/**
 * 创建防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行第一次调用
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let _lastCallTime = 0

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    const callNow = immediate && !timeoutId

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      _lastCallTime = now
      if (!immediate) {
        func.apply(this, args)
      }
    }, delay)

    if (callNow) {
      func.apply(this, args)
    }
  }
}

/**
 * 创建异步防抖函数
 * @param func 要防抖的异步函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的异步函数
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null

  return function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (pendingPromise) {
      return pendingPromise
    }

    pendingPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func.apply(this, args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          timeoutId = null
          pendingPromise = null
        }
      }, delay)
    })

    return pendingPromise
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 节流间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    if (timeSinceLastCall >= delay) {
      lastCallTime = now
      func.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now()
        timeoutId = null
        func.apply(this, args)
      }, delay - timeSinceLastCall)
    }
  }
}

/**
 * 批处理工具
 * 将多个操作合并为一次批量操作
 */
export class BatchProcessor<T> {
  private items: T[] = []
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private readonly processor: (items: T[]) => Promise<void> | void
  private readonly delay: number
  private readonly maxBatchSize: number

  constructor(processor: (items: T[]) => Promise<void> | void, delay = 100, maxBatchSize = 50) {
    this.processor = processor
    this.delay = delay
    this.maxBatchSize = maxBatchSize
  }

  add(item: T): void {
    this.items.push(item)

    // 如果达到最大批次大小，立即处理
    if (this.items.length >= this.maxBatchSize) {
      this.flush()
      return
    }

    // 否则延迟处理
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    this.timeoutId = setTimeout(() => {
      this.flush()
    }, this.delay)
  }

  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.items.length > 0) {
      const itemsToProcess = [...this.items]
      this.items = []
      this.processor(itemsToProcess)
    }
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.items = []
  }
}
