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
    // AI 优先级排序只在待完成筛选状态下显示
    return filter.value === 'active' && todos.value.some((todo) => todo && !todo.completed)
  })

  const generateSuggestedTodos = async () => {
    isGenerating.value = true
    try {
      const response = await getAIResponse(`${t('generateSuggestionsPrompt')}`, 'zh', 1.5)

      // 改进的解析逻辑，支持多种格式
      let parsedTodos: string[] = []

      // 首先尝试按行分割（支持编号格式）
      const lines = response.split('\n').filter((line) => line.trim() !== '')

      if (lines.length >= 2) {
        // 如果有多行，尝试提取任务内容
        parsedTodos = lines
          .map((line) => {
            // 移除编号（如 "1. ", "- ", "• " 等）
            return line.replace(/^\s*[\d\-•*]+\.?\s*/, '').trim()
          })
          .filter((todo) => todo !== '' && todo.length > 0)
      } else {
        // 如果只有一行，尝试按逗号分割
        parsedTodos = response
          .split(/[,，]/)
          .map((todo) => todo.trim())
          .filter((todo) => todo !== '')
      }

      // 确保有有效的建议
      if (parsedTodos.length === 0) {
        // 如果解析失败，使用原始响应作为单个建议
        parsedTodos = [response.trim()]
      }

      // 限制数量并过滤空内容
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
    if (isSorting.value) return

    const activeTodos = todos.value.filter((todo) => !todo.completed)
    if (activeTodos.length === 0) {
      showError(t('noActiveTodosError'))
      return
    }

    if (activeTodos.length < 2) {
      showError(t('noActiveTodosError'))
      return
    }

    isSorting.value = true

    try {
      // 构建 AI 排序请求
      const todoTexts = activeTodos.map((todo, index) => `${index + 1}. ${todo.text}`).join('\n')
      const prompt = `请按照优先级对以下待办事项进行排序，返回排序后的序号列表（用逗号分隔）：\n${todoTexts}`

      const aiResponse = await getAIResponse(prompt)
      const sortedIndices = aiResponse.match(/\d+/g)?.map((num) => parseInt(num) - 1) || []

      // 更新排序后的待办事项
      if (sortedIndices.length === activeTodos.length) {
        const sortedTodos = sortedIndices.map((index) => activeTodos[index]).filter(Boolean)
        const todoMap = new Map(todos.value.map((todo) => [todo.id, todo]))
        sortedTodos.forEach((sortedTodo, index) => {
          const originalTodo = todoMap.get(sortedTodo.id)
          if (originalTodo) {
            originalTodo.order = index
          }
        })
      }

      saveTodos()
      showSuccess(t('aiSortSuccess'))
    } catch (error) {
      console.error('AI 排序失败:', error)
      showError(t('aiSortFailed'))
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
