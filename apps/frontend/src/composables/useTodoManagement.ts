import { computed, ref } from 'vue'
import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAIResponse } from '../services/deepseekService'
import type { Todo } from '../types/todo'
import { handleError, logger } from '../utils/logger'
import { useAIAnalysis } from './useAIAnalysis'
import { useErrorHandler } from './useErrorHandler'
import { useTodos } from './useTodos'

export function useTodoManagement() {
  const { t } = useI18n()
  const {
    todos,
    addTodo,
    addMultipleTodos,
    toggleTodo,
    removeTodo,
    updateTodo,
    batchUpdateTodos,
    saveTodos,
  } = useTodos()
  const { showError, showSuccess, error: duplicateError } = useErrorHandler()

  // AI 分析功能
  const { analyzeSingleTodo, analysisConfig, isAnalyzing, batchAnalyzeTodosAction } =
    useAIAnalysis()

  const filter = ref('active')
  const searchQuery = ref('')
  const isGenerating = ref(false)
  const suggestedTodos = ref<string[]>([])
  const showSuggestedTodos = ref(false)
  const showDomainSelection = ref(false)
  const selectedDomain = ref('')
  const isSorting = ref(false)
  const MAX_TODO_LENGTH = 50

  const isLoading = computed(() => isSorting.value)

  const filteredTodos = computed(() => {
    try {
      const filtered = todos.value
      if (!Array.isArray(filtered)) {
        logger.error('Invalid todos data structure', filtered, 'TodoManagement')
        return []
      }

      const statusFilterFn =
        filter.value === 'active'
          ? (todo: Todo) => todo && !todo.completed
          : filter.value === 'completed'
            ? (todo: Todo) => todo && todo.completed
            : (todo: Todo) => todo !== null && todo !== undefined

      let result = filtered.filter(statusFilterFn)

      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        result = result.filter((todo) => {
          if (!todo) {
            return false
          }

          const titleMatch = todo.text.toLowerCase().includes(query)

          const tagsMatch = todo.tags?.some((tag) => tag.toLowerCase().includes(query)) || false
          return titleMatch || tagsMatch
        })
      }

      return result
    } catch (error) {
      handleError(error, 'Error in filteredTodos computed', 'TodoManagement')
      return []
    }
  })

  const hasActiveTodos = computed(() => {
    return filter.value === 'active' && todos.value.some((todo) => todo && !todo.completed)
  })

  const generateSuggestedTodos = async () => {
    // 显示领域选择对话框
    showDomainSelection.value = true
  }

  const generateSuggestedTodosWithDomain = async (domain: string) => {
    // 增强的输入验证
    if (!domain || typeof domain !== 'string' || domain.trim() === '') {
      showError('请选择或输入一个有效的领域')
      return
    }

    // 清理和标准化 domain 参数
    const cleanDomain = domain.trim()

    isGenerating.value = true
    showDomainSelection.value = false // 立即关闭领域选择对话框
    try {
      // 获取已完成的历史 todo 项
      const completedTodos = todos.value.filter((todo) => todo.completed)

      // 根据选择的领域构建不同的提示词
      let prompt = ''
      let domainName = cleanDomain

      // 检查是否是预设领域
      if (['work', 'study', 'life'].includes(cleanDomain)) {
        domainName = t(`domain.${cleanDomain}`)
      }

      // 如果有已完成的历史记录，使用增强的提示词
      if (completedTodos.length > 0) {
        // 格式化已完成的 todo 项列表
        const completedTodosList = completedTodos
          .slice(-50) // 只取最近的50个已完成项
          .map((todo, index) => `${index + 1}. ${todo.text}`)
          .join('\n')

        const template = t('generateDomainSuggestionsWithHistoryPrompt')

        // 使用正则表达式进行全局替换
        prompt = template
          .replace(/{domain}/g, domainName)
          .replace(/{completedTodos}/g, completedTodosList)

        // 验证替换结果
        const replacementSuccessful =
          prompt.includes(domainName) &&
          prompt.includes(completedTodosList) &&
          !prompt.includes('{domain}') &&
          !prompt.includes('{completedTodos}')

        if (!replacementSuccessful) {
          prompt = `请为我生成5个关于${domainName}领域的待办事项建议。\n\n我已完成的相关任务：\n${completedTodosList}\n\n请按以下要求生成：\n1. 从我的历史记录中选择2个与${domainName}领域最相关的任务\n2. 基于${domainName}领域生成3个全新的待办事项\n\n每个建议应该简洁明了，不超过50个字符。请直接返回建议列表，每行一个建议，总共5个建议。`
        }
      } else {
        // 没有历史记录时，使用原有的提示词
        const template = t('generateDomainSuggestionsPrompt')

        // 使用正则表达式进行全局替换
        prompt = template.replace(/{domain}/g, domainName)

        // 验证替换结果
        const replacementSuccessful = prompt.includes(domainName) && !prompt.includes('{domain}')

        if (!replacementSuccessful) {
          prompt = `请为我生成5个关于${domainName}领域的实用待办事项建议。每个建议应该简洁明了，不超过50个字符。请直接返回建议列表，每行一个建议。`
        }
      }

      const response = await getAIResponse(prompt, 1)

      let parsedTodos: string[] = []

      const lines = response.split('\n').filter((line) => line.trim() !== '')

      if (lines.length >= 2) {
        parsedTodos = lines
          .map((line) => {
            return line.replace(/^\s*[\d\-•*]+\.?\s*/, '').trim()
          })
          .filter((todo) => todo !== '' && todo.length > 0)
      } else {
        parsedTodos = response
          .split(/[,，]/)
          .map((todo) => todo.trim())
          .filter((todo) => todo !== '')
      }

      if (parsedTodos.length === 0) {
        parsedTodos = [response.trim()]
      }

      // 统一生成 5 个建议

      suggestedTodos.value = parsedTodos
        .filter((todo) => todo.length > 0 && todo.length <= MAX_TODO_LENGTH)
        .slice(0, 5)

      if (suggestedTodos.value.length > 0) {
        showSuggestedTodos.value = true
        showDomainSelection.value = false
        logger.info(
          'AI suggestions generated successfully',
          {
            count: suggestedTodos.value.length,
            suggestions: suggestedTodos.value,
            domain: cleanDomain,
          },
          'TodoManagement'
        )
      } else {
        throw new Error('No valid suggestions generated')
      }
    } catch (error) {
      handleError(error, t('generateSuggestionsError'), 'TodoManagement')
      showError(error instanceof Error ? error.message : t('generateSuggestionsError'))
    } finally {
      isGenerating.value = false
    }
  }

  const cancelDomainSelection = () => {
    showDomainSelection.value = false
    selectedDomain.value = ''
  }

  // 计算是否有已完成的历史记录
  const hasCompletedHistory = computed(() => {
    return todos.value.some((todo) => todo.completed)
  })

  const confirmSuggestedTodos = async () => {
    // 过滤掉空的建议项
    const validSuggestions = suggestedTodos.value.filter((todo) => todo.trim() !== '')

    if (validSuggestions.length === 0) {
      showError('请至少添加一个有效的建议')
      return
    }

    const originalSuggestedCount = validSuggestions.length
    const duplicates = addMultipleTodos(
      validSuggestions.map((todo) => ({
        text: todo,
      }))
    )
    if (duplicates.length > 0) {
      showError(`${t('duplicateError')}：${duplicates.join(', ')}`)
    }

    // 计算成功添加的待办事项数量
    const successfullyAdded = originalSuggestedCount - duplicates.length

    // 关闭建议对话框
    showSuggestedTodos.value = false
    suggestedTodos.value = []

    // 如果成功添加了待办事项，进行批量 AI 分析
    if (successfullyAdded > 0) {
      try {
        // 获取最新添加的待办事项（未分析的）
        const newTodos = todos.value.filter((todo) => !todo.aiAnalyzed && !todo.completed)
        if (newTodos.length > 0) {
          await batchAnalyzeTodosAction(newTodos, (updates) => {
            // 批量更新待办事项
            batchUpdateTodos(updates)
          })
        }
      } catch (error) {
        console.warn('批量 AI 分析失败:', error)
        // 不显示错误，因为添加待办事项已经成功了
      }
    }
  }

  const cancelSuggestedTodos = () => {
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  const updateSuggestedTodo = (index: number, newText: string) => {
    suggestedTodos.value[index] = newText
  }

  const deleteSuggestedTodo = (index: number) => {
    suggestedTodos.value.splice(index, 1)
  }

  const addSuggestedTodo = () => {
    suggestedTodos.value.push('')
  }

  const sortActiveTodosWithAI = async () => {
    if (isSorting.value) {
      return
    }

    const activeTodos = todos.value.filter((todo) => !todo.completed)

    if (activeTodos.length === 0) {
      showError('没有待办事项需要排序')
      return
    }

    if (activeTodos.length < 2) {
      showError('至少需要2个待办事项才能进行排序')
      return
    }

    console.warn(
      '✅ 开始 AI 排序，待办事项:',
      activeTodos.map((t) => t.text)
    )
    isSorting.value = true

    try {
      // 检查 API Key 配置
      const apiKey = localStorage.getItem('deepseek_api_key')
      if (!apiKey || apiKey.trim() === '') {
        showError(t('configureApiKey', '请先在设置中配置 DeepSeek API Key'))
        return
      }

      // 构建更详细的提示词，包含任务内容和上下文
      const todoTexts = activeTodos.map((todo, index) => `${index + 1}. ${todo.text}`).join('\n')
      const prompt = `作为一个专业的任务管理助手，请根据以下标准对待办事项进行优先级排序：
1. 紧急程度（截止时间、时间敏感性）
2. 重要程度（对目标的影响）
3. 依赖关系（是否阻塞其他任务）
4. 完成难度和所需时间

待办事项列表：
${todoTexts}

请返回排序后的序号列表，格式为：1,3,2,4（用逗号分隔，不要包含其他文字）`

      console.warn('🤖 发送 AI 请求...')
      const aiResponse = await getAIResponse(prompt)
      console.warn('📥 AI 响应:', aiResponse)

      // 改进的解析逻辑，支持多种格式
      let sortedIndices: number[] = []

      // 尝试多种解析方式
      const cleanResponse = aiResponse.replace(/[^\d,，\s]/g, '').trim()

      // 方式1：直接匹配数字序列
      const directMatch = cleanResponse.match(/^[\d,，\s]+$/)
      if (directMatch) {
        sortedIndices = cleanResponse
          .split(/[,，\s]+/)
          .map((num) => parseInt(num.trim()))
          .filter((num) => !isNaN(num) && num >= 1 && num <= activeTodos.length)
          .map((num) => num - 1)
      }

      // 方式2：从响应中提取所有数字
      if (sortedIndices.length === 0) {
        const allNumbers = aiResponse.match(/\d+/g)?.map((num) => parseInt(num)) || []
        const validNumbers = allNumbers.filter((num) => num >= 1 && num <= activeTodos.length)

        // 去重并保持顺序
        const uniqueNumbers = [...new Set(validNumbers)]
        if (uniqueNumbers.length === activeTodos.length) {
          sortedIndices = uniqueNumbers.map((num) => num - 1)
        }
      }

      // 验证排序结果
      if (
        sortedIndices.length === activeTodos.length &&
        new Set(sortedIndices).size === activeTodos.length &&
        sortedIndices.every((index) => index >= 0 && index < activeTodos.length)
      ) {
        // 应用排序
        // 应用新的排序顺序
        const sortedTodos = sortedIndices.map((index) => activeTodos[index])
        console.warn(
          '📝 排序后的待办事项:',
          sortedTodos.map((t) => t.text)
        )
        const todoMap = new Map(todos.value.map((todo) => [todo.id, todo]))

        // 更新排序，保持已完成任务的位置不变
        let orderCounter = 0
        sortedTodos.forEach((sortedTodo) => {
          const originalTodo = todoMap.get(sortedTodo.id)
          if (originalTodo && !originalTodo.completed) {
            originalTodo.order = orderCounter++
          }
        })

        // 确保已完成的任务排在最后
        todos.value
          .filter((todo) => todo.completed)
          .forEach((todo) => {
            todo.order = orderCounter++
          })

        // 重新排序 todos 数组以触发响应式更新
        const sortedTodosArray = todos.value.sort((a, b) => a.order - b.order)

        // 强制触发响应式更新：创建新的数组引用
        todos.value = [...sortedTodosArray]

        saveTodos()

        // 使用 nextTick 确保 DOM 更新后再显示成功消息
        await nextTick()

        console.warn(
          '🎉 AI 排序完成，todos 数组已更新:',
          todos.value.map((t) => ({ id: t.id, text: t.text, order: t.order }))
        )

        // AI 排序成功完成
        showSuccess(t('aiSortSuccess', 'AI 优先级排序完成！'))
      } else {
        console.warn('AI 排序解析失败:', {
          response: aiResponse,
          cleanResponse,
          sortedIndices,
          expectedLength: activeTodos.length,
        })
        showError(t('aiSortParseFailed', 'AI 排序解析失败，请重试'))
      }
    } catch (error) {
      // AI 排序失败

      if (error instanceof Error) {
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        })

        if (error.message.includes('configureApiKey') || error.message.includes('API Key')) {
          console.error('🔑 API Key 配置错误')
          showError(t('configureApiKey', '请先在设置中配置 DeepSeek API Key'))
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          console.error('🌐 网络连接错误')
          showError('网络连接失败，请检查网络设置后重试')
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('🔐 API Key 认证失败')
          showError('API Key 认证失败，请检查 API Key 是否正确')
        } else if (error.message.includes('429')) {
          console.error('⏰ API 请求频率限制')
          showError('请求过于频繁，请稍后再试')
        } else {
          console.error('🔧 其他错误')
          showError(t('aiSortFailed', 'AI 排序失败，请检查网络连接和 API 配置'))
        }
      } else {
        // 处理未知错误类型
        showError(t('aiSortFailed', 'AI 排序失败，请重试'))
      }
    } finally {
      console.warn('🏁 AI 排序流程结束，重置状态')
      isSorting.value = false
    }
  }

  const handleAddTodo = async (text: string, tags: string[]) => {
    if (!text || text.trim() === '') {
      showError(t('emptyTodoError'))
      return
    }

    const success = addTodo(text, tags)
    if (!success) {
      showError(t('duplicateError'))
      return
    }

    console.warn('任务添加成功，检查自动分析配置:', analysisConfig.value.autoAnalyzeNewTodos)

    // 如果启用了自动分析新待办事项，则自动触发 AI 分析
    if (analysisConfig.value.autoAnalyzeNewTodos) {
      try {
        // 找到刚添加的 Todo（最新的一个）
        const newTodo = todos.value
          .filter((todo) => !todo.completed && !todo.aiAnalyzed)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

        console.warn('找到新添加的任务:', newTodo)

        if (newTodo) {
          console.warn('开始自动 AI 分析...')
          // 异步执行 AI 分析，不阻塞用户操作
          analyzeSingleTodo(newTodo, (id: number, updates: Partial<Todo>) => {
            console.warn('自动分析完成，更新任务:', id, updates)
            updateTodo(id, updates)
          }).catch((error) => {
            // 分析失败时静默处理，不影响任务添加，也不设置任何默认值
            console.warn('Auto AI analysis failed for new todo:', error)
            logger.warn('Auto AI analysis failed for new todo', error, 'TodoManagement')
            // 不更新任何字段，保持 Todo 的原始状态
          })
        } else {
          console.warn('未找到需要分析的新任务')
        }
      } catch (error) {
        // 分析失败时静默处理，不影响任务添加
        console.warn('Error in auto AI analysis:', error)
        logger.warn('Error in auto AI analysis', error, 'TodoManagement')
      }
    } else {
      console.warn('自动分析功能未启用')
    }
  }

  return {
    filter,
    searchQuery,
    filteredTodos,
    hasActiveTodos,
    hasCompletedHistory,
    isGenerating,
    isSorting,
    isLoading,
    isAnalyzing,
    suggestedTodos,
    showSuggestedTodos,
    showDomainSelection,
    selectedDomain,
    MAX_TODO_LENGTH,
    duplicateError,
    generateSuggestedTodos,
    generateSuggestedTodosWithDomain,
    cancelDomainSelection,
    confirmSuggestedTodos,
    cancelSuggestedTodos,
    updateSuggestedTodo,
    deleteSuggestedTodo,
    addSuggestedTodo,
    sortActiveTodosWithAI,
    handleAddTodo,
    toggleTodo,
    removeTodo,
    updateTodo,
    batchUpdateTodos,
  }
}
