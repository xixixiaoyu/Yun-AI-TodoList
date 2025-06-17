import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAISearch, type SearchContext } from '../services/aiSearchTool'
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

  // 搜索功能
  const {
    shouldSearch: _shouldSearch,
    analyzeSearchNeed,
    analyzeResponseUncertainty,
    search,
    manualSearch,
    formatForAI,
    formatForUser,
    getConfig,
    updateConfig,
    extractSearchQueryFromResponse,
  } = useAISearch()

  const isSearching = ref(false)
  const lastSearchContext = ref<SearchContext | null>(null)

  const isLoading = ref(false)
  const retryCount = ref(0)
  const MAX_RETRIES = 3

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
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title,
      messages: [],
      lastUpdated: new Date().toISOString(),
    }
    conversationHistory.value.unshift(newConversation)
    saveCurrentConversationId(newConversation.id)
    chatHistory.value = []
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
  }

  const switchConversation = (id: string) => {
    const conversation = conversationHistory.value.find((c) => c.id === id)
    if (conversation) {
      chatHistory.value = [...conversation.messages]
      saveCurrentConversationId(id)
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

      // 检查是否需要搜索
      let searchContext: SearchContext | null = null
      const searchAnalysis = analyzeSearchNeed(message)

      if (searchAnalysis.needsSearch) {
        isSearching.value = true
        try {
          console.warn('AI 助手检测到需要搜索:', {
            message,
            confidence: searchAnalysis.confidence,
            reasons: searchAnalysis.reasons,
          })
          searchContext = await search(message)
          lastSearchContext.value = searchContext
          console.warn('AI 助手搜索完成:', searchContext)
        } catch (searchError) {
          console.error('AI 助手搜索失败:', searchError)
        } finally {
          isSearching.value = false
        }
      }

      currentAIResponse.value = ''

      // 构建消息，包含搜索结果
      let enhancedMessage = message
      if (searchContext) {
        enhancedMessage += formatForAI(searchContext)
      }

      const messages: Message[] = chatHistory.value.map((msg, index) => {
        // 只对最后一条用户消息添加搜索结果
        if (msg.role === 'user' && index === chatHistory.value.length - 1) {
          return {
            role: 'user',
            content: enhancedMessage,
          }
        }
        return {
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }
      })

      await getAIStreamResponse(messages, async (chunk: string) => {
        if (chunk === '[DONE]') {
          if (currentAIResponse.value) {
            let finalResponse = currentAIResponse.value

            // 检查 AI 响应的不确定性
            const uncertaintyAnalysis = analyzeResponseUncertainty(currentAIResponse.value)

            // 如果 AI 不确定且没有进行过搜索，尝试搜索补充信息
            if (
              uncertaintyAnalysis.isUncertain &&
              !searchContext &&
              getConfig().enabled &&
              getConfig().intelligentSearch
            ) {
              console.warn('AI 响应不确定，尝试搜索补充信息:', {
                confidence: uncertaintyAnalysis.confidence,
                reasons: uncertaintyAnalysis.reasons,
                suggestedQuery: uncertaintyAnalysis.suggestedSearchQuery,
              })

              isSearching.value = true
              try {
                const searchQuery =
                  uncertaintyAnalysis.suggestedSearchQuery ||
                  extractSearchQueryFromResponse(currentAIResponse.value, message).join(' ')

                if (searchQuery) {
                  const supplementarySearchContext = await search(searchQuery)
                  if (supplementarySearchContext) {
                    lastSearchContext.value = supplementarySearchContext

                    // 将搜索结果添加到响应中
                    finalResponse += '\n\n---\n\n'
                    finalResponse += '💡 **补充信息**（基于搜索结果）：\n\n'
                    finalResponse += formatForUser(supplementarySearchContext)
                  }
                }
              } catch (searchError) {
                console.error('补充搜索失败:', searchError)
              } finally {
                isSearching.value = false
              }
            }

            // 如果有原始搜索结果，在 AI 回答后添加搜索结果展示
            if (searchContext) {
              finalResponse += formatForUser(searchContext)
            }

            const aiMsg: ChatMessage = {
              role: 'assistant',
              content: finalResponse,
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
        const currentConversation = conversationHistory.value.find(
          (conv) => conv.id === currentConversationId.value
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

  const stopGenerating = () => {
    abortCurrentRequest()

    if (currentAIResponse.value) {
      let finalResponse = currentAIResponse.value

      // 如果有搜索结果，在停止时也添加搜索结果展示
      if (lastSearchContext.value) {
        finalResponse += formatForUser(lastSearchContext.value)
      }

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: finalResponse,
      }
      chatHistory.value.push(aiMsg)
      saveConversationHistory()
    }
    isGenerating.value = false
  }

  // 手动搜索功能
  const performManualSearch = async (query: string) => {
    if (isSearching.value) return null

    isSearching.value = true
    try {
      const searchContext = await manualSearch(query)
      lastSearchContext.value = searchContext
      return searchContext
    } catch (error) {
      console.error('手动搜索失败:', error)
      return null
    } finally {
      isSearching.value = false
    }
  }

  // 获取搜索配置
  const getSearchConfig = () => getConfig()

  // 更新搜索配置
  const updateSearchConfig = (config: Record<string, unknown>) => updateConfig(config)

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
    // 搜索相关功能
    isSearching,
    lastSearchContext,
    performManualSearch,
    getSearchConfig,
    updateSearchConfig,
  }
}
