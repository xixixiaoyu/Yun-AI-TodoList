<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-display">
      <div class="error-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 class="error-title">{{ t('errorBoundary.title', 'Something went wrong') }}</h3>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button class="retry-button" @click="retry">
          {{ t('errorBoundary.retry', 'Try Again') }}
        </button>
        <button class="details-button" @click="toggleDetails">
          {{
            showDetails
              ? t('errorBoundary.hideDetails', 'Hide Details')
              : t('errorBoundary.showDetails', 'Show Details')
          }}
        </button>
      </div>
      <div v-if="showDetails" class="error-details">
        <pre>{{ errorDetails }}</pre>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { useErrorHandler } from '@/composables/useErrorHandler'
import { onErrorCaptured, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface ErrorInfo {
  componentStack: string
  instance?: unknown
  filename?: string
  lineno?: number
  colno?: number
}

interface Props {
  fallback?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: 'An unexpected error occurred',
  onError: undefined,
})

const { t } = useI18n()
const { showError } = useErrorHandler()

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const showDetails = ref(false)

const captureError = (error: Error, errorInfo: ErrorInfo) => {
  hasError.value = true
  errorMessage.value = error.message || props.fallback
  errorDetails.value = `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`

  props.onError?.(error, errorInfo)
  showError(errorMessage.value)

  console.error('ErrorBoundary caught an error:', error, errorInfo)
}

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  showDetails.value = false
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

onErrorCaptured((error: Error, instance: unknown, info: string) => {
  captureError(error, { componentStack: info, instance })
  return false
})

onMounted(() => {
  window.addEventListener('error', (event) => {
    captureError(event.error, {
      componentStack: 'Global error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    captureError(new Error(event.reason), {
      componentStack: 'Unhandled promise rejection',
    })
  })
})
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  min-height: 300px;
  background-color: var(--card-bg-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--error-color);
}

.error-icon {
  color: var(--error-color);
  margin-bottom: 1rem;
}

.error-title {
  color: var(--error-color);
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-message {
  color: var(--text-color);
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.retry-button,
.details-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.retry-button {
  background-color: var(--primary-color);
  color: white;
}

.retry-button:hover {
  background-color: var(--primary-hover-color);
}

.details-button {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.details-button:hover {
  background-color: var(--hover-bg-color);
}

.error-details {
  width: 100%;
  max-width: 600px;
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--code-bg-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  text-align: left;
}

.error-details pre {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .error-display {
    padding: 1rem;
    min-height: 200px;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .retry-button,
  .details-button {
    width: 100%;
  }
}
</style>
