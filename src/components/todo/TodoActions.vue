<template>
  <div v-if="filter === 'active' || filter === 'completed'" class="ai-actions-container">
    <button
      class="ai-action-btn ai-generate-btn"
      :class="{ 'is-loading': isGenerating }"
      :disabled="isGenerating"
      @click="$emit('generateSuggestions')"
    >
      <div class="btn-content">
        <div v-if="isGenerating" class="loading-spinner" />
        <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span class="btn-text">
          {{ isGenerating ? t('generating') : t('generateSuggestions') }}
        </span>
      </div>
      <div class="btn-shine" />
    </button>

    <button
      v-if="filter === 'active' && hasActiveTodos"
      class="ai-action-btn ai-sort-btn"
      :class="{ 'is-loading': isSorting }"
      :disabled="isSorting"
      @click="handleSortClick"
    >
      <div class="btn-content">
        <div v-if="isSorting" class="loading-spinner" />
        <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 6h18" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
        <span class="btn-text">
          {{ isSorting ? t('sorting') : t('aiPrioritySort') }}
        </span>
      </div>
      <div class="btn-shine" />
    </button>

    <button
      v-if="filter === 'active' && hasActiveTodos"
      class="ai-action-btn ai-analysis-btn"
      :class="{ 'is-loading': isBatchAnalyzing }"
      :disabled="isBatchAnalyzing"
      @click="handleAnalysisClick"
    >
      <div class="btn-content">
        <div v-if="isBatchAnalyzing" class="loading-spinner" />
        <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span class="btn-text">
          {{ isBatchAnalyzing ? t('batchAnalyzing') : t('batchAiAnalysis') }}
        </span>
      </div>
      <div class="btn-shine" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  filter: string
  hasActiveTodos: boolean
  isGenerating: boolean
  isSorting: boolean
  isBatchAnalyzing?: boolean
}

interface Emits {
  (e: 'generateSuggestions'): void
  (e: 'sortWithAI'): void
  (e: 'batchAnalyze'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const handleSortClick = () => {
  emit('sortWithAI')
}

const handleAnalysisClick = () => {
  emit('batchAnalyze')
}

defineOptions({
  name: 'TodoActions',
})
</script>

<style scoped>
.ai-actions-container {
  @apply flex justify-center items-center gap-4 mb-3 flex-wrap p-4;
  @apply bg-gradient-pomodoro rounded-1.5x border border-orange-100/10;
  @apply shadow-sm backdrop-blur-10 transition-all-300;
}

.ai-action-btn {
  @apply relative flex items-center justify-center gap-3 px-6 py-3.5;
  @apply min-w-36 h-11 rounded-1.5x font-medium text-sm;
  @apply border border-white/10 cursor-pointer transition-all-300;
  @apply shadow-button backdrop-blur-10 overflow-hidden;
  @apply hover:transform-hover-up-2 hover:shadow-hover;
  @apply disabled:cursor-not-allowed disabled:transform-none;
}

.btn-content {
  @apply flex items-center gap-2.5 relative z-10;
}

.btn-icon {
  @apply w-4 h-4 stroke-2 transition-transform-300;
}

.btn-text {
  @apply font-medium tracking-wide transition-all-300;
}

.btn-shine {
  @apply absolute inset-0 opacity-0 transition-all-500;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
}

.ai-action-btn:hover .btn-shine {
  @apply opacity-100;
  transform: translateX(100%);
}

.ai-generate-btn {
  @apply text-white;
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.ai-generate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #26d0ce 0%, #2a9d8f 100%);
  @apply border-white/20;
  box-shadow: 0 8px 20px rgba(78, 205, 196, 0.4);
}

.ai-generate-btn:disabled,
.ai-generate-btn.is-loading {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  @apply shadow-sm;
}

.ai-sort-btn {
  @apply text-emerald-800;
  background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%);
}

.ai-sort-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7fcdcd 0%, #74c0fc 100%);
  @apply text-emerald-900 border-white/20;
  box-shadow: 0 8px 20px rgba(168, 230, 207, 0.4);
}

.ai-sort-btn:disabled,
.ai-sort-btn.is-loading {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  @apply text-gray-600 shadow-sm;
}

.ai-analysis-btn {
  @apply text-purple-800;
  background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
}

.ai-analysis-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%);
  @apply text-purple-900 border-white/20;
  box-shadow: 0 8px 20px rgba(196, 181, 253, 0.4);
}

.ai-analysis-btn:disabled,
.ai-analysis-btn.is-loading {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  @apply text-gray-600 shadow-sm;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-current border-t-transparent rounded-full;
  animation: spin 1s linear infinite;
}

.is-loading .btn-icon {
  @apply scale-0;
}

.is-loading .loading-spinner {
  @apply scale-100;
}

@media (max-width: 768px) {
  .ai-actions-container {
    @apply p-3 gap-3;
  }

  .ai-action-btn {
    @apply px-5 py-3 min-w-32 h-10 text-xs;
  }

  .btn-icon {
    @apply w-3.5 h-3.5;
  }

  .loading-spinner {
    @apply w-3.5 h-3.5;
  }
}

@media (max-width: 480px) {
  .ai-actions-container {
    @apply flex-col p-2 gap-2;
  }

  .ai-action-btn {
    @apply w-full min-w-0 px-4 py-2.5 h-9 text-xs;
  }

  .btn-icon {
    @apply w-3 h-3;
  }

  .loading-spinner {
    @apply w-3 h-3;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
