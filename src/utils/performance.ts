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

// 类型声明
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory {
  memory: MemoryInfo
}

// 简化的性能监控实现，避免使用浏览器特定的 API

interface SimplePerformanceObserver {
  observe: (options: { entryTypes: string[] }) => void
  disconnect: () => void
}

// 性能常量
const PERFORMANCE_CONSTANTS = {
  LONG_TASK_THRESHOLD: 50,
  MAX_METRICS_COUNT: 1000,
  METRICS_CLEANUP_COUNT: 500,
  MEMORY_WARNING_SIZE: 50 * 1024 * 1024, // 50MB
  MEMORY_ERROR_SIZE: 100 * 1024 * 1024, // 100MB
  RECENT_METRICS_TIME: 60000 // 1分钟
} as const

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: SimplePerformanceObserver[] = []

  // 性能阈值配置
  private thresholds: Record<string, PerformanceThreshold> = {
    'component-render': { warning: 16, error: 50 }, // 16ms = 60fps
    'route-change': { warning: 100, error: 300 },
    'api-request': { warning: 1000, error: 3000 },
    'memory-usage': { warning: 50 * 1024 * 1024, error: 100 * 1024 * 1024 } // 50MB/100MB
  }

  constructor() {
    this.initObservers()
  }

  /**
   * 初始化性能观察器
   */
  private initObservers() {
    // 简化实现，避免使用浏览器特定的 API
    // 在实际使用中，可以通过其他方式收集性能数据
    console.warn('Performance monitoring initialized (simplified mode)')
  }

  /**
   * 记录性能指标
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // 检查阈值
    const threshold = this.thresholds[metric.name]
    if (threshold) {
      if (metric.value > threshold.error) {
        console.error(`Performance error: ${metric.name} took ${metric.value}ms`)
      } else if (metric.value > threshold.warning) {
        console.warn(`Performance warning: ${metric.name} took ${metric.value}ms`)
      }
    }

    // 限制存储的指标数量
    if (this.metrics.length > PERFORMANCE_CONSTANTS.MAX_METRICS_COUNT) {
      this.metrics = this.metrics.slice(-PERFORMANCE_CONSTANTS.METRICS_CLEANUP_COUNT)
    }
  }

  /**
   * 测量函数执行时间
   */
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

  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    // 简化实现，避免使用浏览器特定的 API
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

  /**
   * 清理资源
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()

// Vue 组合式函数
export function usePerformanceMonitor() {
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor),
    getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor)
  }
}
