<template>
  <button
    class="enhanced-copy-button"
    :class="{
      'copy-success': showSuccess,
      'copy-error': showError,
    }"
    :title="buttonTitle"
    @click="handleCopy"
  >
    <div class="copy-icon-container">
      <CopyIcon v-if="!showSuccess && !showError" class="copy-icon" />
      <CheckIcon v-else-if="showSuccess" class="copy-icon success-icon" />
      <ExclamationIcon v-else class="copy-icon error-icon" />
    </div>
    <span class="copy-text">{{ buttonText }}</span>

    <!-- 成功/失败反馈动画 -->
    <div v-if="showFeedback" class="feedback-overlay" :class="feedbackType">
      <div class="feedback-content">
        <CheckIcon v-if="feedbackType === 'success'" class="feedback-icon" />
        <ExclamationIcon v-else class="feedback-icon" />
        <span class="feedback-text">{{ feedbackMessage }}</span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CopyIcon from '../common/icons/CopyIcon.vue'
import CheckIcon from '../common/icons/CheckIcon.vue'
import ExclamationIcon from '../common/icons/ExclamationIcon.vue'

interface Props {
  text: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'floating'
}

interface Emits {
  (e: 'copy-success', text: string): void
  (e: 'copy-error', error: Error): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
})

const emit = defineEmits<Emits>()

const showSuccess = ref(false)
const showError = ref(false)
const showFeedback = ref(false)
const feedbackType = ref<'success' | 'error'>('success')
const feedbackMessage = ref('')

const buttonTitle = computed(() => {
  if (showSuccess.value) return '复制成功'
  if (showError.value) return '复制失败'
  return '复制内容'
})

const buttonText = computed(() => {
  if (showSuccess.value) return '已复制'
  if (showError.value) return '失败'
  return '复制'
})

const handleCopy = async () => {
  try {
    // 使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.text)
    } else {
      // 降级到传统方法
      const textArea = document.createElement('textarea')
      textArea.value = props.text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }

    // 显示成功状态
    showSuccess.value = true
    showError.value = false

    // 显示反馈动画
    feedbackType.value = 'success'
    feedbackMessage.value = '复制成功'
    showFeedback.value = true

    emit('copy-success', props.text)

    // 重置状态
    setTimeout(() => {
      showSuccess.value = false
      showFeedback.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)

    // 显示错误状态
    showError.value = true
    showSuccess.value = false

    // 显示反馈动画
    feedbackType.value = 'error'
    feedbackMessage.value = '复制失败'
    showFeedback.value = true

    emit('copy-error', error as Error)

    // 重置状态
    setTimeout(() => {
      showError.value = false
      showFeedback.value = false
    }, 2000)
  }
}

defineOptions({
  name: 'EnhancedCopyButton',
})
</script>

<style scoped>
.enhanced-copy-button {
  @apply relative inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer;
  @apply bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40;
  @apply text-primary text-sm font-medium transition-all duration-300;
  @apply opacity-0 invisible group-hover:opacity-90 group-hover:visible;
  @apply hover:!opacity-100 hover:scale-105 active:scale-95;
  @apply backdrop-blur-sm shadow-sm hover:shadow-md;
}

.enhanced-copy-button.copy-success {
  @apply bg-green-500/10 border-green-500/20 text-green-600;
  @apply opacity-100 visible;
}

.enhanced-copy-button.copy-error {
  @apply bg-red-500/10 border-red-500/20 text-red-600;
  @apply opacity-100 visible;
}

.copy-icon-container {
  @apply flex items-center justify-center w-4 h-4;
}

.copy-icon {
  @apply w-full h-full transition-all duration-200;
}

.success-icon {
  @apply text-green-600;
  animation: successPulse 0.6s ease-out;
}

.error-icon {
  @apply text-red-600;
  animation: errorShake 0.6s ease-out;
}

.copy-text {
  @apply hidden sm:inline transition-all duration-200;
}

.feedback-overlay {
  @apply absolute inset-0 flex items-center justify-center;
  @apply bg-white/95 dark:bg-gray-800/95 rounded-lg backdrop-blur-sm;
  @apply border border-current/20;
  animation: feedbackSlide 0.3s ease-out;
}

.feedback-overlay.success {
  @apply text-green-600 bg-green-50/95 dark:bg-green-900/20;
}

.feedback-overlay.error {
  @apply text-red-600 bg-red-50/95 dark:bg-red-900/20;
}

.feedback-content {
  @apply flex items-center gap-1.5 text-xs font-medium;
}

.feedback-icon {
  @apply w-3.5 h-3.5;
}

.feedback-text {
  @apply hidden sm:inline;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .enhanced-copy-button {
    @apply px-2 py-1.5 text-xs;
  }

  .copy-icon-container {
    @apply w-3.5 h-3.5;
  }
}

/* 动画定义 */
@keyframes successPulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

@keyframes feedbackSlide {
  0% {
    opacity: 0;
    transform: translateY(-4px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
