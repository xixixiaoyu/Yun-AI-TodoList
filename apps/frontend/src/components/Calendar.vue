<template>
  <div class="calendar-container" :class="{ 'small-screen': isSmallScreen }">
    <div class="calendar-card">
      <!-- 日历头部 -->
      <CalendarHeader
        :current-date="currentDate"
        :view-mode="viewMode"
        @prev-month="goToPrevMonth"
        @next-month="goToNextMonth"
        @today="goToToday"
        @view-mode-change="handleViewModeChange"
        @holiday-settings="showHolidaySettings = true"
      />

      <!-- 日历网格 -->
      <CalendarGrid
        :current-date="currentDate"
        :selected-date="selectedDate"
        :todos-by-date="todosByDate"
        :view-mode="viewMode"
        @date-click="handleDateClick"
        @date-hover="handleDateHover"
      />

      <!-- 快速添加待办事项 -->
      <div v-if="showQuickAdd" class="quick-add-section">
        <div class="quick-add-header">
          <h3>{{ t('quickAddTodo') }}</h3>
          <button class="close-btn" @click="closeQuickAdd">
            <i class="i-carbon-close"></i>
          </button>
        </div>
        <TodoInput
          :placeholder="quickAddPlaceholder"
          :max-length="MAX_TODO_LENGTH"
          @add="handleQuickAddTodo"
          @cancel="closeQuickAdd"
        />
      </div>
    </div>

    <!-- 日期详情弹窗 -->
    <DayTodosModal
      v-if="showDayModal"
      :date="selectedDate"
      :todos="selectedDateTodos"
      @close="closeDayModal"
      @add-todo="handleAddTodoForDate"
      @update-todo="handleUpdateTodo"
      @update-todo-text="handleUpdateTodoText"
      @remove-todo="handleRemoveTodo"
    />

    <!-- 节假日设置弹窗 -->
    <div v-if="showHolidaySettings" class="modal-overlay" @click="closeHolidaySettings">
      <div class="modal-container" @click.stop>
        <HolidaySettings :show="showHolidaySettings" @close="closeHolidaySettings" />
      </div>
    </div>

    <!-- 加载状态 -->
    <LoadingOverlay :show="isLoading" :message="t('loading')" />
  </div>
</template>

<script setup lang="ts">
import { addWeeks, format, parseISO, subWeeks } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useHolidays } from '@/composables/useHolidays'
import { useTodoManagement } from '@/composables/useTodoManagement'
import { useTodos } from '@/composables/useTodos'
import { useUIState } from '@/composables/useUIState'
import type { Todo } from '@/types/todo'

import CalendarGrid from './calendar/CalendarGrid.vue'
import CalendarHeader from './calendar/CalendarHeader.vue'
import DayTodosModal from './calendar/DayTodosModal.vue'
import HolidaySettings from './calendar/HolidaySettings.vue'
import LoadingOverlay from './common/LoadingOverlay.vue'
import TodoInput from './TodoInput.vue'

// 国际化
const { t, locale } = useI18n()

// UI 状态
const { isSmallScreen } = useUIState()

// 待办事项管理
const { todos, loadTodos } = useTodos()
const { handleAddTodo, updateTodo, updateTodoText, removeTodo, MAX_TODO_LENGTH } =
  useTodoManagement()

// 节假日管理
const { isHolidayEnabled: _isHolidayEnabled } = useHolidays()

// 日历状态
const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const viewMode = ref<'month' | 'week'>('month')
const showDayModal = ref(false)
const showQuickAdd = ref(false)
const showHolidaySettings = ref(false)
const isLoading = ref(false)

// 计算属性
const dateLocale = computed(() => {
  return locale.value === 'zh' ? zhCN : enUS
})

// 按日期分组的待办事项
const todosByDate = computed(() => {
  const grouped: Record<string, Todo[]> = {}

  todos.value.forEach((todo) => {
    if (todo.dueDate) {
      try {
        // 处理完整的 ISO 字符串或简单的日期字符串
        const date = todo.dueDate.includes('T')
          ? parseISO(todo.dueDate)
          : parseISO(todo.dueDate + 'T00:00:00.000Z')
        const dateKey = format(date, 'yyyy-MM-dd')
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(todo)
      } catch (error) {
        console.warn('Invalid dueDate format:', todo.dueDate, error)
      }
    }
  })

  return grouped
})

// 选中日期的待办事项
const selectedDateTodos = computed(() => {
  if (!selectedDate.value) return []
  const dateKey = format(selectedDate.value, 'yyyy-MM-dd')
  return todosByDate.value[dateKey] || []
})

// 快速添加占位符
const quickAddPlaceholder = computed(() => {
  if (selectedDate.value) {
    const dateStr = format(selectedDate.value, 'MM月dd日', { locale: dateLocale.value })
    return t('addTodoForDate', { date: dateStr })
  }
  return t('addTodo')
})

// 方法
const goToPrevMonth = () => {
  if (viewMode.value === 'week') {
    // 周视图：上一周
    currentDate.value = subWeeks(currentDate.value, 1)
  } else {
    // 月视图：上一月
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() - 1)
    currentDate.value = newDate
  }
}

