<template>
  <div class="enhanced-prompt-selector">
    <div class="template-selector-section">
      <label class="selector-label">{{ t('systemPrompt') }}</label>
      <div class="selector-wrapper">
        <PromptTemplateSelector
          :selected-template="selectedTemplate"
          :filtered-custom-prompts="filteredCustomPrompts"
          @template-change="handleTemplateChange"
        />

        <PromptActionButtons
          :is-custom-prompt="isCustomPrompt"
          :current-prompt="currentPrompt"
          @duplicate-prompt="$emit('duplicatePrompt')"
          @toggle-favorite="toggleFavorite"
          @confirm-delete-prompt="$emit('confirmDeletePrompt')"
          @show-add-prompt="$emit('showAddPrompt')"
        />
      </div>
    </div>

    <PromptInfoDisplay
      v-if="currentPrompt || isBuiltinPrompt"
      :current-prompt="currentPrompt"
      :current-prompt-name="currentPromptName"
      :current-prompt-description="currentPromptDescription"
      :is-builtin-prompt="isBuiltinPrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CustomPrompt, PromptTemplate } from '../../types/settings'
import { builtinPromptTemplates } from '../../config/prompts'
import PromptTemplateSelector from './components/PromptTemplateSelector.vue'
import PromptActionButtons from './components/PromptActionButtons.vue'
import PromptInfoDisplay from './components/PromptInfoDisplay.vue'

interface Props {
  selectedTemplate: PromptTemplate
  customPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'update:selectedTemplate', value: PromptTemplate): void
  (e: 'templateChange'): void
  (e: 'duplicatePrompt'): void
  (e: 'toggleFavorite', promptId: string): void
  (e: 'confirmDeletePrompt'): void
  (e: 'showAddPrompt'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const filteredCustomPrompts = computed(() => {
  return props.customPrompts.filter(prompt => prompt.isActive)
})

const isCustomPrompt = computed(() => {
  return props.selectedTemplate.startsWith('custom_')
})

const isBuiltinPrompt = computed(() => {
  return !!builtinPromptTemplates[props.selectedTemplate]
})

const currentPrompt = computed(() => {
  return props.customPrompts.find(p => p.id === props.selectedTemplate)
})

const currentPromptName = computed(() => {
  if (isBuiltinPrompt.value) {
    return builtinPromptTemplates[props.selectedTemplate]?.name || ''
  }
  return currentPrompt.value?.name || ''
})

const currentPromptDescription = computed(() => {
  if (isBuiltinPrompt.value) {
    return builtinPromptTemplates[props.selectedTemplate]?.description || ''
  }
  return currentPrompt.value?.description || ''
})

const handleTemplateChange = (newTemplate: PromptTemplate) => {
  emit('update:selectedTemplate', newTemplate)
  emit('templateChange')
}

const toggleFavorite = () => {
  if (currentPrompt.value) {
    emit('toggleFavorite', currentPrompt.value.id)
  }
}

defineOptions({
  name: 'EnhancedPromptTemplateSelector'
})
</script>

<style scoped>
.enhanced-prompt-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-selector-section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.selector-label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.8rem;
}

.selector-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .selector-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 0.375rem;
  }
}
</style>
