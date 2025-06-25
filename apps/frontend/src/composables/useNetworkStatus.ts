import { computed, readonly, toRef, onMounted, onUnmounted, reactive } from 'vue'

interface NetworkConnection {
  effectiveType?: string
  type?: string
  addEventListener?: (event: string, handler: () => void) => void
  removeEventListener?: (event: string, handler: () => void) => void
}

/**
 * 网络状态管理 Composable
 * 检测网络连接状态，处理离线/在线模式切换
 */

/**
 * 网络状态接口
 */
interface NetworkState {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string
  lastOnlineTime: Date | null
  lastOfflineTime: Date | null
}

/**
 * 网络状态 Composable
 */
export function useNetworkStatus() {
  // 网络状态
  const networkState = reactive<NetworkState>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    lastOnlineTime: navigator.onLine ? new Date() : null,
    lastOfflineTime: navigator.onLine ? null : new Date(),
  })

  // 网络状态变化回调列表
  const onlineCallbacks: Array<() => void> = []
  const offlineCallbacks: Array<() => void> = []

  /**
   * 检测连接类型和速度
   */
  const detectConnectionInfo = () => {
    // 使用 Network Information API（如果可用）
    const connection =
      (navigator as unknown as { connection?: NetworkConnection }).connection ||
      (navigator as unknown as { mozConnection?: NetworkConnection }).mozConnection ||
      (navigator as unknown as { webkitConnection?: NetworkConnection }).webkitConnection

    if (connection) {
      networkState.connectionType = connection.effectiveType || connection.type || 'unknown'

      // 判断是否为慢速连接
      const slowTypes = ['slow-2g', '2g', '3g']
      networkState.isSlowConnection =
        slowTypes.includes(connection.effectiveType || '') ||
        (connection.downlink && connection.downlink < 1.5)
    }
  }

  /**
   * 处理在线状态变化
   */
  const handleOnline = () => {
    networkState.isOnline = true
    networkState.lastOnlineTime = new Date()

    detectConnectionInfo()

    console.log('Network connection restored')

    // 触发在线回调
    onlineCallbacks.forEach((callback) => {
      try {
        callback()
      } catch (e) {
        console.error('Online callback error:', e)
      }
    })

    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent('networkOnline', {
        detail: {
          timestamp: networkState.lastOnlineTime,
          connectionType: networkState.connectionType,
          isSlowConnection: networkState.isSlowConnection,
        },
      })
    )
  }

  /**
   * 处理离线状态变化
   */
  const handleOffline = () => {
    networkState.isOnline = false
    networkState.lastOfflineTime = new Date()

    console.log('Network connection lost')

    // 触发离线回调
    offlineCallbacks.forEach((callback) => {
      try {
        callback()
      } catch (e) {
        console.error('Offline callback error:', e)
      }
    })

    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent('networkOffline', {
        detail: {
          timestamp: networkState.lastOfflineTime,
        },
      })
    )
  }

  /**
   * 主动检测网络连接
   */
  const checkConnection = async (): Promise<boolean> => {
    try {
      // 尝试请求一个小的资源来检测连接
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5秒超时
      })

      const isConnected = response.ok

      // 更新状态（如果与当前状态不同）
      if (isConnected !== networkState.isOnline) {
        if (isConnected) {
          handleOnline()
        } else {
          handleOffline()
        }
      }

      return isConnected
    } catch {
      // 请求失败，认为是离线
      if (networkState.isOnline) {
        handleOffline()
      }
      return false
    }
  }

  /**
   * 注册在线状态变化回调
   */
  const onOnline = (callback: () => void): (() => void) => {
    onlineCallbacks.push(callback)

    // 返回取消注册的函数
    return () => {
      const index = onlineCallbacks.indexOf(callback)
      if (index > -1) {
        onlineCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 注册离线状态变化回调
   */
  const onOffline = (callback: () => void): (() => void) => {
    offlineCallbacks.push(callback)

    // 返回取消注册的函数
    return () => {
      const index = offlineCallbacks.indexOf(callback)
      if (index > -1) {
        offlineCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 获取离线时长
   */
  const getOfflineDuration = (): number => {
    if (networkState.isOnline || !networkState.lastOfflineTime) {
      return 0
    }
    return Date.now() - networkState.lastOfflineTime.getTime()
  }

  /**
   * 获取在线时长
   */
  const getOnlineDuration = (): number => {
    if (!networkState.isOnline || !networkState.lastOnlineTime) {
      return 0
    }
    return Date.now() - networkState.lastOnlineTime.getTime()
  }

  /**
   * 格式化网络状态文本
   */
  const getStatusText = (): string => {
    if (!networkState.isOnline) {
      const offlineDuration = getOfflineDuration()
      const minutes = Math.floor(offlineDuration / (1000 * 60))
      if (minutes > 0) {
        return `离线 ${minutes} 分钟`
      }
      return '离线'
    }

    if (networkState.isSlowConnection) {
      return `在线 (${networkState.connectionType} - 慢速连接)`
    }

    return `在线 (${networkState.connectionType})`
  }

  // 计算属性
  const isOnline = readonly(toRef(networkState, 'isOnline'))
  const isSlowConnection = readonly(toRef(networkState, 'isSlowConnection'))
  const connectionType = readonly(toRef(networkState, 'connectionType'))
  const statusText = computed(getStatusText)

  // 初始化
  onMounted(() => {
    // 监听浏览器的在线/离线事件
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 监听连接信息变化
    const connection = (navigator as unknown as { connection?: NetworkConnection }).connection
    if (connection) {
      connection.addEventListener('change', detectConnectionInfo)
    }

    // 初始检测
    detectConnectionInfo()

    // 定期检查连接状态（每30秒）
    const checkInterval = setInterval(() => {
      if (navigator.onLine) {
        checkConnection()
      }
    }, 30000)

    // 页面可见性变化时检查连接
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        checkConnection()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 清理函数
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection) {
        connection.removeEventListener('change', detectConnectionInfo)
      }

      clearInterval(checkInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
  })

  return {
    // 状态
    isOnline,
    isSlowConnection,
    connectionType,
    statusText,
    networkState: readonly(networkState),

    // 方法
    checkConnection,
    onOnline,
    onOffline,
    getOfflineDuration,
    getOnlineDuration,
  }
}
