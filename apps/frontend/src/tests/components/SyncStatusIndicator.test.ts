import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import SyncStatusIndicator from '../../components/common/SyncStatusIndicator.vue'

// Mock composables
const mockSyncState = reactive({
  syncInProgress: false,
  syncError: null,
  lastSyncTime: null,
})

const mockSyncStatusText = ref('尚未同步')
const mockManualSync = vi.fn()
const mockIsAuthenticated = ref(true)

vi.mock('../../composables/useDataSync', () => ({
  useDataSync: () => ({
    syncState: mockSyncState,
    syncStatusText: mockSyncStatusText,
    manualSync: mockManualSync,
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
        'storage.retrySync': '重试同步',
        'common.close': '关闭',
        'storage.syncFailed': '同步失败',
      }
      return translations[key] || key
    },
  }),
}))

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    mockSyncState.syncInProgress = false
    mockSyncState.syncError = null
    mockSyncState.lastSyncTime = null
    mockSyncStatusText.value = '尚未同步'
    mockIsAuthenticated.value = true
  })

  afterEach(async () => {
    // 清理通知状态
    try {
      const { useNotifications } = await import('@/composables/useNotifications')
      const { clearNotifications } = useNotifications()
      clearNotifications()
    } catch (error) {
      // 忽略导入错误
    }
  })

  it('should not show when user is not authenticated', () => {
    mockIsAuthenticated.value = false
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.sync-indicator').exists()).toBe(false)
  })

  it('should show when sync is in progress', () => {
    mockSyncState.syncInProgress = true
    mockSyncStatusText.value = '同步中...'
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.sync-indicator').exists()).toBe(true)
    expect(wrapper.find('.indicator-syncing').exists()).toBe(true)
    expect(wrapper.text()).toContain('同步中...')
  })

  it('should show when there is a sync error', () => {
    mockSyncState.syncError = '网络错误'
    mockSyncStatusText.value = '同步失败'
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.sync-indicator').exists()).toBe(true)
    expect(wrapper.find('.indicator-error').exists()).toBe(true)
  })

  it('should show retry button when there is an error', () => {
    mockSyncState.syncError = '网络错误'
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.retry-button').exists()).toBe(true)
  })

  it('should show close button by default', () => {
    mockSyncState.syncInProgress = true
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.close-button').exists()).toBe(false) // 同步中时不显示关闭按钮

    // 同步完成后应该显示关闭按钮
    mockSyncState.syncInProgress = false
    mockSyncState.lastSyncTime = new Date()
    const wrapper2 = mount(SyncStatusIndicator)
    expect(wrapper2.find('.close-button').exists()).toBe(true)
  })

  it('should hide close button when showClose is false', () => {
    mockSyncState.lastSyncTime = new Date()
    const wrapper = mount(SyncStatusIndicator, {
      props: { showClose: false },
    })
    expect(wrapper.find('.close-button').exists()).toBe(false)
  })

  it('should call manualSync when retry button is clicked', async () => {
    mockSyncState.syncError = '网络错误'
    const wrapper = mount(SyncStatusIndicator)

    await wrapper.find('.retry-button').trigger('click')
    expect(mockManualSync).toHaveBeenCalled()
  })

  it('should hide after user dismisses and respect silence period', async () => {
    // 显示成功状态
    mockSyncState.lastSyncTime = new Date()
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.sync-indicator').exists()).toBe(true)

    // 用户点击关闭
    await wrapper.find('.close-button').trigger('click')
    await nextTick()

    // 应该隐藏
    expect(wrapper.find('.sync-indicator').exists()).toBe(false)
  })

  it('should show important states even during silence period', async () => {
    // 用户先关闭了成功状态
    mockSyncState.lastSyncTime = new Date()
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.sync-indicator').exists()).toBe(true)

    await wrapper.find('.close-button').trigger('click')
    await nextTick()

    // 现在有同步错误，应该仍然显示
    mockSyncState.syncError = '网络错误'
    await wrapper.vm.$forceUpdate()
    await nextTick()
    expect(wrapper.find('.sync-indicator').exists()).toBe(true)
    expect(wrapper.find('.indicator-error').exists()).toBe(true)
  })

  it('should auto-hide after recent sync', async () => {
    // 模拟最近同步（在autoHideDelay时间内）
    const recentTime = new Date(Date.now() - 1000) // 1秒前
    mockSyncState.lastSyncTime = recentTime

    const wrapper = mount(SyncStatusIndicator, {
      props: { autoHideDelay: 2000 }, // 2秒自动隐藏
    })

    expect(wrapper.find('.sync-indicator').exists()).toBe(true)

    // 模拟时间过去，超过autoHideDelay
    // 直接测试组件的计算属性逻辑，而不是依赖时间变化
    const oldTime = new Date(Date.now() - 3000) // 3秒前，超过了2秒的autoHideDelay
    mockSyncState.lastSyncTime = oldTime
    await wrapper.vm.$forceUpdate()
    await nextTick()

    expect(wrapper.find('.sync-indicator').exists()).toBe(false)
  })

  it('should show progress bar when syncing', () => {
    mockSyncState.syncInProgress = true
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)
    expect(wrapper.find('.progress-fill').exists()).toBe(true)
  })

  it('should not show progress bar when not syncing', () => {
    mockSyncState.syncInProgress = false
    mockSyncState.lastSyncTime = new Date()
    const wrapper = mount(SyncStatusIndicator)
    expect(wrapper.find('.progress-bar').exists()).toBe(false)
  })
})

// 新增：通知系统集成测试
describe('Notification System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create and auto-remove success notifications', async () => {
    const { useNotifications } = await import('@/composables/useNotifications')
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
    const { useNotifications } = await import('@/composables/useNotifications')
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
    const { useNotifications } = await import('@/composables/useNotifications')
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
    const { useNotifications } = await import('@/composables/useNotifications')
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
