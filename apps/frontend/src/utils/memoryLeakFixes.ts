/**
 * 内存泄露修复工具
 * 提供统一的资源清理和内存管理功能
 */

// 全局定时器管理
const activeTimers = new Set<number>()
const activeIntervals = new Set<number>()

// 全局事件监听器管理
const activeEventListeners = new Map<EventTarget, Map<string, (event: Event) => void>>()

// 全局 AbortController 管理
const activeAbortControllers = new Set<AbortController>()

/**
 * 安全的 setTimeout 包装器
 */
export function safeSetTimeout(callback: () => void, delay: number): number {
  const timerId = window.setTimeout(() => {
    activeTimers.delete(timerId)
    callback()
  }, delay)
  activeTimers.add(timerId)
  return timerId
}

/**
 * 安全的 setInterval 包装器
 */
export function safeSetInterval(callback: () => void, delay: number): number {
  const intervalId = window.setInterval(callback, delay)
  activeIntervals.add(intervalId)
  return intervalId
}

/**
 * 清理定时器
 */
export function clearSafeTimeout(timerId: number): void {
  window.clearTimeout(timerId)
  activeTimers.delete(timerId)
}

/**
 * 清理间隔器
 */
export function clearSafeInterval(intervalId: number): void {
  window.clearInterval(intervalId)
  activeIntervals.delete(intervalId)
}

/**
 * 安全的事件监听器添加（支持泛型类型）
 */
export function safeAddEventListener(
  target: EventTarget,
  type: string,
  listener: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
): void {
  target.addEventListener(type, listener, options)

  if (!activeEventListeners.has(target)) {
    activeEventListeners.set(target, new Map())
  }
  const targetListeners = activeEventListeners.get(target)
  if (targetListeners) {
    targetListeners.set(type, listener)
  }
}

/**
 * 安全的事件监听器移除（支持泛型类型）
 */
export function safeRemoveEventListener(
  target: EventTarget,
  type: string,
  listener?: ((event: Event) => void) | null
): void {
  const targetListeners = activeEventListeners.get(target)
  if (targetListeners) {
    const storedListener = listener || targetListeners.get(type)
    if (storedListener) {
      target.removeEventListener(type, storedListener)
      targetListeners.delete(type)

      if (targetListeners.size === 0) {
        activeEventListeners.delete(target)
      }
    }
  }
}

/**
 * 创建可管理的 AbortController
 */
export function createManagedAbortController(): AbortController {
  const controller = new AbortController()
  activeAbortControllers.add(controller)

  // 当 controller 被 abort 时，从集合中移除
  controller.signal.addEventListener(
    'abort',
    () => {
      activeAbortControllers.delete(controller)
    },
    { once: true }
  )

  return controller
}

/**
 * 清理指定目标的所有事件监听器
 */
export function cleanupEventListeners(target: EventTarget): void {
  const targetListeners = activeEventListeners.get(target)
  if (targetListeners) {
    for (const [type, listener] of targetListeners) {
      target.removeEventListener(type, listener)
    }
    activeEventListeners.delete(target)
  }
}

/**
 * 清理所有活跃的定时器
 */
export function cleanupAllTimers(): void {
  for (const timerId of activeTimers) {
    window.clearTimeout(timerId)
  }
  activeTimers.clear()

  for (const intervalId of activeIntervals) {
    window.clearInterval(intervalId)
  }
  activeIntervals.clear()
}

/**
 * 清理所有活跃的 AbortController
 */
export function cleanupAllAbortControllers(): void {
  for (const controller of activeAbortControllers) {
    if (!controller.signal.aborted) {
      controller.abort()
    }
  }
  activeAbortControllers.clear()
}

/**
 * 清理所有活跃的事件监听器
 */
export function cleanupAllEventListeners(): void {
  for (const [target, listeners] of activeEventListeners) {
    for (const [type, listener] of listeners) {
      target.removeEventListener(type, listener)
    }
  }
  activeEventListeners.clear()
}

/**
 * 全局资源清理函数
 */
export function cleanupAllResources(): void {
  cleanupAllTimers()
  cleanupAllEventListeners()
  cleanupAllAbortControllers()
}

/**
 * 获取当前活跃资源统计
 */
export function getActiveResourcesStats() {
  return {
    timers: activeTimers.size,
    intervals: activeIntervals.size,
    eventListeners: Array.from(activeEventListeners.values()).reduce(
      (total, listeners) => total + listeners.size,
      0
    ),
    abortControllers: activeAbortControllers.size,
  }
}

/**
 * 内存泄露检测器
 */
export class MemoryLeakDetector {
  private checkInterval: number | null = null
  private lastStats = getActiveResourcesStats()

  start(intervalMs = 30000): void {
    if (this.checkInterval) return

    this.checkInterval = safeSetInterval(() => {
      this.checkForLeaks()
    }, intervalMs)
  }

  stop(): void {
    if (this.checkInterval) {
      clearSafeInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private checkForLeaks(): void {
    const currentStats = getActiveResourcesStats()
    const threshold = 50 // 资源数量阈值

    // 检查是否有资源数量异常增长
    if (currentStats.timers > threshold) {
      console.warn(`内存泄露警告: 活跃定时器过多 (${currentStats.timers})`)
    }

    if (currentStats.eventListeners > threshold) {
      console.warn(`内存泄露警告: 活跃事件监听器过多 (${currentStats.eventListeners})`)
    }

    if (currentStats.abortControllers > threshold) {
      console.warn(`内存泄露警告: 活跃 AbortController 过多 (${currentStats.abortControllers})`)
    }

    this.lastStats = currentStats
  }

  getReport() {
    return {
      current: getActiveResourcesStats(),
      last: this.lastStats,
    }
  }
}

// 全局内存泄露检测器实例
export const memoryLeakDetector = new MemoryLeakDetector()

// 页面卸载时清理所有资源
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupAllResources)
}
