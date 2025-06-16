<template>
  <div class="w-full max-w-[900px] mx-auto flex flex-col gap-4 md:max-w-full">
    <div class="text-center mb-1">
      <h3 class="m-0 mb-1 text-xl md:text-[1.3rem] sm:text-[1.2rem] font-semibold text-text">
        {{ t('modelSelection') }}
      </h3>
      <p
        class="m-0 text-[0.85rem] md:text-[0.9rem] sm:text-[0.85rem] text-text-secondary leading-[1.4]"
      >
        {{ t('modelSelectionDescription') }}
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <div
        v-for="option in modelOptions"
        :key="option.value"
        class="model-option"
        :class="{ active: selectedModel === option.value }"
        @click="selectModel(option.value)"
      >
        <div class="flex items-center gap-3">
          <div class="radio-button" :class="{ checked: selectedModel === option.value }">
            <div v-if="selectedModel === option.value" class="radio-dot" />
          </div>
          <div class="flex-1">
            <div class="model-name">{{ option.label }}</div>
            <div class="model-description">{{ option.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="current-model-info">
      <span class="text-sm text-text-secondary">
        {{ t('currentModel') }}: {{ getCurrentModelLabel() }}
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
  }
})

const modelOptions = computed<ModelOption[]>(() => [
  {
    value: 'deepseek-chat',
    label: t('deepseekChat'),
    description: t('deepseekChatDescription')
  },
  {
    value: 'deepseek-reasoner',
    label: t('deepseekReasoner'),
    description: t('deepseekReasonerDescription')
  }
])

const selectModel = (model: AIModel) => {
  selectedModel.value = model
}

const getCurrentModelLabel = () => {
  const currentOption = modelOptions.value.find(option => option.value === selectedModel.value)
  return currentOption?.label || selectedModel.value
}

defineOptions({
  name: 'ModelSelectionSection'
})
</script>

<style scoped>
.model-option {
  @apply p-4 border border-input-border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5;
}

.model-option.active {
  @apply border-primary bg-primary/10;
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

.model-name {
  @apply text-base font-medium text-text;
}

.model-description {
  @apply text-sm text-text-secondary mt-1;
}

.current-model-info {
  @apply p-3 bg-bg-card rounded-lg border border-input-border/50;
}
</style>
