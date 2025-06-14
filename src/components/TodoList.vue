<script setup lang="ts">
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import LoadingOverlay from './common/LoadingOverlay.vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useI18n } from 'vue-i18n'
import { useTodoListState } from '../composables/useTodoListState'
import { TodoListHeader, TodoActions, SuggestedTodosDialog, ChartsDialog } from './todo'

interface SortableEvent {
  oldIndex: number
  newIndex: number
}

// 使用组合式函数
const { t } = useI18n()

// 使用 TodoList 状态管理
const {
  todoListRef,
  showConfirmDialog,
  confirmDialogConfig,
  handleConfirm,
  handleCancel,
  history,
  restoreHistory,
  deleteHistoryItem,
  deleteAllHistory,
  updateTodosOrder,
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
  clearActive,
  showHistory,
  showCharts,
  isSmallScreen,
  themeIcon,
  themeTooltip,
  toggleTheme,
  toggleHistory,
  closeHistory,
  closeCharts,
  handlePomodoroComplete,
  handleError,
} = useTodoListState()

// 使用 useSortable 为待办事项列表添加拖拽排序功能
const { option } = useSortable(todoListRef, filteredTodos, {
  animation: 150,
  onEnd: async (evt: SortableEvent) => {
    try {
      const { oldIndex, newIndex } = evt
      if (oldIndex === newIndex) return

      // 获取所有待办事项的 ID 数组
      const todoIds = filteredTodos.value.map((todo) => todo.id)

      // 移动 ID
      const [movedId] = todoIds.splice(oldIndex, 1)
      todoIds.splice(newIndex, 0, movedId)

      // 更新顺序
      updateTodosOrder(todoIds)
    } catch (error) {
      console.error('Error saving todo order:', error)
      handleError(error as Error)
    }
  },
})

option('animation', 150)
</script>

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
        :show-history="showHistory"
        @toggle-theme="toggleTheme"
        @toggle-history="toggleHistory"
        @toggle-charts="() => (showCharts = !showCharts)"
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
      <!-- 待办事项列表 -->
      <div ref="todoListRef" class="todo-grid">
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
        @clear-active="clearActive"
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
    <!-- 历史记录侧边栏 -->
    <transition name="slide">
      <HistorySidebar
        v-if="showHistory"
        :history="history"
        @restore="restoreHistory"
        @delete-item="deleteHistoryItem"
        @delete-all="deleteAllHistory"
        @close="closeHistory"
      />
    </transition>

    <!-- 图表对话框组件 -->
    <ChartsDialog :show="showCharts" @close="closeCharts" />
  </div>
</template>

<style scoped>
/* 引入 TodoList 样式 */
@import '../styles/todo-list.css';
</style>
