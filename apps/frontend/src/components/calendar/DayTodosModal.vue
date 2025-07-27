<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="headerId"
      @click="handleOverlayClick"
      @keydown.esc="handleClose"
    >
      <div ref="modalRef" class="modal-content" role="document" @click.stop>
        <!-- 增强的模态框头部 -->
        <header class="modal-header">
          <div class="date-info">
            <h2 :id="headerId" class="date-title">{{ formattedDate }}</h2>
            <div class="date-subtitle">
              <span class="weekday">{{ formattedWeekday }}</span>
              <span v-if="isToday" class="today-badge">{{ t('today') }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button
              v-if="todos.length > 0"
              class="action-btn"
              :title="allCompleted ? t('markAllIncomplete') : t('markAllComplete')"
              @click="toggleAllTodos"
            >
              <i :class="allCompleted ? 'i-carbon-checkbox-checked' : 'i-carbon-checkbox'"></i>
            </button>
            <button ref="closeButtonRef" class="close-btn" :title="t('close')" @click="handleClose">
              <i class="i-carbon-close"></i>
            </button>
          </div>
        </header>

        <!-- 增强的统计信息区域 -->
        <section v-if="todos.length > 0" class="stats-section">
          <div class="stats-grid">
            <!-- 进度环形图 -->
            <div class="progress-circle-container">
              <div class="progress-circle">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path
                    class="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    class="circle"
                    :stroke-dasharray="`${completionPercentage}, 100`"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div class="percentage-text">
                  <span class="percentage">{{ Math.round(completionPercentage) }}%</span>
                  <span class="label">{{ t('completed') }}</span>
                </div>
              </div>
            </div>

            <!-- 统计数据 -->
            <div class="stats-data">
              <div class="stat-item total">
                <div class="stat-icon">
                  <i class="i-carbon-task"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ todos.length }}</span>
                  <span class="stat-label">{{ t('totalTasks') }}</span>
                </div>
              </div>
              <div class="stat-item completed">
                <div class="stat-icon">
                  <i class="i-carbon-checkmark"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ completedCount }}</span>
                  <span class="stat-label">{{ t('completed') }}</span>
                </div>
              </div>
              <div class="stat-item pending">
                <div class="stat-icon">
                  <i class="i-carbon-time"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ pendingCount }}</span>
                  <span class="stat-label">{{ t('pending') }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 快速操作区域 -->
        <section class="quick-actions-section">
          <div class="quick-add-container">
            <form class="quick-add-form" @submit.prevent="handleQuickAdd">
              <div class="input-group">
                <input
                  ref="quickAddInputRef"
                  v-model="quickAddText"
                  class="quick-add-input"
                  :placeholder="t('addTodoForThisDate')"
                  :maxlength="MAX_TODO_LENGTH"
                  :disabled="isAdding"
                  @keydown.enter="handleQuickAdd"
                  @keydown.esc="clearQuickAdd"
                />
                <button
                  type="submit"
                  class="add-btn"
                  :disabled="!quickAddText.trim() || isAdding"
                  :title="t('add')"
                >
                  <i v-if="isAdding" class="i-carbon-loading animate-spin"></i>
                  <i v-else class="i-carbon-add"></i>
                </button>
              </div>
              <div v-if="quickAddError" class="error-message">
                {{ quickAddError }}
              </div>
            </form>
          </div>

          <!-- 批量操作和筛选 -->
          <div v-if="todos.length > 0" class="bulk-actions">
            <div class="filter-controls">
              <button
                class="filter-btn"
                :class="{ active: filter === 'pending' }"
                @click="setFilter('pending')"
              >
                {{ t('pending') }} ({{ pendingCount }})
              </button>
              <button
                class="filter-btn"
                :class="{ active: filter === 'completed' }"
                @click="setFilter('completed')"
              >
                {{ t('completed') }} ({{ completedCount }})
              </button>
            </div>
          </div>
        </section>

        <!-- 待办事项列表区域 -->
        <section class="todos-list-section">
          <div v-if="filteredTodos.length === 0 && todos.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="i-carbon-calendar text-6xl"></i>
            </div>
            <h3 class="empty-title">{{ t('noTodosForThisDate') }}</h3>
            <p class="empty-description">{{ t('addFirstTodoForDate') }}</p>
          </div>

          <div v-else-if="filteredTodos.length === 0" class="empty-filtered-state">
            <div class="empty-icon">
              <i class="i-carbon-search text-4xl"></i>
            </div>
            <p class="empty-description">{{ t('noTodosMatchFilter') }}</p>
          </div>

          <div v-else class="todos-container">
            <div class="todos-list">
              <TodoItem
                v-for="todo in filteredTodos"
                :key="todo.id"
                :todo="todo"
                :is-draggable="false"
                class="todo-item-enhanced"
                @toggle="handleToggleTodo"
                @remove="handleRemoveTodo"
                @update-todo="handleUpdateTodo"
                @update-text="handleUpdateTodoText"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { isToday as checkIsToday, format } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Todo } from '@/types/todo'
