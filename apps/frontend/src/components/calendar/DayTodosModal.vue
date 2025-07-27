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
        <!-- 优雅的模态框头部 -->
        <header class="modal-header">
          <div class="header-content">
            <div class="date-info">
              <h2 :id="headerId" class="date-title">{{ formattedDate }}</h2>
              <div class="date-subtitle">
                <span class="weekday">{{ formattedWeekday }}</span>
                <span v-if="isToday" class="today-badge">{{ t('today') }}</span>
              </div>
            </div>
            <button ref="closeButtonRef" class="close-btn" :title="t('close')" @click="handleClose">
              <i class="i-carbon-close"></i>
            </button>
          </div>
        </header>

        <!-- 简洁的进度展示区域 -->
        <section v-if="todos.length > 0" class="progress-section">
          <div class="progress-container">
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
      filter.value = 'pending'
    }
  }
)

defineOptions({
  name: 'DayTodosModal',
})
</script>

<style scoped>
/* 优雅的模态框基础样式 */
.modal-overlay {
  @apply fixed inset-0 flex items-center justify-center z-50;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content {
  @apply w-full mx-6 max-h-[90vh] flex flex-col overflow-hidden;
  max-width: 720px;
  background: var(--card-bg-color);
  border: none;
  border-radius: 24px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 4px 20px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 优雅的头部样式 */
.modal-header {
  @apply relative p-6 pb-4;
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(var(--primary-color-rgb), 0.02) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-content {
  @apply flex items-start justify-between;
}

.date-info {
  @apply flex-1;
}

.date-title {
  @apply text-2xl font-bold mb-2;
  color: var(--text-color);
  background: linear-gradient(135deg, var(--text-color) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.date-subtitle {
  @apply flex items-center gap-3;
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

.close-btn {
  @apply p-2 rounded-lg transition-colors duration-200;
  color: var(--text-secondary-color);
}

.close-btn:hover {
  color: var(--text-color);
  background: var(--hover-bg-color);
}

/* 简洁的进度展示区域样式 */
.progress-section {
  @apply p-6 border-b flex justify-center;
  border-color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(var(--primary-color-rgb), 0.01) 100%
  );
}

.progress-container {
  @apply flex justify-center items-center;
}

.progress-circle {
  @apply relative w-28 h-28;
}

.circular-chart {
  @apply w-full h-full transform -rotate-90;
  filter: drop-shadow(0 4px 12px rgba(var(--primary-color-rgb), 0.25));
}

.circle-bg {
  fill: none;
  stroke: rgba(var(--primary-color-rgb), 0.12);
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.percentage-text {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.percentage {
  @apply text-xl font-bold;
  color: var(--text-color);
  background: linear-gradient(135deg, var(--text-color) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.percentage-text .label {
  @apply text-sm font-medium mt-1;
  color: var(--text-secondary-color);
}

/* 优雅的快速操作区域样式 */
.quick-actions-section {
  @apply p-6 border-b;
  border-color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(var(--primary-color-rgb), 0.01) 100%
  );
}

.quick-add-container {
  @apply mb-4;
}

.quick-add-form {
  @apply space-y-3;
}

.input-group {
  @apply flex gap-3;
}

.quick-add-input {
  @apply flex-1 px-4 py-3 rounded-xl border transition-all duration-300;
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  @apply focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary;
}

.quick-add-input:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.quick-add-input::placeholder {
  color: var(--text-secondary-color);
}

.add-btn {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300;
  @apply flex items-center justify-center;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    rgba(var(--primary-color-rgb), 0.8) 100%
  );
  color: white;
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(var(--primary-color-rgb), 0.4);
}

.error-message {
  @apply text-sm mt-1;
  color: var(--error-color);
}

/* 优雅的批量操作样式 */
.bulk-actions {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4;
}

.filter-controls {
  @apply flex gap-3;
}

.filter-btn {
  @apply px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-300;
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-secondary-color);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.filter-btn.active {
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    rgba(var(--primary-color-rgb), 0.8) 100%
  );
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
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

/* 优雅的列表区域样式 */
.todos-list-section {
  @apply flex-1 overflow-hidden;
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(var(--primary-color-rgb), 0.005) 100%
  );
}

.empty-state {
  @apply flex flex-col items-center justify-center py-16 text-center;
}

.empty-filtered-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply mb-4 text-4xl;
  color: var(--text-secondary-color);
  opacity: 0.6;
}

.empty-title {
  @apply text-lg font-bold mb-3;
  color: var(--text-color);
}

.empty-description {
  @apply text-sm leading-relaxed;
  color: var(--text-secondary-color);
}

.todos-container {
  @apply p-6;
}

.todos-list {
  @apply space-y-3 max-h-96 overflow-y-auto;
  padding: 8px 0;
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--primary-color-rgb), 0.3) transparent;
}

.todos-list::-webkit-scrollbar {
  width: 6px;
}

.todos-list::-webkit-scrollbar-track {
  background: transparent;
}

.todos-list::-webkit-scrollbar-thumb {
  background: rgba(var(--primary-color-rgb), 0.3);
  border-radius: 3px;
}

.todos-list::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--primary-color-rgb), 0.5);
}

.todo-item-enhanced {
  @apply transform transition-all duration-300;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  /* 确保宽度约束正确传递 */
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

/* 优化模态框中 TodoItem 的内部布局 */
.todo-item-enhanced :deep(.todo-content) {
  @apply min-w-0 flex-1;
}

.todo-item-enhanced :deep(.todo-text-wrapper) {
  @apply min-w-0 flex-1;
}

.todo-item-enhanced :deep(.todo-main-content) {
  @apply min-w-0;
  /* 改为 flex-start 避免文字被过度压缩 */
  justify-content: flex-start;
  gap: 0.75rem;
}

.todo-item-enhanced :deep(.todo-text) {
  @apply min-w-0 flex-1;
  max-width: calc(100% - 120px); /* 为右侧元素预留空间 */
}

.todo-item-enhanced :deep(.text-content) {
  @apply min-w-0;
  /* 强化文字溢出处理 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.todo-item-enhanced:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.6);
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

  .progress-section {
    @apply p-4;
  }

  .progress-circle {
    @apply w-24 h-24;
  }

  .percentage {
    @apply text-lg;
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
    @apply w-20 h-20;
  }

  .percentage {
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

/* 优雅的动画效果 */
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
    transform: translateY(30px) scale(0.9);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
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

  .stat-card {
    border: 2px solid var(--input-border-color);
    background: var(--card-bg-color);
  }

  .filter-btn.active {
    border: 2px solid var(--primary-color);
  }
}
</style>
