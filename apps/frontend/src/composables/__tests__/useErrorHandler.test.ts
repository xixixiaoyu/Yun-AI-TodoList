import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// 辅助函数：重置模块并设置 mock
const setupMocksAndImport = async () => {
  vi.resetModules()

  // Mock vue-i18n
  vi.doMock('vue-i18n', () => ({
    useI18n: vi.fn(() => ({
      t: vi.fn((key: string) => key),
      te: vi.fn(() => false),
    })),
  }))

  // Mock logger
  vi.doMock('../../utils/logger', () => ({
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }))

  const { useErrorHandler } = await import('../useErrorHandler')
  return useErrorHandler()
}

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: vi.fn((key: string) => key),
    te: vi.fn(() => false),
  })),
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useErrorHandler', () => {
  let mockLogger: typeof import('../../utils/logger').logger

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    const { logger } = await import('../../utils/logger')
    mockLogger = logger
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('错误处理初始化', () => {
    it('应该初始化错误处理器', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { error, success, errorHistory } = useErrorHandler()

      expect(error.value).toBe('')
      expect(success.value).toBe('')
      expect(errorHistory.value).toEqual([])
    })
  })

  describe('错误显示', () => {
    it('应该显示错误消息', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, error, errorHistory } = useErrorHandler()

      showError('测试错误消息')

      expect(error.value).toBe('测试错误消息')
      expect(errorHistory.value).toHaveLength(1)
      expect(errorHistory.value[0]).toMatchObject({
        message: '测试错误消息',
        timestamp: expect.any(String),
      })
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Error message displayed',
        { message: '测试错误消息' },
        'ErrorHandler'
      )
    })

    it('应该自动清除错误消息', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, error } = useErrorHandler()

      showError('测试错误')
      expect(error.value).toBe('测试错误')

      // 快进 5 秒
      vi.advanceTimersByTime(5000)
      await nextTick()

      expect(error.value).toBe('')
    })

    it('应该处理非字符串错误消息', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, error } = useErrorHandler()

      const errorObject = { message: '对象错误' }
      showError(String(errorObject))

      expect(error.value).toBe('[object Object]')
    })

    it('应该记录错误历史', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, errorHistory } = useErrorHandler()

      showError('错误1')
      showError('错误2')
      showError('错误3')

      expect(errorHistory.value).toHaveLength(3)
      expect(errorHistory.value[0].message).toBe('错误1')
      expect(errorHistory.value[1].message).toBe('错误2')
      expect(errorHistory.value[2].message).toBe('错误3')
    })
  })

  describe('成功消息显示', () => {
    it('应该显示成功消息', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showSuccess, success } = useErrorHandler()

      showSuccess('操作成功')

      expect(success.value).toBe('操作成功')
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Success message displayed',
        { message: '操作成功' },
        'ErrorHandler'
      )
    })

    it('应该使用翻译的成功消息', async () => {
      vi.resetModules()

      // 创建特殊的 mock 用于翻译测试
      const mockTe = vi.fn().mockReturnValue(true)
      const mockT = vi.fn().mockReturnValue('翻译后的成功消息')

      vi.doMock('vue-i18n', () => ({
        useI18n: vi.fn(() => ({
          t: mockT,
          te: mockTe,
        })),
      }))

      vi.doMock('../../utils/logger', () => ({
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
        },
      }))

      const { useErrorHandler } = await import('../useErrorHandler')
      const { showSuccess, success } = useErrorHandler()

      showSuccess('success.operation')
      await nextTick()

      expect(success.value).toBe('翻译后的成功消息')
      expect(mockTe).toHaveBeenCalledWith('success.operation')
      expect(mockT).toHaveBeenCalledWith('success.operation')
    })

    it('应该使用原始消息当翻译不存在时', async () => {
      const { showSuccess, success } = await setupMocksAndImport()

      showSuccess('原始成功消息')
      await nextTick()

      expect(success.value).toBe('原始成功消息')
    })

    it('应该自动清除成功消息', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showSuccess, success } = useErrorHandler()

      showSuccess('测试成功', 2000)
      expect(success.value).toBe('测试成功')

      // 快进 2 秒
      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(success.value).toBe('')
    })

    it('应该使用默认持续时间', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showSuccess, success } = useErrorHandler()

      showSuccess('测试成功')
      expect(success.value).toBe('测试成功')

      // 快进 3 秒（默认持续时间）
      vi.advanceTimersByTime(3000)
      await nextTick()

      expect(success.value).toBe('')
    })

    it('应该处理成功处理器中的错误', async () => {
      // 重新导入模块以确保使用新的 mock
      vi.resetModules()

      // 重新设置 mock
      const mockUseI18n = vi.fn(() => ({
        t: vi.fn((key: string) => key),
        te: vi.fn(() => {
          throw new Error('翻译错误')
        }),
      }))

      vi.doMock('vue-i18n', () => ({
        useI18n: mockUseI18n,
      }))

      const { useErrorHandler } = await import('../useErrorHandler')
      const { showSuccess } = useErrorHandler()

      expect(() => showSuccess('测试消息')).not.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in success handler',
        expect.any(Error),
        'ErrorHandler'
      )
    })
  })

  describe('消息清除', () => {
    it('应该手动清除错误消息', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, clearError, error } = useErrorHandler()

      showError('测试错误')
      expect(error.value).toBe('测试错误')

      clearError()
      expect(error.value).toBe('')
    })

    it('应该手动清除成功消息', async () => {
      const { showSuccess, clearSuccess, success } = await setupMocksAndImport()

      showSuccess('测试成功')
      await nextTick()
      expect(success.value).toBe('测试成功')

      clearSuccess()
      expect(success.value).toBe('')
    })
  })

  describe('错误历史管理', () => {
    it('应该获取错误历史副本', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, getErrorHistory, errorHistory } = useErrorHandler()

      showError('错误1')
      showError('错误2')

      const history = getErrorHistory()

      expect(history).toHaveLength(2)
      expect(history).not.toBe(errorHistory.value) // 应该是副本
      expect(history[0].message).toBe('错误1')
      expect(history[1].message).toBe('错误2')
    })

    it('应该返回空数组当没有错误历史时', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { getErrorHistory } = useErrorHandler()

      const history = getErrorHistory()

      expect(history).toEqual([])
    })

    it('应该保持错误历史的时间戳格式', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, getErrorHistory } = useErrorHandler()

      const beforeTime = new Date().toISOString()
      showError('测试错误')
      const afterTime = new Date().toISOString()

      const history = getErrorHistory()
      const timestamp = history[0].timestamp

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(timestamp >= beforeTime).toBe(true)
      expect(timestamp <= afterTime).toBe(true)
    })
  })

  describe('响应式状态', () => {
    it('应该返回响应式的错误状态', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { error, showError } = useErrorHandler()

      expect(error.value).toBe('')

      showError('新错误')
      expect(error.value).toBe('新错误')
    })

    it('应该返回响应式的成功状态', async () => {
      const { success, showSuccess } = await setupMocksAndImport()

      expect(success.value).toBe('')

      showSuccess('新成功')
      await nextTick()
      expect(success.value).toBe('新成功')
    })

    it('应该返回响应式的错误历史', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { errorHistory, showError } = useErrorHandler()

      expect(errorHistory.value).toHaveLength(0)

      showError('错误1')
      expect(errorHistory.value).toHaveLength(1)

      showError('错误2')
      expect(errorHistory.value).toHaveLength(2)
    })
  })

  describe('并发处理', () => {
    it('应该正确处理多个并发错误', async () => {
      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, errorHistory } = useErrorHandler()

      // 同时显示多个错误
      showError('错误1')
      showError('错误2')
      showError('错误3')

      expect(errorHistory.value).toHaveLength(3)
      expect(errorHistory.value.map((e) => e.message)).toEqual(['错误1', '错误2', '错误3'])
    })

    it('应该正确处理错误和成功消息的混合', async () => {
      const { showError, showSuccess, error, success, errorHistory } = await setupMocksAndImport()

      showError('错误消息')
      showSuccess('成功消息')

      // 等待下一个 tick 确保状态更新
      await nextTick()

      expect(error.value).toBe('错误消息')
      expect(success.value).toBe('成功消息')
      expect(errorHistory.value).toHaveLength(1)
    })
  })

  describe('定时器管理', () => {
    it('应该正确管理多个定时器', async () => {
      // 重置模块并重新设置假定时器
      vi.resetModules()
      vi.useFakeTimers()

      // 重新 mock
      const mockT = vi.fn((key: string) => key)
      const mockTe = vi.fn(() => false)

      vi.doMock('vue-i18n', () => ({
        useI18n: vi.fn(() => ({
          t: mockT,
          te: mockTe,
        })),
      }))

      vi.doMock('../../utils/logger', () => ({
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
        },
      }))

      const { useErrorHandler } = await import('../useErrorHandler')
      const { showError, showSuccess, error, success } = useErrorHandler()

      showError('错误1')
      showSuccess('成功1', 1000)
      showError('错误2') // 这会覆盖错误1
      showSuccess('成功2', 2000) // 这会覆盖成功1

      // 等待下一个 tick 确保状态更新
      await nextTick()

      expect(error.value).toBe('错误2')
      expect(success.value).toBe('成功2')

      // 快进 1 秒
      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(error.value).toBe('错误2') // 错误需要 5 秒才清除
      expect(success.value).toBe('成功2') // 成功2 还在（2秒后清除）

      // 再快进 1 秒
      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(success.value).toBe('') // 成功2 清除了（总共2秒）

      // 再快进 3 秒
      vi.advanceTimersByTime(3000)
      await nextTick()

      expect(error.value).toBe('') // 错误也清除了（总共5秒）
    })
  })
})
