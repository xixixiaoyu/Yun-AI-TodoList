<template>
  <div class="flex flex-col h-full">
    <div class="mb-4">
      <div class="flex items-center gap-3 mb-1">
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg settings-section-icon"
        >
          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-text">
          {{ t('modelSelection') }}
        </h3>
      </div>
      <p class="text-xs text-text-secondary leading-snug">
        {{ t('modelSelectionDescription') }}
      </p>
    </div>

    <div class="flex-1 space-y-1">
      <div
        v-for="option in modelOptions"
        :key="option.value"
        class="model-option"
        :class="{ active: selectedModel === option.value }"
        @click="selectModel(option.value)"
      >
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <div class="model-name">{{ option.label }}</div>
            <div class="model-description">{{ option.description }}</div>
          </div>
          <div v-if="selectedModel === option.value" class="selected-indicator">
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

    <div class="mt-3 p-2.5 bg-bg-card rounded-lg border border-input-border/30">
      <span class="text-xs text-text-secondary">
        {{ t('currentModel') }}:
        <span class="font-medium text-text">{{ getCurrentModelLabel() }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { aiModel, saveAIModel } from '../../services/configService'
import type { AIModel, ModelOption } from '../../services/types'

const { t } = useI18n()

const selectedModel = computed({
  get: () => aiModel.value,
  set: (value: AIModel) => {
    saveAIModel(value)
  },
})

const modelOptions = computed<ModelOption[]>(() => [
  {
    value: 'deepseek-chat',
    label: t('deepseekChat'),
    description: t('deepseekChatDescription'),
  },
  {
    value: 'deepseek-reasoner',
    label: t('deepseekReasoner'),
    description: t('deepseekReasonerDescription'),
  },
])

const selectModel = (model: AIModel) => {
  selectedModel.value = model
}

const getCurrentModelLabel = () => {
  const currentOption = modelOptions.value.find((option) => option.value === selectedModel.value)
  return currentOption?.label || selectedModel.value
}

defineOptions({
  name: 'ModelSelectionSection',
})
</script>

<style scoped>
.model-option {
  @apply px-4 py-2.5 rounded-md cursor-pointer transition-all duration-200;
  background: transparent;
  border: 1px solid transparent;
}

.model-option:hover {
  background: var(--settings-primary-ultra-light);
  border-color: var(--settings-primary-ultra-light);
  box-shadow: 0 1px 3px rgba(121, 180, 166, 0.06);
}

.model-option.active {
  background: var(--settings-primary-soft);
  border-color: var(--settings-primary-medium);
}

.selected-indicator {
  @apply flex items-center justify-center;
  color: var(--settings-primary);
}

.settings-section-icon {
  background: linear-gradient(
    135deg,
    var(--settings-primary) 0%,
    var(--settings-primary-dark) 100%
  );
  color: white;
}

.model-name {
  @apply text-sm font-medium text-text;
}

.model-description {
  @apply text-xs text-text-secondary mt-0.5;
}

.current-model-info {
  @apply p-3 rounded-lg;
  background: var(--settings-primary-ultra-light);
  border: 1px solid var(--settings-input-border);
}
</style>
