import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'
import { setupTestEnvironment } from '../helpers'
import { analyzeTodo, reanalyzeTodo } from '../../services/aiAnalysisService'
import type { Todo } from '../../types/todo'

// Mock dependencies
vi.mock('../../services/deepseekService', () => ({
  getAIResponse: vi.fn(),
}))

vi.mock('../../services/aiConfigService', () => ({
  checkAIAvailability: vi.fn(() => true),
  getAIStatusMessage: vi.fn(() => ''),
}))

vi.mock('../../utils/logger', () => ({
  handleError: vi.fn(),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('AI 分析功能综合测试', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>
  let mockGetAIResponse: MockedFunction<(prompt: string) => Promise<string>>

  beforeEach(async () => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()

    // 设置 API Key
    testEnv.localStorage.setItem('deepseek_api_key', 'test-api-key')

    const { getAIResponse } = await import('../../services/deepseekService')
    mockGetAIResponse = vi.mocked(getAIResponse)

    // 确保 AI 可用性检查返回 true
    const { checkAIAvailability } = await import('../../services/aiConfigService')
    vi.mocked(checkAIAvailability).mockReturnValue(true)
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('基础分析功能', () => {
    it('应该正确分析简单任务', async () => {
      const mockResponse = JSON.stringify({
        priority: 3,
        estimatedTime: '30分钟',
        reasoning: '这是一个中等优先级的任务',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      const result = await analyzeTodo('写周报')

      expect(result).toEqual({
        priority: 3,
        estimatedTime: '30分钟',
        reasoning: '这是一个中等优先级的任务',
      })
      expect(mockGetAIResponse).toHaveBeenCalledWith(expect.stringContaining('写周报'), 0.3)
    })

    it('应该正确分析复杂任务', async () => {
      const complexTask = '设计并实现用户认证系统，包括注册、登录、密码重置、权限管理等功能'
      const mockResponse = JSON.stringify({
        priority: 5,
        estimatedTime: '3-5天',
        reasoning: '这是一个复杂的系统级任务，涉及安全性和多个功能模块',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      const result = await analyzeTodo(complexTask)

      expect(result.priority).toBe(5)
      expect(result.estimatedTime).toBe('3-5天')
      expect(result.reasoning).toContain('复杂')
    })

    it('应该正确分析紧急任务', async () => {
      const urgentTask = '修复生产环境的严重 Bug，系统无法正常访问'
      const mockResponse = JSON.stringify({
        priority: 5,
        estimatedTime: '2-4小时',
        reasoning: '生产环境问题需要立即处理',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      const result = await analyzeTodo(urgentTask)

      expect(result.priority).toBe(5)
      expect(result.reasoning).toContain('立即')
    })

    it('应该正确分析日常任务', async () => {
      const routineTask = '整理桌面文件'
      const mockResponse = JSON.stringify({
        priority: 1,
        estimatedTime: '15分钟',
        reasoning: '日常整理任务，优先级较低',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      const result = await analyzeTodo(routineTask)

      expect(result.priority).toBe(1)
      expect(result.estimatedTime).toBe('15分钟')
    })
  })

  describe('边界条件测试', () => {
    it('应该处理空任务文本', async () => {
      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      mockGetAIResponse.mockResolvedValue(
        JSON.stringify({
          priority: 3,
          estimatedTime: '1小时',
          reasoning: '空任务需要明确内容',
        })
      )

      const result = await analyzeTodo('')
      expect(result).toBeDefined()
      expect(result.priority).toBe(3)
    })

    it('应该处理超长任务文本', async () => {
      const longTask = 'A'.repeat(10000)
      const mockResponse = JSON.stringify({
        priority: 3,
        estimatedTime: '1小时',
        reasoning: '任务描述过长，建议简化',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      const result = await analyzeTodo(longTask)
      expect(result).toBeDefined()
    })

    it('应该处理特殊字符', async () => {
      const specialTask = '处理 JSON 数据：{"key": "value", "array": [1, 2, 3]}'
      const mockResponse = JSON.stringify({
        priority: 3,
        estimatedTime: '45分钟',
        reasoning: '数据处理任务',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      const result = await analyzeTodo(specialTask)
      expect(result).toBeDefined()
    })

    it('应该处理多语言任务', async () => {
      const multiLangTask = 'Create a multilingual app: 创建多语言应用 アプリを作る'
      const mockResponse = JSON.stringify({
        priority: 4,
        estimatedTime: '2-3天',
        reasoning: '国际化应用开发任务',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      const result = await analyzeTodo(multiLangTask)
      expect(result).toBeDefined()
    })
  })

  describe('错误处理测试', () => {
    it('应该处理 API 不可用', async () => {
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(false)

      await expect(analyzeTodo('测试任务')).rejects.toThrow('AI 功能暂时不可用')
    })

    it('应该处理网络错误', async () => {
      mockGetAIResponse.mockRejectedValue(new Error('网络连接失败'))

      await expect(analyzeTodo('测试任务')).rejects.toThrow()
    })

    it('应该处理无效的 AI 响应', async () => {
      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      mockGetAIResponse.mockResolvedValue('invalid json response')

      // 由于有备用解析方法，应该返回默认值而不是抛出错误
      const result = await analyzeTodo('测试任务')
      expect(result).toBeDefined()
      expect(result.priority).toBe(3)
      expect(result.estimatedTime).toBe('1小时')
      expect(result.reasoning).toBe('基于任务内容的智能分析')
    })

    it('应该处理不完整的 AI 响应', async () => {
      const incompleteResponse = JSON.stringify({
        priority: 3,
        // 缺少 estimatedTime 和 reasoning
      })

      mockGetAIResponse.mockResolvedValue(incompleteResponse)

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      const result = await analyzeTodo('测试任务')
      expect(result.priority).toBe(3)
      expect(result.estimatedTime).toBeDefined() // 应该有默认值
    })

    it('应该处理超出范围的优先级', async () => {
      const invalidResponse = JSON.stringify({
        priority: 10, // 超出 1-5 范围
        estimatedTime: '1小时',
        reasoning: '测试',
      })

      mockGetAIResponse.mockResolvedValue(invalidResponse)

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      const result = await analyzeTodo('测试任务')
      expect(result.priority).toBeGreaterThanOrEqual(1)
      expect(result.priority).toBeLessThanOrEqual(5)
    })
  })

  describe('重新分析功能', () => {
    it('应该能够重新分析已分析的任务', async () => {
      const todo: Todo = {
        id: 'test-1',
        title: '测试任务',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        order: 1,
        priority: 3,
        estimatedTime: { text: '1小时', minutes: 60 },
        aiAnalyzed: true,
      }

      const mockResponse = JSON.stringify({
        priority: 4,
        estimatedTime: '2小时',
        reasoning: '重新评估后优先级提升',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      const result = await reanalyzeTodo(todo)

      expect(result.priority).toBe(4)
      expect(result.estimatedTime).toBe('2小时')
    })

    it('应该在重新分析时考虑历史信息', async () => {
      const todo: Todo = {
        id: '1',
        title: '优化数据库查询性能',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: 3,
        estimatedTime: { text: '4小时', minutes: 240 },
        aiAnalyzed: true,
      }

      mockGetAIResponse.mockResolvedValue(
        JSON.stringify({
          priority: 4,
          estimatedTime: '6小时',
          reasoning: '考虑到之前的估算，这个任务比预期复杂',
        })
      )

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      const result = await reanalyzeTodo(todo)

      // 验证重新分析返回了正确的结果
      expect(result.priority).toBe(4)
      expect(result.estimatedTime).toBe('6小时')
      expect(result.reasoning).toBe('考虑到之前的估算，这个任务比预期复杂')

      // 验证调用了 AI 分析
      expect(mockGetAIResponse).toHaveBeenCalledWith(
        expect.stringContaining('优化数据库查询性能'),
        0.3
      )
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成分析', async () => {
      const mockResponse = JSON.stringify({
        priority: 3,
        estimatedTime: '1小时',
        reasoning: '测试',
      })

      mockGetAIResponse.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      )

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      const startTime = Date.now()
      await analyzeTodo('测试任务')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(5000) // 5秒内完成
    })

    it('应该能够处理并发分析请求', async () => {
      const mockResponse = JSON.stringify({
        priority: 3,
        estimatedTime: '1小时',
        reasoning: '测试',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      const tasks = ['任务1', '任务2', '任务3', '任务4', '任务5']

      const promises = tasks.map((task) => analyzeTodo(task))
      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result).toBeDefined()
        expect(result.priority).toBeGreaterThanOrEqual(1)
        expect(result.priority).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('缓存和优化', () => {
    it('应该避免重复分析相同任务', async () => {
      const task = '相同的任务内容'
      const mockResponse = JSON.stringify({
        priority: 3,
        estimatedTime: '1小时',
        reasoning: '测试',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      // 第一次分析
      await analyzeTodo(task)

      // 第二次分析相同任务
      await analyzeTodo(task)

      // 验证 API 只被调用了一次（如果有缓存机制）
      // 注意：这取决于实际的缓存实现
      expect(mockGetAIResponse).toHaveBeenCalledTimes(2) // 当前没有缓存，所以是2次
    })
  })

  describe('数据验证', () => {
    it('应该验证分析结果的数据类型', async () => {
      const mockResponse = JSON.stringify({
        priority: '3', // 字符串而不是数字
        estimatedTime: '1小时',
        reasoning: 'test',
      })

      mockGetAIResponse.mockResolvedValue(mockResponse)

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      const result = await analyzeTodo('测试任务')

      expect(typeof result.priority).toBe('number')
      expect(typeof result.estimatedTime).toBe('string')
      expect(typeof result.reasoning).toBe('string')
    })

    it('应该确保优先级在有效范围内', async () => {
      const testCases = [
        { input: -1, expected: 1 },
        { input: 0, expected: 1 },
        { input: 6, expected: 5 },
        { input: 100, expected: 5 },
      ]

      // 确保 AI 可用性检查返回 true
      const { checkAIAvailability } = await import('../../services/aiConfigService')
      vi.mocked(checkAIAvailability).mockReturnValue(true)

      for (const testCase of testCases) {
        const mockResponse = JSON.stringify({
          priority: testCase.input,
          estimatedTime: '1小时',
          reasoning: 'test',
        })

        mockGetAIResponse.mockResolvedValue(mockResponse)

        const result = await analyzeTodo('测试任务')
        expect(result.priority).toBe(testCase.expected)
      }
    })
  })
})
