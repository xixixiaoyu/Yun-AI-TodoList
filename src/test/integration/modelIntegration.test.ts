import { saveAIModel } from '@/services/configService'
import { getAIResponse, getAIStreamResponse } from '@/services/deepseekService'
import type { AIModel } from '@/services/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('模型集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock API key
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'deepseek_api_key') return 'test-api-key'
      if (key === 'deepseek_ai_model') return 'deepseek-chat'
      return null
    })

    // 重新初始化配置
    const { apiKey, aiModel } = require('@/services/configService')
    apiKey.value = 'test-api-key'
    aiModel.value = 'deepseek-chat'
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getAIResponse 模型使用', () => {
    it('应该使用当前选择的模型发送请求', async () => {
      // 设置模型为 deepseek-chat
      saveAIModel('deepseek-chat')

      // Mock 成功响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
        }),
      })

      await getAIResponse('Test message')

      // 验证 fetch 被调用时使用了正确的模型
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"model":"deepseek-chat"'),
        })
      )
    })

    it('应该在模型切换后使用新模型', async () => {
      // 先设置为 deepseek-chat
      saveAIModel('deepseek-chat')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response 1' } }],
        }),
      })

      await getAIResponse('Message 1')

      // 验证第一次调用使用 deepseek-chat
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"deepseek-chat"'),
        })
      )

      // 切换到 deepseek-reasoner
      saveAIModel('deepseek-reasoner')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response 2' } }],
        }),
      })

      await getAIResponse('Message 2')

      // 验证第二次调用使用 deepseek-reasoner
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"deepseek-reasoner"'),
        })
      )
    })
  })

  describe('getAIStreamResponse 模型使用', () => {
    it('应该在流式响应中使用当前选择的模型', async () => {
      // 设置模型为 deepseek-reasoner
      saveAIModel('deepseek-reasoner')

      // Mock 流式响应
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'
            ),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: [DONE]\n\n'),
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined,
          }),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      })

      const chunks: string[] = []
      const onChunk = (chunk: string) => {
        chunks.push(chunk)
      }

      await getAIStreamResponse([{ role: 'user', content: 'Test' }], onChunk)

      // 验证 fetch 被调用时使用了正确的模型
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"model":"deepseek-reasoner"'),
        })
      )
    })
  })

  describe('默认模型行为', () => {
    it('应该在没有保存模型时使用默认的 deepseek-chat', async () => {
      // 清除 localStorage 中的模型设置
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'deepseek_ai_model') return null
        if (key === 'deepseek_api_key') return 'test-api-key'
        return null
      })

      // 重新初始化模型（模拟应用启动）
      const { aiModel } = await import('@/services/configService')
      aiModel.value = (localStorage.getItem('deepseek_ai_model') as AIModel) || 'deepseek-chat'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Default response' } }],
        }),
      })

      await getAIResponse('Test with default model')

      // 验证使用了默认模型 deepseek-chat
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"deepseek-chat"'),
        })
      )
    })
  })
})
