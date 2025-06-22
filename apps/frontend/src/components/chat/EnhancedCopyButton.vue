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

    <!-- 成功/失败反馈动画 -->
    <div v-if="showFeedback" class="feedback-overlay" :class="feedbackType">
      <div class="feedback-content">
        <CheckIcon v-if="feedbackType === 'success'" class="feedback-icon" />
        <ExclamationIcon v-else class="feedback-icon" />
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CheckIcon from '../common/icons/CheckIcon.vue'
import CopyIcon from '../common/icons/CopyIcon.vue'
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
const { t } = useI18n()

const showSuccess = ref(false)
const showError = ref(false)
const showFeedback = ref(false)
const feedbackType = ref<'success' | 'error'>('success')
const feedbackMessage = ref('')

const buttonTitle = computed(() => {
  if (showSuccess.value) return t('copySuccess')
  if (showError.value) return t('copyFailed')
  return t('copyContent')
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
    feedbackMessage.value = t('copySuccess')
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
    feedbackMessage.value = t('copyFailed')
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
  @apply relative inline-flex items-center justify-center p-2 rounded-lg cursor-pointer;
  @apply bg-gray-100/80 hover:bg-gray-200/90 dark:bg-gray-700/80 dark:hover:bg-gray-600/90;
  @apply border border-gray-300/50 hover:border-gray-400/70 dark:border-gray-600/50 dark:hover:border-gray-500/70;
  @apply text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100;
  @apply text-sm font-medium transition-all duration-300;
  @apply hover:scale-105 active:scale-95;
  @apply backdrop-blur-sm shadow-sm hover:shadow-md;
  @apply opacity-100;
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

/* 响应式调整 */
@media (max-width: 640px) {
  .enhanced-copy-button {
    @apply p-1.5 text-xs;
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
