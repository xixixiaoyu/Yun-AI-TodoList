<template>
  <div class="todo-container" :class="{ 'small-screen': isSmallScreen }">
    <div class="todo-list scrollbar-thin">
      <div class="todo-card-header">
        <PomodoroTimer
          class="pomodoro-timer-integrated"
          @pomodoro-complete="handlePomodoroComplete"
        />
      </div>

      <LoadingOverlay :show="isLoading" :message="t('sorting')" />

      <TodoListHeader
        :theme-icon="themeIcon"
        :theme-tooltip="themeTooltip"
        :show-charts="showCharts"
        :show-search="showSearch"
        @toggle-theme="toggleTheme"
        @toggle-charts="toggleCharts"
        @toggle-search="toggleSearch"
        @open-ai-sidebar="$emit('openAiSidebar')"
      />

      <TodoInput
        :max-length="MAX_TODO_LENGTH"
        :duplicate-error="duplicateError"
        :placeholder="t('addTodo')"
        :is-loading="isSplittingTask"
        @add="handleAddTodo"
      />

      <TodoFilters v-model:filter="filter" />

      <TodoSearch v-model="searchQuery" :is-expanded="showSearch" @collapse="collapseSearch" />

      <div
        v-if="error"
        class="error-message mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
      >
        {{ error }}
      </div>

      <div
        v-if="success"
        class="success-message mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
      >
        {{ success }}
      </div>

      <div
        ref="todoListRef"
        class="todo-grid"
        :class="{ 'todo-sortable-container': isDragEnabled }"
      >
        <div v-if="filteredTodos.length === 0 && filter === 'active'" class="empty-hint">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12h18m-9-9v18" />
          </svg>
          <p>{{ t('emptyTodoHint', '还没有待办事项，添加一些开始吧！') }}</p>
        </div>

        <TodoItem
          v-for="todo in filteredTodos"
          :key="todo.id"
          :todo="todo"
          :is-draggable="isDragEnabled"
          :is-dragging="isDragging && draggedItem?.id === todo.id"
          :is-analyzing="isAnalyzing"
          @toggle="toggleTodo"
          @remove="removeTodo"
          @update-todo="handleUpdateTodo"
          @update-text="handleUpdateTodoText"
          @analyze="handleAnalyzeTodo"
        />
      </div>

      <TodoActions
        :filter="filter"
        :has-active-todos="hasActiveTodos"
        :is-generating="isGenerating"
        :is-sorting="isSorting"
        :is-batch-analyzing="isBatchAnalyzing"
        :is-analyzing="isAnalyzing"
        @generate-suggestions="generateSuggestedTodos"
        @sort-with-a-i="sortActiveTodosWithAI"
        @batch-analyze="handleBatchAnalyze"
      />

      <ConfirmDialog
        :show="showConfirmDialog"
        :title="confirmDialogConfig.title"
        :message="confirmDialogConfig.message"
        :confirm-text="confirmDialogConfig.confirmText"
        :cancel-text="confirmDialogConfig.cancelText"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />

      <DomainSelectionDialog
        :show="showDomainSelection"
        @confirm="generateSuggestedTodosWithDomain"
        @cancel="cancelDomainSelection"
      />

      <SuggestedTodosDialog
        :show="showSuggestedTodos"
        :suggested-todos="suggestedTodos"
        :has-completed-history="hasCompletedHistory"
        @update-todo="updateSuggestedTodo"
        @delete-todo="deleteSuggestedTodo"
        @add-todo="addSuggestedTodo"
        @confirm="confirmSuggestedTodos"
        @cancel="cancelSuggestedTodos"
      />

      <SubtaskSelectionDialog
        :config="subtaskConfig"
        @confirm="handleSubtaskConfirm"
        @cancel="handleSubtaskCancel"
      />
    </div>

    <ChartsDialog :show="showCharts" @close="closeCharts" />
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import SubtaskSelectionDialog from './SubtaskSelectionDialog.vue'
import TodoFilters from './TodoFilters.vue'
import TodoInput from './TodoInput.vue'
import TodoItem from './TodoItem.vue'
import TodoSearch from './TodoSearch.vue'

import type { Todo } from '@/types/todo'
import { useTaskSplitting } from '../composables/useTaskSplitting'
import { useTodoDragSort } from '../composables/useTodoDragSort'
import { useTodoListState } from '../composables/useTodoListState'
import { useTodoManagement } from '../composables/useTodoManagement'
import ConfirmDialog from './ConfirmDialog.vue'
import DomainSelectionDialog from './DomainSelectionDialog.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import LoadingOverlay from './common/LoadingOverlay.vue'
import { ChartsDialog, SuggestedTodosDialog, TodoActions, TodoListHeader } from './todo'

