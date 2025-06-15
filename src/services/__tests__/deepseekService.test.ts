import {
  createMockErrorResponse,
  createMockResponse,
  mockFetch,
  setupTestEnvironment
} from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  abortCurrentRequest,
  getAIResponse,
  optimizeText,
  streamAIResponse
} from '../deepseekService'

vi.mock('../configService', () => ({
  getApiKey: vi.fn().mockReturnValue('test-api-key')
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string, params?: Record<string, unknown>) => {
        const messages: Record<string, string> = {
          configureApiKey: '请先配置 API Key',
          httpError: 'HTTP 错误: {status}',
          invalidAiResponse: '无效的 AI 响应',
          networkError: '网络错误'
        }
        let message = messages[key] || key
        if (params && params.status) {
          message = message.replace('{status}', params.status.toString())
        }
        return message
      }
    }
  }
}))

describe('deepseekService', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>
  let mockFetchFn: ReturnType<typeof mockFetch>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    mockFetchFn = mockFetch()
    vi.clearAllMocks()
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
              content: 'AI response content'
            }
          }
        ]
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
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test message')
        })
      )
    })

    it('应该处理 API Key 缺失', async () => {
      const { getApiKey } = await import('../configService')
      const mockGetApiKey = getApiKey as vi.MockedFunction<typeof getApiKey>
      mockGetApiKey.mockReturnValue('')

      await expect(getAIResponse('Test message')).rejects.toThrow('请先配置 API Key')
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
        choices: [{ message: { content: 'English response' } }]
      }
      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      await getAIResponse('Test message', 'en', 0.8)

      const callArgs = mockFetchFn.mock.calls[0][1]
      const requestBody = JSON.parse(callArgs.body)

      expect(requestBody.temperature).toBe(0.8)
      expect(requestBody.messages[0].content).toContain('请用英文回复')
    })
  })

  describe('streamAIResponse', () => {
    it('应该成功流式获取 AI 响应', async () => {
      const mockStreamData = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n'
      ]

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData[0])
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData[1])
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData[2])
              })
              .mockResolvedValueOnce({ done: true })
          })
        }
      }

      mockFetchFn.mockResolvedValue(mockResponse)

      const messages = [{ role: 'user' as const, content: 'Test message' }]
      const stream = await streamAIResponse(messages)

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' world'])
    })

    it('应该处理流式响应错误', async () => {
      mockFetchFn.mockResolvedValue(createMockErrorResponse(500))

      const messages = [{ role: 'user' as const, content: 'Test message' }]

      await expect(streamAIResponse(messages)).rejects.toThrow('HTTP 错误: 500')
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
                value: new TextEncoder().encode('data: invalid json\n\n')
              })
              .mockResolvedValueOnce({ done: true })
          })
        }
      }

      mockFetchFn.mockResolvedValue(mockResponse)

      const messages = [{ role: 'user' as const, content: 'Test message' }]
      const stream = await streamAIResponse(messages)

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual([])
    })
  })

  describe('optimizeText', () => {
    it('应该成功优化文本', async () => {
      const mockResponseData = {
        choices: [
          {
            message: {
              content: 'Optimized text content'
            }
          }
        ]
      }

      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      const result = await optimizeText('Original text')

      expect(result).toBe('Optimized text content')
      expect(mockFetchFn).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Original text')
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
        choices: [{ message: { content: 'Response' } }]
      }
      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      await getAIResponse('Test message')

      const callArgs = mockFetchFn.mock.calls[0][1]
      expect(callArgs.headers).toEqual({
        Authorization: 'Bearer test-api-key',
        'Content-Type': 'application/json'
      })
    })

    it('应该设置正确的请求体', async () => {
      const mockResponseData = {
        choices: [{ message: { content: 'Response' } }]
      }
      mockFetchFn.mockResolvedValue(createMockResponse(mockResponseData))

      await getAIResponse('Test message', 'zh', 0.7)

      const callArgs = mockFetchFn.mock.calls[0][1]
      const requestBody = JSON.parse(callArgs.body)

      expect(requestBody.model).toBe('deepseek-chat')
      expect(requestBody.temperature).toBe(0.7)
      expect(requestBody.stream).toBe(false)
      expect(requestBody.messages).toHaveLength(2)
      expect(requestBody.messages[1].content).toBe('Test message')
    })
  })
})