const goToNextMonth = () => {
  if (viewMode.value === 'week') {
    // 周视图：下一周
    currentDate.value = addWeeks(currentDate.value, 1)
  } else {
    // 月视图：下一月
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() + 1)
    currentDate.value = newDate
  }
}

const goToToday = () => {
  currentDate.value = new Date()
  selectedDate.value = new Date()
}

const handleViewModeChange = (mode: 'month' | 'week') => {
  viewMode.value = mode
}

const handleDateClick = (date: Date) => {
  selectedDate.value = date
  showDayModal.value = true
}

const handleDateHover = (_date: Date) => {
  // 可以在这里添加悬停效果
}

const closeDayModal = () => {
  showDayModal.value = false
  selectedDate.value = null
}

const closeQuickAdd = () => {
  showQuickAdd.value = false
  selectedDate.value = null
}

const closeHolidaySettings = () => {
  showHolidaySettings.value = false
}

const handleQuickAddTodo = async (text: string) => {
  if (!selectedDate.value || !text.trim()) return

  try {
    isLoading.value = true

    // 使用 handleAddTodo 来确保正确的验证和处理，启用 AI 分析
    const result = await handleAddTodo(text.trim(), false) // 不跳过拆分分析，启用 AI 评估

    if (result && !result.needsSplitting) {
      // 如果成功添加，更新其截止日期（使用本地日期避免时区问题）
      const dueDate = format(selectedDate.value, 'yyyy-MM-dd') + 'T00:00:00.000Z'
      // 获取最新添加的待办事项并更新其截止日期
      const latestTodo = todos.value[todos.value.length - 1]
      if (latestTodo) {
        await updateTodo(latestTodo.id, { dueDate })
      }
      // 成功添加后关闭快速添加区域
      closeQuickAdd()
    }
  } catch (error) {
    console.error('Failed to add todo:', error)
  } finally {
    isLoading.value = false
  }
}

const handleAddTodoForDate = async (text: string) => {
  if (!selectedDate.value || !text.trim()) return

  try {
    // 使用 handleAddTodo 来确保正确的验证和处理，启用 AI 分析
    const result = await handleAddTodo(text.trim(), false) // 不跳过拆分分析，启用 AI 评估

    if (result && !result.needsSplitting) {
      // 如果成功添加，更新其截止日期（使用本地日期避免时区问题）
      const dueDate = format(selectedDate.value, 'yyyy-MM-dd') + 'T00:00:00.000Z'
      // 获取最新添加的待办事项并更新其截止日期
      const latestTodo = todos.value[todos.value.length - 1]
      if (latestTodo) {
        await updateTodo(latestTodo.id, { dueDate })
      }
    }
  } catch (error) {
    console.error('Failed to add todo for date:', error)
  }
}

const handleUpdateTodo = async (id: string, updates: Partial<Todo>) => {
  try {
    await updateTodo(id, updates)
  } catch (error) {
    console.error('Failed to update todo:', error)
  }
}

const handleUpdateTodoText = async (id: string, text: string) => {
  try {
    await updateTodoText(id, text)
  } catch (error) {
    console.error('Failed to update todo text:', error)
  }
}

const handleRemoveTodo = async (id: string) => {
  try {
    await removeTodo(id)
  } catch (error) {
    console.error('Failed to remove todo:', error)
  }
}

// 生命周期
onMounted(async () => {
  try {
    isLoading.value = true
    await loadTodos()
  } catch (error) {
    console.error('Failed to load todos:', error)
  } finally {
    isLoading.value = false
  }
})

// 监听路由变化，重置状态
watch(
  () => selectedDate.value,
  (newDate) => {
    if (newDate && !showDayModal.value) {
      showQuickAdd.value = true
    }
  }
)

defineOptions({
  name: 'Calendar',
})
</script>

<style scoped>
.calendar-container {
  @apply w-full max-w-6xl mx-auto p-4 mt-10;
}

.calendar-container.small-screen {
  @apply p-2;
}

.calendar-card {
  @apply bg-card rounded-2xl shadow-lg p-6 backdrop-blur-sm;
  background: var(--card-bg-color);
  box-shadow: var(--card-shadow);
}

.calendar-container.small-screen .calendar-card {
  @apply p-4 rounded-xl;
}

.quick-add-section {
  @apply mt-6 p-4 bg-bg rounded-xl border border-input-border;
}

.quick-add-header {
  @apply flex items-center justify-between mb-3;
}

.quick-add-header h3 {
  @apply text-lg font-medium text-text;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-bg-secondary transition-colors;
  color: var(--text-secondary-color);
}

.close-btn:hover {
  color: var(--text-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-container {
    @apply px-2;
  }

  .calendar-card {
    @apply p-3 rounded-xl;
  }

  .quick-add-section {
    @apply mt-4 p-3;
  }
}

/* 节假日设置弹窗样式 */
.modal-overlay {
  @apply fixed inset-0 z-50;
  @apply flex items-center justify-center p-4;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.modal-container {
  @apply relative z-10;
}
</style>
