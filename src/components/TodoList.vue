<script setup lang="ts">
import { onMounted, onUnmounted, onErrorCaptured, onBeforeMount, ref } from 'vue'
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import PomodoroStats from './PomodoroStats.vue'
import TodoStats from './TodoStats.vue'
import AddProjectModal from './AddProjectModal.vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useTodos } from '../composables/useTodos'
import { useProjectManagement } from '../composables/useProjectManagement'
import { useTodoManagement } from '../composables/useTodoManagement'
import { useUIState } from '../composables/useUIState'

interface SortableEvent {
  oldIndex: number
  newIndex: number
}

// 使用组合式函数
const { t } = useI18n()
const { showError } = useErrorHandler()
const confirmDialog = useConfirmDialog()
const { showConfirmDialog, confirmDialogConfig, handleConfirm, handleCancel } =
  confirmDialog
const {
  todos,
  history,
  restoreHistory,
  deleteHistoryItem,
  deleteAllHistory,
  loadTodos,
  updateTodosOrder,
} = useTodos()

// 项目管理相关
const {
  showAddProjectModal,
  displayedProjects,
  addNewProject,
  deleteProject,
  handleProjectChange,
  currentProjectId,
} = useProjectManagement(confirmDialog)

// 待办事项管理相关
const {
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
} = useTodoManagement()

// UI状态管理相关
const {
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
  checkPomodoroCompletion,
  onKeyDown,
} = useUIState()

// 创建待办事项列表的 ref，用于拖拽排序功能
const todoListRef = ref<HTMLElement | null>(null)

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
      showError(t('updateOrderError'))
    }
  },
})

option('animation', 150)

// 添加错误边界处理
const handleError = (error: Error) => {
  console.error('TodoList error:', error)
  showError(t('generalError'))
}

onErrorCaptured(handleError)

// 添加性能监控
let renderStartTime = 0
onBeforeMount(() => {
  renderStartTime = performance.now()
})

onMounted(() => {
  document.addEventListener('visibilitychange', checkPomodoroCompletion)
  document.addEventListener('keydown', onKeyDown)
  try {
    loadTodos() // 加载待办事项数据
    console.log('Todos loaded:', todos.value)
  } catch (error) {
    console.error('Error loading todos:', error)
    showError(error instanceof Error ? error.message : 'Failed to load todos')
  }

  const renderTime = performance.now() - renderStartTime
  if (renderTime > 100) {
    console.warn(`TodoList render time: ${renderTime}ms`)
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', checkPomodoroCompletion)
  document.removeEventListener('keydown', onKeyDown)
})
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
      <div class="header">
        <!-- 应用标题 -->
        <h1 style="margin-right: 10px">
          {{ t('appTitle') }}
        </h1>
        <div class="header-actions">
          <!-- 主题切换按钮 -->
          <button
            class="icon-button theme-toggle"
            :title="themeTooltip"
            :aria-label="themeTooltip"
            @click="toggleTheme"
          >
            <!-- 根据当前主题显示不同的图标 -->
            <svg
              v-if="themeIcon === 'moon'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path
                d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
              />
            </svg>
            <svg
              v-else-if="themeIcon === 'sun'"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path
                d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-4V3a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm0 18v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm10-10h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zM2 12h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2zm16.95-5.66l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm-14.9 14.9l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm14.9 0a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 1.414-1.414l1.414 1.414zm-14.9-14.9a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path
                d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 3v6h5v-2h-3V7h-2z"
              />
            </svg>
            {{ t('theme') }}
          </button>
          <!-- 历史记录按钮 -->
          <button
            class="icon-button"
            :class="{ active: showHistory }"
            @click="toggleHistory"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
              />
            </svg>
            <span>{{ t('history') }}</span>
          </button>

          <button class="icon-button" @click="showCharts = !showCharts">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path
                d="M3 3v18h18v-2H5V3H3zm4 14h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-7h-2v7z"
              />
            </svg>
            <span>{{ t('showCharts') }}</span>
          </button>
        </div>
      </div>

      <!-- 项目选择器和添加项目按钮 -->
      <div class="project-header" :class="{ 'small-screen': isSmallScreen }">
        <div class="project-tabs">
          <button
            v-for="(project, index) in displayedProjects"
            :key="project.id || index"
            :title="project.name"
            :class="{ active: currentProjectId === project.id }"
            class="project-tab"
            @click="handleProjectChange(project.id)"
          >
            {{ project.name }}
            <button
              v-if="project.id !== null"
              class="delete-project"
              :title="t('deleteProject')"
              @click.stop.prevent="deleteProject(project.id)"
              type="button"
            >
              &times;
            </button>
          </button>
        </div>
        <button class="add-project-btn" @click="showAddProjectModal = true">
          <i class="fas fa-plus" /> {{ t('addProject') }}
        </button>
      </div>

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
      <!-- 操作按钮区域 -->
      <div class="actions">
        <!-- 清除已完成待办事项按钮 -->
        <button
          v-if="filter === 'active' && hasActiveTodos"
          class="clear-btn"
          @click="clearActive"
        >
          {{ t('clearCompleted') }}
        </button>
        <!-- 生成建议待办事项按钮 -->
        <button
          class="generate-btn"
          :disabled="isGenerating"
          @click="generateSuggestedTodos"
        >
          {{ isGenerating ? t('generating') : t('generateSuggestions') }}
        </button>
        <!-- AI优先级排序按钮 -->
        <button
          v-if="hasActiveTodos"
          class="sort-btn"
          :disabled="isSorting"
          @click="sortActiveTodosWithAI"
        >
          <span>{{ t('aiPrioritySort') }}</span>
        </button>
      </div>
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

      <!-- 建议待办事确认对话框 -->
      <div v-if="showSuggestedTodos" class="suggested-todos-dialog">
        <h3>{{ t('suggestedTodos') }}</h3>
        <p>{{ t('confirmOrModify') }}</p>
        <ul>
          <li v-for="(todo, index) in suggestedTodos" :key="index">
            <input
              :value="todo"
              class="suggested-todo-input"
              @input="
                (event: Event) =>
                  updateSuggestedTodo(index, (event.target as HTMLInputElement).value)
              "
            />
          </li>
        </ul>
        <div class="dialog-actions">
          <button class="confirm-btn" @click="confirmSuggestedTodos">
            {{ t('confirmAdd') }}
          </button>
          <button class="cancel-btn" @click="cancelSuggestedTodos">
            {{ t('cancel') }}
          </button>
        </div>
      </div>
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

    <!-- 图表详情对话框 -->
    <div v-if="showCharts" class="charts-dialog" @click="closeCharts">
      <div class="charts-content" @click.stop>
        <button class="close-btn" @click="showCharts = false">
          {{ t('close') }}
        </button>
        <h2>{{ t('todoCharts') }}</h2>

        <!-- 待办事项统计组件 -->
        <TodoStats />

        <!-- 番茄钟统计组件 -->
        <PomodoroStats />
      </div>
    </div>
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
  padding: 2.5rem;
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
  min-height: 300px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  margin-bottom: 1rem;
}

