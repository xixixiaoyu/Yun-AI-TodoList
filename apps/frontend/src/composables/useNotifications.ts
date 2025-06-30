/**
 * 通知系统 Composable
 * 管理全局的通知消息，包括成功、错误、警告和信息提示
 */

import { reactive, readonly, ref } from 'vue'

/**
 * 通知类型
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/**
 * 通知接口
 */
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    style?: 'primary' | 'secondary' | 'danger'
  }>
  timestamp: Date
}

/**
 * 通知配置
 */
interface NotificationConfig {
  maxNotifications: number
  defaultDuration: number
  position:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center'
}

// 全局通知状态
const notifications = ref<Notification[]>([])
const config = reactive<NotificationConfig>({
  maxNotifications: 5,
  defaultDuration: 4000, // 默认4秒，更合理的时长
  position: 'top-right',
})

// 不同类型通知的默认时长配置
const DURATION_CONFIG = {
  success: 3000, // 成功通知3秒
  info: 4000, // 信息通知4秒
  warning: 6000, // 警告通知6秒
  error: 8000, // 错误通知8秒
} as const

// 定时器管理
const notificationTimers = new Map<string, number>()

// 防重复通知的缓存（存储最近的通知内容和时间）
const recentNotifications = new Map<string, number>()

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * 通知系统 Composable
 */
