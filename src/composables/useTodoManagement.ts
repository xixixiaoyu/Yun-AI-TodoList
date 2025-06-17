import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAIResponse } from '../services/deepseekService'
import type { Todo } from '../types/todo'
import { handleError, logger } from '../utils/logger'
import { useErrorHandler } from './useErrorHandler'
import { useTodos } from './useTodos'

export function useTodoManagement() {
  const { t } = useI18n()
  const { todos, addTodo, addMultipleTodos, toggleTodo, removeTodo, saveTodos } = useTodos()
  const { showError, showSuccess, error: duplicateError } = useErrorHandler()

  const filter = ref('active')
  const searchQuery = ref('')
  const isGenerating = ref(false)
  const suggestedTodos = ref<string[]>([])
  const showSuggestedTodos = ref(false)
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
    isGenerating.value = true
    try {
      const response = await getAIResponse(`${t('generateSuggestionsPrompt')}`, 'zh', 1.5)

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

      suggestedTodos.value = parsedTodos
        .filter((todo) => todo.length > 0 && todo.length <= MAX_TODO_LENGTH)
        .slice(0, 5)

      if (suggestedTodos.value.length > 0) {
        showSuggestedTodos.value = true
        logger.info(
          'AI suggestions generated successfully',
          { count: suggestedTodos.value.length, suggestions: suggestedTodos.value },
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

  const confirmSuggestedTodos = () => {
    const duplicates = addMultipleTodos(
      suggestedTodos.value.map((todo) => ({
        text: todo,
      }))
    )
    if (duplicates.length > 0) {
      showError(`${t('duplicateError')}：${duplicates.join(', ')}`)
    }
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  const cancelSuggestedTodos = () => {
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  const updateSuggestedTodo = (index: number, newText: string) => {
    suggestedTodos.value[index] = newText
  }

  const sortActiveTodosWithAI = async () => {
    if (isSorting.value) {
      return
    }

    const activeTodos = todos.value.filter((todo) => !todo.completed)

    if (activeTodos.length === 0) {
      showError(t('noActiveTodos', '没有活跃的待办事项'))
      return
    }

    if (activeTodos.length < 2) {
      showError(t('needMoreTodos', '至少需要2个待办事项才能进行排序'))
      return
    }
    isSorting.value = true

    try {
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

      const aiResponse = await getAIResponse(prompt)

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
        const sortedTodos = sortedIndices.map((index) => activeTodos[index])
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

        saveTodos()

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
      console.error('AI 排序失败:', error)
      if (error instanceof Error) {
        if (error.message.includes('configureApiKey') || error.message.includes('API Key')) {
          showError(t('configureApiKey', '请先在设置中配置 DeepSeek API Key'))
        } else {
          showError(t('aiSortFailed', 'AI 排序失败，请检查网络连接和 API 配置'))
        }
      } else {
        showError(t('aiSortFailed', 'AI 排序失败，请重试'))
      }
    } finally {
      isSorting.value = false
    }
  }

  const handleAddTodo = (text: string, tags: string[]) => {
    if (text && text.trim() !== '') {
      const success = addTodo(text, tags)
      if (!success) {
        showError(t('duplicateError'))
      }
    } else {
      showError(t('emptyTodoError'))
    }
  }

  return {
    filter,
    searchQuery,
    filteredTodos,
    hasActiveTodos,
    isGenerating,
    isSorting,
    isLoading,
    suggestedTodos,
    showSuggestedTodos,
    MAX_TODO_LENGTH,
    duplicateError,
    generateSuggestedTodos,
    confirmSuggestedTodos,
    cancelSuggestedTodos,
    updateSuggestedTodo,
    sortActiveTodosWithAI,
    handleAddTodo,
    toggleTodo,
    removeTodo,
  }
}
