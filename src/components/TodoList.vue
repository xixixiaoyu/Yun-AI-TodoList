<template>
  <div class="todo-container" :class="{ 'small-screen': isSmallScreen }">
    <div class="todo-list scrollable-container">
      <!-- 番茄钟计时器组件 - 集成到待办事项卡片顶部 -->
      <div class="todo-card-header">
        <PomodoroTimer
          class="pomodoro-timer-integrated"
          @pomodoro-complete="handlePomodoroComplete"
        />
      </div>
      <!-- 加载中遮罩层 -->
      <LoadingOverlay :show="isLoading" :message="t('sorting')" />
      <!-- 头部组件 -->
      <TodoListHeader
        :theme-icon="themeIcon"
        :theme-tooltip="themeTooltip"
        :show-charts="showCharts"
        :show-search="showSearch"
        @toggle-theme="toggleTheme"
        @toggle-charts="toggleCharts"
        @toggle-search="toggleSearch"
      />

      <!-- 待办事项输入组 -->
      <TodoInput
        :max-length="MAX_TODO_LENGTH"
        :duplicate-error="duplicateError"
        :placeholder="t('addTodo')"
        @add="handleAddTodo"
      />

      <!-- 待办事项过滤器组件 -->
      <TodoFilters v-model:filter="filter" />

      <!-- 搜索组件 - 可展开收缩 -->
      <TodoSearch
        v-model="searchQuery"
        :is-expanded="showSearch"
        @collapse="collapseSearch"
      />
      <!-- 待办事项列表 -->
      <div
        ref="todoListRef"
        class="todo-grid sortable-container"
        :class="{
          'drag-disabled': dragSort.isDragDisabled.value,
          'drag-processing': dragSort.dragState.value.isProcessing,
        }"
      >
        <!-- 拖拽提示（当列表为空时显示） -->
        <div v-if="filteredTodos.length === 0" class="drag-hint">
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
          <p>{{ t('dragHint', 'Add some todos and drag to reorder them') }}</p>
        </div>

        <TodoItem
          v-for="todo in filteredTodos"
          :key="todo.id"
          :todo="todo"
          @toggle="toggleTodo"
          @remove="removeTodo"
        />
      </div>
      <!-- 操作按钮区域组件 -->
      <TodoActions
        :filter="filter"
        :has-active-todos="hasActiveTodos"
        :is-generating="isGenerating"
        :is-sorting="isSorting"
        @generate-suggestions="generateSuggestedTodos"
        @sort-with-ai="sortActiveTodosWithAI"
      />
      <!-- 确认对话框组件 -->
      <ConfirmDialog
        :show="showConfirmDialog"
        :title="confirmDialogConfig.title"
        :message="confirmDialogConfig.message"
        :confirm-text="confirmDialogConfig.confirmText"
        :cancel-text="confirmDialogConfig.cancelText"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />

      <!-- 建议待办事项对话框组件 -->
      <SuggestedTodosDialog
        :show="showSuggestedTodos"
        :suggested-todos="suggestedTodos"
        @update-todo="updateSuggestedTodo"
        @confirm="confirmSuggestedTodos"
        @cancel="cancelSuggestedTodos"
      />
    </div>

    <!-- 图表对话框组件 -->
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
import { useTodoDragSort } from '../composables/useTodoDragSort'
import { TodoListHeader, TodoActions, SuggestedTodosDialog, ChartsDialog } from './todo'

// 使用组合式函数
const { t } = useI18n()

// 使用 TodoList 状态管理
const {
  todoListRef,
  showConfirmDialog,
  confirmDialogConfig,
  handleConfirm,
  handleCancel,

  updateTodosOrder,
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
} = useTodoListState()

// 使用增强的拖拽排序功能
const dragSort = useTodoDragSort(todoListRef, filteredTodos, updateTodosOrder)
</script>

<style scoped>
/* 引入 TodoList 样式 */
@import '../styles/todo-list.css';
/* 引入拖拽排序样式 */
@import '../styles/drag-sort.css';
</style>
