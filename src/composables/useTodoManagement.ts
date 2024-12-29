import { ref, computed } from 'vue'
import { useTodos } from './useTodos'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from './useErrorHandler'
import { useConfirmDialog } from './useConfirmDialog'
import { getAIResponse } from '../services/deepseekService'

export function useTodoManagement() {
  const { t } = useI18n()
  const {
    todos,
    currentProjectId,
    addTodo,
    addMultipleTodos,
    toggleTodo,
    removeTodo,
    clearActiveTodos,
    saveTodos,
  } = useTodos()
  const { showError, error: duplicateError } = useErrorHandler()
  const { showConfirmDialog, confirmDialogConfig } = useConfirmDialog()

  const filter = ref('active')
  const isGenerating = ref(false)
  const suggestedTodos = ref<string[]>([])
  const showSuggestedTodos = ref(false)
  const isSorting = ref(false)
  const MAX_TODO_LENGTH = 50

  // 计算是否正在加载中
  const isLoading = computed(() => isSorting.value)

  // 清除已完成的待办事项
  const clearActive = () => {
    showConfirmDialog.value = true
    confirmDialogConfig.value = {
      title: t('clearCompleted'),
      message: t('confirmClearCompleted'),
      confirmText: t('confirm'),
      cancelText: t('cancel'),
      action: clearActiveTodos,
    }
  }

  // 计算已过滤的待办事项
  const filteredTodos = computed(() => {
    try {
      let filtered = todos.value
      if (!Array.isArray(filtered)) {
        console.error('Invalid todos data structure')
        return []
      }

      if (currentProjectId.value !== null) {
        filtered = filtered.filter(
          (todo) => todo && todo.projectId === currentProjectId.value
        )
      }

      const filterFn =
        filter.value === 'active'
          ? (todo: any) => todo && !todo.completed
          : filter.value === 'completed'
            ? (todo: any) => todo && todo.completed
            : (todo: any) => todo !== null && todo !== undefined

      return filtered.filter(filterFn)
    } catch (error) {
      console.error('Error in filteredTodos computed:', error)
      return []
    }
  })

  // 检查是否有未完成的待办事项
  const hasActiveTodos = computed(() => {
    return todos.value.some((todo) => todo && !todo.completed)
  })

  // 生成建议待办事项
  const generateSuggestedTodos = async () => {
    isGenerating.value = true
    try {
      const response = await getAIResponse(`${t('generateSuggestionsPrompt')}`, 'zh', 1.5)
      suggestedTodos.value = response
        .split(',')
        .filter((todo: string) => todo.trim() !== '')
        .slice(0, 5)
      showSuggestedTodos.value = true
    } catch (error) {
      console.error(t('generateSuggestionsError'), error)
      showError(error instanceof Error ? error.message : t('generateSuggestionsError'))
    } finally {
      isGenerating.value = false
    }
  }

  // 确认添加建议待办事项
  const confirmSuggestedTodos = () => {
    const duplicates = addMultipleTodos(
      suggestedTodos.value.map((todo) => ({
        text: todo,
        projectId: currentProjectId.value,
      }))
    )
    if (duplicates.length > 0) {
      showError(`${t('duplicateError')}：${duplicates.join(', ')}`)
    }
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  // 取消添加建议待办事项
  const cancelSuggestedTodos = () => {
    showSuggestedTodos.value = false
    suggestedTodos.value = []
  }

  // 更新建议待办事项
  const updateSuggestedTodo = (index: number, newText: string) => {
    suggestedTodos.value[index] = newText
  }

  // 使用 AI 对未完成的待办事项进行排序
  const sortActiveTodosWithAI = async () => {
    isSorting.value = true
    try {
      const activeTodos = todos.value.filter((todo) => todo && !todo.completed)
      if (activeTodos.length <= 1) {
        showError(t('noActiveTodosError'))
        return
      }
      const todoTexts = activeTodos
        .map((todo, index) => `${index + 1}. ${todo.text}`)
        .join('\n')
      const prompt = `${t('sortPrompt')}:\n${todoTexts}`
      const response = await getAIResponse(prompt, 'zh', 0.1)
      if (!response) {
        throw new Error(t('aiEmptyResponseError'))
      }
      const newOrder = response.split(',').map(Number)
      if (newOrder.length !== activeTodos.length) {
        throw new Error(t('aiSortMismatchError'))
      }

      const sortedTodos = newOrder.map((index) => activeTodos[index - 1])

      todos.value = todos.value.map((todo) => {
        if (!todo || todo.completed) {
          return todo
        }
        return sortedTodos.shift() || todo
      })

      saveTodos()
    } catch (error) {
      console.error(t('aiSortError'), error)
      showError(error instanceof Error ? error.message : t('aiSortError'))
    } finally {
      isSorting.value = false
    }
  }

  // 处理添加新待办事项
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
    clearActiveTodos,
    clearActive,
  }
}
