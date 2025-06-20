import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { abortCurrentRequest, getAIStreamResponse, optimizeText } from '../services/deepseekService'
import type { ChatMessage, Conversation, Message } from '../services/types'

export function useChat() {
  const { t } = useI18n()
  const chatHistory = ref<ChatMessage[]>([])
  const currentAIResponse = ref('')
  const currentThinkingContent = ref('')
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
      chatHistory.value = [...chatHistory.value, userMsg]

      currentAIResponse.value = ''
      currentThinkingContent.value = ''

      const messages: Message[] = chatHistory.value.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }))

      await getAIStreamResponse(
        messages,
        async (chunk: string) => {
          if (chunk === '[DONE]') {
            if (currentAIResponse.value) {
              // 如果有思考内容，将其包装在 <think> 标签中
              let finalContent = currentAIResponse.value
              if (currentThinkingContent.value) {
                finalContent = `<think>${currentThinkingContent.value}</think>\n\n${currentAIResponse.value}`
              }

              const aiMsg: ChatMessage = {
                role: 'assistant',
                content: finalContent,
              }

              chatHistory.value = [...chatHistory.value, aiMsg]
              saveConversationHistory()

              nextTick(() => {
                currentAIResponse.value = ''
                currentThinkingContent.value = ''
                isGenerating.value = false
              })
            } else {
              isGenerating.value = false
            }
          } else if (chunk === '[ABORTED]') {
            nextTick(() => {
              currentAIResponse.value = ''
              currentThinkingContent.value = ''
              isGenerating.value = false
            })
          } else {
            currentAIResponse.value += chunk
          }
        },
        async (thinking: string) => {
          currentThinkingContent.value += thinking
        }
      )
    } catch (error) {
      handleError(error, 'sendMessage')

      if (retryCount.value < MAX_RETRIES) {
        retryCount.value++
        await sendMessage()
      } else {
        // 只有在达到最大重试次数时才重置状态
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

  // 重试指定索引的消息
  const retryLastMessage = async (messageIndex?: number) => {
    if (isGenerating.value || isRetrying.value) {
      return
    }

    let targetMessage: ChatMessage | undefined
    let targetIndex: number = -1

    if (messageIndex !== undefined) {
      // 按索引重试：删除指定索引及之后的所有消息
      if (messageIndex < 0 || messageIndex >= chatHistory.value.length) {
        return
      }

      const clickedMessage = chatHistory.value[messageIndex]

      if (clickedMessage.role === 'user') {
        // 如果点击的是用户消息，直接重试该消息
        targetMessage = clickedMessage
        targetIndex = messageIndex
      } else if (clickedMessage.role === 'assistant') {
        // 如果点击的是助手消息，找到它对应的用户消息
        // 向前查找最近的用户消息
        for (let i = messageIndex - 1; i >= 0; i--) {
          if (chatHistory.value[i].role === 'user') {
            targetMessage = chatHistory.value[i]
            targetIndex = i
            break
          }
        }
      }
    } else {
      // 原有逻辑：重试最后一条用户消息
      const lastUserMessage = [...chatHistory.value].reverse().find((msg) => msg.role === 'user')
      if (!lastUserMessage) {
        return
      }
      targetMessage = lastUserMessage
      // 找到最后一条用户消息的索引
      for (let i = chatHistory.value.length - 1; i >= 0; i--) {
        if (chatHistory.value[i].role === 'user') {
          targetIndex = i
          break
        }
      }
    }

    if (!targetMessage || targetMessage.role !== 'user' || targetIndex === -1) {
      return
    }

    isRetrying.value = true
    lastFailedMessage.value = targetMessage.content

    try {
      // 删除目标消息及之后的所有消息
      chatHistory.value.splice(targetIndex)

      // 重新设置用户消息并发送
      userMessage.value = targetMessage.content
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
    currentThinkingContent,
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
