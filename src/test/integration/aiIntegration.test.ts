import { useChat } from '@/composables/useChat'
import { useTodoManagement } from '@/composables/useTodoManagement'
import { createTestChatMessage, createTestConversation, setupTestEnvironment } from '@/test/helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/deepseekService', () => ({
  streamAIResponse: vi.fn(),
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

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
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
      const { streamAIResponse } = await import('@/services/deepseekService')
      const mockStreamAIResponse = streamAIResponse as vi.MockedFunction<typeof streamAIResponse>

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Hello'
          yield ' World'
        },
      }
      mockStreamAIResponse.mockResolvedValue(mockStream)

      const { sendMessage, userMessage, chatHistory, isGenerating, currentAIResponse } = useChat()

      userMessage.value = '测试消息'

      await sendMessage()

      expect(isGenerating.value).toBe(false)
      expect(chatHistory.value).toHaveLength(2)
      expect(chatHistory.value[0].content).toBe('测试消息')
      expect(chatHistory.value[1].content).toBe('Hello World')
      expect(currentAIResponse.value).toBe('')
    })

    it('应该处理流式响应错误', async () => {
      const { streamAIResponse } = await import('@/services/deepseekService')
      const mockStreamAIResponse = streamAIResponse as vi.MockedFunction<typeof streamAIResponse>

      mockStreamAIResponse.mockRejectedValue(new Error('网络错误'))

      const { sendMessage, userMessage, isGenerating } = useChat()

      userMessage.value = '测试消息'

      await sendMessage()

      expect(isGenerating.value).toBe(false)
    })
  })

  describe('待办事项 AI 功能集成', () => {
    it('应该生成建议的待办事项', async () => {
      const { getAIResponse } = await import('@/services/deepseekService')
      const mockGetAIResponse = getAIResponse as vi.MockedFunction<typeof getAIResponse>

      mockGetAIResponse.mockResolvedValue('1. 学习 Vue 3\n2. 编写测试\n3. 部署应用')

      const { generateSuggestedTodos, suggestedTodos, isGenerating } = useTodoManagement()

      await generateSuggestedTodos()

      expect(isGenerating.value).toBe(false)
      expect(suggestedTodos.value.length).toBeGreaterThan(0)
    })

    it('应该处理 AI 生成失败', async () => {
      const { getAIResponse } = await import('@/services/deepseekService')
      const mockGetAIResponse = getAIResponse as vi.MockedFunction<typeof getAIResponse>

      mockGetAIResponse.mockRejectedValue(new Error('API 错误'))

      const { generateSuggestedTodos, isGenerating } = useTodoManagement()

      await generateSuggestedTodos()

      expect(isGenerating.value).toBe(false)
    })
  })

  describe('对话历史管理', () => {
    it('应该保存和加载对话历史', () => {
      const testConversations = [
        createTestConversation({ id: '1', title: '对话1' }),
        createTestConversation({ id: '2', title: '对话2' }),
      ]

      const { conversationHistory, saveConversationHistory, loadConversationHistory } = useChat()

      conversationHistory.value = testConversations
      saveConversationHistory()

      conversationHistory.value = []
      loadConversationHistory()

      expect(conversationHistory.value).toHaveLength(2)
    })

    it('应该创建新对话', () => {
      const { createNewConversation, conversationHistory, currentConversationId } = useChat()

      createNewConversation('新对话')

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
      const { streamAIResponse } = await import('@/services/deepseekService')
      const mockStreamAIResponse = streamAIResponse as vi.MockedFunction<typeof streamAIResponse>

      mockStreamAIResponse.mockRejectedValue(new Error('网络连接失败'))

      const { sendMessage, userMessage } = useChat()

      userMessage.value = '测试消息'

      await sendMessage()

      expect(mockStreamAIResponse).toHaveBeenCalled()
    })
  })
})
