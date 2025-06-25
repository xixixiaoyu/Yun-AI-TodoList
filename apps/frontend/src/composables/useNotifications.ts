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
  defaultDuration: 5000,
  position: 'top-right',
})

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 通知系统 Composable
 */
export function useNotifications() {
  /**
   * 添加通知
   */
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
    const id = generateId()
    const newNotification: Notification = {
      id,
      timestamp: new Date(),
      duration: config.defaultDuration,
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
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  /**
   * 移除通知
   */
  const removeNotification = (id: string): void => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * 清除所有通知
   */
  const clearNotifications = (): void => {
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
      duration: 8000, // 错误消息显示更长时间
      ...options,
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
   * 显示认证相关的错误
   */
  const authError = (error: { code?: string; message?: string }): string => {
    let title = '认证失败'
    let message = '请检查您的登录信息'

    if (error?.code) {
      switch (error.code) {
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
          message = error.message || '认证过程中发生错误'
      }
    } else if (error?.message) {
      message = error.message
    }

    return error({
      title,
      message,
      actions:
        error.code === 'REFRESH_TOKEN_EXPIRED'
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
   * 显示同步相关的通知
   */
  const syncSuccess = (stats: {
    uploaded?: number
    downloaded?: number
    conflicts?: number
  }): string => {
    const { uploaded, downloaded, conflicts } = stats
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

  const syncError = (error: { message?: string }): string => {
    let message = '数据同步失败'

    if (error?.message) {
      message = error.message
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
  }
}
