import { setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()

    // 清除 localStorage 中的主题设置
    testEnv.localStorage.removeItem('theme')

    // 模拟 matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('初始化', () => {
    it('应该默认使用 auto 主题', () => {
      const { theme } = useTheme()
      expect(theme.value).toBe('auto')
    })

    it('应该从 localStorage 加载保存的主题', () => {
      testEnv.localStorage.setItem('theme', 'dark')

      const { theme } = useTheme()
      expect(theme.value).toBe('dark')
    })

    it('应该处理无效的主题值', () => {
      testEnv.localStorage.setItem('theme', 'invalid')

      const { theme } = useTheme()
      // useTheme 直接从 localStorage 读取，不进行验证
      expect(theme.value).toBe('invalid')
    })
  })

  describe('主题切换', () => {
    it('应该正确切换主题：auto -> light -> dark -> auto', () => {
      const { theme, toggleTheme } = useTheme()

      expect(theme.value).toBe('auto')

      toggleTheme()
      expect(theme.value).toBe('light')

      toggleTheme()
      expect(theme.value).toBe('dark')

      toggleTheme()
      expect(theme.value).toBe('auto')
    })

    it('应该保存主题到 localStorage', async () => {
      const { toggleTheme } = useTheme()

      toggleTheme() // auto -> light
      // 等待 watch 回调执行
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(testEnv.localStorage.getItem('theme')).toBe('light')

      toggleTheme() // light -> dark
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(testEnv.localStorage.getItem('theme')).toBe('dark')

      toggleTheme() // dark -> auto
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(testEnv.localStorage.getItem('theme')).toBe('auto')
    })
  })

  describe('主题应用', () => {
    it('应该在 light 主题时设置正确的 data-theme 属性', async () => {
      const { theme } = useTheme()

      theme.value = 'light'

      // 等待 watch 回调执行
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('应该在 dark 主题时设置正确的 data-theme 属性', async () => {
      const { theme } = useTheme()

      theme.value = 'dark'

      // 等待 watch 回调执行
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('应该在 auto 主题时根据系统偏好设置 data-theme', async () => {
      // 模拟系统偏好为 dark
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { theme } = useTheme()

      theme.value = 'auto'

      // 等待 watch 回调执行
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })

  describe('响应式更新', () => {
    it('应该在主题变化时自动应用', async () => {
      const { theme } = useTheme()

      theme.value = 'dark'

      // 等待响应式更新
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })

  describe('系统主题监听', () => {
    it('应该监听系统主题变化', () => {
      const mockAddListener = vi.fn()

      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: mockAddListener,
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      useTheme()

      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function))
    })
  })
})
