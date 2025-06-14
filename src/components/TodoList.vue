<script setup lang="ts">
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import AddProjectModal from './AddProjectModal.vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useI18n } from 'vue-i18n'
import { useTodoListState } from '../composables/useTodoListState'
import {
  TodoListHeader,
  ProjectTabs,
  TodoActions,
  SuggestedTodosDialog,
  ChartsDialog,
} from './todo'

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
  showAddProjectModal,
  displayedProjects,
  addNewProject,
  deleteProject,
  handleProjectChange,
  currentProjectId,
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
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner" />
        <p>{{ t('sorting') }}</p>
      </div>
      <!-- 头部组件 -->
      <TodoListHeader
        :theme-icon="themeIcon"
        :theme-tooltip="themeTooltip"
        :show-history="showHistory"
        @toggle-theme="toggleTheme"
        @toggle-history="toggleHistory"
        @toggle-charts="() => (showCharts = !showCharts)"
      />

      <!-- 项目标签组件 -->
      <ProjectTabs
        :displayed-projects="displayedProjects"
        :current-project-id="currentProjectId"
        :is-small-screen="isSmallScreen"
        @project-change="handleProjectChange"
        @delete-project="deleteProject"
        @show-add-project="showAddProjectModal = true"
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
    <!-- 添加项目模态框 -->
    <AddProjectModal
      v-if="showAddProjectModal"
      @add="addNewProject"
      @close="showAddProjectModal = false"
    />

    <!-- 图表对话框组件 -->
    <ChartsDialog :show="showCharts" @close="closeCharts" />
  </div>
</template>

<style scoped>
.todo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

.todo-list {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  font-family:
    'LXGW WenKai Screen',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen-Sans,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    sans-serif;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-radius: calc(var(--border-radius) * 1.5);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  position: relative;
  min-height: 200px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 番茄钟计时器集成样式 */
.todo-card-header {
  margin-bottom: 1rem;
}

.pomodoro-timer-integrated {
  width: 100%;
}

.todo-grid {
  overflow-y: auto;
  display: flex;
  height: 35vh;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.5rem 0.5rem 0;
  border-radius: var(--border-radius);
}

.todo-grid::-webkit-scrollbar {
  width: 8px;
}

.todo-grid::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color, rgba(0, 0, 0, 0.1));
  border-radius: 4px;
}

.todo-grid::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-color, rgba(0, 0, 0, 0.2));
  border-radius: 4px;
}

.todo-grid::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover-color, rgba(0, 0, 0, 0.3));
}

/* 加载状态样式 */
.todo-list.is-loading {
  pointer-events: none;
  opacity: 0.7;
}

/* 加载覆盖层样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--card-bg-color);
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-overlay p {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: var(--text-color);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #3498db;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (min-width: 1201px) {
  .todo-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 1200px) {
  .todo-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .todo-list {
    width: 100%;
    max-width: 600px;
  }
}

@media (max-width: 768px) {
  .todo-container {
    padding: 0.25rem;
    padding-top: 4rem; /* 为固定导航栏留出空间 */
  }

  .todo-list {
    width: 100%;
    max-width: 100%;
    padding: 0.75rem;
    margin-top: 0; /* 移除额外的margin，因为container已经有padding */
  }

  .todo-grid {
    height: 28vh;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  /* 移动端样式已移到子组件中 */
}

.slide-enter-active,
.slide-leave-active,
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 主题切换工具提示样式 */
.theme-toggle {
  margin-right: 10px;
  position: relative;
}

.theme-toggle::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--text-color);
  color: var(--bg-color);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s,
    visibility 0.3s;
}

.theme-toggle:hover::after {
  opacity: 1;
  visibility: visible;
}

@media (prefers-color-scheme: dark) {
  .todo-list {
    backdrop-filter: blur(20px);
  }
}

.todo-card-header {
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(255, 126, 103, 0.02) 100%
  );
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(255, 126, 103, 0.08);
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 126, 103, 0.08);
  position: relative;
  z-index: 10;
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
  width: 100%;
  margin: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }

  .todo-card-header {
    margin-bottom: 0.5rem; /* 减少底部间距 */
    padding: 0.5rem; /* 减少内边距 */
  }
}

/* 项目相关样式已移到 ProjectTabs 组件中 */

/* 项目相关移动端样式已移到 ProjectTabs 组件中 */

/* 图表对话框样式已移到 ChartsDialog 组件中 */

.todo-container.small-screen {
  padding: 0.5rem;
}

.project-header.small-screen {
  flex-direction: column;
  align-items: stretch;
}

.project-header.small-screen .project-tabs {
  margin-bottom: 0.5rem;
}

.project-header.small-screen .add-project-btn {
  width: 100%;
}

.pomodoro-timer.small-screen {
  position: static;
  margin-bottom: 1rem;
}

/* 移动端样式已移到各个子组件中 */
</style>
