<template>
  <div
    class="card-todo"
    :class="{
      completed: isCompleted,
      'todo-draggable': isDraggable,
      'todo-dragging': isDragging,
      'is-disabled': isBatchAnalyzing,
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
            :todo="todo"
            :max-length="500"
            @update="handleTextUpdate"
            @cancel="handleEditCancel"
          />

          <!-- AI 分析信息 - 水平布局 -->
          <div v-if="showAIAnalysis" class="ai-analysis-info">
            <!-- 重要等级星级 -->
            <div
              v-if="todo.priority"
              class="priority-stars"
              :class="[getPriorityColorClass(todo.priority), { 'is-disabled': isBatchAnalyzing }]"
              :title="isBatchAnalyzing ? t('batchAnalyzing') : getPriorityTitle(todo.priority)"
              @click.stop="handlePriorityClick"
            >
              {{ getPriorityStars(todo.priority) }}
            </div>

            <!-- 时间估算 -->
            <div
              v-if="todo.estimatedTime"
              class="estimated-time"
              :class="{ 'is-disabled': isBatchAnalyzing }"
              :title="isBatchAnalyzing ? t('batchAnalyzing') : t('estimatedTime')"
              @click.stop="handleTimeClick"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <span class="time-text">{{ todo.estimatedTime }}</span>
            </div>

            <!-- AI 分析按钮 -->
            <button
              v-if="!todo.aiAnalyzed && !isCompleted"
              class="ai-analyze-btn"
              :class="{ 'is-disabled': isBatchAnalyzing || isAnalyzing }"
              :disabled="isBatchAnalyzing || isAnalyzing"
              :title="
                isBatchAnalyzing
                  ? t('batchAnalyzing')
                  : isAnalyzing
                    ? t('analyzing')
                    : t('aiAnalysis')
              "
              @click.stop="handleAnalyzeClick"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </button>

            <!-- 分析中状态指示 -->
            <div
              v-if="isAnalyzing && !todo.aiAnalyzed"
              class="analyzing-indicator"
              :title="t('analyzing')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="animate-spin"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button
      class="delete-btn"
      :class="{ 'is-disabled': isBatchAnalyzing }"
      :disabled="isBatchAnalyzing"
      :title="isBatchAnalyzing ? t('batchAnalyzing') : t('delete')"
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
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti'
import { useAIAnalysis } from '../composables/useAIAnalysis'
import { useErrorHandler } from '../composables/useErrorHandler'
import type { Todo } from '../types/todo'
import EditableTodoItem from './EditableTodoItem.vue'

const props = withDefaults(
  defineProps<{
    todo: Todo
    isDraggable?: boolean
    isDragging?: boolean
    showAIAnalysis?: boolean
  }>(),
  {
    isDraggable: false,
    isDragging: false,
    showAIAnalysis: true,
  }
)

const { showError } = useErrorHandler()
const { t } = useI18n()
const { getPriorityStars, getPriorityColorClass, isAnalyzing, isBatchAnalyzing } = useAIAnalysis()

const emit = defineEmits(['toggle', 'remove', 'updateTodo', 'analyze', 'updateText'])
const isCompleted = ref(false)

watchEffect(() => {
  isCompleted.value = props.todo.completed
})

const toggleTodo = () => {
  // 在批量分析期间禁止切换完成状态
  if (isBatchAnalyzing.value) {
    return
  }

  try {
    emit('toggle', props.todo.id)
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
    isCompleted.value = !isCompleted.value
  } catch (error) {
    console.error('Error toggling todo:', error)
    showError(t('toggleError'))
  }
}

const removeTodo = () => {
  // 在批量分析期间禁止删除任务
  if (isBatchAnalyzing.value) {
    return
  }

  try {
    emit('remove', props.todo.id)
  } catch (error) {
    console.error('Error removing todo:', error)
    showError(t('removeError'))
  }
}

// AI 分析相关方法
const getPriorityTitle = (priority: number): string => {
  const priorityKeys = ['', 'priority1', 'priority2', 'priority3', 'priority4', 'priority5']
  return t(priorityKeys[priority] || 'priority3')
}

const handlePriorityClick = () => {
  // 在批量分析期间禁止编辑优先级
  if (isBatchAnalyzing.value) {
    return
  }

  // 触发优先级编辑
  const newPriority = window.prompt(t('clickToSetPriority'), props.todo.priority?.toString() || '3')
  if (newPriority !== null) {
    const priority = Math.max(1, Math.min(5, parseInt(newPriority) || 3))
    emit('updateTodo', props.todo.id, { priority })
  }
}

