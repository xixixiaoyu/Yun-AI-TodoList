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
  RECENT_METRICS_TIME: 60000
} as const

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: SimplePerformanceObserver[] = []

  private thresholds: Record<string, PerformanceThreshold> = {
    'component-render': { warning: 16, error: 50 },
    'route-change': { warning: 100, error: 300 },
    'api-request': { warning: 1000, error: 3000 },
    'memory-usage': { warning: 50 * 1024 * 1024, error: 100 * 1024 * 1024 }
  }

  constructor() {
    this.initObservers()
  }

  private initObservers() {
    console.warn('Performance monitoring initialized (simplified mode)')
  }

  /**
   * 记录性能指标
   */
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
      category
    })

    return result
  }

  /**
   * 测量异步函数执行时间
   */
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
      category
    })

    return result
  }

  getMemoryUsage() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as PerformanceWithMemory).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    return null
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < PERFORMANCE_CONSTANTS.RECENT_METRICS_TIME
    )

    const report = {
      timestamp: now,
      memory: this.getMemoryUsage(),
      metrics: {
        render: recentMetrics.filter(m => m.category === 'render'),
        network: recentMetrics.filter(m => m.category === 'network'),
        userInteraction: recentMetrics.filter(m => m.category === 'user-interaction')
      },
      summary: {
        totalMetrics: recentMetrics.length,
        averageRenderTime: this.getAverageTime(recentMetrics.filter(m => m.category === 'render')),
        averageNetworkTime: this.getAverageTime(recentMetrics.filter(m => m.category === 'network'))
      }
    }

    return report
  }

  private getAverageTime(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

export function usePerformanceMonitor() {
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor),
    getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor)
  }
}
