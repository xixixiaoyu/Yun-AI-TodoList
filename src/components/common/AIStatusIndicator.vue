<template>
  <Transition name="status" appear>
    <div v-if="show" class="ai-status-indicator" :class="statusClass">
      <!-- 状态图标 -->
      <div class="status-icon">
        <div v-if="type === 'loading'" class="loading-animation">
          <div class="loading-dots">
            <div class="dot" />
            <div class="dot" />
            <div class="dot" />
          </div>
        </div>
        <svg v-else-if="type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6" />
          <path d="M9 9l6 6" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>

      <!-- 状态内容 -->
      <div class="status-content">
        <div class="status-title">{{ title }}</div>
        <div v-if="description" class="status-description">{{ description }}</div>
        <div v-if="progress !== undefined" class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button v-if="closable" class="close-button" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type StatusType = 'loading' | 'success' | 'error' | 'info'

interface Props {
  show: boolean
  type: StatusType
  title: string
  description?: string
  progress?: number
  closable?: boolean
  duration?: number
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  progress: undefined,
  closable: false,
  duration: 0
})

const emit = defineEmits<Emits>()

const statusClass = computed(() => {
  return {
    'status-loading': props.type === 'loading',
    'status-success': props.type === 'success',
    'status-error': props.type === 'error',
    'status-info': props.type === 'info'
  }
})

// 自动关闭
if (props.duration > 0) {
  setTimeout(() => {
    emit('close')
  }, props.duration)
}

defineOptions({
  name: 'AIStatusIndicator'
})
</script>

<style scoped>
/* 状态指示器主体 */
.ai-status-indicator {
  @apply fixed top-4 right-4 z-1000;
  @apply flex items-center gap-3 px-4 py-3 rounded-xl;
  @apply bg-bg-card border border-white/10 shadow-custom;
  @apply backdrop-blur-20 max-w-sm;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
}

/* 状态图标 */
.status-icon {
  @apply flex-shrink-0 w-8 h-8 rounded-lg;
  @apply flex items-center justify-center;
}

.status-loading .status-icon {
  @apply bg-blue-500/20 text-blue-400;
}

.status-success .status-icon {
  @apply bg-green-500/20 text-green-400;
}

.status-error .status-icon {
  @apply bg-red-500/20 text-red-400;
}

.status-info .status-icon {
  @apply bg-gray-500/20 text-gray-400;
}

.status-icon svg {
  @apply w-5 h-5 stroke-2;
}

/* 加载动画 */
.loading-animation {
  @apply w-full h-full flex items-center justify-center;
}

.loading-dots {
  @apply flex gap-1;
}

.dot {
  @apply w-1.5 h-1.5 bg-current rounded-full;
  animation: loading-pulse 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

/* 状态内容 */
.status-content {
  @apply flex-1 min-w-0;
}

.status-title {
  @apply text-sm font-medium text-text mb-1;
}

.status-description {
  @apply text-xs text-text-secondary opacity-80;
}

/* 进度条 */
.progress-bar {
  @apply w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden;
}

.progress-fill {
  @apply h-full bg-current rounded-full transition-all-300;
}

.status-loading .progress-fill {
  @apply bg-blue-400;
}

.status-success .progress-fill {
  @apply bg-green-400;
}

.status-error .progress-fill {
  @apply bg-red-400;
}

.status-info .progress-fill {
  @apply bg-gray-400;
}

/* 关闭按钮 */
.close-button {
  @apply flex-shrink-0 w-6 h-6 rounded-md;
  @apply flex items-center justify-center text-text-secondary;
  @apply hover:bg-white/5 hover:text-text transition-all-300;
}

.close-button svg {
  @apply w-4 h-4 stroke-2;
}

/* 过渡动画 */
.status-enter-active,
.status-leave-active {
  @apply transition-all-300;
}

.status-enter-from,
.status-leave-to {
  @apply opacity-0 translate-x-full scale-95;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-status-indicator {
    @apply top-2 right-2 left-2 max-w-none;
  }
}

@media (max-width: 480px) {
  .ai-status-indicator {
    @apply px-3 py-2;
  }

  .status-icon {
    @apply w-7 h-7;
  }

  .status-icon svg {
    @apply w-4 h-4;
  }

  .status-title {
    @apply text-xs;
  }

  .status-description {
    @apply text-xs;
  }
}

/* 动画关键帧 */
@keyframes loading-pulse {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
