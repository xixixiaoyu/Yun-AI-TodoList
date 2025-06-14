<template>
  <div class="prompt-template-selector">
    <select :value="selectedTemplate" @change="handleTemplateChange">
      <option value="none">{{ t('nonePrompt') }}</option>
      <option value="my">{{ t('defaultPrompt') }}</option>

      <optgroup v-if="customPrompts.length > 0" :label="t('customPrompts')">
        <option v-for="prompt in customPrompts" :key="prompt.id" :value="prompt.id">
          {{ prompt.name }}
        </option>
      </optgroup>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CustomPrompt, PromptTemplate } from '../../types/settings'

interface Props {
  selectedTemplate: PromptTemplate
  customPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'update:selectedTemplate', value: PromptTemplate): void
  (e: 'templateChange'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

/**
 * 处理模板选择变更
 */
const handleTemplateChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newTemplate = target.value as PromptTemplate
  emit('update:selectedTemplate', newTemplate)
  emit('templateChange')
}

defineOptions({
  name: 'PromptTemplateSelector',
})
</script>

<style scoped>
.prompt-template-selector select {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--input-border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  min-width: 200px;
}

.prompt-template-selector select:hover {
  border-color: var(--button-bg-color);
}

.prompt-template-selector select:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

@media (max-width: 768px) {
  .prompt-template-selector {
    width: 100%;
  }

  .prompt-template-selector select {
    width: 100%;
    min-width: unset;
  }
}
</style>
