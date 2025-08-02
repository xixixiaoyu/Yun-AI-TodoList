import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { setupTestEnvironment } from '../../test/helpers'

// Mock fetch for connection testing
global.fetch = vi.fn()

// Mock AbortSignal.timeout
if (!AbortSignal.timeout) {
  AbortSignal.timeout = vi.fn((timeout: number) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeout)
    return controller.signal
  })
}

describe('useNetworkStatus', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()

    // 重置模块缓存
    vi.resetModules()

    // 重置网络状态
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })

    // 模拟 Network Information API
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        type: 'wifi',
        downlink: 10,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    // Mock fetch 成功响应
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
    } as Response)
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('基础网络状态', () => {
    it('应该初始化网络状态', async () => {
      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { isOnline, connectionType, isSlowConnection } = useNetworkStatus()

      expect(isOnline.value).toBe(true)
      expect(connectionType.value).toBe('unknown') // 初始值
      expect(isSlowConnection.value).toBe(false)
    })

    it('应该检测离线状态', async () => {
      // 模拟离线状态
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { isOnline } = useNetworkStatus()

      expect(isOnline.value).toBe(false)
    })

    it('应该提供状态文本', async () => {
      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { statusText } = useNetworkStatus()

      expect(statusText.value).toContain('在线')
    })
  })

  describe('网络状态变化监听', () => {
    it('应该监听网络上线事件', async () => {
      // 重新导入模块
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      let composableResult: ReturnType<typeof useNetworkStatus> | undefined
      const TestComponent = defineComponent({
        setup() {
          composableResult = useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      const onlineCallback = vi.fn()
      const unsubscribe = composableResult!.onOnline(onlineCallback)

      // 模拟网络上线事件
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      // 触发网络状态变化
      window.dispatchEvent(new Event('online'))
      await nextTick()

      expect(onlineCallback).toHaveBeenCalled()
      expect(composableResult!.isOnline.value).toBe(true)

      // 清理监听器
      unsubscribe()
      wrapper.unmount()
    })

    it('应该监听网络离线事件', async () => {
      // 重新导入模块
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      let composableResult: ReturnType<typeof useNetworkStatus> | undefined
      const TestComponent = defineComponent({
        setup() {
          composableResult = useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      const offlineCallback = vi.fn()
      const unsubscribe = composableResult!.onOffline(offlineCallback)

      // 模拟网络离线事件
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      // 触发网络状态变化
      window.dispatchEvent(new Event('offline'))
      await nextTick()

      expect(offlineCallback).toHaveBeenCalled()
      expect(composableResult!.isOnline.value).toBe(false)

      // 清理监听器
      unsubscribe()
      wrapper.unmount()
    })

    it('应该正确取消监听器', async () => {
      // 重新导入模块
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      let composableResult: ReturnType<typeof useNetworkStatus> | undefined
      const TestComponent = defineComponent({
        setup() {
          composableResult = useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const unsubscribe1 = composableResult!.onOnline(callback1)
      const unsubscribe2 = composableResult!.onOnline(callback2)

      // 取消第一个监听器
      unsubscribe1()

      // 触发事件
      window.dispatchEvent(new Event('online'))
      await nextTick()

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()

      // 清理
      unsubscribe2()
      wrapper.unmount()
    })
  })

  describe('网络连接测试', () => {
    it('应该能够测试网络连接', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
      } as Response)

      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { checkConnection } = useNetworkStatus()

      const result = await checkConnection()

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: expect.any(Object),
      })
    })

    it('应该处理连接测试失败', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
      } as Response)

      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { checkConnection } = useNetworkStatus()

      const result = await checkConnection()

      expect(result).toBe(false)
    })

    it('应该处理连接测试异常', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('网络错误'))

      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { checkConnection } = useNetworkStatus()

      const result = await checkConnection()

      expect(result).toBe(false)
    })
  })

  describe('时长计算', () => {
    it('应该计算离线时长', async () => {
      // 重新导入模块
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      let composableResult: any
      const TestComponent = defineComponent({
        setup() {
          composableResult = useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      // 模拟离线
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event('offline'))
      await nextTick()

      // 等待一段时间
      await new Promise((resolve) => setTimeout(resolve, 100))

      const duration = composableResult.getOfflineDuration()
      expect(duration).toBeGreaterThan(0)

      wrapper.unmount()
    })

    it('应该计算在线时长', async () => {
      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { getOnlineDuration } = useNetworkStatus()

      // 等待一段时间
      await new Promise((resolve) => setTimeout(resolve, 100))

      const duration = getOnlineDuration()
      expect(duration).toBeGreaterThan(0)
    })

    it('应该在在线时返回零离线时长', async () => {
      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { getOfflineDuration } = useNetworkStatus()

      const duration = getOfflineDuration()
      expect(duration).toBe(0)
    })
  })

  describe('网络状态恢复', () => {
    it('应该在网络恢复时更新状态', async () => {
      // 重新导入模块
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      let composableResult: any
      const TestComponent = defineComponent({
        setup() {
          composableResult = useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      const restoreCallback = vi.fn()
      composableResult.onOnline(restoreCallback)

      // 模拟网络从离线到在线
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event('offline'))
      await nextTick()

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
      window.dispatchEvent(new Event('online'))
      await nextTick()

      expect(restoreCallback).toHaveBeenCalled()
      expect(composableResult.isOnline.value).toBe(true)
      wrapper.unmount()
    })

    it('应该触发自定义网络事件', async () => {
      // 重新导入模块
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      const TestComponent = defineComponent({
        setup() {
          useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      const onlineEventListener = vi.fn()
      const offlineEventListener = vi.fn()

      window.addEventListener('networkOnline', onlineEventListener)
      window.addEventListener('networkOffline', offlineEventListener)

      // 触发离线事件
      window.dispatchEvent(new Event('offline'))
      await nextTick()

      // 触发在线事件
      window.dispatchEvent(new Event('online'))
      await nextTick()

      expect(offlineEventListener).toHaveBeenCalled()
      expect(onlineEventListener).toHaveBeenCalled()

      // 清理
      window.removeEventListener('networkOnline', onlineEventListener)
      window.removeEventListener('networkOffline', offlineEventListener)
      wrapper.unmount()
    })
  })

  describe('慢速连接检测', () => {
    it('应该检测慢速连接', async () => {
      // 模拟慢速连接
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      })

      // 重新导入模块以确保获取最新的 navigator.connection
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建一个测试组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      let composableResult: any
      const TestComponent = defineComponent({
        setup() {
          composableResult = useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      // 等待 onMounted 执行完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(composableResult.isSlowConnection.value).toBe(true)

      wrapper.unmount()
    })

    it('应该检测快速连接', async () => {
      // 模拟快速连接
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          downlink: 10,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      })

      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { isSlowConnection } = useNetworkStatus()

      // 触发连接信息检测
      window.dispatchEvent(new Event('online'))
      await nextTick()

      expect(isSlowConnection.value).toBe(false)
    })
  })

  describe('状态文本格式化', () => {
    it('应该显示离线状态文本', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { statusText } = useNetworkStatus()

      window.dispatchEvent(new Event('offline'))
      await nextTick()

      expect(statusText.value).toContain('离线')
    })

    it('应该显示慢速连接状态文本', async () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      })

      // 重新导入模块以确保获取最新的 navigator.connection
      vi.resetModules()
      const { useNetworkStatus } = await import('../useNetworkStatus')

      // 使用 Vue 测试工具创建一个测试组件来触发 onMounted
      const { mount } = await import('@vue/test-utils')
      const { defineComponent } = await import('vue')

      let composableResult: any
      const TestComponent = defineComponent({
        setup() {
          composableResult = useNetworkStatus()
          return {}
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()

      // 等待 onMounted 执行完成
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(composableResult.statusText.value).toContain('慢速连接')

      wrapper.unmount()
    })
  })

  describe('网络状态访问', () => {
    it('应该提供只读的网络状态', async () => {
      const { useNetworkStatus } = await import('../useNetworkStatus')
      const { networkState } = useNetworkStatus()

      expect(networkState.isOnline).toBe(true)
      expect(networkState.connectionType).toBe('unknown')
      expect(networkState.isSlowConnection).toBe(false)
      expect(networkState.lastOnlineTime).toBeInstanceOf(Date)
    })
  })
})
