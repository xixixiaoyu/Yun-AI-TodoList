import { debounce } from 'lodash-es'
// @ts-expect-error - sortablejs types may not be available
import Sortable from 'sortablejs'
import { computed, nextTick, onUnmounted, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Todo } from '../types/todo'
import { useErrorHandler } from './useErrorHandler'

/**
 * 拖拽排序事件接口
 */
interface SortableEvent {
  oldIndex: number
  newIndex: number
  item: HTMLElement
  from: HTMLElement
  to: HTMLElement
  clone: HTMLElement
}

/**
 * 拖拽排序配置选项
 */
interface DragSortOptions {
  animation?: number
  ghostClass?: string
  chosenClass?: string
  dragClass?: string
  disabled?: boolean
  handle?: string
  filter?: string
  preventOnFilter?: boolean
  delay?: number
  delayOnTouchStart?: boolean
  touchStartThreshold?: number
  forceFallback?: boolean
  fallbackClass?: string
  fallbackOnBody?: boolean
  fallbackTolerance?: number
  scroll?: boolean
  scrollSensitivity?: number
  scrollSpeed?: number
  bubbleScroll?: boolean
}

/**
 * 拖拽排序状态
 */
interface DragSortState {
  isDragging: boolean
  draggedItem: Todo | null
  originalOrder: number[]
  isProcessing: boolean
  status: 'idle' | 'dragging' | 'processing' | 'success' | 'error'
  statusMessage: string
}

/**
 * Todo 拖拽排序 composable
 * 提供增强的拖拽排序功能，包括视觉反馈、性能优化、错误处理等
 */
