import type { AITaskGenerationRequest } from '@/types/todo'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkServiceHealth,
  generateTasksFromDescription,
  getServiceStatus,
  resetServiceStats,
} from '../aiTaskGenerationService'

// Mock dependencies
vi.mock('../deepseekService', () => ({
  getAIResponse: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({
  handleError: vi.fn(),
}))

describe('aiTaskGenerationService - TODO 完成功能测试', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    resetServiceStats()
    // 确保每个测试开始时都有干净的状态
    vi.resetModules()
    // 清除缓存以避免测试间的干扰
    const { clearAllCache } = await import('../aiTaskGenerationService')
    clearAllCache()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('缓存命中率统计', () => {
    it('应该正确统计缓存命中率', async () => {
      const { getAIResponse } = await import('../deepseekService')

      // Mock AI 响应
      const mockResponse = JSON.stringify({
        tasks: [
          {
            title: '测试任务',
            description: '测试描述',
            priority: 3,
            estimatedTime: '1小时',
            category: '测试',
            tags: ['test'],
            reasoning: '测试原因',
          },
        ],
        suggestions: {
          timeframe: '1天',
          totalEstimatedTime: '1小时',
        },
      })

      vi.mocked(getAIResponse).mockResolvedValue(mockResponse)

      const request: AITaskGenerationRequest = {
        description: '创建一个测试任务',
        config: { maxTasks: 1 },
      }

      // 第一次请求 - 缓存未命中
      await generateTasksFromDescription(request)

      let status = getServiceStatus()
      expect(status.totalRequests).toBe(1)
      expect(status.cacheHits).toBe(0)
      expect(status.cacheMisses).toBe(1)
      expect(status.cacheHitRate).toBe(0)

      // 第二次相同请求 - 缓存命中
      await generateTasksFromDescription(request)

      status = getServiceStatus()
      expect(status.totalRequests).toBe(2)
      expect(status.cacheHits).toBe(1)
      expect(status.cacheMisses).toBe(1)
      expect(status.cacheHitRate).toBe(0.5)

      // 第三次相同请求 - 再次缓存命中
      await generateTasksFromDescription(request)

      status = getServiceStatus()
      expect(status.totalRequests).toBe(3)
      expect(status.cacheHits).toBe(2)
      expect(status.cacheMisses).toBe(1)
      expect(status.cacheHitRate).toBeCloseTo(0.67, 2)
    })

    it('应该正确处理不同请求的缓存统计', async () => {
      const { getAIResponse } = await import('../deepseekService')

      vi.mocked(getAIResponse).mockResolvedValue(
        JSON.stringify({
          tasks: [{ title: '任务', priority: 3 }],
          suggestions: {},
        })
      )

      // 不同的请求
      const request1: AITaskGenerationRequest = {
        description: '任务1',
        config: { maxTasks: 1 },
      }

      const request2: AITaskGenerationRequest = {
        description: '任务2',
        config: { maxTasks: 2 },
      }

      // 两个不同的请求 - 都是缓存未命中
      await generateTasksFromDescription(request1)
      await generateTasksFromDescription(request2)

      const status = getServiceStatus()
      expect(status.totalRequests).toBe(2)
      expect(status.cacheHits).toBe(0)
      expect(status.cacheMisses).toBe(2)
      expect(status.cacheHitRate).toBe(0)
    })
  })

  describe('服务健康状态检查', () => {
    it('应该正确跟踪服务健康状态 - 成功情况', async () => {
      const { getAIResponse } = await import('../deepseekService')

      vi.mocked(getAIResponse).mockResolvedValue(
        JSON.stringify({
          tasks: [{ title: '任务', priority: 3 }],
          suggestions: {},
        })
      )

      const request: AITaskGenerationRequest = {
        description: '测试任务',
        config: { maxTasks: 1 },
      }

      await generateTasksFromDescription(request)

      const status = getServiceStatus()
      expect(status.isHealthy).toBe(true)
      expect(status.consecutiveFailures).toBe(0)
      expect(status.lastError).toBeUndefined()
    })

    it('应该正确跟踪服务健康状态 - 失败情况', async () => {
      const { getAIResponse } = await import('../deepseekService')

      // Mock AI 服务失败
      vi.mocked(getAIResponse).mockRejectedValue(new Error('AI 服务不可用'))

      const request: AITaskGenerationRequest = {
        description: '测试任务失败' + Date.now(), // 使用唯一描述避免缓存
        config: { maxTasks: 1 },
      }

      // 第一次失败
      const result1 = await generateTasksFromDescription(request)
      expect(result1.success).toBe(false)

      let status = getServiceStatus()
      expect(status.isHealthy).toBe(true) // 还没达到失败阈值
      expect(status.consecutiveFailures).toBe(1)
      expect(status.lastError).toBe('AI 服务不可用')

      // 第二次失败
      request.description = '测试任务失败2' + Date.now() // 避免缓存
      await generateTasksFromDescription(request)
      status = getServiceStatus()
      expect(status.consecutiveFailures).toBe(2)

      // 第三次失败 - 服务变为不健康
      request.description = '测试任务失败3' + Date.now() // 避免缓存
      await generateTasksFromDescription(request)
      status = getServiceStatus()
      expect(status.isHealthy).toBe(false)
      expect(status.consecutiveFailures).toBe(3)
    })

    it('应该在成功后重置失败计数', async () => {
      const { getAIResponse } = await import('../deepseekService')

      // 先失败两次
      vi.mocked(getAIResponse).mockRejectedValue(new Error('临时错误'))

      let request: AITaskGenerationRequest = {
        description: '测试任务失败A' + Date.now(),
        config: { maxTasks: 1 },
      }
      await generateTasksFromDescription(request)

      request = {
        description: '测试任务失败B' + Date.now(),
        config: { maxTasks: 1 },
      }
      await generateTasksFromDescription(request)

      let status = getServiceStatus()
      expect(status.consecutiveFailures).toBe(2)

      // 然后成功一次
      vi.mocked(getAIResponse).mockResolvedValue(
        JSON.stringify({
          tasks: [{ title: '任务', priority: 3 }],
          suggestions: {},
        })
      )

      request = {
        description: '测试任务成功' + Date.now(),
        config: { maxTasks: 1 },
      }
      await generateTasksFromDescription(request)

      status = getServiceStatus()
      expect(status.isHealthy).toBe(true)
      expect(status.consecutiveFailures).toBe(0)
      expect(status.lastError).toBeUndefined()
    })
  })

  describe('服务状态重置', () => {
    it('应该正确重置服务统计', async () => {
      const { getAIResponse } = await import('../deepseekService')

      // 先产生一些统计数据
      vi.mocked(getAIResponse).mockRejectedValue(new Error('测试错误'))

      let request: AITaskGenerationRequest = {
        description: '测试任务重置A' + Date.now(),
        config: { maxTasks: 1 },
      }
      await generateTasksFromDescription(request)

      request = {
        description: '测试任务重置B' + Date.now(),
        config: { maxTasks: 1 },
      }
      await generateTasksFromDescription(request)

      let status = getServiceStatus()
      expect(status.totalRequests).toBe(2)
      expect(status.consecutiveFailures).toBe(2)

      // 重置统计
      resetServiceStats()

      status = getServiceStatus()
      expect(status.totalRequests).toBe(0)
      expect(status.cacheHits).toBe(0)
      expect(status.cacheMisses).toBe(0)
      expect(status.consecutiveFailures).toBe(0)
      expect(status.isHealthy).toBe(true)
      expect(status.lastError).toBeUndefined()
    })
  })

  describe('服务健康检查', () => {
    it('应该正确执行健康检查', async () => {
      const { getAIResponse } = await import('../deepseekService')

      // Mock 成功响应
      vi.mocked(getAIResponse).mockResolvedValue(
        JSON.stringify({
          tasks: [{ title: '测试任务', priority: 3 }],
          suggestions: {},
        })
      )

      const isHealthy = await checkServiceHealth()
      expect(isHealthy).toBe(true)
    })

    it('应该在健康检查失败时返回 false', async () => {
      const { getAIResponse } = await import('../deepseekService')

      // Mock 失败响应
      vi.mocked(getAIResponse).mockRejectedValue(new Error('服务不可用'))

      const isHealthy = await checkServiceHealth()
      expect(isHealthy).toBe(false)
    })
  })

  describe('服务状态信息', () => {
    it('应该返回完整的服务状态信息', () => {
      const status = getServiceStatus()

      expect(status).toHaveProperty('cacheSize')
      expect(status).toHaveProperty('cacheHitRate')
      expect(status).toHaveProperty('totalRequests')
      expect(status).toHaveProperty('cacheHits')
      expect(status).toHaveProperty('cacheMisses')
      expect(status).toHaveProperty('isHealthy')
      expect(status).toHaveProperty('consecutiveFailures')
      expect(status).toHaveProperty('lastHealthCheck')
      expect(status).toHaveProperty('uptime')

      expect(typeof status.cacheSize).toBe('number')
      expect(typeof status.cacheHitRate).toBe('number')
      expect(typeof status.totalRequests).toBe('number')
      expect(typeof status.isHealthy).toBe('boolean')
      expect(typeof status.uptime).toBe('number')
    })
  })
})
