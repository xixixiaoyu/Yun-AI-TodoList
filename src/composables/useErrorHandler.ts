import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { logger } from '../utils/logger'

export function useErrorHandler() {
  const { t, te } = useI18n()
  const error = ref('')
  const success = ref('')
  const errorHistory = ref<Array<{ message: string; timestamp: Date }>>([])

  const showError = (message: string) => {
    const translatedMessage = typeof message === 'string' ? message : String(message)
    error.value = translatedMessage
    errorHistory.value.push({
      message: translatedMessage,
      timestamp: new Date().toISOString(),
    })

    logger.info('Error message displayed', { message: translatedMessage }, 'ErrorHandler')

    setTimeout(() => {
      error.value = ''
    }, 5000)
  }

  const showSuccess = (message: string, duration = 3000) => {
    try {
      const translatedMessage = te(message) ? t(message) : message
      success.value = translatedMessage

      logger.info('Success message displayed', { message: translatedMessage }, 'ErrorHandler')

      setTimeout(() => {
        success.value = ''
      }, duration)
    } catch (err) {
      console.error('Error in success handler:', err)
    }
  }

  const clearError = () => {
    error.value = ''
  }

  const clearSuccess = () => {
    success.value = ''
  }

  const getErrorHistory = () => {
    return [...errorHistory.value]
  }

  return {
    error,
    success,
    errorHistory,
    showError,
    showSuccess,
    clearError,
    clearSuccess,
    getErrorHistory,
  }
}