const { t } = useI18n()

// 定义事件
defineEmits<{
  openAiSidebar: []
}>()

// 任务拆分功能
const { subtaskConfig, hideSubtaskDialog } = useTaskSplitting()

const {
  todoListRef,
  showConfirmDialog,
  confirmDialogConfig,
  handleConfirm,
  handleCancel,
  todos,
  handleDragOrderChange,
  filter,
  searchQuery,
  filteredTodos,
  hasActiveTodos,
  hasCompletedHistory,
  isGenerating,
  isSplittingTask,
  isSorting,
  suggestedTodos,
  showSuggestedTodos,
  showDomainSelection,
  MAX_TODO_LENGTH,
  generateSuggestedTodos,
  generateSuggestedTodosWithDomain,
  cancelDomainSelection,
  confirmSuggestedTodos,
  cancelSuggestedTodos,
  updateSuggestedTodo,
  deleteSuggestedTodo,
  addSuggestedTodo,
  sortActiveTodosWithAI,
  handleAddTodo: originalHandleAddTodo,
  toggleTodo,
  removeTodo,
  duplicateError,
  isLoading,
  isAnalyzing,
  handleUpdateTodo,
  handleAnalyzeTodo,
  handleBatchAnalyze,
  isBatchAnalyzing,
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
  error,
  success,
} = useTodoListState()

// 从 useTodoManagement 获取任务拆分相关功能
const { handleAddSubtasks, updateTodoText } = useTodoManagement()

// 拖拽排序功能 - 在 AI 排序过程中和批量分析期间禁用拖拽
const isDragEnabled = computed(
  () =>
    filter.value === 'active' &&
    filteredTodos.value.length > 1 &&
    !isSorting.value &&
    !isGenerating.value &&
    !isBatchAnalyzing.value
)

// 处理任务添加，包含拆分逻辑
const handleAddTodo = async (text: string, tags: string[]) => {
  const result = await originalHandleAddTodo(text, tags)

  // 如果需要拆分，显示拆分对话框
  if (result && result.needsSplitting && result.splitResult) {
    subtaskConfig.showDialog = true
    subtaskConfig.originalTask = result.splitResult.originalTask
    subtaskConfig.subtasks = [...result.splitResult.subtasks]
    subtaskConfig.reasoning = result.splitResult.reasoning
  }
}

// 处理子任务选择确认
const handleSubtaskConfirm = async (selectedSubtasks: string[]) => {
  hideSubtaskDialog()

  if (selectedSubtasks.length > 0) {
    try {
      // 添加选中的子任务
      const successCount = await handleAddSubtasks(selectedSubtasks, [])

      if (successCount > 0) {
        // 强制触发响应式更新
        await nextTick()
        await nextTick()
      }
    } catch (_err) {
      error.value = '添加子任务失败，请重试'
    }
  }
}

// 处理子任务选择取消
const handleSubtaskCancel = () => {
  hideSubtaskDialog()

  // 添加原始任务
  if (subtaskConfig.originalTask) {
    originalHandleAddTodo(subtaskConfig.originalTask, [], true) // 跳过拆分分析
  }
}

// 处理 Todo 文本更新
const handleUpdateTodoText = async (id: number, newText: string) => {
  await updateTodoText(id, newText)
}

// 创建专门的拖拽顺序更新函数
const handleDragReorder = (reorderedTodos: Todo[]) => {
  console.warn('处理拖拽重排序:', reorderedTodos)

  try {
    // 由于我们只对 filteredTodos 进行拖拽，需要将重新排序的结果合并回完整的 todos 数组
    if (filter.value === 'active') {
      // 获取所有已完成的待办事项
      const completedTodos = todos.value.filter((todo) => todo.completed)

      // 重新计算所有待办事项的顺序
      const allTodos = [
        ...reorderedTodos.map((todo, index) => ({
          ...todo,
          order: index,
          updatedAt: new Date().toISOString(),
        })),
        ...completedTodos.map((todo, index) => ({
          ...todo,
          order: reorderedTodos.length + index,
          updatedAt: new Date().toISOString(),
        })),
      ].sort((a, b) => a.order - b.order)

      console.warn('合并后的所有待办事项:', allTodos)
      handleDragOrderChange(allTodos)
    } else {
      // 如果不是 active 筛选状态，直接更新
      const updatedTodos = reorderedTodos.map((todo, index) => ({
        ...todo,
        order: index,
        updatedAt: new Date().toISOString(),
      }))
      handleDragOrderChange(updatedTodos)
    }
  } catch (error) {
    console.error('拖拽重排序失败:', error)
  }
}