export function useNotifications() {
  /**
   * 检查是否为重复通知
   */
  const isDuplicateNotification = (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ): boolean => {
    const key = `${notification.type}:${notification.title}:${notification.message || ''}`
    const now = Date.now()
    const lastTime = recentNotifications.get(key)

    // 如果同样的通知在2秒内出现，认为是重复
    if (lastTime && now - lastTime < 2000) {
      return true
    }

    recentNotifications.set(key, now)
    return false
  }

  /**
   * 添加通知
   */
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
    // 定期清理过期的重复通知缓存
    if (Math.random() < 0.1) {
      // 10% 的概率执行清理
      cleanupRecentNotifications()
    }

    // 检查重复通知
    if (isDuplicateNotification(notification)) {
      console.log(`[Notification] Duplicate notification ignored: "${notification.title}"`)
      return '' // 返回空字符串表示未创建通知
    }

    const id = generateId()
    const newNotification: Notification = {
      id,
      timestamp: new Date(),
      duration:
        notification.duration ?? DURATION_CONFIG[notification.type] ?? config.defaultDuration,
      ...notification,
    }

    // 添加到通知列表
    notifications.value.unshift(newNotification)

    // 限制通知数量
    if (notifications.value.length > config.maxNotifications) {
      notifications.value = notifications.value.slice(0, config.maxNotifications)
    }

    // 设置自动移除（如果不是持久通知）
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      // 使用更健壮的定时器设置
      const timerId = window.setTimeout(() => {
        try {
          removeNotification(id)
          console.log(
            `[Notification] Auto-removed "${newNotification.title}" after ${newNotification.duration}ms`
          )
        } catch (error) {
          console.error(`[Notification] Error auto-removing notification ${id}:`, error)
        }
      }, newNotification.duration)

      // 保存定时器ID以便后续清理
      notificationTimers.set(id, timerId)

      // 调试日志
      console.log(
        `[Notification] Auto-remove timer set for "${newNotification.title}" (${newNotification.duration}ms)`,
        {
          id: id.slice(-8), // 只显示ID的后8位
          timerId,
          duration: newNotification.duration,
          persistent: newNotification.persistent,
          totalNotifications: notifications.value.length,
        }
      )
    } else if (newNotification.persistent) {
      console.log(`[Notification] Persistent notification created: "${newNotification.title}"`, {
        id: id.slice(-8),
        persistent: true,
      })
    }

    return id
  }

  /**
   * 移除通知
   */
  const removeNotification = (id: string): void => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      const notification = notifications.value[index]
      notifications.value.splice(index, 1)

      // 清理对应的定时器
      const timerId = notificationTimers.get(id)
      if (timerId) {
        window.clearTimeout(timerId)
        notificationTimers.delete(id)
        console.log(`[Notification] Timer cleared for "${notification.title}"`, { id, timerId })
      }

      console.log(`[Notification] Removed "${notification.title}"`, {
        id,
        remaining: notifications.value.length,
      })
    }
  }

  /**
   * 清理过期的重复通知缓存
   */
  const cleanupRecentNotifications = (): void => {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, timestamp] of recentNotifications) {
      if (now - timestamp > 10000) {
        // 10秒后清理
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach((key) => recentNotifications.delete(key))

    if (expiredKeys.length > 0) {
      console.log(
        `[Notification] Cleaned up ${expiredKeys.length} expired notification cache entries`
      )
    }
  }

  /**
   * 清除所有通知
   */
  const clearNotifications = (): void => {
    // 清理所有定时器
    for (const [, timerId] of notificationTimers) {
      window.clearTimeout(timerId)
    }
    notificationTimers.clear()

    // 清理重复通知缓存
    recentNotifications.clear()

    console.log(`[Notification] Cleared all notifications`, { count: notifications.value.length })
    notifications.value = []
  }

  /**
   * 成功通知
   */
  const success = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    })
  }

  /**
   * 错误通知
   */
  const error = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'error',
      title,
      message,
      ...options, // duration 会由 DURATION_CONFIG 自动设置
    })
  }

  /**
   * 警告通知
   */
  const warning = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000,
      ...options,
    })
  }

  /**
   * 信息通知
   */
  const info = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    })
  }

  /**
   * 加载通知（持久性，需要手动移除）
   */
  const loading = (title: string, message?: string): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      persistent: true,
      duration: 0,
    })
  }

  /**
   * 更新通知配置
   */
  const updateConfig = (newConfig: Partial<NotificationConfig>): void => {
    Object.assign(config, newConfig)
  }

  /**
   * 调试函数：获取当前通知状态
   */
  const getDebugInfo = () => {
    return {
      notifications: notifications.value.map((n) => ({
        id: n.id.slice(-8), // 只显示ID的后8位
        title: n.title,
        type: n.type,
        duration: n.duration,
        persistent: n.persistent,
        timestamp: n.timestamp,
        age: Date.now() - n.timestamp.getTime(), // 通知存在的时间
      })),
      activeTimers: Array.from(notificationTimers.entries()).map(([id, timerId]) => ({
        notificationId: id.slice(-8),
        timerId,
      })),
      recentNotificationsCache: Array.from(recentNotifications.entries()).map(
        ([key, timestamp]) => ({
          key,
          timestamp,
          age: Date.now() - timestamp,
        })
      ),
      config: { ...config },
      stats: {
        totalNotifications: notifications.value.length,
        activeTimers: notificationTimers.size,
        cacheEntries: recentNotifications.size,
      },
    }
  }

  /**
   * 显示认证相关的错误
   */
  const authError = (authErr: { code?: string; message?: string }): string => {
    let title = '认证失败'
    let message = '请检查您的登录信息'

    if (authErr?.code) {
      switch (authErr.code) {
        case 'INVALID_CREDENTIALS':
          title = '登录失败'
          message = '邮箱或密码错误'
          break
        case 'EMAIL_EXISTS':
          title = '注册失败'
          message = '该邮箱已被注册'
          break
        case 'USERNAME_EXISTS':
          title = '注册失败'
          message = '该用户名已被使用'
          break
        case 'ACCOUNT_LOCKED':
          title = '账户被锁定'
          message = '请联系管理员解锁'
          break
        case 'TOO_MANY_ATTEMPTS':
          title = '操作过于频繁'
          message = '请稍后再试'
          break
        case 'REFRESH_TOKEN_EXPIRED':
          title = '登录已过期'
          message = '请重新登录'
          break
        default:
          message = authErr.message || '认证过程中发生错误'
      }
    } else if (authErr?.message) {
      message = authErr.message
    }

    return error(title, message, {
      actions:
        authErr?.code === 'REFRESH_TOKEN_EXPIRED'
          ? [
              {
                label: '重新登录',
                action: () => {
                  // 可以在这里触发重新登录逻辑
                  window.location.href = '/login'
                },
                style: 'primary',
              },
            ]
          : undefined,
    })
  }

  /**
   * 同步成功通知
   */
  const syncSuccess = (stats: {
    uploaded?: number
    downloaded?: number
    conflicts?: number
  }): string => {
    const { uploaded = 0, downloaded = 0, conflicts = 0 } = stats
    let message = '数据同步完成'

    if (uploaded > 0 || downloaded > 0) {
      const parts = []
      if (uploaded > 0) parts.push(`上传 ${uploaded} 条`)
      if (downloaded > 0) parts.push(`下载 ${downloaded} 条`)
      message = `${message}：${parts.join('，')}`
    }

    if (conflicts > 0) {
      message += `，发现 ${conflicts} 个冲突`
    }

    return success('同步成功', message)
  }

  const syncError = (syncErr: { message?: string }): string => {
    let message = '数据同步失败'

    if (syncErr?.message) {
      message = syncErr.message
    }

    return error('同步失败', message, {
      actions: [
        {
          label: '重试',
          action: () => {
            // 可以在这里触发重试逻辑
            window.dispatchEvent(new CustomEvent('retrySyncRequested'))
          },
          style: 'primary',
        },
      ],
    })
  }

  /**
   * 显示网络状态通知
   */
  const networkOffline = (): string => {
    return warning('网络连接断开', '应用将在离线模式下运行，数据将在网络恢复后同步')
  }

  const networkOnline = (): string => {
    return success('网络连接恢复', '正在同步数据...')
  }

  return {
    // 状态
    notifications: readonly(notifications),
    config: readonly(config),

    // 基础方法
    addNotification,
    removeNotification,
    clearNotifications,
    updateConfig,

    // 快捷方法
    success,
    error,
    warning,
    info,
    loading,

    // 专用方法
    authError,
    syncSuccess,
    syncError,
    networkOffline,
    networkOnline,

    // 调试方法
    getDebugInfo,
  }
}
