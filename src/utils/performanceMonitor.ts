/**
 * 性能监控和优化工具
 * 用于监控 AI 助手应用的性能指标
 */

// 扩展 PerformanceEntry 接口
interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number
}

// 扩展 Performance 接口
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export interface PerformanceMetrics {
  // 页面性能
  pageLoadTime: number
  domContentLoadedTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number

  // 交互性能
  firstInputDelay: number
  cumulativeLayoutShift: number

  // 内存使用
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }

  // 存储使用
  storageUsage: {
    localStorage: number
    sessionStorage: number
    indexedDB: number
  }

  // 自定义指标
  aiResponseTime: number[]
  messageRenderTime: number[]
  searchTime: number[]
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []

  private constructor() {
    this.initializeObservers()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 初始化性能观察器
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return

    // 观察导航时间
    this.observeNavigationTiming()

    // 观察绘制时间
    this.observePaintTiming()

    // 观察布局偏移
    this.observeLayoutShift()

    // 观察首次输入延迟
    this.observeFirstInputDelay()

    // 观察最大内容绘制
    this.observeLargestContentfulPaint()
  }

  /**
   * 观察导航时间
   */
  private observeNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0]
        this.metrics.pageLoadTime = entry.loadEventEnd - entry.navigationStart
        this.metrics.domContentLoadedTime = entry.domContentLoadedEventEnd - entry.navigationStart
      }
    }
  }

  /**
   * 观察绘制时间
   */
  private observePaintTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime
          }
        }
      })
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    }
  }

  /**
   * 观察布局偏移
   */
  private observeLayoutShift(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShiftEntry
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value
          }
        }
        this.metrics.cumulativeLayoutShift = clsValue
      })
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    }
  }

  /**
   * 观察首次输入延迟
   */
  private observeFirstInputDelay(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const firstInputEntry = entry as FirstInputEntry
          this.metrics.firstInputDelay = firstInputEntry.processingStart - entry.startTime
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    }
  }

  /**
   * 观察最大内容绘制
   */
  private observeLargestContentfulPaint(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.largestContentfulPaint = lastEntry.startTime
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    }
  }

  /**
   * 测量内存使用情况
   */
  measureMemoryUsage(): void {
    const extendedPerformance = performance as ExtendedPerformance
    if (extendedPerformance.memory) {
      const memory = extendedPerformance.memory
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      }
    }
  }

  /**
   * 测量存储使用情况
   */
  async measureStorageUsage(): Promise<void> {
    const storageUsage = {
      localStorage: 0,
      sessionStorage: 0,
      indexedDB: 0,
    }

    // 测量 localStorage
    try {
      const localStorageSize = new Blob(Object.values(localStorage)).size
      storageUsage.localStorage = localStorageSize
    } catch (error) {
      console.warn('无法测量 localStorage 大小:', error)
    }

    // 测量 sessionStorage
    try {
      const sessionStorageSize = new Blob(Object.values(sessionStorage)).size
      storageUsage.sessionStorage = sessionStorageSize
    } catch (error) {
      console.warn('无法测量 sessionStorage 大小:', error)
    }

    // 测量 IndexedDB (如果支持)
    if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        storageUsage.indexedDB = estimate.usage || 0
      } catch (error) {
        console.warn('无法测量 IndexedDB 大小:', error)
      }
    }

    this.metrics.storageUsage = storageUsage
  }

  /**
   * 记录 AI 响应时间
   */
  recordAIResponseTime(responseTime: number): void {
    if (!this.metrics.aiResponseTime) {
      this.metrics.aiResponseTime = []
    }
    this.metrics.aiResponseTime.push(responseTime)

    // 只保留最近的 100 个记录
    if (this.metrics.aiResponseTime.length > 100) {
      this.metrics.aiResponseTime = this.metrics.aiResponseTime.slice(-100)
    }
  }

  /**
   * 记录消息渲染时间
   */
  recordMessageRenderTime(renderTime: number): void {
    if (!this.metrics.messageRenderTime) {
      this.metrics.messageRenderTime = []
    }
    this.metrics.messageRenderTime.push(renderTime)

    // 只保留最近的 100 个记录
    if (this.metrics.messageRenderTime.length > 100) {
      this.metrics.messageRenderTime = this.metrics.messageRenderTime.slice(-100)
    }
  }

  /**
   * 记录搜索时间
   */
  recordSearchTime(searchTime: number): void {
    if (!this.metrics.searchTime) {
      this.metrics.searchTime = []
    }
    this.metrics.searchTime.push(searchTime)

    // 只保留最近的 50 个记录
    if (this.metrics.searchTime.length > 50) {
      this.metrics.searchTime = this.metrics.searchTime.slice(-50)
    }
  }

  /**
   * 获取性能报告
   */
  async getPerformanceReport(): Promise<PerformanceMetrics> {
    // 更新内存和存储使用情况
    this.measureMemoryUsage()
    await this.measureStorageUsage()

    return this.metrics as PerformanceMetrics
  }

  /**
   * 获取性能评分
   */
  getPerformanceScore(): {
    overall: number
    details: {
      loading: number
      interactivity: number
      visualStability: number
      memory: number
    }
  } {
    const loading = this.calculateLoadingScore()
    const interactivity = this.calculateInteractivityScore()
    const visualStability = this.calculateVisualStabilityScore()
    const memory = this.calculateMemoryScore()

    const overall = Math.round((loading + interactivity + visualStability + memory) / 4)

    return {
      overall,
      details: {
        loading,
        interactivity,
        visualStability,
        memory,
      },
    }
  }

  /**
   * 计算加载性能评分
   */
  private calculateLoadingScore(): number {
    const fcp = this.metrics.firstContentfulPaint || 0
    const lcp = this.metrics.largestContentfulPaint || 0

    let score = 100

    // FCP 评分 (< 1.8s = 100, > 3s = 0)
    if (fcp > 3000) score -= 30
    else if (fcp > 1800) score -= ((fcp - 1800) / 1200) * 30

    // LCP 评分 (< 2.5s = 100, > 4s = 0)
    if (lcp > 4000) score -= 30
    else if (lcp > 2500) score -= ((lcp - 2500) / 1500) * 30

    return Math.max(0, Math.round(score))
  }

  /**
   * 计算交互性评分
   */
  private calculateInteractivityScore(): number {
    const fid = this.metrics.firstInputDelay || 0

    let score = 100

    // FID 评分 (< 100ms = 100, > 300ms = 0)
    if (fid > 300) score = 0
    else if (fid > 100) score -= ((fid - 100) / 200) * 100

    return Math.max(0, Math.round(score))
  }

  /**
   * 计算视觉稳定性评分
   */
  private calculateVisualStabilityScore(): number {
    const cls = this.metrics.cumulativeLayoutShift || 0

    let score = 100

    // CLS 评分 (< 0.1 = 100, > 0.25 = 0)
    if (cls > 0.25) score = 0
    else if (cls > 0.1) score -= ((cls - 0.1) / 0.15) * 100

    return Math.max(0, Math.round(score))
  }

  /**
   * 计算内存使用评分
   */
  private calculateMemoryScore(): number {
    const memoryPercentage = this.metrics.memoryUsage?.percentage || 0

    let score = 100

    // 内存使用评分 (< 50% = 100, > 80% = 0)
    if (memoryPercentage > 80) score = 0
    else if (memoryPercentage > 50) score -= ((memoryPercentage - 50) / 30) * 100

    return Math.max(0, Math.round(score))
  }

  /**
   * 清理观察器
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()

// 性能优化建议
export const getPerformanceOptimizationSuggestions = (metrics: PerformanceMetrics) => {
  const suggestions: string[] = []

  if (metrics.firstContentfulPaint > 1800) {
    suggestions.push('考虑优化首次内容绘制时间，可以通过代码分割、懒加载等方式改善')
  }

  if (metrics.largestContentfulPaint > 2500) {
    suggestions.push('最大内容绘制时间较长，建议优化图片加载和关键资源')
  }

  if (metrics.firstInputDelay > 100) {
    suggestions.push('首次输入延迟较高，考虑减少主线程阻塞时间')
  }

  if (metrics.cumulativeLayoutShift > 0.1) {
    suggestions.push('布局偏移较大，建议为图片和动态内容设置固定尺寸')
  }

  if (metrics.memoryUsage?.percentage > 70) {
    suggestions.push('内存使用率较高，建议清理不必要的数据和优化内存管理')
  }

  if (metrics.storageUsage?.localStorage > 5 * 1024 * 1024) {
    suggestions.push('本地存储使用过多，考虑清理旧数据或使用更高效的存储方案')
  }

  return suggestions
}
