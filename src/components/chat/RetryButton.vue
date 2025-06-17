<template>
  <button
    class="retry-button"
    :class="{
      'retry-loading': isRetrying,
      'retry-error': hasError,
    }"
    :disabled="isRetrying"
    :title="buttonTitle"
    @click="handleRetry"
  >
    <div class="retry-icon-container">
      <RefreshIcon
        v-if="!isRetrying"
        class="retry-icon"
        :class="{ 'retry-icon-error': hasError }"
      />
      <LoadingIcon v-else class="retry-icon loading-spin" />
    </div>

    <span class="retry-text">{{ buttonText }}</span>

    <!-- 重试计数器 -->
    <span v-if="retryCount > 0" class="retry-count">
      {{ retryCount }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingIcon from '../common/icons/LoadingIcon.vue'
import RefreshIcon from '../common/icons/RefreshIcon.vue'

interface Props {
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  hasError?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'outline'
}

interface Emits {
  (e: 'retry'): void
  (e: 'retry-start'): void
  (e: 'retry-complete', success: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  isRetrying: false,
  retryCount: 0,
  maxRetries: 3,
  hasError: false,
  size: 'md',
  variant: 'default',
})

const emit = defineEmits<Emits>()

const buttonTitle = computed(() => {
  if (props.isRetrying) return '正在重试...'
  if (props.hasError) return '重试失败的请求'
  if (props.retryCount >= props.maxRetries) return '已达到最大重试次数'
  return '重试上一个请求'
})

const buttonText = computed(() => {
  if (props.isRetrying) return '重试中'
  if (props.hasError) return '重试'
  if (props.retryCount >= props.maxRetries) return '已达上限'
  return '重试'
})

const handleRetry = () => {
  if (props.isRetrying || props.retryCount >= props.maxRetries) {
    return
  }

  emit('retry-start')
  emit('retry')
}

defineOptions({
  name: 'RetryButton',
})
</script>

<style scoped>
.retry-button {
  @apply relative inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer;
  @apply bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40;
  @apply text-orange-600 text-sm font-medium transition-all duration-300;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply hover:scale-105 active:scale-95;
  @apply backdrop-blur-sm shadow-sm hover:shadow-md;
}

.retry-button.retry-loading {
  @apply bg-blue-500/10 border-blue-500/20 text-blue-600;
  @apply cursor-wait;
}

.retry-button.retry-error {
  @apply bg-red-500/10 border-red-500/20 text-red-600;
  @apply hover:bg-red-500/20 hover:border-red-500/40;
}

.retry-icon-container {
  @apply flex items-center justify-center w-4 h-4;
}

.retry-icon {
  @apply w-full h-full transition-all duration-200;
}

.retry-icon-error {
  @apply text-red-600;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

.retry-text {
  @apply transition-all duration-200;
}

.retry-count {
  @apply ml-1 px-1.5 py-0.5 bg-current/20 text-xs rounded-full;
  @apply min-w-[1.25rem] text-center;
}

/* 尺寸变体 */
.retry-button.size-sm {
  @apply px-2 py-1.5 text-xs;
}

.retry-button.size-sm .retry-icon-container {
  @apply w-3.5 h-3.5;
}

.retry-button.size-lg {
  @apply px-4 py-3 text-base;
}

.retry-button.size-lg .retry-icon-container {
  @apply w-5 h-5;
}

/* 样式变体 */
.retry-button.variant-minimal {
  @apply bg-transparent border-transparent shadow-none;
  @apply hover:bg-orange-500/10 hover:border-orange-500/20;
}

.retry-button.variant-outline {
  @apply bg-transparent border-2;
  @apply hover:bg-orange-500/5;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .retry-button {
    @apply px-2 py-1.5 text-xs;
  }

  .retry-icon-container {
    @apply w-3.5 h-3.5;
  }

  .retry-text {
    @apply hidden;
  }
}

/* 动画定义 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 悬停效果增强 */
.retry-button:hover .retry-icon {
  transform: rotate(180deg);
}

.retry-button.retry-loading:hover .retry-icon {
  transform: none;
}

/* 禁用状态 */
.retry-button:disabled {
  @apply transform-none hover:scale-100;
}

.retry-button:disabled .retry-icon {
  @apply transform-none;
}

/* 成功状态动画 */
.retry-success {
  animation: successPulse 0.6s ease-out;
}

@keyframes successPulse {
  0% {
    background-color: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.2);
    color: rgb(22, 163, 74);
  }
  50% {
    background-color: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
    transform: scale(1.05);
  }
  100% {
    background-color: rgba(249, 115, 22, 0.1);
    border-color: rgba(249, 115, 22, 0.2);
    color: rgb(234, 88, 12);
    transform: scale(1);
  }
}
</style>
