import type { Todo } from '@/types/todo'
import { moveArrayElement, useSortable } from '@vueuse/integrations/useSortable'
import { computed, nextTick, ref, shallowRef, watch, type Ref } from 'vue'

/**
 * 待办事项拖拽排序 composable
 * 提供拖拽排序功能，包括视觉反馈和数据更新
 */
export function useTodoDragSort(
  todos: Ref<Todo[]>,
  onOrderChange: (newOrder: Todo[]) => void,
  containerRef: Ref<HTMLElement | undefined>
) {
  const isDragging = ref(false)
  const draggedItem = ref<Todo | null>(null)

  // 使用 shallowRef 来存储 todos，避免深度响应式问题
  const sortableTodos = shallowRef<Todo[]>([])

  // 监听 todos 变化，同步到 sortableTodos
  watch(
    todos,
    (newTodos) => {
      if (Array.isArray(newTodos)) {
        sortableTodos.value = [...newTodos]
      } else {
        sortableTodos.value = []
      }
    },
    { immediate: true, deep: true }
  )

  // 拖拽配置选项
  const sortableOptions = {
    animation: 200,
    handle: '.todo-drag-handle', // 指定拖拽手柄
    ghostClass: 'todo-ghost',
    chosenClass: 'todo-chosen',
    dragClass: 'todo-drag',
    forceFallback: true,
    fallbackClass: 'todo-fallback',
    fallbackOnBody: true,
    swapThreshold: 0.65,
    invertSwap: false,
    direction: 'vertical' as const,
    scroll: true,
    scrollSensitivity: 30,
    scrollSpeed: 10,
    bubbleScroll: true,

    // 拖拽开始事件
    onStart: (evt: { item: HTMLElement & { dataset: { todoId?: string } } }) => {
      console.warn('拖拽开始:', evt)
      isDragging.value = true
      const todoId = parseInt(evt.item.dataset.todoId || '0')
      draggedItem.value = todos.value.find((todo) => todo.id === todoId.toString()) || null
      console.warn('拖拽的待办事项:', draggedItem.value)

      // 添加拖拽开始的视觉效果
      document.body.classList.add('dragging-todo')
    },

    // 拖拽结束事件
    onEnd: (evt: { item: HTMLElement }) => {
      console.warn('拖拽结束:', evt)
      isDragging.value = false
      draggedItem.value = null
      document.body.classList.remove('dragging-todo')
    },

    // 自定义更新处理
    onUpdate: (evt: { oldIndex?: number; newIndex?: number }) => {
      console.warn('拖拽更新:', evt)
      // 确保索引存在
      if (typeof evt.oldIndex === 'number' && typeof evt.newIndex === 'number') {
        // 使用 VueUse 提供的 moveArrayElement 函数
        moveArrayElement(sortableTodos.value, evt.oldIndex, evt.newIndex)

        // 等待下一个 tick 后调用回调
        nextTick(() => {
          onOrderChange([...sortableTodos.value])
        })
      }
    },

    // 拖拽移动事件
    onMove: () => {
      return true
    },
  }

  // 初始化拖拽排序
  const { start, stop } = useSortable(() => containerRef.value, sortableTodos, sortableOptions)

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

  // 组件卸载时确保清理拖拽功能
  // 注意：这里应该使用 Vue 的 onUnmounted，但在 composable 中不应该直接调用
  // 应该由使用这个 composable 的组件负责在适当时候调用 stop()

  return {
    isDragging: isCurrentlyDragging,
    draggedItem: currentDraggedItem,
    enableDragSort,
    disableDragSort,
    isItemBeingDragged,
    getDragHandleProps,
    getDraggableItemProps,
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
