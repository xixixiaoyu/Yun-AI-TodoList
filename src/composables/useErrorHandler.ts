import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { logger } from '../utils/logger'

export function useErrorHandler() {
  const { t, te } = useI18n()
  const error = ref('')
  const errorHistory = ref<Array<{ message: string; timestamp: Date }>>([])

  const showError = (message: string, duration = 3000) => {
    try {
      const translatedMessage = te(message) ? t(message) : message

      error.value = translatedMessage

      errorHistory.value.push({
        message: translatedMessage,
        timestamp: new Date()
      })

      if (errorHistory.value.length > 10) {
        errorHistory.value = errorHistory.value.slice(-10)
      }

      logger.warn('User error displayed', { message: translatedMessage }, 'ErrorHandler')

      setTimeout(() => {
        error.value = ''
      }, duration)
    } catch (err) {
      console.error('Error in error handler:', err)
      error.value = 'An unexpected error occurred'
      setTimeout(() => {
        error.value = ''
      }, duration)
    }
  }

  const clearError = () => {
    error.value = ''
  }

  const getErrorHistory = () => {
    return [...errorHistory.value]
  }

  return {
    error,
    errorHistory,
    showError,
    clearError,
    getErrorHistory
  }
}