h1 {
  color: #ff7e67;
  font-size: 2.6rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  white-space: nowrap;
}

.todo-grid {
  overflow-y: auto;
  display: flex;
  height: 48vh;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-top: 0.5rem;
  padding-right: 0.5rem;
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

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
  font-weight: bold;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.icon-button svg {
  fill: currentColor;
}

.icon-button:hover,
.icon-button.active {
  color: #ff7e67;
  opacity: 1;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 126, 103, 0.08);
}

.clear-btn,
.generate-btn,
.sort-btn {
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  min-width: 130px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--button-bg-color) 0%,
    rgba(121, 180, 166, 0.8) 100%
  );
  color: var(--text-color);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  box-shadow: 0 3px 8px rgba(121, 180, 166, 0.2);
  position: relative;
  overflow: hidden;
}

.clear-btn::before,
.generate-btn::before,
.sort-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.clear-btn:hover::before,
.generate-btn:hover::before,
.sort-btn:hover::before {
  left: 100%;
}

.clear-btn:hover {
  background: linear-gradient(
    135deg,
    var(--button-hover-bg-color) 0%,
    rgba(121, 180, 166, 1) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(121, 180, 166, 0.4);
}

.generate-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    var(--button-hover-bg-color) 0%,
    rgba(121, 180, 166, 1) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(121, 180, 166, 0.4);
}

.generate-btn:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sort-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    var(--button-hover-bg-color) 0%,
    rgba(121, 180, 166, 1) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(121, 180, 166, 0.4);
}

.sort-btn:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top: 2px solid #3498db;
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

.todo-list.is-loading {
  pointer-events: none;
  opacity: 0.7;
}

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
    padding: 0.5rem;
    padding-top: 4.5rem; /* 为固定导航栏留出空间 */
  }

  .todo-list {
    width: 100%;
    max-width: 100%;
    padding: 0.5rem;
    margin-top: 0; /* 移除额外的margin，因为container已经有padding */
  }

  .actions {
    flex-direction: column; /* 在小屏幕上垂直排列按钮 */
    align-items: stretch; /* 让按钮宽度填满容器 */
  }

  .clear-btn,
  .generate-btn,
  .sort-btn {
    width: 100%; /* 按钮宽度填满容 */
    margin-bottom: 0.5rem; /* 增加按钮之间间距 */
  }

  .header {
    flex-direction: column; /* 标题和操作按钮垂直排列 */
    align-items: flex-start;
  }

  .header-actions {
    margin-top: 1rem; /* 增加标题和操作按钮之间的间 */
    width: 100%; /* 让操作按钮占满宽度 */
    justify-content: space-between; /* 均匀分布操作按钮 */
  }

  h1 {
    font-size: 1.5rem; /* 减小标题字体大小 */
  }
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

.suggested-todos-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--card-bg-color);
  color: var(--text-color);
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  z-index: 1000;
  max-width: 90%;
  width: 400px;
}

