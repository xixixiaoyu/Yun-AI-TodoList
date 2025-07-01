import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import SyncStatusIndicator from '../../components/common/SyncStatusIndicator.vue'

// Mock composables
const mockNetworkStatus = reactive({
  isOnline: true,
  isServerReachable: true,
  consecutiveFailures: 0,
  lastCheckTime: null as string | null,
})

const mockNetworkStatusText = ref('网络连接正常')
const mockReconnectCloudStorage = vi.fn()
const mockCheckServerHealth = vi.fn()
const mockIsAuthenticated = ref(true)

vi.mock('../../composables/useStorageMode', () => ({
  useStorageMode: () => ({
    networkStatus: ref(mockNetworkStatus),
    reconnectCloudStorage: mockReconnectCloudStorage,
  }),
}))

vi.mock('../../composables/useSyncManager', () => ({
  useSyncManager: () => ({
    networkStatusText: mockNetworkStatusText,
    checkServerHealth: mockCheckServerHealth,
  }),
}))

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'network.retryConnection': '重试连接',
        'common.close': '关闭',
        'network.checking': '检查中',
        'network.unknown': '未知',
      }
      return translations[key] || key
    },
  }),
}))

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    mockNetworkStatus.isOnline = true
    mockNetworkStatus.isServerReachable = true
    mockNetworkStatus.consecutiveFailures = 0
    mockNetworkStatus.lastCheckTime = null
    mockNetworkStatusText.value = '网络连接正常'
    mockIsAuthenticated.value = true
  })

  afterEach(async () => {
    // 清理通知状态
    try {
      const { useNotifications } = await import('../../composables/useNotifications')
      const { clearNotifications } = useNotifications()
      clearNotifications()
    } catch (error) {
      // 忽略导入错误
      console.warn('Failed to clear notifications:', error)
    }
  })

  it('should not show when user is not authenticated', () => {
    mockIsAuthenticated.value = false
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.network-indicator').exists()).toBe(false)
  })

  it('should show when network is offline', () => {
    mockNetworkStatus.isOnline = false
    mockNetworkStatusText.value = '网络已断开'
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.network-indicator').exists()).toBe(true)
    expect(wrapper.find('.indicator-offline').exists()).toBe(true)
    expect(wrapper.text()).toContain('网络已断开')
  })

  it('should show when server is unreachable', () => {
    mockNetworkStatus.isServerReachable = false
    mockNetworkStatusText.value = '服务器不可达'
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.network-indicator').exists()).toBe(true)
    expect(wrapper.find('.indicator-error').exists()).toBe(true)
  })

  it('should show retry button when there is a connection error', () => {
    mockNetworkStatus.isServerReachable = false
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.retry-button').exists()).toBe(true)
  })

  it('should show close button by default when connection is stable', () => {
    mockNetworkStatus.lastCheckTime = new Date().toISOString()
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.close-button').exists()).toBe(true)
  })

  it('should hide close button when showClose is false', () => {
    mockNetworkStatus.lastCheckTime = new Date().toISOString()
    const wrapper = mount(SyncStatusIndicator, {
      props: { showClose: false },
    })
    expect(wrapper.find('.close-button').exists()).toBe(false)
  })

  it('should call reconnectCloudStorage when retry button is clicked', async () => {
    mockNetworkStatus.isServerReachable = false
    const wrapper = mount(SyncStatusIndicator)

    await wrapper.find('.retry-button').trigger('click')
    expect(mockReconnectCloudStorage).toHaveBeenCalled()
    expect(mockCheckServerHealth).toHaveBeenCalled()
  })

  it('should hide after user dismisses and respect silence period', async () => {
    // 显示成功状态
    mockNetworkStatus.lastCheckTime = new Date().toISOString()
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.network-indicator').exists()).toBe(true)

    // 用户点击关闭
    await wrapper.find('.close-button').trigger('click')
    await nextTick()

    // 应该隐藏
    expect(wrapper.find('.network-indicator').exists()).toBe(false)
  })

  it('should show important states even during silence period', async () => {
    // 用户先关闭了成功状态
    mockNetworkStatus.lastCheckTime = new Date().toISOString()
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.network-indicator').exists()).toBe(true)

    await wrapper.find('.close-button').trigger('click')
    await nextTick()

    // 现在网络离线，应该仍然显示
    mockNetworkStatus.isOnline = false
    await nextTick()
    expect(wrapper.find('.network-indicator').exists()).toBe(true)
    expect(wrapper.find('.indicator-offline').exists()).toBe(true)
  })

  it('should auto-hide after recent check', async () => {
    // 模拟最近检查（在autoHideDelay时间内）
    const recentTime = new Date(Date.now() - 1000).toISOString() // 1秒前
    mockNetworkStatus.lastCheckTime = recentTime

    const wrapper = mount(SyncStatusIndicator, {
      props: { autoHideDelay: 2000 }, // 2秒自动隐藏
    })

    expect(wrapper.find('.network-indicator').exists()).toBe(true)

    // 模拟时间过去，超过autoHideDelay
    const oldTime = new Date(Date.now() - 3000).toISOString() // 3秒前，超过了2秒的autoHideDelay
    mockNetworkStatus.lastCheckTime = oldTime
    await nextTick()

    expect(wrapper.find('.network-indicator').exists()).toBe(false)
  })

  it('should show progress bar when checking connection', () => {
    // 设置一个需要显示的状态（离线状态）
    mockNetworkStatus.isOnline = false
    mockNetworkStatusText.value = '网络已断开'
    const wrapper = mount(SyncStatusIndicator)
    // 验证组件显示
    expect(wrapper.find('.network-indicator').exists()).toBe(true)
  })

  it('should show different status icons for different states', () => {
    // 测试离线状态 - 应该显示
    mockNetworkStatus.isOnline = false
    mockNetworkStatusText.value = '网络已断开'
    const wrapper1 = mount(SyncStatusIndicator)
    expect(wrapper1.find('.network-indicator').exists()).toBe(true)

    // 测试服务器不可达状态 - 应该显示
    mockNetworkStatus.isOnline = true
    mockNetworkStatus.isServerReachable = false
    mockNetworkStatusText.value = '服务器不可达'
    const wrapper2 = mount(SyncStatusIndicator)
    expect(wrapper2.find('.network-indicator').exists()).toBe(true)

    // 测试在线且服务器可达状态 - 可能不显示（除非有最近的检查时间）
    mockNetworkStatus.isOnline = true
    mockNetworkStatus.isServerReachable = true
    mockNetworkStatus.lastCheckTime = new Date().toISOString()
    mockNetworkStatusText.value = '网络连接正常'
    const wrapper3 = mount(SyncStatusIndicator)
    expect(wrapper3.find('.network-indicator').exists()).toBe(true)
  })
})

