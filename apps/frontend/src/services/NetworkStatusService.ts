/**
 * 增强的网络状态管理服务
 * 提供更准确的网络连接检测和状态管理
 */

export interface NetworkStatus {
  isOnline: boolean
  isServerReachable: boolean
  connectionType: string
  isSlowConnection: boolean
  latency: number
  lastCheckTime: Date
  consecutiveFailures: number
}

export interface NetworkCheckOptions {
  timeout: number
  retries: number
  endpoint: string
  method: 'HEAD' | 'GET'
}

export class NetworkStatusService {
  private status: NetworkStatus = {
    isOnline: navigator.onLine,
    isServerReachable: false,
    connectionType: 'unknown',
    isSlowConnection: false,
    latency: 0,
    lastCheckTime: new Date(),
    consecutiveFailures: 0,
  }

  private checkInterval: number | null = null
  private listeners: Array<(status: NetworkStatus) => void> = []
  private defaultOptions: NetworkCheckOptions = {
    timeout: 5000,
    retries: 2,
    endpoint: '/api/v1/health',
    method: 'HEAD',
  }

  constructor() {
    this.setupEventListeners()
    this.startPeriodicCheck()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.status.isOnline = true
      this.checkServerReachability()
      this.notifyListeners()
    })

    window.addEventListener('offline', () => {
      this.status.isOnline = false
      this.status.isServerReachable = false
      this.status.consecutiveFailures++
      this.notifyListeners()
    })

    // 监听连接类型变化
    if ('connection' in navigator) {
      const connection = (navigator as Record<string, unknown>).connection as EventTarget & {
        effectiveType?: string
        type?: string
      }
      connection.addEventListener('change', () => {
        this.updateConnectionInfo()
        this.notifyListeners()
      })
    }
  }

  /**
   * 更新连接信息
   */
  private updateConnectionInfo() {
    const connection = (navigator as Record<string, unknown>).connection as {
      effectiveType?: string
      type?: string
    }
    if (connection) {
      this.status.connectionType = connection.effectiveType || connection.type || 'unknown'

      // 判断是否为慢速连接
      const slowTypes = ['slow-2g', '2g', '3g']
      this.status.isSlowConnection =
        slowTypes.includes(connection.effectiveType) ||
        (connection.downlink && connection.downlink < 1.5)
    }
  }

  /**
   * 检查服务器可达性
   */
  async checkServerReachability(options?: Partial<NetworkCheckOptions>): Promise<boolean> {
    const opts = { ...this.defaultOptions, ...options }
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout)

      const response = await fetch(opts.endpoint, {
        method: opts.method,
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })

      clearTimeout(timeoutId)

      const latency = Date.now() - startTime
      const isReachable = response.ok || response.status < 500

      this.status.isServerReachable = isReachable
      this.status.latency = latency
      this.status.lastCheckTime = new Date()

      if (isReachable) {
        this.status.consecutiveFailures = 0
      } else {
        this.status.consecutiveFailures++
      }

      return isReachable
    } catch (error) {
      this.status.isServerReachable = false
      this.status.latency = Date.now() - startTime
      this.status.lastCheckTime = new Date()
      this.status.consecutiveFailures++

      console.warn('Server reachability check failed:', error)
      return false
    }
  }

  /**
   * 执行带重试的网络检查
   */
  async checkWithRetry(options?: Partial<NetworkCheckOptions>): Promise<boolean> {
    const opts = { ...this.defaultOptions, ...options }

    for (let attempt = 0; attempt <= opts.retries; attempt++) {
      const isReachable = await this.checkServerReachability(opts)

      if (isReachable) {
        return true
      }

      // 如果不是最后一次尝试，等待一段时间再重试
      if (attempt < opts.retries) {
        await this.delay(1000 * (attempt + 1)) // 递增延迟
      }
    }

    return false
  }

  /**
   * 启动定期检查
   */
  private startPeriodicCheck() {
    // 每30秒检查一次服务器可达性
    this.checkInterval = window.setInterval(() => {
      if (this.status.isOnline) {
        this.checkServerReachability()
      }
    }, 30000)

    // 立即执行一次检查
    if (this.status.isOnline) {
      this.checkServerReachability()
    }
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * 获取当前网络状态
   */
  getStatus(): NetworkStatus {
    return { ...this.status }
  }

  /**
   * 检查是否可以进行同步操作
   */
  canSync(): boolean {
    return (
      this.status.isOnline && this.status.isServerReachable && this.status.consecutiveFailures < 3
    )
  }

  /**
   * 检查是否为慢速连接
   */
  isSlowConnection(): boolean {
    return this.status.isSlowConnection || this.status.latency > 3000
  }

  /**
   * 获取连接质量评分 (0-100)
   */
  getConnectionQuality(): number {
    if (!this.status.isOnline || !this.status.isServerReachable) {
      return 0
    }

    let score = 100

    // 根据延迟扣分
    if (this.status.latency > 1000) score -= 30
    else if (this.status.latency > 500) score -= 15
    else if (this.status.latency > 200) score -= 5

    // 根据连接类型扣分
    switch (this.status.connectionType) {
      case 'slow-2g':
        score -= 50
        break
      case '2g':
        score -= 40
        break
      case '3g':
        score -= 20
        break
      case '4g':
        score -= 5
        break
    }

    // 根据连续失败次数扣分
    score -= this.status.consecutiveFailures * 10

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 获取推荐的同步策略
   */
  getRecommendedSyncStrategy(): 'immediate' | 'delayed' | 'batch' | 'disabled' {
    const quality = this.getConnectionQuality()

    if (quality >= 80) return 'immediate'
    if (quality >= 50) return 'delayed'
    if (quality >= 20) return 'batch'
    return 'disabled'
  }

  /**
   * 添加状态变化监听器
   */
  addListener(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.push(callback)

    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.getStatus())
      } catch (error) {
        console.error('Network status listener error:', error)
      }
    })
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 清理资源
   */
  destroy() {
    this.stopPeriodicCheck()
    this.listeners = []

    window.removeEventListener('online', this.setupEventListeners)
    window.removeEventListener('offline', this.setupEventListeners)
  }

  /**
   * 手动触发网络检查
   */
  async forceCheck(): Promise<NetworkStatus> {
    await this.checkServerReachability()
    this.updateConnectionInfo()
    this.notifyListeners()
    return this.getStatus()
  }

  /**
   * 重置连续失败计数
   */
  resetFailureCount() {
    this.status.consecutiveFailures = 0
  }

  /**
   * 获取网络状态摘要
   */
  getStatusSummary(): string {
    const status = this.status

    if (!status.isOnline) {
      return '离线'
    }

    if (!status.isServerReachable) {
      return '网络连接异常'
    }

    const quality = this.getConnectionQuality()
    if (quality >= 80) return '网络良好'
    if (quality >= 50) return '网络一般'
    if (quality >= 20) return '网络较差'
    return '网络很差'
  }
}
