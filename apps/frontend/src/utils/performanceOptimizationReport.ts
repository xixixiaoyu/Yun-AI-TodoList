/**
 * 性能优化和内存泄露检查报告生成器
 * 提供全面的性能分析和优化建议
 */

import { getActiveResourcesStats } from './memoryLeakFixes'
import { performanceMonitor } from './performance'

export interface OptimizationIssue {
  type: 'performance' | 'memory' | 'build' | 'network'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  recommendation: string
  code?: string
}

export interface OptimizationReport {
  timestamp: string
  summary: {
    totalIssues: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
  }
  issues: OptimizationIssue[]
  resourceStats: {
    timers: number
    intervals: number
    eventListeners: number
    abortControllers: number
  }
  memoryUsage?: {
    used: number
    total: number
    limit: number
  }
  recommendations: string[]
}

export class PerformanceOptimizationReporter {
  private issues: OptimizationIssue[] = []

  /**
   * 生成完整的优化报告
   */
  generateReport(): OptimizationReport {
    this.issues = []

    // 检查各种性能问题
    this.checkMemoryLeaks()
    this.checkPerformanceMetrics()
    this.checkResourceUsage()
    this.checkBuildOptimizations()
    this.checkNetworkOptimizations()

    const summary = this.generateSummary()
    const resourceStats = getActiveResourcesStats()
    const memoryUsage = performanceMonitor.getMemoryUsage()
    const recommendations = this.generateRecommendations()

    return {
      timestamp: new Date().toISOString(),
      summary,
      issues: this.issues,
      resourceStats,
      memoryUsage: memoryUsage || undefined,
      recommendations,
    }
  }

  /**
   * 检查内存泄露
   */
  private checkMemoryLeaks(): void {
    const resourceStats = getActiveResourcesStats()

    // 检查活跃资源数量
    if (resourceStats.timers > 20) {
      this.addIssue({
        type: 'memory',
        severity: 'high',
        title: '定时器过多',
        description: `检测到 ${resourceStats.timers} 个活跃定时器`,
        recommendation:
          '检查是否有未清理的 setTimeout/setInterval，使用 safeSetTimeout 和 clearSafeTimeout',
        code: `
// 错误示例
setTimeout(() => {}, 1000)

// 正确示例
import { safeSetTimeout, clearSafeTimeout } from '@/utils/memoryLeakFixes'
const timerId = safeSetTimeout(() => {}, 1000)
// 在组件卸载时清理
onUnmounted(() => clearSafeTimeout(timerId))
        `.trim(),
      })
    }

    if (resourceStats.eventListeners > 30) {
      this.addIssue({
        type: 'memory',
        severity: 'high',
        title: '事件监听器过多',
        description: `检测到 ${resourceStats.eventListeners} 个活跃事件监听器`,
        recommendation:
          '检查是否有未清理的事件监听器，使用 safeAddEventListener 和 safeRemoveEventListener',
        code: `
// 错误示例
document.addEventListener('click', handler)

// 正确示例
import { safeAddEventListener, safeRemoveEventListener } from '@/utils/memoryLeakFixes'
onMounted(() => safeAddEventListener(document, 'click', handler))
onUnmounted(() => safeRemoveEventListener(document, 'click', handler))
        `.trim(),
      })
    }

    if (resourceStats.abortControllers > 10) {
      this.addIssue({
        type: 'memory',
        severity: 'medium',
        title: 'AbortController 过多',
        description: `检测到 ${resourceStats.abortControllers} 个活跃 AbortController`,
        recommendation: '检查网络请求是否正确取消，使用 createManagedAbortController',
        code: `
// 正确示例
import { createManagedAbortController } from '@/utils/memoryLeakFixes'
const controller = createManagedAbortController()
fetch(url, { signal: controller.signal })
        `.trim(),
      })
    }
  }

  /**
   * 检查性能指标
   */
  private checkPerformanceMetrics(): void {
    const memoryUsage = performanceMonitor.getMemoryUsage()

    if (memoryUsage) {
      const percentage = (memoryUsage.used / memoryUsage.total) * 100

      if (percentage > 80) {
        this.addIssue({
          type: 'performance',
          severity: 'critical',
          title: '内存使用率过高',
          description: `内存使用率达到 ${percentage.toFixed(1)}%`,
          recommendation: '立即检查内存泄露，清理不必要的对象引用',
        })
      } else if (percentage > 60) {
        this.addIssue({
          type: 'performance',
          severity: 'medium',
          title: '内存使用率较高',
          description: `内存使用率为 ${percentage.toFixed(1)}%`,
          recommendation: '监控内存使用情况，考虑优化数据结构',
        })
      }
    }

    // 检查性能监控中的潜在问题
    const leakDetection = performanceMonitor.detectMemoryLeaks()
    leakDetection.potentialLeaks.forEach((leak) => {
      this.addIssue({
        type: 'performance',
        severity: 'medium',
        title: '性能问题',
        description: leak,
        recommendation: leakDetection.recommendations.join('; '),
      })
    })
  }