.suggested-todo-input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid var(--input-border-color);
  border-radius: calc(var(--border-radius) / 2);
  background-color: var(--input-bg-color);
  color: var(--text-color);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.confirm-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border: none;
  border-radius: calc(var(--border-radius) / 2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn {
  background-color: #4caf50;
  color: white;
}

.confirm-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #ff7043;
  color: white;
}

.cancel-btn:hover {
  background-color: #f4511e;
}

.theme-toggle {
  margin-right: 10px;
  position: relative;
}

/* 可以考虑添加一个自定义的工具提示样式，如果你想要更好的视觉效果 */
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
    rgba(255, 126, 103, 0.05) 100%
  );
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border-bottom: 2px solid rgba(255, 126, 103, 0.1);
  position: relative;
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
    flex-direction: column;
    align-items: stretch;
  }

  .todo-card-header {
    margin-bottom: 0.75rem;
    padding: 0.75rem;
  }
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 126, 103, 0.08);
  position: relative;
  z-index: 100;
}

.project-tabs {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(121, 180, 166, 0.3) transparent;
}

.project-tabs::-webkit-scrollbar {
  height: 4px;
}

.project-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.project-tabs::-webkit-scrollbar-thumb {
  background: rgba(121, 180, 166, 0.3);
  border-radius: 2px;
}

.project-tabs::-webkit-scrollbar-thumb:hover {
  background: rgba(121, 180, 166, 0.5);
}

.project-tab {
  position: relative;
  padding: 0.75rem 1.25rem;
  padding-right: 2.2rem; /* 为删除按钮留出更多空间 */
  line-height: 1;
  background: linear-gradient(
    135deg,
    var(--filter-btn-bg) 0%,
    rgba(121, 180, 166, 0.1) 100%
  );
  color: var(--filter-btn-text);
  border: 2px solid var(--filter-btn-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 110px;
  max-width: 200px;
  white-space: nowrap;
  overflow: visible; /* 确保删除按钮可见 */
  text-overflow: ellipsis;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.project-tab:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(121, 180, 166, 0.2);
}

.delete-project {
  position: absolute;
  top: 50%;
  right: 0.3rem;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.7;
  transition: all 0.3s ease;
  background: none;
  border: none;
  color: inherit;
  padding: 0.3rem;
  border-radius: 50%;
  width: 1.6rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  font-weight: bold;
}

.delete-project:hover {
  opacity: 1;
  background-color: rgba(255, 0, 0, 0.15);
  color: #ff4444;
  transform: translateY(-50%) scale(1.1);
}

.delete-project:active {
  transform: translateY(-50%) scale(0.95);
  background-color: rgba(255, 0, 0, 0.25);
}

.project-tab.active {
  background: linear-gradient(
    135deg,
    var(--filter-btn-active-bg) 0%,
    rgba(255, 126, 103, 0.2) 100%
  );
  color: var(--filter-btn-active-text);
  border-color: var(--filter-btn-active-border);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 126, 103, 0.3);
}

.add-project-btn {
  padding: 0.75rem 1.25rem;
  white-space: nowrap;
  background: linear-gradient(
    135deg,
    var(--button-bg-color) 0%,
    rgba(121, 180, 166, 0.9) 100%
  );
  color: var(--button-text-color);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(121, 180, 166, 0.3);
}

.add-project-btn i {
  margin-right: 0.5rem;
}

.add-project-btn:hover {
  background: linear-gradient(
    135deg,
    var(--button-hover-bg-color) 0%,
    rgba(121, 180, 166, 1) 100%
  );
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(121, 180, 166, 0.4);
}

.project-title {
  font-size: 1.2rem;
  margin: 1rem 0;
  color: var(--text-color);
}

/* 添加响应式样式 */
@media (max-width: 768px) {
  .project-header {
    flex-direction: column;
    align-items: stretch;
    margin-top: 0.5rem; /* 确保不被导航栏遮挡 */
    position: relative;
    z-index: 50;
  }

  .project-tabs {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .project-tab {
    min-width: 90px;
    max-width: 150px;
    font-size: 0.9rem;
    padding: 0.6rem 1rem;
    padding-right: 2rem; /* 为删除按钮留出足够空间 */
  }

  .delete-project {
    right: 0.2rem;
    width: 1.4rem;
    height: 1.4rem;
    font-size: 1rem;
  }

  .add-project-btn {
    width: 100%;
    justify-content: center;
  }
}

.charts-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.charts-content {
  background-color: var(--card-bg-color);
  padding: 2rem;
  border-radius: var(--border-radius);
  max-width: 100%;
  max-height: 80%;
  overflow-y: auto;
  position: relative; /* 添加这行 */
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: var(--button-bg-color);
  color: var(--text-color);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
}

/* 其他现有的样式 */

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

@media (max-width: 768px) {
  .todo-container {
    max-width: 100%;
    padding: 0.5rem;
  }

  .todo-list {
    max-width: 100%;
    padding: 1rem;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .clear-btn,
  .generate-btn,
  .sort-btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    margin-top: 1rem;
    width: 100%;
    justify-content: space-between;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
