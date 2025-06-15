import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAIStreamResponse, optimizeText, abortCurrentRequest } from '../services/deepseekService'
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

  // 添加新的状态
  const isLoading = ref(false)
  const retryCount = ref(0)
  const MAX_RETRIES = 3

  // 改进错误处理
  const handleError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    showError(errorMessage)
  }

  // 加载对话历史
  const loadConversationHistory = () => {
    try {
      const savedHistory = localStorage.getItem('conversationHistory')
      if (savedHistory) {
        conversationHistory.value = JSON.parse(savedHistory)
      }
    } catch (error) {
      handleError(error, 'loadConversationHistory')
    }
  }

  // 保存当前对话 ID
  const saveCurrentConversationId = (id: string | null) => {
    currentConversationId.value = id
    if (id) {
      localStorage.setItem('currentConversationId', id)
    } else {
      localStorage.removeItem('currentConversationId')
    }
  }

  // 创建新对话
  const createNewConversation = (title: string = t('newConversation')) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title,
      messages: [],
      lastUpdated: new Date().toISOString()
    }
    conversationHistory.value.unshift(newConversation)
    saveCurrentConversationId(newConversation.id)
    chatHistory.value = []
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
  }

  // 切换对话
  const switchConversation = (id: string) => {
    const conversation = conversationHistory.value.find(c => c.id === id)
    if (conversation) {
      chatHistory.value = [...conversation.messages]
      saveCurrentConversationId(id)
    }
  }

  // 删除对话
  const deleteConversation = (id: string) => {
    conversationHistory.value = conversationHistory.value.filter(c => c.id !== id)
    if (currentConversationId.value === id) {
      if (conversationHistory.value.length > 0) {
        switchConversation(conversationHistory.value[0].id)
      } else {
        createNewConversation()
      }
    }
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
  }

  // 清空所有对话
  const clearAllConversations = () => {
    conversationHistory.value = []
    chatHistory.value = []
    currentConversationId.value = null
    localStorage.removeItem('conversationHistory')
    localStorage.removeItem('currentConversationId')
    createNewConversation()
  }

  // 改进消息发送逻辑
  const sendMessage = async () => {
    if (!userMessage.value.trim() || isGenerating.value) {
      return
    }

    const message = userMessage.value
    userMessage.value = ''
    isGenerating.value = true
    retryCount.value = 0

    try {
      // 如果是新对话的第一条消息，更新对话标题
      if (chatHistory.value.length === 0) {
        const currentConversation = conversationHistory.value.find(
          conv => conv.id === currentConversationId.value
        )
        if (currentConversation) {
          currentConversation.title = message
          localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
        }
      }

      // 保存用户消息到历史记录
      const userMsg: ChatMessage = {
        role: 'user',
        content: message
      }
      chatHistory.value.push(userMsg)

      // 开始生成 AI 响应
      currentAIResponse.value = ''
      const messages: Message[] = chatHistory.value.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      await getAIStreamResponse(messages, (chunk: string) => {
        if (chunk === '[DONE]') {
          // 保存完整的 AI 响应到历史记录
          if (currentAIResponse.value) {
            const aiMsg: ChatMessage = {
              role: 'assistant',
              content: currentAIResponse.value
            }
            // 先添加到历史记录
            chatHistory.value.push(aiMsg)
            saveConversationHistory()
            // 等待下一个渲染周期再清空当前响应
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
      // 在错误发生时，尝试重试
      if (retryCount.value < MAX_RETRIES) {
        retryCount.value++
        await sendMessage()
      } else {
        isGenerating.value = false
      }
    }
  }

  // 改进优化消息逻辑
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

  // 改进错误显示逻辑
  const showError = (message: string) => {
    error.value = message
    const timer = setTimeout(() => {
      error.value = ''
      clearTimeout(timer)
    }, 3000)
  }

  // 改进历史记录保存逻辑
  const saveConversationHistory = () => {
    try {
      if (currentConversationId.value) {
        const currentConversation = conversationHistory.value.find(
          conv => conv.id === currentConversationId.value
        )
        if (currentConversation) {
          currentConversation.messages = [...chatHistory.value]
          currentConversation.lastUpdated = new Date().toISOString()
          localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
        }
      }
    } catch (error) {
      handleError(error, 'saveConversationHistory')
    }
  }

  // 停止生成
  const stopGenerating = () => {
    abortCurrentRequest()
    // 如果有已生成的内容，将其保存到聊天历史
    if (currentAIResponse.value) {
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: currentAIResponse.value
      }
      chatHistory.value.push(aiMsg)
      saveConversationHistory()
    }
    isGenerating.value = false
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
    showError
  }
}
