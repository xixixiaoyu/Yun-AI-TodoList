<template>
  <div class="message-action-bar" :class="{ 'action-bar-visible': isVisible }">
    <!-- 复制按钮 -->
    <EnhancedCopyButton
      :text="messageContent"
      size="sm"
      variant="minimal"
      @copy-success="handleCopySuccess"
      @copy-error="handleCopyError"
    />

    <!-- 重试按钮 (仅对 AI 消息显示) -->
    <RetryButton
      v-if="messageRole === 'assistant' && canRetry"
      :is-retrying="isRetrying"
      :retry-count="retryCount"
      :has-error="hasError"
      size="sm"
      variant="minimal"
      @retry="handleRetry"
      @retry-start="handleRetryStart"
    />

    <!-- 优化按钮 (仅对用户消息显示) -->
    <button
      v-if="messageRole === 'user' && canOptimize"
      class="action-button optimize-button"
      :disabled="isOptimizing"
      title="优化这个问题"
      @click="handleOptimize"
    >
      <span class="action-icon">✨</span>
      <span class="action-text">{{ isOptimizing ? '优化中' : '优化' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import EnhancedCopyButton from './EnhancedCopyButton.vue'
import RetryButton from './RetryButton.vue'

interface Props {
  messageContent: string
  messageRole: 'user' | 'assistant'
  isVisible?: boolean
  canRetry?: boolean
  canOptimize?: boolean
  isRetrying?: boolean
  isOptimizing?: boolean
  retryCount?: number
  hasError?: boolean
}

interface Emits {
  (e: 'copy-success', text: string): void
  (e: 'copy-error', error: Error): void
  (e: 'retry'): void
  (e: 'retry-start'): void
  (e: 'optimize'): void
}

withDefaults(defineProps<Props>(), {
  isVisible: false,
  canRetry: true,
  canOptimize: true,
  isRetrying: false,
  isOptimizing: false,
  retryCount: 0,
  hasError: false,
})

const emit = defineEmits<Emits>()

const handleCopySuccess = (text: string) => {
  emit('copy-success', text)
}

const handleCopyError = (error: Error) => {
  emit('copy-error', error)
}

const handleRetry = () => {
  emit('retry')
}

const handleRetryStart = () => {
  emit('retry-start')
}

const handleOptimize = () => {
  emit('optimize')
}

defineOptions({
  name: 'MessageActionBar',
})
</script>

<style scoped>
.message-action-bar {
  @apply absolute bottom-3 right-3 flex items-center gap-1;
  @apply opacity-0 invisible transition-all duration-300;
  @apply bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm;
  @apply border border-white/20 dark:border-gray-700/20 rounded-lg;
  @apply shadow-lg p-1;
}

.action-bar-visible {
  @apply opacity-100 visible;
}

.action-button {
  @apply flex items-center justify-center p-1.5 rounded-md;
  @apply text-text-secondary hover:text-text;
  @apply bg-transparent hover:bg-input-bg;
  @apply transition-all duration-200 cursor-pointer;
  @apply text-xs font-medium;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.optimize-button {
  @apply text-purple-600 hover:text-purple-700;
  @apply hover:bg-purple-50 dark:hover:bg-purple-900/20;
}

.action-icon {
  @apply w-4 h-4;
}

.action-text {
  @apply hidden;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .message-action-bar {
    @apply bottom-2 right-2 p-0.5;
  }

  .action-button {
    @apply p-1;
  }

  .action-icon {
    @apply w-3.5 h-3.5;
  }
}

/* 悬停效果 */
.message-action-bar:hover {
  @apply shadow-xl;
}

/* 主题适配 */
[data-theme='dark'] .message-action-bar {
  @apply bg-gray-800/95 border-gray-700/20;
}
</style>
