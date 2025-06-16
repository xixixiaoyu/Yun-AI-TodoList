<template>
  <div v-if="filter === 'active' || filter === 'completed'" class="ai-actions-container">
    <!-- AI 生成建议按钮 -->
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

    <!-- AI 优先级排序按钮 -->
    <button
      v-if="filter === 'active' && hasActiveTodos"
      class="ai-action-btn ai-sort-btn"
      :class="{ 'is-loading': isSorting }"
      :disabled="isSorting"
      @click="$emit('sortWithAI')"
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
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  filter: string
  hasActiveTodos: boolean
  isGenerating: boolean
  isSorting: boolean
}

interface Emits {
  (e: 'generateSuggestions'): void
  (e: 'sortWithAI'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'TodoActions'
})
</script>

<style scoped>
/* AI 操作容器 */
.ai-actions-container {
  @apply flex justify-center items-center gap-4 mb-3 flex-wrap p-4;
  @apply bg-gradient-pomodoro rounded-1.5x border border-orange-100/10;
  @apply shadow-sm backdrop-blur-10 transition-all-300;
}

/* AI 操作按钮基础样式 */
.ai-action-btn {
  @apply relative flex items-center justify-center gap-3 px-6 py-3.5;
  @apply min-w-36 h-11 rounded-1.5x font-medium text-sm;
  @apply border border-white/10 cursor-pointer transition-all-300;
  @apply shadow-button backdrop-blur-10 overflow-hidden;
  @apply hover:transform-hover-up-2 hover:shadow-hover;
  @apply disabled:cursor-not-allowed disabled:transform-none;
}

/* 按钮内容布局 */
.btn-content {
  @apply flex items-center gap-2.5 relative z-10;
}

/* 按钮图标 */
.btn-icon {
  @apply w-4 h-4 stroke-2 transition-transform-300;
}

/* 按钮文本 */
.btn-text {
  @apply font-medium tracking-wide transition-all-300;
}

/* 按钮光泽效果 */
.btn-shine {
  @apply absolute inset-0 opacity-0 transition-all-500;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
}

.ai-action-btn:hover .btn-shine {
  @apply opacity-100;
  transform: translateX(100%);
}

/* 生成建议按钮样式 */
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

/* 排序按钮样式 */
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

/* 加载状态动画 */
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

/* 响应式设计 */
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

/* 动画关键帧 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
