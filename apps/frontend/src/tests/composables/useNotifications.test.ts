import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from '../../composables/useNotifications'

// Mock timers
vi.useFakeTimers()

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // 清理所有通知
    const { clearNotifications } = useNotifications()
    clearNotifications()
  })

  describe('基础通知功能', () => {
    it('should create notifications with correct properties', () => {
      const { success, getDebugInfo } = useNotifications()

      const id = success('测试标题', '测试消息')
      expect(id).toBeTruthy()

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(1)

      const notification = debugInfo.notifications[0]
      expect(notification.title).toBe('测试标题')
      expect(notification.type).toBe('success')
      expect(notification.duration).toBe(3000) // 成功通知默认3秒
    })

    it('should use correct durations for different notification types', () => {
      const { success, error, warning, info, getDebugInfo } = useNotifications()

      success('成功')
      error('错误')
      warning('警告')
      info('信息')

      const debugInfo = getDebugInfo()
      const notifications = debugInfo.notifications

      expect(notifications.find((n) => n.type === 'success')?.duration).toBe(3000)
      expect(notifications.find((n) => n.type === 'error')?.duration).toBe(8000)
      expect(notifications.find((n) => n.type === 'warning')?.duration).toBe(6000)
      expect(notifications.find((n) => n.type === 'info')?.duration).toBe(4000)
    })

    it('should allow custom duration override', () => {
      const { success, getDebugInfo } = useNotifications()

      success('自定义时长', '测试', { duration: 10000 })

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications[0].duration).toBe(10000)
    })
  })

  describe('自动移除功能', () => {
    it('should set timer for auto-removal', () => {
      const { success, getDebugInfo } = useNotifications()

      success('测试', '消息', { duration: 5000 })

      const debugInfo = getDebugInfo()
      expect(debugInfo.activeTimers).toHaveLength(1)
    })

    it('should auto-remove notification after duration', () => {
      const { success, getDebugInfo } = useNotifications()

      success('测试', '消息', { duration: 1000 })

      // 检查通知已创建
      let debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(1)
      expect(debugInfo.activeTimers).toHaveLength(1)

      // 快进时间
      vi.advanceTimersByTime(1000)

      // 检查通知已被移除
      debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(0)
      expect(debugInfo.activeTimers).toHaveLength(0)
    })

    it('should not set timer for persistent notifications', () => {
      const { loading, getDebugInfo } = useNotifications()

      loading('持久通知', '不会自动消失')

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(1)
      expect(debugInfo.activeTimers).toHaveLength(0) // 持久通知不设置定时器
    })
  })

  describe('防重复通知', () => {
    it('should prevent duplicate notifications within 2 seconds', () => {
      const { success, getDebugInfo } = useNotifications()

      const id1 = success('重复标题', '重复消息')
      const id2 = success('重复标题', '重复消息')

      expect(id1).toBeTruthy()
      expect(id2).toBe('') // 重复通知返回空字符串

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(1)
    })

    it('should allow same notification after 2 seconds', () => {
      const { success, getDebugInfo } = useNotifications()

      const id1 = success('延迟重复', '消息')
      expect(id1).toBeTruthy()

      // 快进2.1秒
      vi.advanceTimersByTime(2100)

      const id2 = success('延迟重复', '消息')
      expect(id2).toBeTruthy()

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(2)
    })

    it('should clean up expired cache entries', () => {
      const { success, getDebugInfo } = useNotifications()

      // 创建多个通知以触发缓存清理
      for (let i = 0; i < 10; i++) {
        success(`通知${i}`, `消息${i}`)
      }

      let debugInfo = getDebugInfo()
      const initialCacheSize = debugInfo.recentNotificationsCache.length
      expect(initialCacheSize).toBeGreaterThan(0)

      // 快进11秒（超过10秒清理阈值）
      vi.advanceTimersByTime(11000)

      // 创建多个新通知以确保触发清理（10%概率，多试几次）
      for (let i = 0; i < 20; i++) {
        success(`清理触发${i}`, '消息')
      }

      debugInfo = getDebugInfo()
      // 缓存应该被清理，但由于新通知也会添加到缓存，所以检查是否有清理发生
      // 这里我们检查缓存中是否有过期的条目被清理
      const hasOldEntries = debugInfo.recentNotificationsCache.some((entry) => entry.age > 10000)
      expect(hasOldEntries).toBe(false) // 不应该有超过10秒的缓存条目
    })
  })

  describe('通知数量限制', () => {
    it('should limit notifications to maxNotifications', () => {
      const { success, getDebugInfo, updateConfig } = useNotifications()

      // 设置最大通知数为3
      updateConfig({ maxNotifications: 3 })

      // 创建5个通知
      for (let i = 0; i < 5; i++) {
        success(`通知${i}`, `消息${i}`)
      }

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(3) // 只保留最新的3个
    })
  })

  describe('资源清理', () => {
    it('should clear all timers when clearing notifications', () => {
      const { success, error, clearNotifications, getDebugInfo } = useNotifications()

      success('通知1')
      error('通知2')
      success('通知3')

      let debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(3)
      expect(debugInfo.activeTimers).toHaveLength(3)

      clearNotifications()

      debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(0)
      expect(debugInfo.activeTimers).toHaveLength(0)
      expect(debugInfo.recentNotificationsCache).toHaveLength(0)
    })

    it('should clear timer when manually removing notification', () => {
      const { success, removeNotification, getDebugInfo } = useNotifications()

      const id = success('测试', '消息', { duration: 5000 })

      let debugInfo = getDebugInfo()
      expect(debugInfo.activeTimers).toHaveLength(1)

      removeNotification(id)

      debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(0)
      expect(debugInfo.activeTimers).toHaveLength(0)
    })
  })

  describe('同步通知专项测试', () => {
    it('should create sync success notification with correct format', () => {
      const { syncSuccess, getDebugInfo } = useNotifications()

      syncSuccess({ uploaded: 3, downloaded: 2, conflicts: 1 })

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(1)

      const notification = debugInfo.notifications[0]
      expect(notification.title).toBe('同步成功')
      expect(notification.type).toBe('success')
      expect(notification.duration).toBe(3000) // 成功通知3秒
    })

    it('should create sync error notification', () => {
      const { syncError, getDebugInfo } = useNotifications()

      syncError({ message: '网络连接失败' })

      const debugInfo = getDebugInfo()
      expect(debugInfo.notifications).toHaveLength(1)

      const notification = debugInfo.notifications[0]
      expect(notification.title).toBe('同步失败')
      expect(notification.type).toBe('error')
      expect(notification.duration).toBe(8000) // 错误通知8秒
    })
  })

  describe('调试功能', () => {
    it('should provide comprehensive debug information', () => {
      const { success, error, getDebugInfo } = useNotifications()

      success('测试1')
      error('测试2')

      const debugInfo = getDebugInfo()

      expect(debugInfo).toHaveProperty('notifications')
      expect(debugInfo).toHaveProperty('activeTimers')
      expect(debugInfo).toHaveProperty('recentNotificationsCache')
      expect(debugInfo).toHaveProperty('config')
      expect(debugInfo).toHaveProperty('stats')

      expect(debugInfo.stats.totalNotifications).toBe(2)
      expect(debugInfo.stats.activeTimers).toBe(2)
    })
  })
})
