<template>
  <div class="settings-section" :class="{ fullscreen: isFullscreen }">
    <SystemPromptHeader
      :is-fullscreen="isFullscreen"
      @toggle-fullscreen="$emit('toggleFullscreen')"
    />

    <div class="prompt-controls">
      <EnhancedPromptTemplateSelector
        :selected-template="selectedPromptTemplate"
        :custom-prompts="customPrompts"
        @update:selected-template="$emit('update:selectedPromptTemplate', $event)"
        @template-change="$emit('templateChange')"
        @duplicate-prompt="$emit('duplicatePrompt')"
        @toggle-favorite="$emit('toggleFavorite', $event)"
        @confirm-delete-prompt="$emit('confirmDeletePrompt')"
        @show-add-prompt="$emit('showAddPrompt')"
      />
    </div>

    <SystemPromptTextarea
      :value="localSystemPrompt"
      @input="$emit('update:localSystemPrompt', $event)"
    />

    <SystemPromptActions
      :is-valid="isSystemPromptValid"
      @save="$emit('saveSystemPrompt')"
      @reset="$emit('resetSystemPrompt')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EnhancedPromptTemplateSelector from './EnhancedPromptTemplateSelector.vue'
import SystemPromptHeader from './SystemPromptHeader.vue'
import SystemPromptTextarea from './SystemPromptTextarea.vue'
import SystemPromptActions from './SystemPromptActions.vue'
import type { CustomPrompt, PromptTemplate } from '../../types/settings'

interface Props {
  localSystemPrompt: string
  isFullscreen: boolean
  selectedPromptTemplate: PromptTemplate
  customPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'update:localSystemPrompt', value: string): void
  (e: 'update:selectedPromptTemplate', value: PromptTemplate): void
  (e: 'templateChange'): void
  (e: 'saveSystemPrompt'): void
  (e: 'resetSystemPrompt'): void
  (e: 'confirmDeletePrompt'): void
  (e: 'duplicatePrompt'): void
  (e: 'toggleFavorite', promptId: string): void
  (e: 'showAddPrompt'): void
  (e: 'toggleFullscreen'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const isSystemPromptValid = computed(() => {
  return props.localSystemPrompt.trim() !== ''
})

defineOptions({
  name: 'SystemPromptSection'
})
</script>

<style scoped>
.settings-section {
  background-color: var(--card-bg-color);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: all 0.3s ease;
}

.prompt-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.settings-section.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  z-index: 1000;
  border-radius: 0;
  padding: 2rem;
  border: none;
  transform: none !important;
}

.settings-section.fullscreen:hover {
  box-shadow: none;
}

.settings-section.fullscreen :deep(.system-prompt-input) {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  max-height: none;
  font-size: 1rem;
}

@media (max-height: 800px) {
  .settings-section {
    padding: 1rem;
    gap: 0.875rem;
  }
}

@media (max-height: 700px) {
  .settings-section {
    padding: 0.875rem;
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .settings-section {
    padding: 1rem;
    gap: 0.875rem;
  }

  .prompt-controls {
    gap: 0.625rem;
  }

  .settings-section.fullscreen {
    position: relative;
    padding: 1.5rem;
    max-width: 100%;
    border-radius: 0;
  }

  .settings-section.fullscreen :deep(.system-prompt-input) {
    max-width: 100%;
    font-size: 0.95rem;
  }
}
</style>
