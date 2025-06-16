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
      />

      <TodoInput
        :max-length="MAX_TODO_LENGTH"
        :duplicate-error="duplicateError"
        :placeholder="t('addTodo')"
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

      <div ref="todoListRef" class="todo-grid">
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
          @toggle="toggleTodo"
          @remove="removeTodo"
        />
      </div>

      <TodoActions
        :filter="filter"
        :has-active-todos="hasActiveTodos"
        :is-generating="isGenerating"
        :is-sorting="isSorting"
        @generate-suggestions="generateSuggestedTodos"
        @sort-with-ai="sortActiveTodosWithAI"
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

      <SuggestedTodosDialog
        :show="showSuggestedTodos"
        :suggested-todos="suggestedTodos"
        @update-todo="updateSuggestedTodo"
        @confirm="confirmSuggestedTodos"
        @cancel="cancelSuggestedTodos"
      />
    </div>

    <ChartsDialog :show="showCharts" @close="closeCharts" />
  </div>
</template>

<script setup lang="ts">
import TodoFilters from './TodoFilters.vue'
import TodoInput from './TodoInput.vue'
import TodoItem from './TodoItem.vue'
import TodoSearch from './TodoSearch.vue'

import { useTodoListState } from '../composables/useTodoListState'
import ConfirmDialog from './ConfirmDialog.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import LoadingOverlay from './common/LoadingOverlay.vue'
import { ChartsDialog, SuggestedTodosDialog, TodoActions, TodoListHeader } from './todo'

const { t } = useI18n()

const {
  todoListRef,
  showConfirmDialog,
  confirmDialogConfig,
  handleConfirm,
  handleCancel,

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
  error,
  success,
} = useTodoListState()
</script>

<style scoped>
.todo-container {
  @apply flex flex-col items-center justify-center w-full mx-auto box-border min-h-70vh transition-all-300;
  max-width: 1400px;
}

.todo-container.small-screen {
  @apply p-2 justify-start;
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

.empty-hint {
  @apply flex flex-col items-center justify-center p-8 text-center min-h-50;
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
    @apply p-1 min-h-auto justify-start;
  }

  .todo-container.small-screen {
    @apply p-2;
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
