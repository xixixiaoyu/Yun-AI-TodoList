<template>
  <div class="enhanced-prompt-selector">
    <!-- 选择器区域 -->
    <div class="selector-section">
      <div class="selector-header">
        <label class="selector-label">{{ t('currentPrompt') }}</label>
        <div class="selector-actions">
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

      <div class="selector-wrapper">
        <PromptTemplateSelector
          :selected-template="selectedTemplate"
          :filtered-custom-prompts="filteredCustomPrompts"
          @template-change="handleTemplateChange"
        />
      </div>
    </div>

    <!-- 信息展示区域 -->
    <div v-if="currentPrompt || isBuiltinPrompt" class="info-section">
      <PromptInfoDisplay
        :current-prompt="currentPrompt"
        :current-prompt-name="currentPromptName"
        :current-prompt-description="currentPromptDescription"
        :is-builtin-prompt="isBuiltinPrompt"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
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
  gap: 1rem;
}

.selector-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.selector-label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
  margin: 0;
}

.selector-actions {
  flex-shrink: 0;
}

.selector-wrapper {
  width: 100%;
}

.info-section {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .selector-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .selector-actions {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style>
