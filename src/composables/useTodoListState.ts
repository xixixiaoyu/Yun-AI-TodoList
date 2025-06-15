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
  const { showError } = useErrorHandler()
  const confirmDialog = useConfirmDialog()

  // 创建待办事项列表的 ref，用于拖拽排序功能
  const todoListRef = ref<HTMLElement | null>(null)

  // 使用各种 composables
  const { showConfirmDialog, confirmDialogConfig, handleConfirm, handleCancel } =
    confirmDialog

  const { todos, loadTodos, updateTodosOrder } = useTodos()

  // 待办事项管理相关
  const {
    filter,
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

  // UI状态管理相关
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
    onKeyDown,
  } = useUIState()

  // 添加错误边界处理
  const handleError = (error: Error) => {
    logError(error, 'TodoList error', 'TodoListState')
    showError(t('generalError'))
  }

  onErrorCaptured(handleError)

  // 添加性能监控
  let renderStartTime = 0
  onBeforeMount(() => {
    renderStartTime = performance.now()
  })

  onMounted(() => {
    document.addEventListener('visibilitychange', checkPomodoroCompletion)
    document.addEventListener('keydown', onKeyDown)

    try {
      loadTodos() // 加载待办事项数据
      logger.debug('Todos loaded', todos.value, 'TodoListState')
    } catch (error) {
      logError(error, 'Error loading todos', 'TodoListState')
      showError(error instanceof Error ? error.message : 'Failed to load todos')
    }

    const renderTime = performance.now() - renderStartTime
    if (renderTime > 100) {
      logger.warn(
        `TodoList render time: ${renderTime}ms`,
        { renderTime },
        'TodoListState'
      )
    }
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', checkPomodoroCompletion)
    document.removeEventListener('keydown', onKeyDown)
  })

  return {
    // Refs
    todoListRef,

    // 确认对话框
    showConfirmDialog,
    confirmDialogConfig,
    handleConfirm,
    handleCancel,

    // 待办事项数据
    todos,
    updateTodosOrder,

    // 待办事项管理
    filter,
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

    // UI 状态
    showCharts,
    isSmallScreen,
    themeIcon,
    themeTooltip,
    toggleTheme,
    toggleCharts,
    closeCharts,
    handlePomodoroComplete,

    // 事件处理
    handleError,
  }
}
