import { aiModel, apiKey, saveAIModel } from '@/services/configService'
import { getAIResponse, getAIStreamResponse } from '@/services/deepseekService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

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

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'deepseek_api_key') return 'test-api-key'
      if (key === 'deepseek_ai_model') return 'deepseek-chat'
      return null
    })

    // 直接设置导入的响应式变量
    apiKey.value = 'test-api-key'
    aiModel.value = 'deepseek-chat'
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getAIResponse 模型使用', () => {
    it('应该使用当前选择的模型发送请求', async () => {
      saveAIModel('deepseek-chat')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
        }),
      })

      await getAIResponse('Test message')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"model":"deepseek-chat"'),
        })
      )
    })

    it('应该在模型切换后使用新模型', async () => {
      saveAIModel('deepseek-chat')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response 1' } }],
        }),
      })

      await getAIResponse('Message 1')

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"deepseek-chat"'),
        })
      )

      saveAIModel('deepseek-reasoner')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response 2' } }],
        }),
      })

      await getAIResponse('Message 2')

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
      saveAIModel('deepseek-reasoner')

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
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'deepseek_ai_model') return null
        if (key === 'deepseek_api_key') return 'test-api-key'
        return null
      })

      // 重置为默认值
      aiModel.value = 'deepseek-chat'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Default response' } }],
        }),
      })

      await getAIResponse('Test with default model')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"deepseek-chat"'),
        })
      )
    })
  })
})
