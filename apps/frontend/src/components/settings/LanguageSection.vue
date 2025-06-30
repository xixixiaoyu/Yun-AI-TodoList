<template>
  <div class="settings-section">
    <div class="section-header">
      <div class="section-icon">
        <i class="i-carbon-language text-lg"></i>
      </div>
      <div class="section-info">
        <h3 class="section-title">{{ t('language') }}</h3>
        <p class="section-description">{{ t('languageDescription') }}</p>
      </div>
    </div>

    <div class="flex-1 space-y-1 pt-2">
      <div
        v-for="option in languageOptions"
        :key="option.value"
        class="language-option"
        :class="{ active: selectedLanguage === option.value }"
        @click="selectLanguage(option.value)"
      >
        <div class="flex items-center gap-3">
          <div class="language-icon">
            <component :is="option.icon" class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <div class="language-title">{{ option.label }}</div>
            <div class="language-description">{{ option.description }}</div>
          </div>
          <div v-if="selectedLanguage === option.value" class="selected-indicator">
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '../../i18n'

// 语言图标组件
const ChineseIcon = () => h('span', { class: 'text-sm font-bold' }, '中')
const EnglishIcon = () => h('span', { class: 'text-sm font-bold' }, 'EN')

const { locale, t } = useI18n()

const selectedLanguage = computed({
  get: () => locale.value,
  set: (value: string) => {
    setLanguage(value as 'zh' | 'en')
  },
})

const languageOptions = computed(() => [
  {
    value: 'zh',
    label: '中文',
    description: t('chineseDescription'),
    icon: ChineseIcon,
  },
  {
    value: 'en',
    label: 'English',
    description: t('englishDescription'),
    icon: EnglishIcon,
  },
])

const selectLanguage = (languageValue: string) => {
  selectedLanguage.value = languageValue
}

defineOptions({
  name: 'LanguageSection',
})
</script>

<style scoped>
.language-option {
  @apply px-4 py-2.5 rounded-md cursor-pointer transition-all duration-200;
  background: transparent;
  border: 1px solid transparent;
}

.language-option:hover {
  background: var(--settings-primary-ultra-light);
  border-color: var(--settings-primary-ultra-light);
  box-shadow: 0 1px 3px rgba(121, 180, 166, 0.06);
}

.language-option.active {
  background: var(--settings-primary-soft);
  border-color: var(--settings-primary-medium);
}

.language-icon {
  @apply w-10 h-10 text-white rounded-lg flex items-center justify-center flex-shrink-0;
  background: var(--settings-primary);
}

.language-title {
  @apply text-sm font-medium text-text;
}

.language-description {
  @apply text-xs text-text-secondary mt-0.5;
}

.selected-indicator {
  @apply flex items-center justify-center;
  color: var(--settings-primary);
}
</style>
