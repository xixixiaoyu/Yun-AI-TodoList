/**
 * 性能监控工具
 * 提供应用性能监控和优化建议
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: 'render' | 'network' | 'memory' | 'user-interaction'
}

interface PerformanceThreshold {
  warning: number
  error: number
}

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory {
  memory: MemoryInfo
}

interface SimplePerformanceObserver {
  observe: (options: { entryTypes: string[] }) => void
  disconnect: () => void
}

const PERFORMANCE_CONSTANTS = {
  LONG_TASK_THRESHOLD: 50,
  MAX_METRICS_COUNT: 1000,
  METRICS_CLEANUP_COUNT: 500,
  MEMORY_WARNING_SIZE: 50 * 1024 * 1024,
  MEMORY_ERROR_SIZE: 100 * 1024 * 1024,
  RECENT_METRICS_TIME: 60000,
} as const

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: SimplePerformanceObserver[] = []

  private thresholds: Record<string, PerformanceThreshold> = {
    'component-render': { warning: 16, error: 50 },
    'route-change': { warning: 100, error: 300 },
    'api-request': { warning: 1000, error: 3000 },
    'memory-usage': { warning: 50 * 1024 * 1024, error: 100 * 1024 * 1024 },
  }

  constructor() {
    this.initObservers()
  }

  private initObservers() {
    console.warn('Performance monitoring initialized (simplified mode)')
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    const threshold = this.thresholds[metric.name]
    if (threshold) {
      if (metric.value > threshold.error) {
        console.error(`Performance error: ${metric.name} took ${metric.value}ms`)
      } else if (metric.value > threshold.warning) {
        console.warn(`Performance warning: ${metric.name} took ${metric.value}ms`)
      }
    }

    if (this.metrics.length > PERFORMANCE_CONSTANTS.MAX_METRICS_COUNT) {
      this.metrics = this.metrics.slice(-PERFORMANCE_CONSTANTS.METRICS_CLEANUP_COUNT)
    }
  }

  measure<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'user-interaction'
  ): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordMetric({
      name,
      value: duration,
      timestamp: start,
      category,
    })

    return result
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'network'
  ): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    this.recordMetric({
      name,
      value: duration,
      timestamp: start,
      category,
    })

    return result
  }

  getMemoryUsage() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as PerformanceWithMemory).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }
    }
    return null
  }

  getPerformanceReport() {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      (m) => now - m.timestamp < PERFORMANCE_CONSTANTS.RECENT_METRICS_TIME
    )

    const report = {
      timestamp: now,
      memory: this.getMemoryUsage(),
      metrics: {
        render: recentMetrics.filter((m) => m.category === 'render'),
        network: recentMetrics.filter((m) => m.category === 'network'),
        userInteraction: recentMetrics.filter((m) => m.category === 'user-interaction'),
      },
      summary: {
        totalMetrics: recentMetrics.length,
        averageRenderTime: this.getAverageTime(
          recentMetrics.filter((m) => m.category === 'render')
        ),
        averageNetworkTime: this.getAverageTime(
          recentMetrics.filter((m) => m.category === 'network')
        ),
      },
    }

    return report
  }

  private getAverageTime(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
    this.metrics = []
  }

  // 内存泄露检测
  detectMemoryLeaks(): {
    potentialLeaks: string[]
    recommendations: string[]
  } {
    const potentialLeaks: string[] = []
    const recommendations: string[] = []

    // 检查内存使用情况
    const memoryUsage = this.getMemoryUsage()
    if (memoryUsage && memoryUsage.percentage > 80) {
      potentialLeaks.push(`内存使用率过高: ${memoryUsage.percentage.toFixed(1)}%`)
      recommendations.push('检查是否有未清理的事件监听器或定时器')
    }

    // 检查长任务
    const longTasks = this.metrics.filter((m) => m.category === 'user-interaction' && m.value > 50)
    if (longTasks.length > 10) {
      potentialLeaks.push(`检测到 ${longTasks.length} 个长任务`)
      recommendations.push('优化计算密集型操作，考虑使用 Web Workers')
    }

    // 检查网络请求
    const networkTasks = this.metrics.filter((m) => m.category === 'network' && m.value > 5000)
    if (networkTasks.length > 5) {
      potentialLeaks.push(`检测到 ${networkTasks.length} 个慢网络请求`)
      recommendations.push('优化网络请求，添加请求缓存和超时处理')
    }

    return { potentialLeaks, recommendations }
  }
}

export const performanceMonitor = new PerformanceMonitor()

export function usePerformanceMonitor() {
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor),
    getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor),
  }
}
