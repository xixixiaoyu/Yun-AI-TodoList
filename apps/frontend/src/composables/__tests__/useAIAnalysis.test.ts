import { setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock aiAnalysisService
vi.mock('@/services/aiAnalysisService', () => ({
  analyzeTodo: vi.fn().mockResolvedValue({
    priority: 3,
    estimatedTime: '30分钟',
    reasoning: 'Mock analysis result',
  }),
  batchAnalyzeTodos: vi.fn(),
  reanalyzeTodo: vi.fn(),
}))

// Mock aiConfigService
vi.mock('@/services/aiConfigService', () => ({
  checkAIAvailability: vi.fn().mockReturnValue(true),
  getAIStatusMessage: vi.fn().mockReturnValue(''),
}))

// Mock useErrorHandler
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}))

import { useAIAnalysis } from '../useAIAnalysis'

describe('useAIAnalysis', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()
    testEnv.localStorage.setItem('deepseek_api_key', 'test-key')
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('配置管理', () => {
    it('应该初始化默认配置', () => {
      const { analysisConfig } = useAIAnalysis()

      expect(analysisConfig.value.autoAnalyzeNewTodos).toBe(true)
      expect(analysisConfig.value.enablePriorityAnalysis).toBe(true)
      expect(analysisConfig.value.enableTimeEstimation).toBe(true)
      expect(analysisConfig.value.enableSubtaskSplitting).toBe(false)
    })

    it('应该提供分析功能开关', () => {
      const { isAnalysisEnabled } = useAIAnalysis()
      expect(typeof isAnalysisEnabled.value).toBe('boolean')
    })
  })

  describe('状态管理', () => {
    it('应该正确管理分析状态', () => {
      const { isAnalyzing, isBatchAnalyzing, analysisProgress, analysisTotal } = useAIAnalysis()

      expect(isAnalyzing.value).toBe(false)
      expect(isBatchAnalyzing.value).toBe(false)
      expect(analysisProgress.value).toBe(0)
      expect(analysisTotal.value).toBe(0)
    })
  })

  describe('工具函数', () => {
    it('应该提供优先级星级显示', () => {
      const { getPriorityStars } = useAIAnalysis()

      expect(getPriorityStars(1)).toBe('⭐')
      expect(getPriorityStars(3)).toBe('⭐⭐⭐')
      expect(getPriorityStars(5)).toBe('⭐⭐⭐⭐⭐')
      expect(getPriorityStars()).toBe('')
    })

    it('应该提供优先级颜色类', () => {
      const { getPriorityColorClass } = useAIAnalysis()

      expect(getPriorityColorClass(1)).toContain('text-gray')
      expect(getPriorityColorClass(5)).toContain('text-red')
    })
  })
})