  /**
   * 检查资源使用情况
   */
  private checkResourceUsage(): void {
    // 检查是否有大量的 DOM 节点
    const domNodes = document.querySelectorAll('*').length
    if (domNodes > 5000) {
      this.addIssue({
        type: 'performance',
        severity: 'medium',
        title: 'DOM 节点过多',
        description: `页面包含 ${domNodes} 个 DOM 节点`,
        recommendation: '考虑使用虚拟滚动或分页来减少 DOM 节点数量',
      })
    }

    // 检查是否有过多的样式表
    const stylesheets = document.styleSheets.length
    if (stylesheets > 20) {
      this.addIssue({
        type: 'build',
        severity: 'low',
        title: '样式表过多',
        description: `页面加载了 ${stylesheets} 个样式表`,
        recommendation: '合并和压缩 CSS 文件，使用 CSS 代码分割',
      })
    }
  }

  /**
   * 检查构建优化
   */
  private checkBuildOptimizations(): void {
    // 检查 console 语句（在生产环境中）
    try {
      if (
        typeof console !== 'undefined' &&
        typeof import.meta !== 'undefined' &&
        (import.meta as { env: { DEV?: boolean } }).env &&
        !(import.meta as { env: { DEV?: boolean } }).env.DEV
      ) {
        this.addIssue({
          type: 'build',
          severity: 'low',
          title: 'Console 语句未移除',
          description: '生产环境中仍包含 console 语句',
          recommendation: '配置构建工具在生产环境中移除 console 语句',
        })
      }
    } catch {
      // 忽略环境检查错误
    }
  }

  /**
   * 检查网络优化
   */
  private checkNetworkOptimizations(): void {
    // 检查是否启用了 Service Worker
    if (!('serviceWorker' in navigator)) {
      this.addIssue({
        type: 'network',
        severity: 'medium',
        title: 'Service Worker 不可用',
        description: '浏览器不支持 Service Worker',
        recommendation: '考虑为不支持 Service Worker 的浏览器提供降级方案',
      })
    }

    // 检查网络连接
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection && connection.effectiveType === 'slow-2g') {
        this.addIssue({
          type: 'network',
          severity: 'high',
          title: '网络连接缓慢',
          description: '检测到缓慢的网络连接',
          recommendation: '启用资源压缩，减少网络请求，使用 CDN',
        })
      }
    }
  }

  /**
   * 添加问题到列表
   */
  private addIssue(issue: OptimizationIssue): void {
    this.issues.push(issue)
  }

  /**
   * 生成摘要
   */
  private generateSummary() {
    const summary = {
      totalIssues: this.issues.length,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
    }

    this.issues.forEach((issue) => {
      switch (issue.severity) {
        case 'critical':
          summary.criticalIssues++
          break
        case 'high':
          summary.highIssues++
          break
        case 'medium':
          summary.mediumIssues++
          break
        case 'low':
          summary.lowIssues++
          break
      }
    })

    return summary
  }

  /**
   * 生成总体建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.issues.some((i) => i.type === 'memory' && i.severity === 'high')) {
      recommendations.push('立即修复内存泄露问题，使用提供的内存管理工具')
    }

    if (this.issues.some((i) => i.type === 'performance' && i.severity === 'critical')) {
      recommendations.push('优化性能关键路径，减少主线程阻塞')
    }

    if (this.issues.some((i) => i.type === 'build')) {
      recommendations.push('优化构建配置，启用代码分割和压缩')
    }

    if (this.issues.some((i) => i.type === 'network')) {
      recommendations.push('优化网络请求，启用缓存和压缩')
    }

    if (recommendations.length === 0) {
      recommendations.push('应用性能良好，继续保持最佳实践')
    }

    return recommendations
  }
}

// 导出单例实例
export const performanceReporter = new PerformanceOptimizationReporter()

/**
 * 快速生成性能报告
 */
export function generatePerformanceReport(): OptimizationReport {
  return performanceReporter.generateReport()
}

/**
 * 在控制台输出性能报告
 */
export function logPerformanceReport(): void {
  const report = generatePerformanceReport()

  console.group('🚀 性能优化报告')
  console.warn('📊 摘要:', report.summary)
  console.warn('💾 资源统计:', report.resourceStats)
  if (report.memoryUsage) {
    console.warn('🧠 内存使用:', report.memoryUsage)
  }

  if (report.issues.length > 0) {
    console.group('⚠️ 发现的问题')
    report.issues.forEach((issue) => {
      const emoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
      }[issue.severity]

      console.group(`${emoji} ${issue.title}`)
      console.warn('描述:', issue.description)
      console.warn('建议:', issue.recommendation)
      if (issue.code) {
        console.warn('代码示例:', issue.code)
      }
      console.groupEnd()
    })
    console.groupEnd()
  }

  console.warn('💡 总体建议:', report.recommendations)
  console.groupEnd()
}
