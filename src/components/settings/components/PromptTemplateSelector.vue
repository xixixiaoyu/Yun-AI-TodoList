<template>
  <select :value="selectedTemplate" class="template-select" @change="handleTemplateChange">
    <optgroup :label="t('builtinPrompts')">
      <option value="none">{{ t('nonePrompt') }}</option>
    </optgroup>

    <optgroup v-if="filteredCustomPrompts.length > 0" :label="t('customPrompts')">
      <option
        v-for="prompt in filteredCustomPrompts"
        :key="prompt.id"
        :value="prompt.id"
        :disabled="!prompt.isActive"
      >
        {{ prompt.name }}
        <span v-if="prompt.isFavorite">⭐</span>
        <span v-if="!prompt.isActive">({{ t('promptInactive') }})</span>
      </option>
    </optgroup>
  </select>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CustomPrompt, PromptTemplate } from '../../../types/settings'

interface Props {
  selectedTemplate: PromptTemplate
  filteredCustomPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'templateChange', value: PromptTemplate): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

/**
 * 处理模板变更
 */
const handleTemplateChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newTemplate = target.value as PromptTemplate
  emit('templateChange', newTemplate)
}

defineOptions({
  name: 'PromptTemplateSelector'
})
</script>

<style scoped>
.template-select {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--input-border-color);
  background-color: var(--card-bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.template-select:hover {
  border-color: var(--button-bg-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.template-select:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
  transform: translateY(-1px);
}

.template-select option {
  padding: 0.5rem;
  font-weight: 500;
}

.template-select optgroup {
  font-weight: 600;
  color: var(--text-secondary-color);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .template-select {
    padding: 0.625rem 2rem 0.625rem 0.875rem;
    font-size: 0.8rem;
    background-size: 16px;
    background-position: right 0.625rem center;
  }
}
</style>