const handleTimeClick = () => {
  // 在批量分析期间禁止编辑时间估算
  if (isBatchAnalyzing.value) {
    return
  }

  // 触发时间估算编辑
  const newTime = window.prompt(t('enterEstimatedTime'), props.todo.estimatedTime || '')
  if (newTime !== null && newTime.trim()) {
    emit('updateTodo', props.todo.id, { estimatedTime: newTime.trim() })
  }
}

const handleAnalyzeClick = () => {
  // 触发单个 Todo 的 AI 分析
  emit('analyze', props.todo.id)
}

// 处理文本更新
const handleTextUpdate = (newText: string) => {
  if (newText.trim() !== props.todo.text.trim()) {
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
  @apply font-sans flex items-center w-full box-border gap-2 will-change-transform;
  padding: 0.7rem;
  margin-bottom: 0.75rem;
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
  justify-content: space-between;
}

.todo-main-content .todo-text {
  @apply flex-1 min-w-0;
}

/* AI 分析信息样式 - 水平布局 */
.ai-analysis-info {
  @apply flex items-center gap-2 text-xs opacity-80 flex-shrink-0;
}

.priority-stars {
  @apply cursor-pointer transition-all duration-200 hover:opacity-100 hover:scale-110;
  font-size: 10px;
  line-height: 1;
}

.priority-stars.is-disabled {
  @apply opacity-50 cursor-not-allowed;
  pointer-events: none;
}

.priority-stars.is-disabled:hover {
  @apply transform-none opacity-50;
}

.estimated-time {
  @apply flex items-center gap-1 cursor-pointer transition-all duration-200 hover:opacity-100 text-gray-500;
}

.estimated-time.is-disabled {
  @apply opacity-50 cursor-not-allowed;
  pointer-events: none;
}

.estimated-time.is-disabled:hover {
  @apply opacity-50;
}

.time-text {
  @apply text-xs;
}

.ai-analyze-btn {
  @apply flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 bg-opacity-20 text-blue-500 hover:bg-blue-200 hover:bg-opacity-30 transition-all duration-200 cursor-pointer;
}

.ai-analyze-btn:hover {
  @apply transform scale-110;
}

.ai-analyze-btn.is-disabled {
  @apply opacity-50 cursor-not-allowed;
  pointer-events: none;
}

.ai-analyze-btn.is-disabled:hover {
  @apply transform-none;
}

.analyzing-indicator {
  @apply flex items-center justify-center w-5 h-5 text-blue-500;
}

.analyzing-indicator svg {
  @apply animate-spin;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .todo-main-content {
    @apply flex items-center gap-3 min-w-0;
    justify-content: space-between;
  }

  .ai-analysis-info {
    @apply flex items-center gap-2 text-xs opacity-80 flex-shrink-0;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  /* 默认垂直布局 */
  .todo-main-content {
    @apply flex-col items-start gap-2 min-w-0;
  }

  .todo-text {
    @apply w-full;
  }

  .ai-analysis-info {
    @apply self-end;
  }

  /* 当存在 AI 分析按钮时，保持水平布局 */
  .todo-main-content:has(.ai-analyze-btn) {
    @apply flex-row items-center justify-between;
  }

  .todo-main-content:has(.ai-analyze-btn) .todo-text {
    @apply w-auto flex-1 min-w-0;
  }

  .todo-main-content:has(.ai-analyze-btn) .ai-analysis-info {
    @apply self-center;
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

.delete-btn {
  @apply bg-transparent text-completed border border-input-border rounded-md p-1.5 text-sm cursor-pointer transition-all duration-200 opacity-60 transform translate-x-1.25 ml-2 flex items-center justify-center min-w-8 h-8;
}

.delete-btn.is-disabled {
  @apply opacity-50 cursor-not-allowed;
  pointer-events: none;
}

.delete-btn.is-disabled:hover {
  @apply text-red-500 bg-transparent;
}

.card-todo:hover .delete-btn {
  @apply opacity-100 transform translate-x-0 text-error;
}

.delete-btn:hover {
  @apply bg-red-50 bg-opacity-10 text-error transform scale-105;
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
    padding: 0.8rem 0.7rem;
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

  .delete-btn {
    @apply opacity-80 transform translate-x-0 ml-3 relative;
    align-self: center;
  }

  .delete-btn:active {
    @apply transform scale-95;
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

  .delete-btn {
    @apply opacity-80 transform translate-x-0 ml-2 relative;
    align-self: center;
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
