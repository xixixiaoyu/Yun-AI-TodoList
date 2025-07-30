<template>
  <div
    class="card-todo"
    :class="{
      completed: isCompleted,
      'todo-draggable': isDraggable,
      'todo-dragging': isDragging,
      // 批量分析禁用状态已移除
    }"
    :data-todo-id="todo.id"
  >
    <!-- 拖拽手柄 -->
    <div
      v-if="isDraggable"
      class="todo-drag-handle"
      :title="t('dragToReorder', '拖拽重新排序')"
      @click.stop
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="9" cy="12" r="1" />
        <circle cx="9" cy="5" r="1" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="15" cy="5" r="1" />
        <circle cx="15" cy="19" r="1" />
      </svg>
    </div>

    <div class="todo-content">
      <span class="checkbox-wrapper" @click="toggleTodo">
        <transition name="fade">
          <i v-show="true" class="checkbox" :class="{ checked: isCompleted }" />
        </transition>
      </span>
      <div class="todo-text-wrapper">
        <div class="todo-main-content">
          <!-- 可编辑的 Todo 文本 -->
          <EditableTodoItem
            ref="editableTodoItem"
            :todo="todo"
            :max-length="500"
            @update="handleTextUpdate"
            @cancel="handleEditCancel"
          />
        </div>
      </div>
    </div>
    <div class="todo-actions">
      <button
        class="edit-btn"
        :title="t('editTodo', '编辑待办事项')"
        :aria-label="t('editTodo', '编辑待办事项')"
        @click.stop="handleEdit"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        class="delete-btn"
        :title="t('delete')"
        :aria-label="t('delete')"
        @click.stop="removeTodo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti'

import { useErrorHandler } from '../composables/useErrorHandler'
import type { Todo } from '../types/todo'
import EditableTodoItem from './EditableTodoItem.vue'

const props = withDefaults(
  defineProps<{
    todo: Todo
    isDraggable?: boolean
    isDragging?: boolean
  }>(),
  {
    isDraggable: false,
    isDragging: false,
  }
)

const { showError } = useErrorHandler()
const { t } = useI18n()

const emit = defineEmits(['toggle', 'remove', 'updateTodo', 'updateText'])
const isCompleted = ref(false)
const editableTodoItem = ref<InstanceType<typeof EditableTodoItem> | null>(null)

watchEffect(() => {
  isCompleted.value = props.todo.completed
})

const toggleTodo = () => {
  // 批量分析检查已移除

  try {
    // 在切换前显示庆祝动画（如果当前是未完成状态）
    if (!isCompleted.value) {
      requestAnimationFrame(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true,
        })
      })
    }

    // 发出 toggle 事件，让父组件处理状态更新
    // 不要在这里直接修改 isCompleted.value，让 watchEffect 通过 props 更新
    emit('toggle', props.todo.id)
  } catch (error) {
    console.error('Error toggling todo:', error)
    showError(t('toggleError'))
  }
}

const removeTodo = () => {
  // 批量分析检查已移除

  try {
    emit('remove', props.todo.id)
  } catch (error) {
    console.error('Error removing todo:', error)
    showError(t('removeError'))
  }
}

// 处理编辑
const handleEdit = () => {
  editableTodoItem.value?.startEdit()
}

// 处理文本更新
const handleTextUpdate = (newText: string) => {
  if (newText.trim() !== props.todo.title.trim()) {
    // 触发文本更新事件，让父组件处理
    emit('updateText', props.todo.id, newText.trim())
  }
}

// 处理编辑取消
const handleEditCancel = () => {
  // 编辑取消时不需要特殊处理
}

let renderStartTime = 0
onBeforeMount(() => {
  renderStartTime = performance.now()
})

onMounted(() => {
  const renderTime = performance.now() - renderStartTime
  if (renderTime > 50) {
    console.warn(`TodoItem render time: ${renderTime}ms`)
  }
})

const handleError = (error: Error) => {
  console.error('TodoItem error:', error)
  showError(t('generalError'))
}

onErrorCaptured(handleError)
</script>

<style scoped>
.card-todo {
  @apply font-sans flex items-center w-full box-border gap-3 will-change-transform;
  padding: 1rem 1.2rem;
  margin-bottom: 0.75rem;
  min-height: 4rem;
  background-color: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-todo.is-disabled {
  @apply opacity-60 cursor-not-allowed;
  pointer-events: none;
}

.card-todo.is-disabled:hover {
  @apply shadow-sm;
}

.checkbox-wrapper {
  @apply flex items-center cursor-pointer;
  align-self: center;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.checkbox-wrapper:hover {
  @apply bg-gray-100 bg-opacity-30;
}

.card-todo:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--input-focus-color);
}

.card-todo.completed {
  animation: completedTodo 0.3s ease forwards;
}

