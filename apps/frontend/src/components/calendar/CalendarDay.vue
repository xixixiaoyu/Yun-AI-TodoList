<template>
  <div
    class="calendar-day"
    :class="[dayClasses, { 'week-view': viewMode === 'week' }]"
    @click="$emit('click')"
    @mouseenter="$emit('hover')"
  >
    <!-- 日期头部 -->
    <div class="day-header">
      <!-- 日期数字 -->
      <div class="day-number">{{ dayNumber }}</div>
      <!-- 节假日图标 - 右上角 -->
      <div v-if="holidays.length > 0" class="holiday-icons">
        <span
          v-for="holiday in displayHolidays.slice(0, 2)"
          :key="holiday.id"
          class="holiday-icon-small"
          :style="getHolidayIconStyle(holiday)"
          :title="getHolidayTooltip(holiday)"
        >
          {{ holiday.icon || '●' }}
        </span>
      </div>
    </div>

    <!-- 节假日名称显示 - 只显示最重要的一个 -->
    <div v-if="holidays.length > 0 && displayHolidays[0]" class="holiday-names">
      <div
        class="holiday-name"
        :class="getHolidayClass(displayHolidays[0])"
        :style="getHolidayStyle(displayHolidays[0])"
        :title="getHolidayTooltip(displayHolidays[0])"
      >
        <span class="holiday-text">{{ getHolidayDisplayName(displayHolidays[0]) }}</span>
      </div>
    </div>

    <!-- 待办事项指示器 -->
    <div v-if="todoCount > 0" class="todo-indicators">
      <!-- 待办事项数量徽章 -->
      <div class="todo-badge">
        <span class="todo-count">{{ todoCount }}</span>
      </div>

      <!-- 小圆点指示器 -->
      <div class="todo-dots">
        <div
          v-for="i in Math.min(todoCount, 3)"
          :key="i"
          class="todo-dot"
          :class="getDotClass(i - 1)"
        ></div>
        <div v-if="todoCount > 3" class="more-indicator">+{{ todoCount - 3 }}</div>
      </div>

      <!-- 完成进度条 -->
      <div v-if="todoCount > 0" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${completionPercentage}%` }"></div>
      </div>
    </div>

    <!-- 今日标记 -->
    <div v-if="isToday" class="today-marker"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { Todo } from '@/types/todo'
import type { Holiday } from '@/types/holiday'
import { useHolidays } from '@/composables/useHolidays'

// Props
interface Props {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  todos: Todo[]
  todoCount: number
  completedCount: number
  viewMode?: 'month' | 'week'
}

const props = defineProps<Props>()

// Events
defineEmits<{
  click: []
  hover: []
}>()

// 使用节假日功能
const { getHolidaysForDate, getHolidayName, isHolidayEnabled } = useHolidays()

// 计算属性
const dayNumber = computed(() => {
  return format(props.date, 'd')
})

const completionPercentage = computed(() => {
  if (props.todoCount === 0) return 0
  return Math.round((props.completedCount / props.todoCount) * 100)
})

// 获取当前日期的节假日
const holidays = computed(() => {
  if (!isHolidayEnabled.value) return []
  return getHolidaysForDate(props.date)
})

// 显示的节假日（最多显示3个）
const displayHolidays = computed(() => {
  return holidays.value.slice(0, 3)
})

const dayClasses = computed(() => {
  return {
    'current-month': props.isCurrentMonth,
    'other-month': !props.isCurrentMonth,
    today: props.isToday,
    selected: props.isSelected,
    'has-todos': props.todoCount > 0,
    'all-completed': props.todoCount > 0 && props.completedCount === props.todoCount,
    'has-holidays': holidays.value.length > 0,
    'legal-holiday': holidays.value.some((h) => h.type === 'legal' && h.isOfficial),
  }
})

// 方法
const getDotClass = (index: number) => {
  const todo = props.todos[index]
  if (!todo) return ''

  return {
    completed: todo.completed,
    'high-priority': todo.priority && todo.priority >= 4,
    'medium-priority': todo.priority && todo.priority === 3,
    'low-priority': todo.priority && todo.priority <= 2,
  }
}

// 节假日相关方法
const getHolidayClass = (holiday: Holiday) => {
  return {
    'legal-holiday-indicator': holiday.type === 'legal',
    'traditional-holiday-indicator': holiday.type === 'traditional',
    'international-holiday-indicator': holiday.type === 'international',
    'custom-holiday-indicator': holiday.type === 'custom',
    'high-importance': holiday.importance === 'high',
    'medium-importance': holiday.importance === 'medium',
    'low-importance': holiday.importance === 'low',
  }
}

const getHolidayTooltip = (holiday: Holiday) => {
  const name = getHolidayName(holiday)
  return holiday.description ? `${name} - ${holiday.description}` : name
}

const getHolidayDisplayName = (holiday: Holiday) => {
  const name = getHolidayName(holiday)
  // 对于较长的节假日名称，进行简化显示
  if (name.length > 4) {
    return name.substring(0, 3) + '...'
  }
  return name
}

const getHolidayStyle = (holiday: Holiday) => {
  // 如果是自定义节假日且有颜色，使用自定义颜色
  if (holiday.type === 'custom' && holiday.color) {
    return {
      backgroundColor: holiday.color,
    }
  }
  return {}
}

const getHolidayIconStyle = (holiday: Holiday) => {
  // 如果是自定义节假日且有颜色，且没有图标，使用自定义颜色
  if (holiday.type === 'custom' && holiday.color && !holiday.icon) {
    return {
      color: holiday.color,
    }
  }
  return {}
}

defineOptions({
  name: 'CalendarDay',
})
</script>

<style scoped>
.calendar-day {
  @apply relative p-2 min-h-[80px] bg-card rounded-lg border border-input-border;
  @apply cursor-pointer transition-all duration-200;
  @apply hover:shadow-md hover:scale-105;
}

/* 周视图样式 */
.calendar-day.week-view {
  @apply min-h-[120px] p-4;
}

.calendar-day:hover {
  @apply border-primary;
  transform: translateY(-2px);
}

.calendar-day.selected {
  @apply bg-primary/10 border-primary shadow-lg;
}

.calendar-day.today {
  @apply bg-primary/5 border-primary/50;
}

.calendar-day.other-month {
  @apply opacity-40;
}

.calendar-day.other-month .day-number {
  @apply text-text-secondary;
}

/* 日期头部布局 */
.day-header {
  @apply flex items-start justify-between w-full mb-1;
}

.day-number {
  @apply text-lg font-semibold text-text;
}

/* 节假日图标 - 右上角 */
.holiday-icons {
  @apply flex gap-0.5;
}

.holiday-icon-small {
  @apply text-xs leading-none;
}

/* 旧的节假日指示器样式已移除，使用新的布局 */

/* 法定节假日日期样式 */
.calendar-day.legal-holiday {
  @apply bg-red-50 border-red-200;
}

.calendar-day.legal-holiday .day-number {
  @apply text-red-600 font-bold;
}

/* 节假日名称显示 */
.holiday-names {
  @apply mt-auto;
}

.holiday-name {
  @apply text-xs px-1 py-0.5 rounded text-center;
  @apply bg-opacity-90 text-white font-medium;
  @apply shadow-sm border border-white/20;
  font-size: 9px;
  line-height: 1.1;
  max-width: 100%;
}

.legal-holiday-indicator.holiday-name {
  @apply bg-red-500;
}

.traditional-holiday-indicator.holiday-name {
  @apply bg-orange-500;
}

.international-holiday-indicator.holiday-name {
  @apply bg-blue-500;
}

/* 自定义节假日颜色由内联样式控制，不使用固定颜色 */
.custom-holiday-indicator.holiday-name:not([style*='background-color']) {
  @apply bg-purple-500;
}

.holiday-text {
  @apply block truncate;
}

.calendar-day.today .day-number {
  @apply text-primary font-bold;
}

.calendar-day.selected .day-number {
  @apply text-primary;
}

.todo-indicators {
  @apply space-y-1 relative;
}

.todo-badge {
  @apply absolute -top-1 -right-1 z-10;
  @apply bg-primary text-white text-xs font-bold;
  @apply w-5 h-5 rounded-full flex items-center justify-center;
  @apply shadow-sm border-2 border-white;
}

.todo-count {
  @apply leading-none;
}

.todo-dots {
  @apply flex items-center gap-1 flex-wrap mt-1;
}

.todo-dot {
  @apply w-3 h-3 rounded-full;
  @apply bg-text-secondary shadow-sm;
}

.todo-dot.completed {
  @apply bg-green-500;
}

.todo-dot.high-priority {
  @apply bg-red-500;
}

.todo-dot.medium-priority {
  @apply bg-yellow-500;
}

.todo-dot.low-priority {
  @apply bg-blue-500;
}

.more-indicator {
  @apply text-xs text-text-secondary font-medium;
}

.progress-bar {
  @apply w-full h-1.5 bg-bg rounded-full overflow-hidden mt-1;
  @apply shadow-inner;
}

.progress-fill {
  @apply h-full bg-primary transition-all duration-300;
  @apply shadow-sm;
}

.calendar-day.all-completed .progress-fill {
  @apply bg-green-500;
}

.today-marker {
  @apply absolute top-1 right-1 w-2 h-2 bg-primary rounded-full;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-day {
    @apply p-1.5 min-h-[60px];
  }

  .day-number {
    @apply text-base mb-0.5;
  }

  .todo-dot {
    @apply w-1.5 h-1.5;
  }

  .more-indicator {
    @apply text-xs;
  }

  .today-marker {
    @apply w-1.5 h-1.5;
  }

  .holiday-indicators {
    @apply gap-0.5;
  }

  .holiday-icon {
    font-size: 8px;
  }

  .holiday-dot {
    @apply w-1.5 h-1.5;
  }

  .high-importance .holiday-dot {
    @apply w-2 h-2;
  }

  .medium-importance .holiday-dot {
    @apply w-1.5 h-1.5;
  }

  .low-importance .holiday-dot {
    @apply w-1 h-1;
  }

  .holiday-name {
    font-size: 8px;
    @apply px-0.5 py-0;
  }
}

@media (max-width: 480px) {
  .calendar-day {
    @apply p-1 min-h-[50px];
  }

  .day-number {
    @apply text-sm;
  }

  .todo-dot {
    @apply w-1 h-1;
  }

  .more-indicator {
    @apply text-xs;
  }

  .holiday-icon {
    font-size: 6px;
  }

  .holiday-dot {
    @apply w-1 h-1;
  }

  .high-importance .holiday-dot {
    @apply w-1.5 h-1.5;
  }

  .medium-importance .holiday-dot {
    @apply w-1 h-1;
  }

  .low-importance .holiday-dot {
    @apply w-0.5 h-0.5;
  }

  .holiday-name {
    font-size: 6px;
    @apply px-0.5 py-0;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .calendar-day {
  @apply bg-card border-border;
}

[data-theme='dark'] .calendar-day:hover {
  @apply border-primary;
}

[data-theme='dark'] .calendar-day.today {
  @apply bg-primary/10 border-primary/50;
}

[data-theme='dark'] .calendar-day.selected {
  @apply bg-primary/15 border-primary;
}

[data-theme='dark'] .progress-bar {
  @apply bg-bg-secondary;
}

/* 深色主题节假日样式 */
[data-theme='dark'] .calendar-day.legal-holiday {
  @apply bg-red-900/20 border-red-700/50;
}

[data-theme='dark'] .calendar-day.legal-holiday .day-number {
  @apply text-red-400;
}

[data-theme='dark'] .holiday-dot {
  @apply border-gray-700;
}

[data-theme='dark'] .legal-holiday-indicator .holiday-dot {
  @apply ring-red-600/50;
}

[data-theme='dark'] .traditional-holiday-indicator .holiday-dot {
  @apply ring-orange-600/50;
}

[data-theme='dark'] .international-holiday-indicator .holiday-dot {
  @apply ring-blue-600/50;
}

[data-theme='dark'] .custom-holiday-indicator .holiday-dot {
  @apply ring-purple-600/50;
}

/* 深色主题节假日名称样式 */
[data-theme='dark'] .holiday-name {
  @apply border-gray-600/30;
}

[data-theme='dark'] .legal-holiday-indicator.holiday-name {
  @apply bg-red-600;
}

[data-theme='dark'] .traditional-holiday-indicator.holiday-name {
  @apply bg-orange-600;
}

[data-theme='dark'] .international-holiday-indicator.holiday-name {
  @apply bg-blue-600;
}

/* 深色主题自定义节假日颜色由内联样式控制 */
[data-theme='dark'] .custom-holiday-indicator.holiday-name:not([style*='background-color']) {
  @apply bg-purple-600;
}

/* 动画效果 */
.calendar-day {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-day:hover {
  transform: translateY(-1px) scale(1.02);
}

.calendar-day:active {
  transform: translateY(0) scale(0.98);
}

.progress-fill {
  transition: width 0.3s ease-in-out;
}

.todo-dot {
  transition: all 0.2s ease-in-out;
}

.todo-dot:hover {
  transform: scale(1.2);
}
</style>
