/**
 * 网络状态管理 Composable
 * 提供网络连接状态监控功能（简化版，专为云端存储设计）
 */

import type { NetworkStatus, StorageConfig } from '@shared/types'
import { computed, onUnmounted, reactive, readonly, ref, toRef } from 'vue'

import { useAuth } from './useAuth'

// 全局网络状态
const globalNetworkState = reactive({
  isInitialized: false,
  networkStatus: {
    isOnline: navigator.onLine,
    isServerReachable: false,
    consecutiveFailures: 0,
    lastCheckTime: undefined,
  } as NetworkStatus,
  config: {
    mode: 'cloud',
    retryAttempts: 3,
    requestTimeout: 10000,
  } as StorageConfig,
})

export function useSyncManager() {
  const { isAuthenticated } = useAuth()

  // 响应式状态
  const isOnline = ref(navigator.onLine)
  const healthCheckTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // 计算属性
  const canUseCloudStorage = computed(() => isAuthenticated.value && isOnline.value)

  const networkStatusText = computed(() => {
    const status = globalNetworkState.networkStatus
    if (!status.isOnline) {
      return '网络已断开'
    }
    if (!status.isServerReachable) {
      return '服务器不可达'
    }
    if (status.consecutiveFailures > 0) {
      return `连接不稳定 (${status.consecutiveFailures} 次失败)`
    }
    return '网络连接正常'
  })

  const connectionQualityText = computed(() => {
    const failures = globalNetworkState.networkStatus.consecutiveFailures
    if (failures === 0) return '良好'
    if (failures < 3) return '一般'
    return '较差'
  })

  /**
   * 初始化网络状态管理器
   */
  const initialize = async (config?: Partial<StorageConfig>): Promise<void> => {
    if (globalNetworkState.isInitialized) return

    try {
      // 合并配置
      if (config) {
        globalNetworkState.config = { ...globalNetworkState.config, ...config }
      }

      // 设置网络状态监听
      setupNetworkListeners()

      // 开始定期健康检查
      startHealthCheck()

      // 初始网络状态检查
      await checkServerHealth()

      globalNetworkState.isInitialized = true
      console.log('网络状态管理器初始化成功')
    } catch (error) {
      console.error('Failed to initialize network manager:', error)
      throw error
    }
  }

  /**
   * 更新配置
   */
  const updateConfig = async (newConfig: Partial<StorageConfig>): Promise<void> => {
    globalNetworkState.config = { ...globalNetworkState.config, ...newConfig }
    console.log('网络配置已更新:', newConfig)
  }

  /**
   * 检查服务器健康状态
   */
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      // 使用正确的后端 API URL
      const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8888/api/v1'
      const healthUrl = `${apiBaseUrl}/health`

      const response = await fetch(healthUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(globalNetworkState.config.requestTimeout || 10000),
      })

      const isHealthy = response.ok
      globalNetworkState.networkStatus.isServerReachable = isHealthy
      globalNetworkState.networkStatus.lastCheckTime = new Date().toISOString()

      if (isHealthy) {
        globalNetworkState.networkStatus.consecutiveFailures = 0
      } else {
        globalNetworkState.networkStatus.consecutiveFailures++
      }

      return isHealthy
    } catch (error) {
      console.error('服务器健康检查失败:', error)
      globalNetworkState.networkStatus.isServerReachable = false
      globalNetworkState.networkStatus.consecutiveFailures++
      globalNetworkState.networkStatus.lastCheckTime = new Date().toISOString()
      return false
    }
  }

  /**
   * 开始定期健康检查
   */
  const startHealthCheck = (): void => {
    // 清除现有定时器
    if (healthCheckTimer.value) {
      clearInterval(healthCheckTimer.value)
    }

    // 每30秒检查一次服务器健康状态
    healthCheckTimer.value = setInterval(() => {
      if (isOnline.value) {
        checkServerHealth()
      }
    }, 30000)
  }

  /**
   * 停止健康检查
   */
  const stopHealthCheck = (): void => {
    if (healthCheckTimer.value) {
      clearInterval(healthCheckTimer.value)
      healthCheckTimer.value = null
    }
  }

  /**
   * 设置网络状态监听器
   */
  const setupNetworkListeners = (): void => {
    const handleOnline = () => {
      isOnline.value = true
      globalNetworkState.networkStatus.isOnline = true
      console.log('网络已连接')
      // 网络恢复时立即检查服务器健康状态
      checkServerHealth()
    }

    const handleOffline = () => {
      isOnline.value = false
      globalNetworkState.networkStatus.isOnline = false
      globalNetworkState.networkStatus.isServerReachable = false
      globalNetworkState.networkStatus.consecutiveFailures++
      console.log('网络已断开')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 清理函数
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
  }

  /**
   * 销毁网络管理器，清理所有资源
   */
  const destroy = (): void => {
    // 停止健康检查
    stopHealthCheck()

    // 重置状态
    globalNetworkState.isInitialized = false
    globalNetworkState.networkStatus = {
      isOnline: navigator.onLine,
      isServerReachable: false,
      consecutiveFailures: 0,
      lastCheckTime: undefined,
    }

    console.log('网络管理器已销毁')
  }

  // 清理资源
  onUnmounted(() => {
    destroy()
  })

  return {
    // 状态
    isOnline: readonly(isOnline),
    networkStatus: readonly(toRef(globalNetworkState, 'networkStatus')),
    config: readonly(toRef(globalNetworkState, 'config')),

    // 计算属性
    canUseCloudStorage,
    networkStatusText,
    connectionQualityText,
    isInitialized: computed(() => globalNetworkState.isInitialized),

    // 方法
    initialize,
    updateConfig,
    checkServerHealth,
    startHealthCheck,
    stopHealthCheck,
    setupNetworkListeners,
    destroy,
  }
}
