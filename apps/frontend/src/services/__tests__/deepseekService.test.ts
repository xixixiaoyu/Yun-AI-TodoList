import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'
import {
  abortCurrentRequest,
  getAIResponse,
  getAIStreamResponse,
  optimizeText,
} from '../deepseekService'

// Mock test helpers
const createMockResponse = (data: any) => ({
  ok: true,
  json: () => Promise.resolve(data),
})

const createMockErrorResponse = (status: number, statusText = 'Error') => ({
  ok: false,
  status,
  statusText,
})

const mockFetch = () => {
  const mockFn = vi.fn()
  global.fetch = mockFn
  return mockFn
}

const setupTestEnvironment = () => {
  const localStorage = {
    data: {} as Record<string, string>,
    setItem: (key: string, value: string) => {
      localStorage.data[key] = value
    },
    getItem: (key: string) => localStorage.data[key] || null,
    clear: () => {
      localStorage.data = {}
    },
  }

  Object.defineProperty(global, 'localStorage', {
    value: localStorage,
    writable: true,
  })

  return {
    localStorage,
    cleanup: () => {
      localStorage.clear()
    },
  }
}

vi.mock('../configService', () => ({
  getApiKey: vi.fn().mockReturnValue('test-api-key'),
  getAIModel: vi.fn().mockReturnValue('deepseek-chat'),
  getBaseUrl: vi.fn().mockReturnValue('https://api.deepseek.com'),
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string, params?: Record<string, unknown>) => {
        const messages: Record<string, string> = {
          configureApiKey: '请先配置 API Key',
          httpError: 'HTTP 错误: {status}',
          invalidAiResponse: '无效的 AI 响应',
          networkError: '网络错误',
          networkConnectionError: '网络连接错误',
          streamError: '流错误',
          jsonParseError: 'JSON 解析错误',
          requestAborted: '请求已中止',
          aiResponseError: 'AI 响应错误',
          apiError: 'API 错误: {error}',
          unknownError: '未知错误',
          textOptimizationError: '文本优化错误',
        }
        let message = messages[key] || key
        if (params) {
          Object.keys(params).forEach((paramKey) => {
            message = message.replace(`{${paramKey}}`, params[paramKey]?.toString() || '')
          })
        }
        return message
      },
    },
  },
}))

