import type { Todo } from '@/types/todo'
import { handleError as logError, logger } from '@/utils/logger'
import { onBeforeMount, onErrorCaptured, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from './useConfirmDialog'
import { useErrorHandler } from './useErrorHandler'
import { useTodoManagement } from './useTodoManagement'
import { useTodos } from './useTodos'
import { useUIState } from './useUIState'

/**
 * TodoList 状态管理 composable
 * 整合所有 TodoList 相关的状态和逻辑
 */
export function useTodoListState() {
  const { t } = useI18n()
  const { showError, error, success } = useErrorHandler()
  const confirmDialog = useConfirmDialog()

  const todoListRef = ref<HTMLElement | null>(null)

  const { showConfirmDialog, confirmDialogConfig, handleConfirm, handleCancel } = confirmDialog

  const { todos, loadTodos, updateTodosOrder, updateTodosOrderByArray } = useTodos()

  const {
    filter,
    searchQuery,
    filteredTodos,
    hasActiveTodos,
    isGenerating,
    isSorting,
    suggestedTodos,
    showSuggestedTodos,
    MAX_TODO_LENGTH,
    generateSuggestedTodos,
    confirmSuggestedTodos,
    cancelSuggestedTodos,
    updateSuggestedTodo,
    sortActiveTodosWithAI,
    handleAddTodo,
    toggleTodo,
    removeTodo,
    duplicateError,
    isLoading,
  } = useTodoManagement()

  // 拖拽排序功能
  const handleDragOrderChange = (newTodos: Todo[]) => {
    console.warn('handleDragOrderChange 被调用:', newTodos)
    try {
      const success = updateTodosOrderByArray(newTodos)
      if (success) {
        logger.debug(
          'Drag sort completed successfully',
          { count: newTodos.length },
          'TodoListState'
        )
        console.warn('拖拽排序成功完成')
      } else {
        console.error('updateTodosOrderByArray 返回 false')
        showError(t('dragSortError', '拖拽排序失败'))
      }
    } catch (error) {
      console.error('handleDragOrderChange 错误:', error)
      showError(t('dragSortError', '拖拽排序失败'))
    }
  }

  const showSearch = ref(false)
  const toggleSearch = () => {
    showSearch.value = !showSearch.value
    if (!showSearch.value) {
      searchQuery.value = ''
    }
  }
  const collapseSearch = () => {
    showSearch.value = false
    searchQuery.value = ''
  }

  const {
    showCharts,
    isSmallScreen,
    themeIcon,
    themeTooltip,
    toggleTheme,
    toggleCharts,
    closeCharts,
    handlePomodoroComplete,
    checkPomodoroCompletion,
    onKeyDown: originalOnKeyDown,
  } = useUIState()

  const onKeyDown = (event: KeyboardEvent) => {
    originalOnKeyDown(event)

    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleSearch()
      }
    }
  }

  const handleError = (error: Error) => {
    logError(error, 'TodoList error', 'TodoListState')
    showError(t('generalError'))
  }

  onErrorCaptured(handleError)

  let renderStartTime = 0
  onBeforeMount(() => {
    renderStartTime = performance.now()
  })

  onMounted(() => {
    document.addEventListener('visibilitychange', checkPomodoroCompletion)
    document.addEventListener('keydown', onKeyDown)

    try {
      loadTodos()
      logger.debug('Todos loaded', todos.value, 'TodoListState')
    } catch (error) {
      logError(error, 'Error loading todos', 'TodoListState')
      showError(error instanceof Error ? error.message : 'Failed to load todos')
    }

    const renderTime = performance.now() - renderStartTime
    if (renderTime > 100) {
      logger.warn(`TodoList render time: ${renderTime}ms`, { renderTime }, 'TodoListState')
    }
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', checkPomodoroCompletion)
    document.removeEventListener('keydown', onKeyDown)
  })

  return {
    todoListRef,

    showConfirmDialog,
    confirmDialogConfig,
    handleConfirm,
    handleCancel,

    todos,
    updateTodosOrder,
    updateTodosOrderByArray,
    handleDragOrderChange,

    filter,
    searchQuery,
    filteredTodos,
    hasActiveTodos,
    isGenerating,
    isSorting,
    suggestedTodos,
    showSuggestedTodos,
    MAX_TODO_LENGTH,
    generateSuggestedTodos,
    confirmSuggestedTodos,
    cancelSuggestedTodos,
    updateSuggestedTodo,
    sortActiveTodosWithAI,
    handleAddTodo,
    toggleTodo,
    removeTodo,
    duplicateError,
    isLoading,

    showCharts,
    showSearch,
    isSmallScreen,
    themeIcon,
    themeTooltip,
    toggleTheme,
    toggleCharts,
    toggleSearch,
    closeCharts,
    collapseSearch,
    handlePomodoroComplete,

    onKeyDown,
    handleError,
    error,
    success,
  }
}