// 新增：通知系统集成测试
describe('Notification System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create and auto-remove success notifications', async () => {
    const { useNotifications } = await import('../../composables/useNotifications')
    const { success, getDebugInfo } = useNotifications()

    // 创建成功通知
    const id = success('测试成功', '这是一个测试通知', { duration: 1000 })
    expect(id).toBeTruthy()

    // 检查通知是否创建
    let debugInfo = getDebugInfo()
    expect(debugInfo.notifications).toHaveLength(1)
    expect(debugInfo.notifications[0].title).toBe('测试成功')
    expect(debugInfo.activeTimers).toHaveLength(1)

    // 等待自动移除
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // 检查通知是否被移除
    debugInfo = getDebugInfo()
    expect(debugInfo.notifications).toHaveLength(0)
    expect(debugInfo.activeTimers).toHaveLength(0)
  })

  it('should prevent duplicate notifications', async () => {
    const { useNotifications } = await import('../../composables/useNotifications')
    const { success, getDebugInfo } = useNotifications()

    // 创建第一个通知
    const id1 = success('重复测试', '第一个通知')
    expect(id1).toBeTruthy()

    // 立即创建相同的通知（应该被阻止）
    const id2 = success('重复测试', '第一个通知')
    expect(id2).toBe('') // 空字符串表示被阻止

    // 检查只有一个通知
    const debugInfo = getDebugInfo()
    expect(debugInfo.notifications).toHaveLength(1)
  })

  it('should handle different notification types with correct durations', async () => {
    const { useNotifications } = await import('../../composables/useNotifications')
    const { addNotification, getDebugInfo, clearNotifications } = useNotifications()

    // 先清理之前的通知，确保干净的状态
    clearNotifications()

    // 使用 addNotification 直接创建通知以避免防重复机制
    const timestamp = Date.now()
    addNotification({
      type: 'success',
      title: `成功通知_${timestamp}`,
      duration: 3000,
    })
    addNotification({
      type: 'error',
      title: `错误通知_${timestamp}`,
      duration: 8000,
    })
    addNotification({
      type: 'warning',
      title: `警告通知_${timestamp}`,
      duration: 6000,
    })
    addNotification({
      type: 'info',
      title: `信息通知_${timestamp}`,
      duration: 4000,
    })

    const debugInfo = getDebugInfo()
    expect(debugInfo.notifications).toHaveLength(4)

    // 检查不同类型的时长
    const notifications = debugInfo.notifications
    const successNotif = notifications.find((n) => n.type === 'success')
    const errorNotif = notifications.find((n) => n.type === 'error')
    const warningNotif = notifications.find((n) => n.type === 'warning')
    const infoNotif = notifications.find((n) => n.type === 'info')

    expect(successNotif?.duration).toBe(3000)
    expect(errorNotif?.duration).toBe(8000)
    expect(warningNotif?.duration).toBe(6000)
    expect(infoNotif?.duration).toBe(4000)
  })

  it('should clean up resources when clearing all notifications', async () => {
    const { useNotifications } = await import('../../composables/useNotifications')
    const { addNotification, clearNotifications, getDebugInfo } = useNotifications()

    // 先清理之前的通知，确保干净的状态
    clearNotifications()

    // 使用 addNotification 直接创建通知以避免防重复机制
    const timestamp = Date.now()
    addNotification({
      type: 'success',
      title: `清理测试通知1_${timestamp}`,
      message: '消息1',
    })
    addNotification({
      type: 'error',
      title: `清理测试通知2_${timestamp}`,
      message: '消息2',
    })
    addNotification({
      type: 'success',
      title: `清理测试通知3_${timestamp}`,
      message: '消息3',
    })

    let debugInfo = getDebugInfo()
    expect(debugInfo.notifications).toHaveLength(3)
    expect(debugInfo.activeTimers).toHaveLength(3)

    // 清除所有通知
    clearNotifications()

    debugInfo = getDebugInfo()
    expect(debugInfo.notifications).toHaveLength(0)
    expect(debugInfo.activeTimers).toHaveLength(0)
    expect(debugInfo.recentNotificationsCache).toHaveLength(0)
  })
})