export function useTodoDragSort(
  containerRef: Ref<HTMLElement | null>,
  todos: Ref<Todo[]>,
  onOrderChange: (newOrder: number[]) => Promise<void> | void
) {
  const { t } = useI18n()
  const { showError } = useErrorHandler()

  // 拖拽状态
  const dragState = ref<DragSortState>({
    isDragging: false,
    draggedItem: null,
    originalOrder: [],
    isProcessing: false,
    status: 'idle',
    statusMessage: '',
  })

  // 拖拽配置选项
  const defaultOptions: DragSortOptions = {
    animation: 200,
    ghostClass: 'todo-ghost',
    chosenClass: 'todo-chosen',
    dragClass: 'todo-drag',
    disabled: false,
    handle: '.drag-handle',
    delay: 0, // 移除延迟，立即响应拖拽
    delayOnTouchStart: false, // 触摸时也立即响应
    touchStartThreshold: 5, // 降低触摸阈值，提高响应性
    forceFallback: false,
    fallbackClass: 'todo-fallback',
    fallbackOnBody: true,
    fallbackTolerance: 3, // 降低容错范围，提高精确度
    scroll: true,
    scrollSensitivity: 40, // 调整滚动敏感度
    scrollSpeed: 15, // 调整滚动速度
    bubbleScroll: true,
  }

  // 防抖的顺序更新函数
  const debouncedOrderUpdate = debounce(async (newOrder: number[]) => {
    try {
      dragState.value.isProcessing = true
      dragState.value.status = 'processing'
      dragState.value.statusMessage = ''

      await onOrderChange(newOrder)

      // 成功状态
      dragState.value.status = 'success'
      setTimeout(() => {
        if (dragState.value.status === 'success') {
          resetDragState()
        }
      }, 1500)
    } catch (error) {
      console.error('Error updating todo order:', error)
      dragState.value.status = 'error'
      dragState.value.statusMessage = error instanceof Error ? error.message : ''
      showError(t('dragSortError', 'Failed to update todo order'))

      // 回滚到原始顺序
      await rollbackOrder()

      // 错误状态持续一段时间后重置
      setTimeout(() => {
        if (dragState.value.status === 'error') {
          resetDragState()
        }
      }, 3000)
    } finally {
      dragState.value.isProcessing = false
    }
  }, 300)

  // 回滚到原始顺序
  const rollbackOrder = async () => {
    if (dragState.value.originalOrder.length > 0) {
      try {
        await onOrderChange(dragState.value.originalOrder)
      } catch (error) {
        console.error('Error rolling back todo order:', error)
        showError(t('dragRollbackError', 'Failed to restore original order'))
      }
    }
  }

  // 拖拽开始事件处理
  const onDragStart = (evt: SortableEvent) => {
    const todoId = parseInt(evt.item.dataset.todoId || '0')
    const draggedTodo = todos.value.find((todo) => todo.id === todoId)

    dragState.value = {
      isDragging: true,
      draggedItem: draggedTodo || null,
      originalOrder: todos.value.map((todo) => todo.id),
      isProcessing: false,
      status: 'dragging',
      statusMessage: '',
    }

    // 添加拖拽开始的视觉反馈
    evt.item.classList.add('dragging')

    // 触觉反馈（如果支持）
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  // 拖拽结束事件处理
  const onDragEnd = async (evt: SortableEvent) => {
    try {
      const { oldIndex, newIndex } = evt

      // 移除拖拽样式
      evt.item.classList.remove('dragging')

      // 如果位置没有改变，直接返回
      if (oldIndex === newIndex) {
        resetDragState()
        return
      }

      // 获取新的顺序
      const todoIds = Array.from(evt.to.children)
        .map((el) => parseInt((el as HTMLElement).dataset.todoId || '0'))
        .filter((id) => id > 0)

      // 更新顺序
      await debouncedOrderUpdate(todoIds)

      // 触觉反馈（如果支持）
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30])
      }
    } catch (error) {
      console.error('Error in drag end handler:', error)
      showError(t('dragEndError', 'Failed to complete drag operation'))
      await rollbackOrder()
    } finally {
      resetDragState()
    }
  }

  // 重置拖拽状态
  const resetDragState = () => {
    dragState.value = {
      isDragging: false,
      draggedItem: null,
      originalOrder: [],
      isProcessing: false,
      status: 'idle',
      statusMessage: '',
    }
  }

  // 拖拽移动事件处理（用于实时预览）
  const onDragMove = (_evt: SortableEvent) => {
    // 可以在这里添加实时预览逻辑
    return true // 允许移动
  }

  // 计算属性：是否禁用拖拽
  const isDragDisabled = computed(() => {
    return dragState.value.isProcessing || todos.value.length <= 1
  })

  // 初始化拖拽排序

  let sortableInstance: typeof Sortable | null = null
  let option: ((key: string, value: unknown) => void) | null = null

  // 等待 DOM 准备好后初始化
  const initializeSortable = async () => {
    await nextTick()
    if (containerRef.value && todos.value.length > 0 && !sortableInstance) {
      // 销毁现有实例（如果存在）
      if (sortableInstance) {
        sortableInstance.destroy()
      }

      // 创建新的 Sortable 实例
      sortableInstance = new Sortable(containerRef.value, {
        ...defaultOptions,
        disabled: isDragDisabled.value,
        onStart: onDragStart,
        onEnd: onDragEnd,
        onMove: onDragMove,
      })

      // 创建 option 函数
      option = (key: string, value: unknown) => {
        if (sortableInstance) {
          sortableInstance.option(key, value)
        }
      }
    }
  }

  // 立即尝试初始化
  initializeSortable()

  // 监听容器和数据变化
  watch(
    [containerRef, todos],
    () => {
      if (containerRef.value && todos.value.length > 0 && !sortableInstance) {
        initializeSortable()
      }
    },
    { immediate: true }
  )

  // 动态更新配置选项
  const updateOptions = (newOptions: Partial<DragSortOptions>) => {
    if (option) {
      Object.entries(newOptions).forEach(([key, value]) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        option!(key as keyof DragSortOptions, value)
      })
    }
  }

  // 启用/禁用拖拽
  const setDragEnabled = (enabled: boolean) => {
    if (option) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      option!('disabled', !enabled)
    }
  }

  // 键盘支持功能
  const handleKeyboardSort = (todoId: number, direction: 'up' | 'down') => {
    const currentIndex = todos.value.findIndex((todo) => todo.id === todoId)
    if (currentIndex === -1) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= todos.value.length) {
      return
    }

    // 创建新的顺序数组
    const todoIds = todos.value.map((todo) => todo.id)
    const [movedId] = todoIds.splice(currentIndex, 1)
    todoIds.splice(newIndex, 0, movedId)

    // 更新顺序
    debouncedOrderUpdate(todoIds)
  }

  // 清理函数
  const cleanup = () => {
    debouncedOrderUpdate.cancel()
    resetDragState()
    if (sortableInstance) {
      sortableInstance.destroy()
      sortableInstance = null
    }
  }

  // 组件卸载时清理
  onUnmounted(cleanup)

  return {
    // 状态
    dragState: computed(() => dragState.value),
    isDragDisabled,

    // 方法
    updateOptions,
    setDragEnabled,
    resetDragState,
    rollbackOrder,
    cleanup,
    handleKeyboardSort,

    // 内部方法（用于测试）
    onDragStart,
    onDragEnd,
    onDragMove,
  }
}