describe('deepseekService', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>
  let mockFetchFn: ReturnType<typeof mockFetch>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    mockFetchFn = mockFetch()
    vi.clearAllMocks()

    // 设置系统提示词配置
    testEnv.localStorage.setItem(
      'system_prompt_config',
      JSON.stringify({
        enabled: true,
        activePromptId: 'test-prompt-1',
      })
    )

    testEnv.localStorage.setItem(
      'system_prompts',
      JSON.stringify([
        {
          id: 'test-prompt-1',
          name: '英文回复助手',
          content: '请用英文回复用户的问题。',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ])
    )
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('getAIResponse', () => {
    it('应该成功获取 AI 响应', async () => {
      const mockResponseData = {
        choices: [
          {
            message: {
              content: 'AI response content',
            },
          },
        ],
      }

      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      const result = await getAIResponse('Test message')

      expect(result).toBe('AI response content')
      expect(mockFetchFn).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Test message'),
        })
      )
    })

    it('应该处理 API Key 缺失', async () => {
      const { getApiKey } = await import('../configService')
      const mockGetApiKey = getApiKey as MockedFunction<typeof getApiKey>
      mockGetApiKey.mockReturnValueOnce('')

      await expect(getAIResponse('Test message')).rejects.toThrow('请先配置 API Key')

      // 恢复原始 mock
      mockGetApiKey.mockReturnValue('test-api-key')
    })

    it('应该处理 HTTP 错误', async () => {
      mockFetchFn.mockResolvedValue(createMockErrorResponse(500, 'Server Error'))

      await expect(getAIResponse('Test message')).rejects.toThrow('HTTP 错误: 500')
    })

    it('应该处理无效的 AI 响应', async () => {
      const invalidResponse = { invalid: 'response' }
      mockFetchFn.mockResolvedValue(createMockResponse(invalidResponse))

      await expect(getAIResponse('Test message')).rejects.toThrow('无效的 AI 响应')
    })

    it('应该支持不同语言和温度参数', async () => {
      const mockResponseData = {
        choices: [{ message: { content: 'English response' } }],
      }
      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      await getAIResponse('Test message', 0.8)

      const callArgs = mockFetchFn.mock.calls[0][1]
      const requestBody = JSON.parse(callArgs.body)

      expect(requestBody.temperature).toBe(0.8)
      expect(requestBody.messages[0].content).toContain('请用英文回复')
    })
  })

  describe('getAIStreamResponse', () => {
    it('应该成功流式获取 AI 响应', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ]

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData[0]),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData[1]),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData[2]),
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      }

      mockFetchFn.mockResolvedValue(mockResponse)

      const messages = [{ role: 'user' as const, content: 'Test message' }]
      const chunks: string[] = []
      const onChunk = (chunk: string) => chunks.push(chunk)

      await getAIStreamResponse(messages, onChunk)

      expect(chunks).toEqual(['Hello', ' world', '[DONE]'])
    })

    it('应该处理流式响应错误', async () => {
      mockFetchFn.mockResolvedValue(createMockErrorResponse(500))

      const messages = [{ role: 'user' as const, content: 'Test message' }]
      const onChunk = (_chunk: string) => {}

      await expect(getAIStreamResponse(messages, onChunk)).rejects.toThrow('HTTP 错误: 500')
    })

    it('应该处理流式响应中的无效数据', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: invalid json\n\n'),
              })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      }

      mockFetchFn.mockResolvedValue(mockResponse)

      const messages = [{ role: 'user' as const, content: 'Test message' }]
      const chunks: string[] = []
      const onChunk = (chunk: string) => chunks.push(chunk)

      await getAIStreamResponse(messages, onChunk)

      expect(chunks).toEqual([])
    })
  })

  describe('optimizeText', () => {
    it('应该成功优化文本', async () => {
      const mockResponseData = {
        choices: [
          {
            message: {
              content: 'Optimized text content',
            },
          },
        ],
      }

      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      const result = await optimizeText('Original text')

      expect(result).toBe('Optimized text content')
      expect(mockFetchFn).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Original text'),
        })
      )
    })

    it('应该处理优化失败', async () => {
      mockFetchFn.mockResolvedValue(createMockErrorResponse(400))

      await expect(optimizeText('Original text')).rejects.toThrow('HTTP 错误: 400')
    })
  })

  describe('abortCurrentRequest', () => {
    it('应该能够中止当前请求', () => {
      expect(() => abortCurrentRequest()).not.toThrow()
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      mockFetchFn.mockRejectedValue(new Error('Network error'))

      await expect(getAIResponse('Test message')).rejects.toThrow()
    })

    it('应该处理超时错误', async () => {
      mockFetchFn.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )

      await expect(getAIResponse('Test message')).rejects.toThrow()
    })
  })

  describe('请求配置', () => {
    it('应该设置正确的请求头', async () => {
      const mockResponseData = {
        choices: [{ message: { content: 'Response' } }],
      }
      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      await getAIResponse('Test message')

      const callArgs = mockFetchFn.mock.calls[0][1]
      expect(callArgs.headers).toEqual({
        Authorization: 'Bearer test-api-key',
        'Content-Type': 'application/json',
      })
    })

    it('应该设置正确的请求体', async () => {
      const mockResponseData = {
        choices: [{ message: { content: 'Response' } }],
      }
      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      await getAIResponse('Test message', 0.3)

      const callArgs = mockFetchFn.mock.calls[0][1]
      const requestBody = JSON.parse(callArgs.body)

      expect(requestBody.model).toBe('deepseek-chat')
      expect(requestBody.temperature).toBe(0.3)
      expect(requestBody.stream).toBe(false)
      expect(requestBody.messages).toHaveLength(2)
      expect(requestBody.messages[1].content).toBe('Test message')
    })
  })
})
