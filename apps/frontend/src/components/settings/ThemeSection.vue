<template>
  <div class="flex flex-col h-full">
    <div class="mb-4">
      <div class="flex items-center gap-3 mb-1">
        <div
          class="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg"
        >
          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 18.5A6.5 6.5 0 1 1 18.5 12A6.51 6.51 0 0 1 12 18.5zM12 2a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V3A1 1 0 0 0 12 2zM21 11H18a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2zM6 11H3a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2zM6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0 0-1.41zM17 8.14a1 1 0 0 0 .69-.28l1.44-1.39A1 1 0 0 0 17.78 5l-1.44 1.42a1 1 0 0 0 0 1.41A1 1 0 0 0 17 8.14zM12 22a1 1 0 0 0 1-1V18a1 1 0 0 0-2 0v3A1 1 0 0 0 12 22zM5.64 17.36a1 1 0 0 0 .7.3 1 1 0 0 0 .71-.3 1 1 0 0 0 0-1.41L5.64 14.5a1 1 0 0 0-1.41 1.41zM18.36 17.36l1.41-1.41a1 1 0 0 0-1.41-1.41l-1.41 1.41a1 1 0 0 0 0 1.41 1 1 0 0 0 .7.3A1 1 0 0 0 18.36 17.36z"
            />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-text">
          {{ t('themeConfiguration') }}
        </h3>
      </div>
      <p class="text-xs text-text-secondary leading-snug">
        {{ t('themeConfigurationDescription') }}
      </p>
    </div>

    <div class="flex-1 space-y-1">
      <div
        v-for="option in themeOptions"
        :key="option.value"
        class="theme-option"
        :class="{ active: selectedTheme === option.value }"
        @click="selectTheme(option.value)"
      >
        <div class="flex items-center gap-3">
          <div class="theme-icon">
            <component :is="option.icon" class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <div class="theme-title">{{ option.label }}</div>
            <div class="theme-description">{{ option.description }}</div>
            <div v-if="option.value === 'auto'" class="current-theme-info">
              {{ t('currentTheme') }}: {{ getCurrentThemeLabel() }}
            </div>
          </div>
          <div v-if="selectedTheme === option.value" class="selected-indicator">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
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
  @apply px-4 py-2.5 rounded-md cursor-pointer transition-all duration-200;
  background: transparent;
  border: 1px solid transparent;
}

.theme-option:hover {
  background: var(--settings-primary-ultra-light);
  border-color: var(--settings-primary-ultra-light);
  box-shadow: 0 1px 3px rgba(121, 180, 166, 0.06);
}

.theme-option.active {
  background: var(--settings-primary-soft);
  border-color: var(--settings-primary-medium);
}

.theme-icon {
  @apply w-10 h-10 text-white rounded-lg flex items-center justify-center flex-shrink-0;
  background: var(--settings-primary);
}

.theme-title {
  @apply text-sm font-medium text-text;
}

.theme-description {
  @apply text-xs text-text-secondary mt-0.5;
}

.current-theme-info {
  @apply text-xs text-text-secondary mt-0.5 italic;
}

.selected-indicator {
  @apply flex items-center justify-center;
  color: var(--settings-primary);
}
</style>
