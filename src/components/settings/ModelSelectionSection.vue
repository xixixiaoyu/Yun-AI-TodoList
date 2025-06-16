<template>
  <div class="flex flex-col h-full">
    <!-- 区块标题 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
        >
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-text">
          {{ t('modelSelection') }}
        </h3>
      </div>
      <p class="text-sm text-text-secondary leading-relaxed">
        {{ t('modelSelectionDescription') }}
      </p>
    </div>

    <!-- 模型选项 -->
    <div class="flex-1 space-y-3">
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

    <!-- 当前模型信息 -->
    <div class="mt-4 p-3 bg-bg-card rounded-lg border border-input-border/30">
      <span class="text-sm text-text-secondary">
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