import TodoItem from '../TodoItem.vue'

// Props
interface Props {
  date: Date
  todos: Todo[]
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
  addTodo: [text: string]
  updateTodo: [id: string, updates: Partial<Todo>]
  updateTodoText: [id: string, text: string]
  removeTodo: [id: string]
}>()

// 国际化
const { t, locale } = useI18n()

// 常量
const MAX_TODO_LENGTH = 200

// 响应式数据
const modalRef = ref<HTMLElement>()
const closeButtonRef = ref<HTMLElement>()
const _footerCloseButtonRef = ref<HTMLElement>()
const quickAddInputRef = ref<HTMLInputElement>()

const quickAddText = ref('')
const quickAddError = ref('')
const isAdding = ref(false)
const filter = ref<'pending' | 'completed'>('pending')

// 生成唯一ID
const headerId = `modal-header-${Date.now()}`

// 计算属性
const dateLocale = computed(() => {
  return locale.value === 'zh' ? zhCN : enUS
})

const formattedDate = computed(() => {
  return format(props.date, 'yyyy年MM月dd日', { locale: dateLocale.value })
})

const formattedWeekday = computed(() => {
  return format(props.date, 'EEEE', { locale: dateLocale.value })
})

const isToday = computed(() => {
  return checkIsToday(props.date)
})

const completedCount = computed(() => {
  return props.todos.filter((todo) => todo.completed).length
})

const pendingCount = computed(() => {
  return props.todos.filter((todo) => !todo.completed).length
})

const completionPercentage = computed(() => {
  if (props.todos.length === 0) return 0
  return (completedCount.value / props.todos.length) * 100
})

const allCompleted = computed(() => {
  return props.todos.length > 0 && completedCount.value === props.todos.length
})

