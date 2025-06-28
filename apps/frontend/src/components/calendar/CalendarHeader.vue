<template>
  <div class="calendar-header">
    <!-- 主要导航区域 -->
    <div class="header-main">
      <!-- 月份年份显示 -->
      <div class="date-display">
        <h1 class="current-month">
          {{ formattedCurrentMonth }}
        </h1>
        <div class="current-year">
          {{ currentYear }}
        </div>
      </div>

      <!-- 导航按钮 -->
      <div class="navigation-buttons">
        <button
          class="nav-btn"
          :title="viewMode === 'week' ? t('previousWeek') : t('previousMonth')"
          @click="$emit('prevMonth')"
        >
          <i class="i-carbon-chevron-left"></i>
        </button>

        <button class="nav-btn today-btn" :title="t('goToToday')" @click="$emit('today')">
          {{ t('today') }}
        </button>

        <button
          class="nav-btn"
          :title="viewMode === 'week' ? t('nextWeek') : t('nextMonth')"
          @click="$emit('nextMonth')"
        >
          <i class="i-carbon-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 视图模式切换和其他控件 -->
    <div class="header-controls">
      <!-- 视图模式切换 -->
      <div class="view-mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: viewMode === 'month' }"
          @click="$emit('viewModeChange', 'month')"
        >
          {{ t('monthView') }}
        </button>
        <button
          class="mode-btn"
          :class="{ active: viewMode === 'week' }"
          @click="$emit('viewModeChange', 'week')"
        >
          {{ t('weekView') }}
        </button>
      </div>

      <!-- 其他控件 -->
      <div class="additional-controls">
        <!-- 节假日设置按钮 -->
        <button
          class="control-btn holiday-settings-btn"
          :title="t('holidaySettings')"
          @click="$emit('holidaySettings')"
        >
          <i class="i-carbon-calendar-settings"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

// Props
interface Props {
  currentDate: Date
  viewMode: 'month' | 'week'
}

const props = defineProps<Props>()

// Events
defineEmits<{
  prevMonth: []
  nextMonth: []
  today: []
  viewModeChange: [mode: 'month' | 'week']
  holidaySettings: []
}>()

// 国际化
const { t, locale } = useI18n()

// 计算属性
const dateLocale = computed(() => {
  return locale.value === 'zh' ? zhCN : enUS
})

const formattedCurrentMonth = computed(() => {
  return format(props.currentDate, 'MMMM', { locale: dateLocale.value })
})

const currentYear = computed(() => {
  return format(props.currentDate, 'yyyy')
})

defineOptions({
  name: 'CalendarHeader',
})
</script>

<style scoped>
.calendar-header {
  @apply mb-6;
}

.header-main {
  @apply flex items-center justify-between mb-4;
}

.date-display {
  @apply flex items-baseline gap-3;
}

.current-month {
  @apply text-3xl font-bold text-text;
}

.current-year {
  @apply text-xl text-text-secondary;
}

.navigation-buttons {
  @apply flex items-center gap-2;
}

.nav-btn {
  @apply p-3 rounded-xl transition-all duration-200 flex items-center justify-center;
  @apply bg-bg hover:bg-bg-secondary border border-input-border;
  @apply text-text hover:text-primary;
  min-width: 44px;
  min-height: 44px;
}

.nav-btn:hover {
  @apply transform scale-105 shadow-md;
  border-color: var(--primary-color);
}

.today-btn {
  @apply px-4 font-medium;
  min-width: auto;
}

.header-controls {
  @apply flex items-center justify-between;
}

.view-mode-toggle {
  @apply flex bg-bg rounded-xl p-1 border border-input-border;
}

.mode-btn {
  @apply px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium;
  @apply text-text-secondary hover:text-text;
}

.mode-btn.active {
  @apply bg-primary text-white shadow-sm;
}

.mode-btn:not(.active):hover {
  @apply bg-bg-secondary;
}

.additional-controls {
  @apply flex items-center gap-2;
}

.control-btn {
  @apply p-2 rounded-lg border border-input-border bg-card;
  @apply text-text-secondary hover:text-text hover:bg-bg-secondary;
  @apply transition-all duration-200;
  min-width: 40px;
  min-height: 40px;
}

.control-btn:hover {
  @apply shadow-md transform scale-105;
}

.holiday-settings-btn {
  @apply relative;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-header {
    @apply mb-4;
  }

  .header-main {
    @apply flex-col gap-4 mb-3;
  }

  .date-display {
    @apply flex-col gap-1 text-center;
  }

  .current-month {
    @apply text-2xl;
  }

  .current-year {
    @apply text-lg;
  }

  .navigation-buttons {
    @apply gap-3;
  }

  .nav-btn {
    @apply p-2;
    min-width: 40px;
    min-height: 40px;
  }

  .today-btn {
    @apply px-6;
  }

  .header-controls {
    @apply flex-col gap-3;
  }

  .view-mode-toggle {
    @apply w-full;
  }

  .mode-btn {
    @apply flex-1 text-center;
  }
}

@media (max-width: 480px) {
  .current-month {
    @apply text-xl;
  }

  .current-year {
    @apply text-base;
  }

  .nav-btn {
    min-width: 36px;
    min-height: 36px;
  }

  .today-btn {
    @apply px-4 text-sm;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .nav-btn {
  @apply bg-card border-border;
}

[data-theme='dark'] .nav-btn:hover {
  @apply bg-bg-secondary;
}

[data-theme='dark'] .view-mode-toggle {
  @apply bg-card border-border;
}

[data-theme='dark'] .mode-btn:not(.active):hover {
  @apply bg-bg-secondary;
}
</style>
