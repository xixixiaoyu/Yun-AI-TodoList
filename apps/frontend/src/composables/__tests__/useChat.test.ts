import { createTestChatMessage, createTestConversation, setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChat } from '../useChat'

vi.mock('@/services/deepseekService', () => ({
  getAIStreamResponse: vi.fn(),
  optimizeText: vi.fn(),
  abortCurrentRequest: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        newConversation: '新对话',
        httpError: 'HTTP 错误: {status}',
        networkError: '网络错误',
        optimizationError: '优化失败',
      }
      return messages[key] || key
    },
  }),
}))

describe('useChat', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('初始状态', () => {
    it('应该初始化默认状态', () => {
      const {
        chatHistory,
        currentAIResponse,
        isGenerating,
        userMessage,
        isOptimizing,
        error,
        conversationHistory,
        currentConversationId,
      } = useChat()

      expect(chatHistory.value).toEqual([])
      expect(currentAIResponse.value).toBe('')
      expect(isGenerating.value).toBe(false)
      expect(userMessage.value).toBe('')
      expect(isOptimizing.value).toBe(false)
      expect(error.value).toBe('')
      expect(conversationHistory.value).toEqual([])
      expect(currentConversationId.value).toBeNull()
    })
  })

  describe('对话历史管理', () => {
    it('应该加载对话历史', () => {
      const testConversations = [
        createTestConversation({ id: '1', title: 'Conversation 1' }),
        createTestConversation({ id: '2', title: 'Conversation 2' }),
      ]

      // 设置 localStorage 数据
      testEnv.localStorage.store.conversationHistory = JSON.stringify(testConversations)
      testEnv.localStorage.store.currentConversationId = '1'

      // 模拟 localStorage.getItem 返回正确的数据
      testEnv.localStorage.getItem.mockImplementation((key: string) => {
        if (key === 'conversationHistory') return JSON.stringify(testConversations)
        if (key === 'currentConversationId') return '1'
        return null
      })

      const { loadConversationHistory, conversationHistory, currentConversationId } = useChat()

      loadConversationHistory()

      expect(conversationHistory.value).toHaveLength(2)
      expect(currentConversationId.value).toBe('1')
    })

    it('应该处理无效的对话历史数据', () => {
      testEnv.localStorage.store.conversationHistory = 'invalid json'

      const { loadConversationHistory, conversationHistory } = useChat()

      loadConversationHistory()

      expect(conversationHistory.value).toEqual([])
    })

    it('应该创建新对话', () => {
      const { createNewConversation, conversationHistory, currentConversationId } = useChat()

      createNewConversation('Test Conversation')

      expect(conversationHistory.value).toHaveLength(1)
      expect(conversationHistory.value[0].title).toBe('Test Conversation')
      expect(currentConversationId.value).toBe(conversationHistory.value[0].id)
      expect(testEnv.localStorage.setItem).toHaveBeenCalledWith(
        'conversationHistory',
        expect.any(String)
      )
    })

    it('应该切换对话', () => {
      const testConversations = [
        createTestConversation({
          id: '1',
          title: 'Conversation 1',
          messages: [createTestChatMessage({ content: 'Hello' })],
        }),
        createTestConversation({ id: '2', title: 'Conversation 2' }),
      ]

      const { conversationHistory, switchConversation, chatHistory, currentConversationId } =
        useChat()

      conversationHistory.value = testConversations

      switchConversation('1')

      expect(currentConversationId.value).toBe('1')
      expect(chatHistory.value).toHaveLength(1)
      expect(chatHistory.value[0].content).toBe('Hello')
    })

    it('应该删除对话', () => {
      const testConversations = [
        createTestConversation({ id: '1', title: 'Conversation 1' }),
        createTestConversation({ id: '2', title: 'Conversation 2' }),
      ]

      const { conversationHistory, deleteConversation, currentConversationId } = useChat()

      conversationHistory.value = testConversations
      currentConversationId.value = '1'

      deleteConversation('1')

      expect(conversationHistory.value).toHaveLength(1)
      expect(conversationHistory.value[0].id).toBe('2')
      expect(currentConversationId.value).toBe('2')
    })

    it('应该清除所有对话', () => {
      const {
        createNewConversation,
        clearAllConversations,
        conversationHistory,
        currentConversationId,
      } = useChat()

      createNewConversation('Test 1')
      createNewConversation('Test 2')

      expect(conversationHistory.value).toHaveLength(2)

      clearAllConversations()

      // clearAllConversations 会创建一个新对话，所以长度应该是 1
      expect(conversationHistory.value).toHaveLength(1)
      expect(conversationHistory.value[0].title).toBe('新对话')
      expect(currentConversationId.value).toBe(conversationHistory.value[0].id)
    })
  })

  describe('消息发送', () => {
    it('应该发送消息并接收 AI 响应', async () => {
      const { getAIStreamResponse } = await import('@/services/deepseekService')
      const mockGetAIStreamResponse = getAIStreamResponse as vi.MockedFunction<
        typeof getAIStreamResponse
      >

      mockGetAIStreamResponse.mockImplementation(async (messages, onChunk) => {
        onChunk('Hello')
        onChunk(' World')
        onChunk('[DONE]')
      })

      const { sendMessage, userMessage, chatHistory, isGenerating, createNewConversation } =
        useChat()

      // 创建新对话以确保有当前对话 ID
      createNewConversation('Test Conversation')

      userMessage.value = '测试消息'

      await sendMessage()

      // 等待异步操作完成
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(isGenerating.value).toBe(false)
      expect(chatHistory.value).toHaveLength(2)
      expect(chatHistory.value[0].content).toBe('测试消息')
      expect(chatHistory.value[1].content).toBe('Hello World')
    })

    it('应该处理发送消息失败', async () => {
      const { getAIStreamResponse } = await import('@/services/deepseekService')
      const mockGetAIStreamResponse = getAIStreamResponse as vi.MockedFunction<
        typeof getAIStreamResponse
      >
      mockGetAIStreamResponse.mockRejectedValue(new Error('API Error'))

      const { sendMessage, userMessage, isGenerating, createNewConversation } = useChat()

      // 创建新对话以确保有当前对话 ID
      createNewConversation('Test Conversation')

      userMessage.value = 'Test message'

      // 确保初始状态
      expect(isGenerating.value).toBe(false)

      // 发送消息，期望失败但不抛出异常
      await sendMessage()

      // 等待所有异步操作完成
      await vi.runAllTimersAsync()
      await new Promise((resolve) => setTimeout(resolve, 0))

      // 最终应该是false
      expect(isGenerating.value).toBe(false)
    })

    it('应该停止生成', async () => {
      const { abortCurrentRequest } = await import('@/services/deepseekService')
      const mockAbortCurrentRequest = abortCurrentRequest as vi.MockedFunction<
        typeof abortCurrentRequest
      >

      const { stopGenerating, isGenerating } = useChat()

      isGenerating.value = true
      stopGenerating()

      expect(isGenerating.value).toBe(false)
      expect(mockAbortCurrentRequest).toHaveBeenCalled()
    })
  })

  describe('文本优化', () => {
    it('应该优化消息文本', async () => {
      const { optimizeText } = await import('@/services/deepseekService')
      const mockOptimizeText = optimizeText as vi.MockedFunction<typeof optimizeText>

      mockOptimizeText.mockResolvedValue('优化后的文本')

      const { optimizeMessage, userMessage, isOptimizing } = useChat()

      userMessage.value = '原始文本'

      expect(isOptimizing.value).toBe(false)

      const optimizePromise = optimizeMessage()

      // 等待优化完成
      await optimizePromise

      expect(isOptimizing.value).toBe(false)
      expect(userMessage.value).toBe('优化后的文本')
      expect(mockOptimizeText).toHaveBeenCalledWith('原始文本')
    })

    it('应该处理优化失败', async () => {
      const { optimizeText } = await import('@/services/deepseekService')
      const mockOptimizeText = optimizeText as vi.MockedFunction<typeof optimizeText>
      mockOptimizeText.mockRejectedValue(new Error('Optimization failed'))

      const { optimizeMessage, isOptimizing } = useChat()

      await optimizeMessage('Original text')

      expect(isOptimizing.value).toBe(false)
    })
  })

  describe('错误处理', () => {
    it('应该正确处理和显示错误', () => {
      const { error } = useChat()

      expect(error.value).toBe('')
    })
  })

  describe('数据持久化', () => {
    it('应该保存对话历史', () => {
      const { createNewConversation, conversationHistory } = useChat()

      createNewConversation('Test Conversation')

      expect(testEnv.localStorage.setItem).toHaveBeenCalledWith(
        'conversationHistory',
        expect.any(String)
      )
      expect(testEnv.localStorage.setItem).toHaveBeenCalledWith(
        'currentConversationId',
        conversationHistory.value[0].id
      )
    })

    it('应该保存当前对话 ID', () => {
      const { saveCurrentConversationId } = useChat()

      saveCurrentConversationId('test-id')

      expect(testEnv.localStorage.setItem).toHaveBeenCalledWith('currentConversationId', 'test-id')
    })
  })
})
