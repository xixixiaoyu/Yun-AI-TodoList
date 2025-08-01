import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'
import { setupTestEnvironment } from '../helpers'
import { useChat } from '../../composables/useChat'

// Mock dependencies
vi.mock('../../services/deepseekService', () => ({
  getAIStreamResponse: vi.fn(),
  getAIResponse: vi.fn(),
  abortCurrentRequest: vi.fn(),
  optimizeText: vi.fn(),
}))

vi.mock('../../composables/useTodos', () => ({
  useTodos: () => ({
    todos: { value: [] },
    activeTodos: { value: [] },
    completedTodos: { value: [] },
  }),
}))

vi.mock('../../composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => (key === 'newConversation' ? '新对话' : key),
  }),
}))

describe('AI 对话功能高级测试', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>
  let mockGetAIStreamResponse: MockedFunction<
    (
      messages: any[],
      onChunk: (chunk: string) => void,
      onThinking?: (thinking: string) => void,
      temperature?: number
    ) => Promise<void>
  >

  beforeEach(async () => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()

    // 设置 API Key
    testEnv.localStorage.setItem('deepseek_api_key', 'test-api-key')

    const deepseekService = await import('../../services/deepseekService')
    mockGetAIStreamResponse = vi.mocked(deepseekService.getAIStreamResponse)
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('基础消息发送', () => {
    it('应该能够发送消息并接收响应', async () => {
      const { sendMessage, chatHistory, userMessage, isGenerating } = useChat()

      // 模拟流式响应
      mockGetAIStreamResponse.mockImplementation(async (messages, onChunk) => {
        const callback = onChunk as (chunk: string) => void
        callback('Hello')
        callback(' World')
        callback('[DONE]')
      })

      userMessage.value = '测试消息'
      await sendMessage()

      expect(chatHistory.value).toHaveLength(2)
      expect(chatHistory.value[0].content).toBe('测试消息')
      expect(chatHistory.value[0].role).toBe('user')
      expect(isGenerating.value).toBe(false)
    })

    it('应该拒绝发送空消息', async () => {
      const { sendMessage, chatHistory, userMessage } = useChat()

      userMessage.value = ''
      await sendMessage()

      expect(chatHistory.value).toHaveLength(0)
    })

    it('应该拒绝发送只包含空格的消息', async () => {
      const { sendMessage, chatHistory, userMessage } = useChat()

      userMessage.value = '   '
      await sendMessage()

      expect(chatHistory.value).toHaveLength(0)
    })

    it('应该在发送消息时设置加载状态', async () => {
      const { sendMessage, userMessage, isGenerating } = useChat()

      mockGetAIStreamResponse.mockImplementation(async (messages, onChunk) => {
        // 模拟延迟
        await new Promise((resolve) => setTimeout(resolve, 100))
        const callback = onChunk as (chunk: string) => void
        callback('回复')
        callback('[DONE]')
      })

      userMessage.value = '测试消息'

      expect(isGenerating.value).toBe(false)

      const promise = sendMessage()
      expect(isGenerating.value).toBe(true)

      await promise
      expect(isGenerating.value).toBe(false)
    })
  })

  describe('会话管理', () => {
    it('应该能够创建新会话', () => {
      const { createNewConversation, conversationHistory, currentConversationId } = useChat()

      createNewConversation('测试会话', true)

      expect(conversationHistory.value).toHaveLength(1)
      expect(conversationHistory.value[0].title).toBe('测试会话')
      expect(currentConversationId.value).toBe(conversationHistory.value[0].id)
    })

    it('应该能够切换会话', () => {
      const { createNewConversation, switchConversation, currentConversationId } = useChat()

      // 创建两个会话
      createNewConversation('会话1', true)
      const conv1Id = currentConversationId.value

      createNewConversation('会话2', true)
      const conv2Id = currentConversationId.value

      // 切换到第一个会话
      switchConversation(conv1Id as string)
      expect(currentConversationId.value).toBe(conv1Id)

      // 切换到第二个会话
      switchConversation(conv2Id as string)
      expect(currentConversationId.value).toBe(conv2Id)
    })

    it('应该能够删除会话', () => {
      const {
        createNewConversation,
        deleteConversation,
        conversationHistory,
        currentConversationId,
      } = useChat()

      // 创建两个会话
      createNewConversation('会话1', true)

      createNewConversation('会话2', true)
      const conv2Id = currentConversationId.value

      expect(conversationHistory.value).toHaveLength(2)

      // 删除当前会话
      deleteConversation(conv2Id as string)

      expect(conversationHistory.value).toHaveLength(1)
      // 验证当前会话ID是第一个会话的ID（不依赖精确匹配）
      expect(currentConversationId.value).toBeDefined()
      expect(conversationHistory.value[0].id).toBe(currentConversationId.value)
    })

    it('应该能够清空所有会话', () => {
      const { createNewConversation, clearAllConversations, conversationHistory, chatHistory } =
        useChat()

      // 创建多个会话
      createNewConversation('会话1', true)
      createNewConversation('会话2', true)

      expect(conversationHistory.value).toHaveLength(2)

      clearAllConversations()

      expect(conversationHistory.value).toHaveLength(1) // 会自动创建一个新会话
      expect(chatHistory.value).toHaveLength(0)
    })
  })

  describe('错误处理', () => {
    it('应该处理流式响应错误', async () => {
      const { sendMessage, userMessage, isGenerating, error } = useChat()

      mockGetAIStreamResponse.mockRejectedValue(new Error('网络错误'))

      userMessage.value = '测试消息'
      await sendMessage()

      expect(isGenerating.value).toBe(false)
      expect(error.value).toContain('网络错误')
    })

    it('应该处理 API 限流错误', async () => {
      const { sendMessage, userMessage, error } = useChat()

      const rateLimitError = new Error('Rate limit exceeded')
      mockGetAIStreamResponse.mockRejectedValue(rateLimitError)

      userMessage.value = '测试消息'
      await sendMessage()

      expect(error.value).toContain('Rate limit')
    })
  })

  describe('文件上传功能', () => {
    it('应该能够处理文件上传', () => {
      const { handleFileUpload, hasUploadedFile, uploadedFileName, uploadedFileSize } = useChat()

      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      handleFileUpload({
        file: mockFile,
        content: 'test content',
      })

      expect(hasUploadedFile.value).toBe(true)
      expect(uploadedFileName.value).toBe('test.txt')
      expect(uploadedFileSize.value).toBe(mockFile.size)
    })

    it('应该能够清理文件上传状态', () => {
      const { handleFileUpload, clearFileUpload, hasUploadedFile, uploadedFileName } = useChat()

      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      handleFileUpload({
        file: mockFile,
        content: 'test content',
      })

      expect(hasUploadedFile.value).toBe(true)

      clearFileUpload()

      expect(hasUploadedFile.value).toBe(false)
      expect(uploadedFileName.value).toBe('')
    })
  })

  describe('数据持久化', () => {
    it('应该能够保存会话历史', () => {
      const { createNewConversation, saveConversationHistory } = useChat()

      createNewConversation('测试会话', true)
      saveConversationHistory()

      const savedData = testEnv.localStorage.getItem('conversationHistory')
      expect(savedData).toBeDefined()

      const parsedData = JSON.parse(savedData as string)
      expect(parsedData).toHaveLength(1)
      expect(parsedData[0].title).toBe('测试会话')
    })

    it('应该能够加载会话历史', () => {
      const conversationData = [
        {
          id: 'test-conv-1',
          title: '测试会话',
          messages: [],
          createdAt: Date.now(),
          lastUpdated: new Date().toISOString(),
        },
      ]

      testEnv.localStorage.setItem('conversationHistory', JSON.stringify(conversationData))
      testEnv.localStorage.setItem('currentConversationId', 'test-conv-1')

      const { loadConversationHistory, conversationHistory, currentConversationId } = useChat()
      loadConversationHistory()

      expect(conversationHistory.value).toHaveLength(1)
      expect(conversationHistory.value[0].title).toBe('测试会话')
      expect(currentConversationId.value).toBe('test-conv-1')
    })
  })

  describe('性能测试', () => {
    it('应该能够处理大量消息历史', async () => {
      const { chatHistory, sendMessage, userMessage } = useChat()

      // 预填充大量历史消息
      for (let i = 0; i < 100; i++) {
        chatHistory.value.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `消息 ${i}`,
        })
      }

      mockGetAIStreamResponse.mockImplementation(async (messages, onChunk) => {
        const callback = onChunk as (chunk: string) => void
        callback('回复')
        callback('[DONE]')
      })

      userMessage.value = '新消息'

      const startTime = Date.now()
      await sendMessage()
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // 应该在1秒内完成
      expect(chatHistory.value).toHaveLength(102) // 100 + 2条新消息
    })

    it('应该能够处理快速连续的消息发送', async () => {
      const { sendMessage, userMessage, chatHistory } = useChat()

      mockGetAIStreamResponse.mockImplementation(async (messages, onChunk) => {
        const callback = onChunk as (chunk: string) => void
        callback('快速回复')
        callback('[DONE]')
      })

      // 快速发送多条消息
      const promises: Array<Promise<void>> = []
      for (let i = 1; i <= 3; i++) {
        userMessage.value = `消息${i}`
        promises.push(sendMessage())
      }

      await Promise.all(promises)

      expect(chatHistory.value.length).toBeGreaterThanOrEqual(2) // 至少有用户消息和AI回复
    })
  })

  describe('优化功能', () => {
    it('应该能够优化消息', async () => {
      const { optimizeMessage, isOptimizing, userMessage } = useChat()

      const { optimizeText } = await import('../../services/deepseekService')
      const mockOptimizeText = vi.mocked(optimizeText)

      mockOptimizeText.mockResolvedValue('优化后的文本')

      userMessage.value = '原始文本'
      expect(isOptimizing.value).toBe(false)

      const promise = optimizeMessage()
      expect(isOptimizing.value).toBe(true)

      await promise
      expect(userMessage.value).toBe('优化后的文本')
      expect(isOptimizing.value).toBe(false)
    })

    it('应该处理优化错误', async () => {
      const { optimizeMessage, isOptimizing, userMessage } = useChat()

      const { optimizeText } = await import('../../services/deepseekService')
      const mockOptimizeText = vi.mocked(optimizeText)

      mockOptimizeText.mockRejectedValue(new Error('优化失败'))

      userMessage.value = '原始文本'
      expect(isOptimizing.value).toBe(false)

      const promise = optimizeMessage()
      expect(isOptimizing.value).toBe(true)

      await promise
      expect(userMessage.value).toBe('原始文本') // 错误时保持原文本
      expect(isOptimizing.value).toBe(false)
    })

    it('应该拒绝优化空消息', async () => {
      const { optimizeMessage, isOptimizing, userMessage } = useChat()

      userMessage.value = ''
      expect(isOptimizing.value).toBe(false)

      await optimizeMessage()

      expect(isOptimizing.value).toBe(false)
      expect(userMessage.value).toBe('')
    })
  })

  describe('停止生成', () => {
    it('应该能够停止正在进行的生成', async () => {
      const { sendMessage, stopGenerating, userMessage, isGenerating } = useChat()

      mockGetAIStreamResponse.mockImplementation(async (messages, onChunk) => {
        // 模拟长时间生成
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const callback = onChunk as (chunk: string) => void
        callback('延迟回复')
        callback('[DONE]')
      })

      userMessage.value = '测试消息'

      const promise = sendMessage()
      expect(isGenerating.value).toBe(true)

      // 立即停止生成
      stopGenerating()

      await promise
      expect(isGenerating.value).toBe(false)
    })
  })
})
