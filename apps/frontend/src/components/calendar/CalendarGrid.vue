<template>
  <div class="calendar-grid" :class="{ 'week-view': viewMode === 'week' }">
    <!-- 星期标题 -->
    <div class="weekdays-header">
      <div v-for="weekday in weekdays" :key="weekday" class="weekday-cell">
        {{ weekday }}
      </div>
    </div>

    <!-- 日期网格 -->
    <div class="dates-grid" :class="{ 'week-grid': viewMode === 'week' }">
      <CalendarDay
        v-for="day in calendarDays"
        :key="day.dateKey"
        :date="day.date"
        :is-current-month="day.isCurrentMonth"
        :is-today="day.isToday"
        :is-selected="day.isSelected"
        :todos="day.todos"
        :todo-count="day.todoCount"
        :completed-count="day.completedCount"
        :view-mode="viewMode"
        @click="handleDayClick(day.date)"
        @hover="handleDayHover(day.date)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

import type { Todo } from '@/types/todo'
import CalendarDay from './CalendarDay.vue'

// Props
interface Props {
  currentDate: Date
  selectedDate: Date | null
  todosByDate: Record<string, Todo[]>
  viewMode: 'month' | 'week'
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  dateClick: [date: Date]
  dateHover: [date: Date]
}>()

// 国际化
const { locale } = useI18n()

// 计算属性
const dateLocale = computed(() => {
  return locale.value === 'zh' ? zhCN : enUS
})

// 星期标题
const weekdays = computed(() => {
  const days = []
  const startDate = startOfWeek(new Date(), { locale: dateLocale.value })

  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + i)
    days.push(format(day, 'EEE', { locale: dateLocale.value }))
  }

  return days
})

// 日历天数数据
const calendarDays = computed(() => {
  let calendarStart: Date
  let calendarEnd: Date

  if (props.viewMode === 'week') {
    // 周视图：显示当前日期所在的周
    calendarStart = startOfWeek(props.currentDate, { locale: dateLocale.value })
    calendarEnd = endOfWeek(props.currentDate, { locale: dateLocale.value })
  } else {
    // 月视图：显示整个月
    const monthStart = startOfMonth(props.currentDate)
    const monthEnd = endOfMonth(props.currentDate)
    calendarStart = startOfWeek(monthStart, { locale: dateLocale.value })
    calendarEnd = endOfWeek(monthEnd, { locale: dateLocale.value })
  }

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  return days.map((date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayTodos = props.todosByDate[dateKey] || []
    const completedTodos = dayTodos.filter((todo) => todo.completed)

    return {
      date,
      dateKey,
      isCurrentMonth: props.viewMode === 'week' ? true : isSameMonth(date, props.currentDate),
      isToday: isToday(date),
      isSelected: props.selectedDate ? isSameDay(date, props.selectedDate) : false,
      todos: dayTodos,
      todoCount: dayTodos.length,
      completedCount: completedTodos.length,
    }
  })
})

// 方法
const handleDayClick = (date: Date) => {
  emit('dateClick', date)
}

const handleDayHover = (date: Date) => {
  emit('dateHover', date)
}

defineOptions({
  name: 'CalendarGrid',
})
</script>

<style scoped>
.calendar-grid {
  @apply w-full;
}

.weekdays-header {
  @apply grid grid-cols-7 gap-1 mb-2;
}

.weekday-cell {
  @apply p-3 text-center text-sm font-medium text-text-secondary;
  @apply bg-bg rounded-lg;
}

.dates-grid {
  @apply grid grid-cols-7 gap-1;
}

.dates-grid.week-grid {
  @apply gap-2;
}

/* 周视图样式 */
.calendar-grid.week-view .weekday-cell {
  @apply p-4 text-base font-semibold;
}

.calendar-grid.week-view .dates-grid {
  @apply gap-3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .weekdays-header {
    @apply gap-0.5 mb-1;
  }

  .weekday-cell {
    @apply p-2 text-xs;
  }

  .dates-grid {
    @apply gap-0.5;
  }
}

@media (max-width: 480px) {
  .weekday-cell {
    @apply p-1.5 text-xs;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .weekday-cell {
  @apply bg-card;
}
</style>