@keyframes completedTodo {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.card-todo.completed .text-content {
  @apply line-through opacity-60;
  color: var(--completed-todo-text-color);
}

.todo-content {
  @apply flex items-center flex-grow min-w-0 gap-2;
}

.todo-text-wrapper {
  @apply flex flex-col flex-grow min-w-0;
}

.todo-main-content {
  @apply flex items-center gap-3 min-w-0;
}

.todo-main-content .todo-text {
  @apply flex-1 min-w-0;
}

/* 操作按钮容器 */
.todo-actions {
  @apply flex items-center gap-1 ml-2;
}

/* 编辑按钮样式 */
.edit-btn {
  @apply flex items-center justify-center w-8 h-8 opacity-60;
  @apply bg-transparent text-gray-500 rounded-md;
  @apply hover:bg-gray-100 hover:bg-opacity-30 hover:text-primary hover:opacity-100;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30;
  @apply transition-all duration-200;
  min-width: 2rem;
}

.edit-btn:hover {
  @apply transform scale-105;
}

/* 删除按钮样式 */
.delete-btn {
  @apply flex items-center justify-center w-8 h-8 opacity-60;
  @apply bg-transparent text-gray-500 rounded-md;
  @apply hover:bg-red-50 hover:bg-opacity-10 hover:text-error hover:opacity-100;
  @apply focus:outline-none focus:ring-2 focus:ring-error focus:ring-opacity-30;
  @apply transition-all duration-200;
  min-width: 2rem;
}

.delete-btn:hover {
  @apply transform scale-105;
}

.card-todo:hover .edit-btn,
.card-todo:hover .delete-btn {
  @apply opacity-100;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .todo-main-content {
    @apply flex items-center gap-3 min-w-0;
  }

  .todo-actions {
    @apply gap-2 ml-3;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .todo-main-content {
    @apply flex items-center gap-3 min-w-0;
  }

  .todo-text {
    @apply flex-1 min-w-0;
  }

  .todo-actions {
    @apply gap-1 ml-2;
  }
}

.todo-text {
  @apply flex items-center cursor-pointer gap-2 min-w-0;
  color: var(--todo-text-color);
  font-family: 'LXGW WenKai Lite Medium', sans-serif;
}

.text-content {
  @apply text-left whitespace-nowrap overflow-hidden text-ellipsis transition-all-300 min-w-0;
  flex: 1;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid var(--button-bg-color);
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  background-color: transparent;
}

.checkbox.checked {
  background-color: var(--button-bg-color);
  transform: scale(0.95);
}

.checkbox.checked::after {
  content: '✓';
  color: var(--card-bg-color);
  font-size: 12px;
  font-weight: bold;
  transform: scale(1.2);
  transition: transform 0.2s ease;
}

/* 拖拽手柄样式 */
.todo-drag-handle {
  @apply flex items-center justify-center cursor-grab opacity-40 transition-all duration-200 p-1 rounded;
  min-width: 24px;
  height: 24px;
  margin-right: 8px;
}

.todo-drag-handle:hover {
  @apply opacity-70 bg-gray-100 bg-opacity-20;
}

.todo-drag-handle:active {
  @apply cursor-grabbing;
}

/* 拖拽状态样式 */
.todo-draggable {
  @apply cursor-move;
}

.todo-dragging {
  @apply opacity-50 transform scale-105 shadow-lg;
  z-index: 1000;
}

/* 拖拽过程中的全局样式 */
:global(.dragging-todo) .card-todo:not(.todo-dragging) {
  @apply opacity-70;
}

/* 拖拽占位符样式 */
:global(.todo-ghost) {
  @apply opacity-30 bg-blue-100 bg-opacity-30;
  border: 2px dashed var(--input-focus-color);
}

:global(.todo-chosen) {
  @apply shadow-lg transform scale-102;
}

:global(.todo-drag) {
  @apply opacity-80 transform rotate-2;
}

:global(.todo-fallback) {
  @apply opacity-60 transform scale-95;
}

@media (max-width: 768px) {
  .card-todo {
    @apply flex-row items-center;
    padding: 1rem 0.9rem;
    min-height: 4.5rem;
  }

  .todo-content {
    @apply flex-1 min-w-0 items-center;
  }

  .checkbox-wrapper {
    @apply flex items-center cursor-pointer;
    align-self: center;
    margin-right: 0.5rem;
    padding: 0.25rem;
    border-radius: 0.375rem;
  }

  .todo-text-wrapper {
    @apply flex flex-col flex-grow min-w-0;
    align-self: center;
  }

  .todo-drag-handle {
    @apply opacity-60;
    min-width: 20px;
    height: 20px;
    margin-right: 6px;
    align-self: center;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .card-todo {
    @apply flex-row items-center;
    padding: 0.7rem 0.5rem;
  }

  .todo-content {
    @apply flex-1 min-w-0 items-center;
  }

  .checkbox-wrapper {
    @apply flex items-center cursor-pointer;
    align-self: center;
    margin-right: 0.4rem;
    padding: 0.25rem;
    border-radius: 0.375rem;
  }

  .todo-text-wrapper {
    @apply flex flex-col flex-grow min-w-0;
    align-self: center;
    justify-content: center;
  }

  .todo-drag-handle {
    @apply opacity-60;
    min-width: 18px;
    height: 18px;
    margin-right: 4px;
    align-self: center;
  }
}
</style>
