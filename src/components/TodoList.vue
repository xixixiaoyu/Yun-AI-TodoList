<template>
  <div class="todo-container" :class="{ 'small-screen': isSmallScreen }">
    <div class="todo-list scrollable-container">
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

      <div ref="todoListRef" class="todo-grid">
        <div v-if="filteredTodos.length === 0" class="empty-hint">
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
          <p>{{ t('emptyTodoHint', 'No todos yet. Add some to get started!') }}</p>
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
import TodoInput from './TodoInput.vue'
import TodoSearch from './TodoSearch.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'

import ConfirmDialog from './ConfirmDialog.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import LoadingOverlay from './common/LoadingOverlay.vue'
import { useI18n } from 'vue-i18n'
import { useTodoListState } from '../composables/useTodoListState'
import { TodoListHeader, TodoActions, SuggestedTodosDialog, ChartsDialog } from './todo'

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
  handlePomodoroComplete
} = useTodoListState()
</script>

<style scoped>
@import '../styles/todo-list.css';
</style>