const filteredTodos = computed(() => {
  // 按优先级排序的待办事项
  const sorted = [...props.todos].sort((a, b) => {
    // 优先级排序（高优先级在前）
    const priorityA = a.priority || 3
    const priorityB = b.priority || 3
    if (priorityA !== priorityB) {
      return priorityB - priorityA
    }
    // 相同优先级按创建时间排序（新的在前）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  switch (filter.value) {
    case 'pending':
      return sorted.filter((todo) => !todo.completed)
    case 'completed':
      return sorted.filter((todo) => todo.completed)
    default:
      return sorted
  }
})

// 方法
const handleOverlayClick = () => {
  handleClose()
}

const handleClose = () => {
  emit('close')
}

const handleQuickAdd = async () => {
  const text = quickAddText.value.trim()

  if (!text) {
    quickAddError.value = t('emptyTodoError')
    setTimeout(() => {
      quickAddError.value = ''
    }, 3000)
    return
  }

  if (text.length > MAX_TODO_LENGTH) {
    quickAddError.value = t('maxLengthError', { maxLength: MAX_TODO_LENGTH })
    setTimeout(() => {
      quickAddError.value = ''
    }, 3000)
    return
  }

  try {
    isAdding.value = true
    quickAddError.value = ''

    emit('addTodo', text)

    // 清空输入框
    quickAddText.value = ''

    // 重新聚焦输入框
    await nextTick()
    quickAddInputRef.value?.focus()
  } catch (error) {
    quickAddError.value = t('addTodoError')
    console.error('Error adding todo:', error)
  } finally {
    isAdding.value = false
  }
}

const clearQuickAdd = () => {
  quickAddText.value = ''
  quickAddError.value = ''
}

const handleToggleTodo = (todoId: string) => {
  const todo = props.todos.find((t) => t.id === todoId)
  if (todo) {
    emit('updateTodo', todo.id, { completed: !todo.completed })
  }
}

const handleUpdateTodo = (id: string, updates: Partial<Todo>) => {
  emit('updateTodo', id, updates)
}

const handleUpdateTodoText = (id: string, text: string) => {
  emit('updateTodoText', id, text)
}

const handleRemoveTodo = (id: string) => {
  emit('removeTodo', id)
}

const toggleAllTodos = () => {
  const shouldComplete = !allCompleted.value
  props.todos.forEach((todo) => {
    if (todo.completed !== shouldComplete) {
      emit('updateTodo', todo.id, { completed: shouldComplete })
    }
  })
}

const _clearCompleted = () => {
  const completedTodos = props.todos.filter((todo) => todo.completed)
  completedTodos.forEach((todo) => {
    emit('removeTodo', todo.id)
  })
}

const setFilter = (newFilter: 'pending' | 'completed') => {
  if (filter.value === newFilter) return
  filter.value = newFilter
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      handleClose()
      break
    case 'Tab':
      // 处理Tab键导航
      handleTabNavigation(event)
      break
  }
}

const handleTabNavigation = (event: KeyboardEvent) => {
  const focusableElements = modalRef.value?.querySelectorAll(
    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  if (!focusableElements || focusableElements.length === 0) return

  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

// 生命周期钩子
onMounted(() => {
  // 聚焦到快速添加输入框
  nextTick(() => {
    quickAddInputRef.value?.focus()
  })

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)

  // 防止背景滚动
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeydown)

  // 恢复背景滚动
  document.body.style.overflow = ''
})

// 监听todos变化，重置筛选器
watch(
  () => props.todos.length,
  (newLength) => {
    if (newLength === 0) {
      filter.value = 'all'
    }
  }
)

defineOptions({
  name: 'DayTodosModal',
})
</script>

<style scoped>
/* 模态框基础样式 */
.modal-overlay {
  @apply fixed inset-0 flex items-center justify-center z-50;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  @apply w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden;
  max-width: 680px;
  background: var(--card-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  animation: slideUp 0.3s ease-out;
}

/* 头部样式 */
.modal-header {
  @apply flex items-center justify-between p-5 border-b;
  border-color: var(--input-border-color);
  background: var(--card-bg-color);
}

.date-info {
  @apply flex-1;
}

.date-title {
  @apply text-xl font-semibold;
  color: var(--text-color);
}

.date-subtitle {
  @apply flex items-center gap-2 mt-1;
}

.weekday {
  @apply text-sm;
  color: var(--text-secondary-color);
}

.today-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
  background: var(--primary-color);
  color: white;
}

.header-actions {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply p-2 rounded-lg transition-colors duration-200;
  color: var(--text-secondary-color);
}

.action-btn:hover {
  color: var(--text-color);
  background: var(--hover-bg-color);
}

.close-btn {
  @apply p-2 rounded-lg transition-colors duration-200;
  color: var(--text-secondary-color);
}

.close-btn:hover {
  color: var(--text-color);
  background: var(--hover-bg-color);
}

