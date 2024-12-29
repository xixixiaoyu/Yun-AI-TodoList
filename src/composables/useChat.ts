import { ref } from 'vue'
import { Message } from '../services/types'
import {
  getAIStreamResponse,
  abortCurrentRequest,
  optimizeText,
} from '../services/deepseekService'
import { useI18n } from 'vue-i18n'

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

export interface Conversation {
  id: number
  title: string
  messages: ChatMessage[]
}

export function useChat() {
  const { t } = useI18n()
  const chatHistory = ref<ChatMessage[]>([])
  const currentAIResponse = ref('')
  const isGenerating = ref(false)
  const userMessage = ref('')
  const isOptimizing = ref(false)
  const error = ref('')

  // 对话历史列表
  const conversationHistory = ref<Conversation[]>([])
  const currentConversationId = ref<number | null>(null)

  // 加载对话历史
  const loadConversationHistory = () => {
    const savedHistory = localStorage.getItem('aiConversationHistory')
    if (savedHistory) {
      conversationHistory.value = JSON.parse(savedHistory)
    }
  }

  // 保存对话历史
  const saveConversationHistory = () => {
    localStorage.setItem(
      'aiConversationHistory',
      JSON.stringify(conversationHistory.value)
    )
  }

  // 保存当前会话 ID
  const saveCurrentConversationId = () => {
    if (currentConversationId.value) {
      localStorage.setItem(
        'currentConversationId',
        currentConversationId.value.toString()
      )
    }
  }

  // 创建新对话
  const createNewConversation = () => {
    const newId = Date.now()
    const newConversation = {
      id: newId,
      title: t('newConversation'),
      messages: [],
    }
    conversationHistory.value.unshift(newConversation)
    currentConversationId.value = newId
    chatHistory.value = []
    saveConversationHistory()
    saveCurrentConversationId()
  }

  // 切换对话
  const switchConversation = (id: number) => {
    currentConversationId.value = id
    const conversation = conversationHistory.value.find((c) => c.id === id)
    if (conversation) {
      chatHistory.value = [...conversation.messages]
    }
    saveCurrentConversationId()
  }

  // 删除对话
  const deleteConversation = (id: number) => {
    conversationHistory.value = conversationHistory.value.filter((c) => c.id !== id)
    if (currentConversationId.value === id) {
      if (conversationHistory.value.length > 0) {
        switchConversation(conversationHistory.value[0].id)
      } else {
        createNewConversation()
      }
    }
    saveConversationHistory()
  }

  // 清空所有对话
  const clearAllConversations = () => {
    if (confirm(t('confirmClearAll'))) {
      conversationHistory.value = []
      localStorage.removeItem('aiConversationHistory')
      localStorage.removeItem('currentConversationId')
      createNewConversation()
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!userMessage.value.trim()) return

    const userMessageContent = userMessage.value
    chatHistory.value.push({ role: 'user', content: userMessageContent })
    userMessage.value = ''
    isGenerating.value = true
    currentAIResponse.value = ''

    const aiResponseIndex = chatHistory.value.length
    chatHistory.value.push({ role: 'ai', content: '' })

    try {
      const messages: Message[] = chatHistory.value
        .filter((msg) => msg.content.trim() !== '')
        .map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))

      await getAIStreamResponse(messages, (chunk) => {
        if (chunk === '[DONE]' || chunk === '[ABORTED]') {
          isGenerating.value = false
          // 更新当前对话的消息
          if (currentConversationId.value !== null) {
            const currentConversation = conversationHistory.value.find(
              (c) => c.id === currentConversationId.value
            )
            if (currentConversation) {
              currentConversation.messages = chatHistory.value
              if (currentConversation.messages.length === 2) {
                currentConversation.title =
                  currentConversation.messages[0].content.slice(0, 30) + '...'
              }
            }
          }
          saveConversationHistory()
          return
        }
        currentAIResponse.value += chunk
        chatHistory.value[aiResponseIndex].content = currentAIResponse.value
      })
    } catch (error) {
      console.error(t('aiResponseError'), error)
      chatHistory.value[aiResponseIndex].content = t('aiResponseErrorMessage')
    } finally {
      isGenerating.value = false
      currentAIResponse.value = ''
    }
  }

  // 停止生成
  const stopGenerating = () => {
    abortCurrentRequest()
    isGenerating.value = false
  }

  // 优化消息
  const optimizeMessage = async () => {
    if (!userMessage.value.trim() || isOptimizing.value) return

    try {
      isOptimizing.value = true
      const optimizedText = await optimizeText(userMessage.value)
      userMessage.value = optimizedText
    } catch (error) {
      console.error('优化文本时出错:', error)
    } finally {
      isOptimizing.value = false
    }
  }

  // 显示错误
  const showError = (message: string) => {
    error.value = message
    setTimeout(() => {
      error.value = ''
    }, 3000)
  }

  return {
    chatHistory,
    currentAIResponse,
    isGenerating,
    userMessage,
    isOptimizing,
    error,
    conversationHistory,
    currentConversationId,
    loadConversationHistory,
    saveConversationHistory,
    saveCurrentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
    clearAllConversations,
    sendMessage,
    stopGenerating,
    optimizeMessage,
    showError,
  }
}
