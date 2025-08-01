import { useChat } from '../../composables/useChat'
import { createTestChatMessage, createTestConversation, setupTestEnvironment } from '../helpers'
import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'

vi.mock('vue-i18n', () => ({
  createI18n: vi.fn(() => ({
    global: {
      t: vi.fn((key) => key),
      locale: { value: 'zh-CN' },
    },
  })),
  useI18n: vi.fn(() => ({
    t: vi.fn((key) => key),
    locale: { value: 'zh-CN' },
  })),
}))

vi.mock('@/services/deepseekService', () => ({
  getAIStreamResponse: vi.fn(),
  optimizeText: vi.fn(),
  abortCurrentRequest: vi.fn(),
  getAIResponse: vi.fn(),
}))

vi.mock('@/composables/useTodos', () => ({
  useTodos: vi.fn(() => ({
    todos: { value: [] },
    addTodo: vi.fn(),
    toggleTodo: vi.fn(),
    removeTodo: vi.fn(),
    addMultipleTodos: vi.fn(),
  })),
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    showError: vi.fn(),
  })),
}))

describe('AI 集成测试', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  describe('聊天功能集成', () => {
    it('应该能够发送消息并接收响应', async () => {
      const { getAIStreamResponse } = await import('../../services/deepseekService')
      const mockGetAIStreamResponse = getAIStreamResponse as MockedFunction<
        typeof getAIStreamResponse
      >

      mockGetAIStreamResponse.mockImplementation(async (messages, onChunk) => {
        onChunk('Hello')
        onChunk(' World')
        onChunk('[DONE]')
      })

      const { sendMessage, userMessage, chatHistory, isGenerating, currentAIResponse } = useChat()

      userMessage.value = '测试消息'

      await sendMessage()

      // 等待异步操作完成
      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(isGenerating.value).toBe(false)
      expect(chatHistory.value).toHaveLength(2)
      expect(chatHistory.value[0].content).toBe('测试消息')
      expect(chatHistory.value[1].content).toBe('Hello World')
      expect(currentAIResponse.value).toBe('')
    })

    it('应该处理流式响应错误', async () => {
      const { getAIStreamResponse } = await import('../../services/deepseekService')
      const mockGetAIStreamResponse = getAIStreamResponse as MockedFunction<
        typeof getAIStreamResponse
      >

      mockGetAIStreamResponse.mockRejectedValue(new Error('网络错误'))

      const { sendMessage, userMessage, isGenerating } = useChat()

      userMessage.value = '测试消息'

      await sendMessage()

      expect(isGenerating.value).toBe(false)
    })
  })

  describe('对话历史管理', () => {
    it('应该保存和加载对话历史', () => {
      const { conversationHistory, loadConversationHistory } = useChat()

      // 清空现有状态
      conversationHistory.value = []

      const testConversations = [
        createTestConversation({ id: '1', title: '对话1' }),
        createTestConversation({ id: '2', title: '对话2' }),
      ]

      // 直接设置 localStorage 来模拟保存的数据
      testEnv.localStorage.setItem('conversationHistory', JSON.stringify(testConversations))

      loadConversationHistory()

      expect(conversationHistory.value).toHaveLength(2)
    })

    it('应该创建新对话', () => {
      const { createNewConversation, conversationHistory, currentConversationId } = useChat()

      // 清空现有状态
      conversationHistory.value = []

      createNewConversation('新对话', true) // 强制创建

      expect(conversationHistory.value).toHaveLength(1)
      expect(conversationHistory.value[0].title).toBe('新对话')
      expect(currentConversationId.value).toBe(conversationHistory.value[0].id)
    })

    it('应该切换对话', () => {
      const testConversations = [
        createTestConversation({
          id: '1',
          title: '对话1',
          messages: [createTestChatMessage({ content: '消息1' })],
        }),
        createTestConversation({ id: '2', title: '对话2' }),
      ]

      const { conversationHistory, switchConversation, chatHistory, currentConversationId } =
        useChat()

      conversationHistory.value = testConversations
      switchConversation('1')

      expect(currentConversationId.value).toBe('1')
      expect(chatHistory.value).toHaveLength(1)
      expect(chatHistory.value[0].content).toBe('消息1')
    })

    it('应该删除对话', () => {
      const testConversations = [
        createTestConversation({ id: '1', title: '对话1' }),
        createTestConversation({ id: '2', title: '对话2' }),
      ]

      const { conversationHistory, deleteConversation, currentConversationId } = useChat()

      conversationHistory.value = testConversations
      currentConversationId.value = '1'

      deleteConversation('1')

      expect(conversationHistory.value).toHaveLength(1)
      expect(conversationHistory.value[0].id).toBe('2')
      expect(currentConversationId.value).toBe('2')
    })
  })

  describe('错误处理集成', () => {
    it('应该正确处理网络错误', async () => {
      const { getAIStreamResponse } = await import('../../services/deepseekService')
      const mockGetAIStreamResponse = getAIStreamResponse as MockedFunction<
        typeof getAIStreamResponse
      >

      mockGetAIStreamResponse.mockRejectedValue(new Error('网络连接失败'))

      const { sendMessage, userMessage } = useChat()

      userMessage.value = '测试消息'

      await sendMessage()

      expect(mockGetAIStreamResponse).toHaveBeenCalled()
    })
  })
})