/* 统计区域样式 */
.stats-section {
  @apply p-4 border-b;
  border-color: var(--input-border-color);
  background: var(--card-bg-color);
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.progress-circle-container {
  @apply flex justify-center;
}

.progress-circle {
  @apply relative w-24 h-24;
}

.circular-chart {
  @apply w-full h-full transform -rotate-90;
}

.circle-bg {
  fill: none;
  stroke: var(--input-border-color);
  stroke-width: 2;
}

.circle {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.percentage-text {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.percentage {
  @apply text-base font-semibold;
  color: var(--text-color);
}

.percentage-text .label {
  @apply text-xs;
  color: var(--text-secondary-color);
}

.stats-data {
  @apply grid grid-cols-3 gap-3;
}

.stat-item {
  @apply flex items-center gap-2 p-3 rounded-lg transition-all duration-200;
  background: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
}

.stat-item:hover {
  background: var(--hover-bg-color);
}

.stat-item.total .stat-icon {
  color: var(--primary-color);
}

.stat-item.completed .stat-icon {
  color: #10b981;
}

.stat-item.pending .stat-icon {
  color: #f59e0b;
}

.stat-icon {
  @apply text-lg flex-shrink-0;
}

.stat-content {
  @apply flex flex-col min-w-0;
}

.stat-value {
  @apply text-base font-semibold;
  color: var(--text-color);
}

.stat-label {
  @apply text-xs;
  color: var(--text-secondary-color);
}

/* 快速操作区域样式 */
.quick-actions-section {
  @apply p-4 border-b;
  border-color: var(--input-border-color);
}

.quick-add-container {
  @apply mb-3;
}

.quick-add-form {
  @apply space-y-2;
}

.input-group {
  @apply flex gap-2;
}

.quick-add-input {
  @apply flex-1 px-3 py-2 rounded-lg border transition-all duration-200;
  background: var(--input-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-color);
  @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary;
}

.quick-add-input::placeholder {
  color: var(--text-secondary-color);
}

.add-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
  @apply flex items-center justify-center;
  background: var(--primary-color);
  color: white;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.add-btn:hover:not(:disabled) {
  background: var(--button-hover-bg-color);
}

.error-message {
  @apply text-sm mt-1;
  color: var(--error-color);
}

/* 批量操作样式 */
.bulk-actions {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3;
}

.filter-controls {
  @apply flex gap-2;
}

.filter-btn {
  @apply px-3 py-2 text-sm rounded-lg border transition-all duration-200;
  background: var(--input-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-secondary-color);
}

.filter-btn:hover {
  background: var(--hover-bg-color);
  color: var(--text-color);
}

.filter-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.sort-controls {
  @apply flex items-center gap-2;
}

.sort-select {
  @apply px-3 py-2 text-sm rounded-lg border transition-all duration-200;
  background: var(--input-bg-color);
  border-color: var(--input-border-color);
  color: var(--text-color);
  @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary;
}

/* 列表区域样式 */
.todos-list-section {
  @apply flex-1 overflow-hidden;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-filtered-state {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.empty-icon {
  @apply mb-3;
  color: var(--text-secondary-color);
}

.empty-title {
  @apply text-base font-semibold mb-2;
  color: var(--text-color);
}

.empty-description {
  @apply text-sm;
  color: var(--text-secondary-color);
}

.todos-container {
  @apply p-4;
}

.todos-list {
  @apply space-y-2 max-h-80 overflow-y-auto;
  padding-top: 4px; /* 为第一个 todo 的 hover 效果预留空间 */
}

.todo-item-enhanced {
  @apply transform transition-all duration-200;
}

/* 列表动画 */
.todo-list-enter-active,
.todo-list-leave-active {
  transition: all 0.3s ease;
}

.todo-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.todo-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.todo-list-move {
  transition: transform 0.3s ease;
}

/* 底部样式 */
.modal-footer {
  @apply flex items-center justify-between p-4 border-t;
  border-color: var(--input-border-color);
  background: var(--card-bg-color);
}

.footer-stats {
  @apply text-sm;
  color: var(--text-secondary-color);
}

.footer-actions {
  @apply flex items-center gap-2;
}

.btn-text {
  @apply px-3 py-2 text-sm transition-colors duration-200;
  color: var(--text-secondary-color);
}

.btn-text:hover {
  color: var(--text-color);
}

.btn-primary {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--button-hover-bg-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    @apply mx-2 max-h-[95vh];
  }

  .modal-header {
    @apply p-4;
  }

  .date-title {
    @apply text-xl;
  }

  .stats-section {
    @apply p-4;
  }

  .stats-grid {
    @apply grid-cols-1 gap-4;
  }

  .stats-data {
    @apply grid-cols-1 gap-2;
  }

  .stat-item {
    @apply p-2;
  }

  .quick-actions-section {
    @apply p-4;
  }

  .bulk-actions {
    @apply flex-col gap-3;
  }

  .filter-controls {
    @apply flex-wrap;
  }

  .todos-container {
    @apply p-4;
  }

  .todos-list {
    @apply max-h-80;
  }

  .modal-footer {
    @apply p-4;
  }
}

@media (max-width: 480px) {
  .modal-content {
    @apply mx-1 max-h-[98vh];
  }

  .modal-header {
    @apply p-3;
  }

  .date-title {
    @apply text-lg;
  }

  .stats-section {
    @apply p-3;
  }

  .progress-circle {
    @apply w-22 h-22;
  }

  .percentage {
    @apply text-base;
  }

  .stat-item {
    @apply flex-col gap-1 p-2;
  }

  .stat-icon {
    @apply text-lg;
  }

  .stat-value {
    @apply text-base;
  }

  .quick-actions-section {
    @apply p-3;
  }

  .input-group {
    @apply flex-col gap-2;
  }

  .add-btn {
    @apply w-full;
  }

  .filter-btn {
    @apply text-xs px-2 py-1;
  }

  .todos-container {
    @apply p-3;
  }

  .todos-list {
    @apply max-h-64;
  }

  .modal-footer {
    @apply p-3 flex-col gap-2;
  }

  .footer-actions {
    @apply w-full justify-between;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .modal-content {
  @apply bg-card border border-border;
}

[data-theme='dark'] .modal-header {
  @apply border-border;
}

[data-theme='dark'] .stats-section {
  @apply border-border;
}

[data-theme='dark'] .stat-item {
  @apply bg-bg border-border;
}

[data-theme='dark'] .circle-bg {
  stroke: #374151;
}

[data-theme='dark'] .quick-actions-section {
  @apply border-border;
}

[data-theme='dark'] .filter-btn {
  @apply border-border bg-card hover:bg-bg;
}

[data-theme='dark'] .sort-select {
  @apply border-border bg-card;
}

[data-theme='dark'] .modal-footer {
  @apply border-border;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 加载动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 焦点样式 */
.modal-content:focus-within {
  @apply ring-2 ring-primary ring-opacity-50;
}

/* 滚动条样式 */
.todos-list::-webkit-scrollbar {
  width: 6px;
}

.todos-list::-webkit-scrollbar-track {
  background: var(--input-border-color);
  border-radius: 9999px;
}

.todos-list::-webkit-scrollbar-thumb {
  background: var(--text-secondary-color);
  border-radius: 9999px;
}

.todos-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-color);
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-content,
  .todo-list-enter-active,
  .todo-list-leave-active,
  .todo-list-move {
    animation: none;
    transition: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .modal-content {
    border: 2px solid var(--text-color);
  }

  .stat-item {
    border: 2px solid var(--input-border-color);
  }

  .filter-btn.active {
    border: 2px solid var(--primary-color);
  }
}
</style>
