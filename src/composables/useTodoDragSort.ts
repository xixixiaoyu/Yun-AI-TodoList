import type { Todo } from '@/types/todo'
import { useSortable } from '@vueuse/integrations/useSortable'
import { computed, nextTick, ref, watch, type Ref } from 'vue'

// 拖拽事件类型定义
interface SortableEvent {
  item: HTMLElement
  oldIndex: number
  newIndex: number
}

/**
 * 待办事项拖拽排序 composable
 * 提供拖拽排序功能，包括视觉反馈和数据更新
 */
export function useTodoDragSort(todos: Ref<Todo[]>, onOrderChange: (newOrder: Todo[]) => void) {
  const sortableContainer = ref<HTMLElement>()
  const isDragging = ref(false)
  const draggedItem = ref<Todo | null>(null)

  // 创建一个可变的 ref 来存储当前的 todos，避免 computed readonly 问题
  const sortableTodos = ref<Todo[]>([])

  // 监听 todos 变化，同步到 sortableTodos
  watch(
    todos,
    (newTodos) => {
      sortableTodos.value = [...newTodos]
    },
    { immediate: true, deep: true }
  )

  // 拖拽配置选项
  const sortableOptions = {
    animation: 200,
    ghostClass: 'todo-ghost',
    chosenClass: 'todo-chosen',
    dragClass: 'todo-drag',
    forceFallback: true,
    fallbackClass: 'todo-fallback',
    fallbackOnBody: true,
    swapThreshold: 0.65,
    invertSwap: false,
    direction: 'vertical',
    scroll: true,
    scrollSensitivity: 30,
    scrollSpeed: 10,
    bubbleScroll: true,

    // 拖拽开始事件
    onStart: (evt: SortableEvent) => {
      isDragging.value = true
      const todoId = parseInt(evt.item.dataset.todoId)
      draggedItem.value = todos.value.find((todo) => todo.id === todoId) || null

      // 添加拖拽开始的视觉效果
      document.body.classList.add('dragging-todo')
    },

    // 拖拽结束事件
    onEnd: (evt: SortableEvent) => {
      isDragging.value = false
      draggedItem.value = null
      document.body.classList.remove('dragging-todo')

      // 如果位置发生变化，更新顺序
      if (evt.oldIndex !== evt.newIndex) {
        updateTodoOrder(evt.oldIndex, evt.newIndex)
      }
    },

    // 拖拽移动事件
    onMove: () => {
      // 可以在这里添加额外的移动逻辑
      return true
    },
  }

  // 初始化拖拽排序 - 使用可变的 sortableTodos 而不是 computed todos
  const { start, stop } = useSortable(sortableContainer, sortableTodos, sortableOptions)

  /**
   * 更新待办事项顺序
   */
  const updateTodoOrder = async (oldIndex: number, newIndex: number) => {
    try {
      // 使用 sortableTodos 的当前值来计算新顺序
      const newTodos = [...sortableTodos.value]
      const [movedTodo] = newTodos.splice(oldIndex, 1)
      newTodos.splice(newIndex, 0, movedTodo)

      // 重新计算 order 值
      const updatedTodos = newTodos.map((todo, index) => ({
        ...todo,
        order: index,
        updatedAt: new Date().toISOString(),
      }))

      // 等待下一个 tick 确保 DOM 更新完成
      await nextTick()

      // 调用回调函数更新数据
      onOrderChange(updatedTodos)
    } catch (error) {
      console.error('更新待办事项顺序失败:', error)
    }
  }

  /**
   * 启用拖拽排序
   */
  const enableDragSort = () => {
    start()
  }

  /**
   * 禁用拖拽排序
   */
  const disableDragSort = () => {
    stop()
  }

  /**
   * 检查是否正在拖拽
   */
  const isCurrentlyDragging = computed(() => isDragging.value)

  /**
   * 获取当前拖拽的项目
   */
  const currentDraggedItem = computed(() => draggedItem.value)

  /**
   * 检查特定项目是否正在被拖拽
   */
  const isItemBeingDragged = (todo: Todo) => {
    return draggedItem.value?.id === todo.id
  }

  /**
   * 获取拖拽手柄的属性
   */
  const getDragHandleProps = () => ({
    class: 'todo-drag-handle',
    'data-drag-handle': true,
  })

  /**
   * 获取可拖拽项目的属性
   */
  const getDraggableItemProps = (todo: Todo) => ({
    'data-todo-id': todo.id,
    class: {
      'todo-draggable': true,
      'todo-dragging': isItemBeingDragged(todo),
    },
  })

  return {
    sortableContainer,
    isDragging: isCurrentlyDragging,
    draggedItem: currentDraggedItem,
    enableDragSort,
    disableDragSort,
    isItemBeingDragged,
    getDragHandleProps,
    getDraggableItemProps,
    updateTodoOrder,
  }
}

/**
 * 拖拽排序的样式类名
 */
export const dragSortClasses = {
  container: 'todo-sortable-container',
  item: 'todo-draggable',
  handle: 'todo-drag-handle',
  ghost: 'todo-ghost',
  chosen: 'todo-chosen',
  drag: 'todo-drag',
  fallback: 'todo-fallback',
} as const
