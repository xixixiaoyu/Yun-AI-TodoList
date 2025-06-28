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

    <div class="flex-1 space-y-2 pt-2">
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
          <div class="radio-button" :class="{ checked: selectedLanguage === option.value }">
            <div v-if="selectedLanguage === option.value" class="radio-dot" />
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
  @apply p-3 border border-input-border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5;
}

.language-option.active {
  @apply border-primary bg-primary/10;
}

.language-icon {
  @apply w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0;
}

.language-title {
  @apply text-sm font-medium text-text;
}

.language-description {
  @apply text-xs text-text-secondary mt-0.5;
}

.radio-button {
  @apply w-5 h-5 border-2 border-input-border rounded-full flex items-center justify-center transition-all duration-200;
}

.radio-button.checked {
  @apply border-primary bg-primary;
}

.radio-dot {
  @apply w-2 h-2 bg-white rounded-full;
}
</style>
