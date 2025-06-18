<template>
  <div class="flex flex-col h-full">
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg"
        >
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 18.5A6.5 6.5 0 1 1 18.5 12A6.51 6.51 0 0 1 12 18.5zM12 2a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V3A1 1 0 0 0 12 2zM21 11H18a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2zM6 11H3a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2zM6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0 0-1.41zM17 8.14a1 1 0 0 0 .69-.28l1.44-1.39A1 1 0 0 0 17.78 5l-1.44 1.42a1 1 0 0 0 0 1.41A1 1 0 0 0 17 8.14zM12 22a1 1 0 0 0 1-1V18a1 1 0 0 0-2 0v3A1 1 0 0 0 12 22zM5.64 17.36a1 1 0 0 0 .7.3 1 1 0 0 0 .71-.3 1 1 0 0 0 0-1.41L5.64 14.5a1 1 0 0 0-1.41 1.41zM18.36 17.36l1.41-1.41a1 1 0 0 0-1.41-1.41l-1.41 1.41a1 1 0 0 0 0 1.41 1 1 0 0 0 .7.3A1 1 0 0 0 18.36 17.36z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-text">
          {{ t('themeConfiguration') }}
        </h3>
      </div>
      <p class="text-sm text-text-secondary leading-relaxed">
        {{ t('themeConfigurationDescription') }}
      </p>
    </div>

    <div class="flex-1 space-y-3">
      <div
        v-for="option in themeOptions"
        :key="option.value"
        class="theme-option"
        :class="{ active: selectedTheme === option.value }"
        @click="selectTheme(option.value)"
      >
        <div class="flex items-center gap-4">
          <div class="theme-icon">
            <component :is="option.icon" class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <div class="theme-title">{{ option.label }}</div>
            <div class="theme-description">{{ option.description }}</div>
            <div v-if="option.value === 'auto'" class="current-theme-info">
              {{ t('currentTheme') }}: {{ getCurrentThemeLabel() }}
            </div>
          </div>
          <div class="radio-button" :class="{ checked: selectedTheme === option.value }">
            <div v-if="selectedTheme === option.value" class="radio-dot" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '../../composables/useTheme'
import type { ThemeValue } from '../../types/theme'

const SunIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [
      h('circle', { cx: '12', cy: '12', r: '5' }),
      h('path', {
        d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
      }),
    ]
  )

const MoonIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [h('path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })]
  )

const AutoIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [
      h('rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }),
      h('line', { x1: '8', y1: '21', x2: '16', y2: '21' }),
      h('line', { x1: '12', y1: '17', x2: '12', y2: '21' }),
    ]
  )

const { t } = useI18n()
const { theme, systemTheme } = useTheme()

const selectedTheme = computed({
  get: () => theme.value,
  set: (value: ThemeValue) => {
    theme.value = value
  },
})

const themeOptions = computed(() => [
  {
    value: 'light' as ThemeValue,
    label: t('lightTheme'),
    description: t('lightThemeDescription'),
    icon: SunIcon,
  },
  {
    value: 'dark' as ThemeValue,
    label: t('darkTheme'),
    description: t('darkThemeDescription'),
    icon: MoonIcon,
  },
  {
    value: 'auto' as ThemeValue,
    label: t('autoTheme'),
    description: t('autoThemeDescription'),
    icon: AutoIcon,
  },
])

const selectTheme = (themeValue: ThemeValue) => {
  selectedTheme.value = themeValue
}

const getCurrentThemeLabel = () => {
  const currentTheme = systemTheme.value
  return currentTheme === 'light' ? t('lightTheme') : t('darkTheme')
}

defineOptions({
  name: 'ThemeSection',
})
</script>

<style scoped>
.theme-option {
  @apply p-4 border border-input-border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5;
}

.theme-option.active {
  @apply border-primary bg-primary/10;
}

.theme-icon {
  @apply w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0;
}

.theme-title {
  @apply text-base font-medium text-text;
}

.theme-description {
  @apply text-sm text-text-secondary mt-1;
}

.current-theme-info {
  @apply text-xs text-text-secondary mt-1 italic;
}

.radio-button {
  @apply w-5 h-5 border-2 border-input-border rounded-full flex items-center justify-center transition-all duration-200;
}

.radio-button.checked {
  @apply border-primary;
}

.radio-dot {
  @apply w-2.5 h-2.5 bg-primary rounded-full;
}
</style>