const { isDragging, draggedItem, enableDragSort, disableDragSort } = useTodoDragSort(
  filteredTodos,
  handleDragReorder,
  todoListRef
)

// 监听拖拽启用状态
watch(
  isDragEnabled,
  (enabled) => {
    if (enabled) {
      nextTick(() => {
        enableDragSort()
      })
    } else {
      disableDragSort()
    }
  },
  { immediate: true }
)

// 组件卸载时禁用拖拽
onUnmounted(() => {
  disableDragSort()
})
</script>

<style scoped>
.todo-container {
  @apply flex flex-col items-center justify-start w-full mx-auto box-border min-h-[calc(100vh-120px)] transition-all-300 pt-10;
  max-width: 1200px;
}

.todo-container.small-screen {
  @apply p-2 justify-start pt-4;
}

.todo-list {
  @apply w-full mx-auto font-sans min-h-50 box-border relative;
  max-width: 800px;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: calc(var(--border-radius) * 1.5);
}

.todo-card-header {
  @apply mb-4 rounded p-4 mb-3 relative z-10;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 126, 103, 0.02) 100%);
  box-shadow: 0 2px 8px rgba(255, 126, 103, 0.08);
  border-bottom: 1px solid rgba(255, 126, 103, 0.08);
  border-radius: var(--border-radius);
}

.todo-card-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 126, 103, 0.3), transparent);
}

.pomodoro-timer-integrated {
  @apply w-full m-0 bg-transparent shadow-none p-0;
}

.todo-grid {
  @apply overflow-y-auto flex h-40vh max-h-125 flex-col mb-4 rounded;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.5rem 0;
}

/* 拖拽容器样式 */
.todo-sortable-container {
  @apply relative;
}

/* 拖拽过程中的全局样式 */
:global(.dragging-todo) .todo-grid {
  @apply cursor-grabbing;
}

:global(.dragging-todo) .todo-grid .card-todo:not(.todo-dragging) {
  @apply opacity-60 transition-opacity-200;
}

/* 拖拽占位符样式 */
:global(.todo-ghost) {
  @apply opacity-40 bg-blue-50 bg-opacity-50 border-2 border-dashed border-blue-300 rounded-xl;
  transform: scale(0.98);
}

:global(.todo-chosen) {
  @apply shadow-xl transform scale-102 z-50;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

:global(.todo-drag) {
  @apply opacity-80 transform rotate-1 shadow-2xl;
  z-index: 1000;
}

:global(.todo-fallback) {
  @apply opacity-70 transform scale-95 shadow-lg;
}

.empty-hint {
  @apply flex flex-col items-center justify-center p-8 text-center;
  height: 100%;
  min-height: 300px;
  color: var(--text-secondary-color);
}

.empty-hint svg {
  @apply mb-4;
  opacity: 0.5;
  width: 48px;
  height: 48px;
  color: var(--text-secondary-color);
}

.empty-hint p {
  @apply m-0 text-base;
  opacity: 0.8;
  font-weight: 300;
  line-height: 1.6;
}

.todo-list.is-loading {
  @apply pointer-events-none opacity-70;
}

.slide-enter-active,
.slide-leave-active,
.slide-fade-enter-active,
.slide-fade-leave-active {
  @apply transition-all-300;
}

.slide-enter-from,
.slide-leave-to {
  @apply transform translate-x-full;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  @apply transform translate-x-full opacity-0;
}

.list-enter-active,
.list-leave-active {
  @apply transition-all-500;
}

.list-enter-from {
  @apply opacity-0 transform -translate-y-7.5;
}

.list-leave-to {
  @apply opacity-0 transform translate-y-7.5;
}

.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity-300;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

@media (min-width: 1201px) {
  .todo-container {
    @apply px-4;
  }
}

@media (max-width: 1200px) {
  .todo-container {
    @apply px-4;
  }

  .todo-list {
    @apply w-full max-w-2xl;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .todo-container {
    @apply min-h-75vh;
  }

  .todo-grid {
    @apply h-45vh max-h-150;
  }
}

@media (max-width: 768px) {
  .todo-container {
    @apply p-1 min-h-[calc(100vh-100px)] justify-start pt-2;
  }

  .todo-container.small-screen {
    @apply p-2 pt-2;
  }

  .todo-list {
    @apply w-full max-w-full p-3 mt-0;
  }

  .todo-grid {
    @apply h-30vh max-h-100 gap-2 mb-3;
  }

  .todo-card-header {
    @apply mb-2 p-2;
  }
}
</style>
