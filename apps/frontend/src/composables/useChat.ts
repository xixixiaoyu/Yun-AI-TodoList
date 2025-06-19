import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { abortCurrentRequest, getAIStreamResponse, optimizeText } from '../services/deepseekService'
import type { ChatMessage, Conversation, Message } from '../services/types'

export function useChat() {
  const { t } = useI18n()
  const chatHistory = ref<ChatMessage[]>([])
  const currentAIResponse = ref('')
  const isGenerating = ref(false)
  const userMessage = ref('')
  const isOptimizing = ref(false)
  const error = ref('')
  const conversationHistory = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)

  const isLoading = ref(false)
  const retryCount = ref(0)
  const MAX_RETRIES = 3
  const isRetrying = ref(false)
  const lastFailedMessage = ref<string>('')

  const handleError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    showError(errorMessage)
  }

  const loadConversationHistory = () => {
    try {
      const savedHistory = localStorage.getItem('conversationHistory')
      if (savedHistory) {
        conversationHistory.value = JSON.parse(savedHistory)
      }

      const savedCurrentId = localStorage.getItem('currentConversationId')
      if (savedCurrentId) {
        currentConversationId.value = savedCurrentId
        // 自动恢复最近的对话内容
        const currentConversation = conversationHistory.value.find((c) => c.id === savedCurrentId)
        if (currentConversation) {
          chatHistory.value = [...currentConversation.messages]
        }
      } else if (conversationHistory.value.length > 0) {
        // 如果没有保存的当前对话ID，但有对话历史，则恢复最近的对话
        const mostRecentConversation = conversationHistory.value[0]
        currentConversationId.value = mostRecentConversation.id
        chatHistory.value = [...mostRecentConversation.messages]
        saveCurrentConversationId(mostRecentConversation.id)
      }
    } catch (error) {
      handleError(error, 'loadConversationHistory')
    }
  }

  const saveCurrentConversationId = (id: string | null) => {
    currentConversationId.value = id
    if (id) {
      localStorage.setItem('currentConversationId', id)
    } else {
      localStorage.removeItem('currentConversationId')
    }
  }

  const createNewConversation = (title: string = t('newConversation')) => {
    const now = Date.now()
    const newConversation: Conversation = {
      id: now.toString(),
      title,
      messages: [],
      createdAt: now,
      lastUpdated: new Date().toISOString(),
    }
    conversationHistory.value.unshift(newConversation)
    saveCurrentConversationId(newConversation.id)
    chatHistory.value = []
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
  }

  const switchConversation = (id: string) => {
    const conversationIndex = conversationHistory.value.findIndex((c) => c.id === id)
    if (conversationIndex !== -1) {
      const conversation = conversationHistory.value[conversationIndex]
      chatHistory.value = [...conversation.messages]
      saveCurrentConversationId(id)

      // 将切换到的对话移动到最前面（如果不在第一位的话）
      if (conversationIndex !== 0) {
        conversationHistory.value.splice(conversationIndex, 1)
        conversationHistory.value.unshift(conversation)
        localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
      }
    }
  }

  const deleteConversation = (id: string) => {
    conversationHistory.value = conversationHistory.value.filter((c) => c.id !== id)
    if (currentConversationId.value === id) {
      if (conversationHistory.value.length > 0) {
        switchConversation(conversationHistory.value[0].id)
      } else {
        createNewConversation()
      }
    }
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
  }

  const clearAllConversations = () => {
    conversationHistory.value = []
    chatHistory.value = []
    currentConversationId.value = null
    localStorage.removeItem('conversationHistory')
    localStorage.removeItem('currentConversationId')
    createNewConversation()
  }

  const sendMessage = async () => {
    if (!userMessage.value.trim() || isGenerating.value) {
      return
    }

    const message = userMessage.value
    userMessage.value = ''
    isGenerating.value = true
    retryCount.value = 0

    try {
      if (chatHistory.value.length === 0) {
        const currentConversation = conversationHistory.value.find(
          (conv) => conv.id === currentConversationId.value
        )
        if (currentConversation) {
          currentConversation.title = message
          localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
        }
      }

      const userMsg: ChatMessage = {
        role: 'user',
        content: message,
      }
      chatHistory.value.push(userMsg)

      currentAIResponse.value = ''

      const messages: Message[] = chatHistory.value.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }))

      await getAIStreamResponse(messages, async (chunk: string) => {
        if (chunk === '[DONE]') {
          if (currentAIResponse.value) {
            const aiMsg: ChatMessage = {
              role: 'assistant',
              content: currentAIResponse.value,
            }

            chatHistory.value.push(aiMsg)
            saveConversationHistory()

            nextTick(() => {
              currentAIResponse.value = ''
              isGenerating.value = false
            })
          } else {
            isGenerating.value = false
          }
        } else if (chunk === '[ABORTED]') {
          nextTick(() => {
            currentAIResponse.value = ''
            isGenerating.value = false
          })
        } else {
          currentAIResponse.value += chunk
        }
      })
    } catch (error) {
      handleError(error, 'sendMessage')

      if (retryCount.value < MAX_RETRIES) {
        retryCount.value++
        await sendMessage()
      } else {
        isGenerating.value = false
      }
    }
  }

  const optimizeMessage = async () => {
    if (!userMessage.value.trim() || isOptimizing.value) {
      return
    }

    isOptimizing.value = true
    isLoading.value = true

    try {
      const optimizedText = await optimizeText(userMessage.value)
      userMessage.value = optimizedText
    } catch (error) {
      handleError(error, 'optimizeMessage')
    } finally {
      isOptimizing.value = false
      isLoading.value = false
    }
  }

  const showError = (message: string) => {
    error.value = message
    const timer = setTimeout(() => {
      error.value = ''
      clearTimeout(timer)
    }, 3000)
  }

  const saveConversationHistory = () => {
    try {
      if (currentConversationId.value) {
        const currentIndex = conversationHistory.value.findIndex(
          (conv) => conv.id === currentConversationId.value
        )
        if (currentIndex !== -1) {
          const currentConversation = conversationHistory.value[currentIndex]
          currentConversation.messages = [...chatHistory.value]
          currentConversation.lastUpdated = new Date().toISOString()

          // 将当前对话移动到最前面（如果不在第一位的话）
          if (currentIndex !== 0) {
            conversationHistory.value.splice(currentIndex, 1)
            conversationHistory.value.unshift(currentConversation)
          }

          localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
        }
      }
    } catch (error) {
      handleError(error, 'saveConversationHistory')
    }
  }

  const stopGenerating = () => {
    abortCurrentRequest()

    if (currentAIResponse.value) {
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: currentAIResponse.value,
      }
      chatHistory.value.push(aiMsg)
      saveConversationHistory()
    }
    isGenerating.value = false
  }

  // 重试最后一条消息
  const retryLastMessage = async () => {
    if (isGenerating.value || isRetrying.value) {
      return
    }

    // 获取最后一条用户消息
    const lastUserMessage = [...chatHistory.value].reverse().find((msg) => msg.role === 'user')
    if (!lastUserMessage) {
      return
    }

    isRetrying.value = true
    lastFailedMessage.value = lastUserMessage.content

    try {
      // 移除最后一条 AI 回答（如果存在）
      if (
        chatHistory.value.length > 0 &&
        chatHistory.value[chatHistory.value.length - 1].role === 'assistant'
      ) {
        chatHistory.value.pop()
      }

      // 重新设置用户消息并发送
      userMessage.value = lastUserMessage.content
      await sendMessage()

      retryCount.value++
    } catch (error) {
      handleError(error, 'retryLastMessage')
    } finally {
      isRetrying.value = false
    }
  }

  return {
    chatHistory,
    currentAIResponse,
    isGenerating,
    userMessage,
    isOptimizing,
    isLoading,
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
    // 重试相关功能
    retryLastMessage,
    isRetrying,
    retryCount,
    lastFailedMessage,
  }
}
