import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { logger } from '../utils/logger'

export function useErrorHandler() {
  const { t, te } = useI18n()
  const error = ref('')
  const success = ref('')
  const errorHistory = ref<Array<{ message: string; timestamp: string }>>([])
  let errorTimer: ReturnType<typeof setTimeout> | null = null
  let successTimer: ReturnType<typeof setTimeout> | null = null

  const showError = (message: string) => {
    const translatedMessage = typeof message === 'string' ? message : String(message)
    error.value = translatedMessage
    errorHistory.value.push({
      message: translatedMessage,
      timestamp: new Date().toISOString(),
    })

    logger.info('Error message displayed', { message: translatedMessage }, 'ErrorHandler')

    // 清除之前的错误定时器
    if (errorTimer) {
      clearTimeout(errorTimer)
    }

    errorTimer = setTimeout(() => {
      error.value = ''
      errorTimer = null
    }, 5000)
  }

  const showSuccess = (message: string, duration = 3000) => {
    try {
      const translatedMessage = te(message) ? t(message) : message
      success.value = translatedMessage

      logger.info('Success message displayed', { message: translatedMessage }, 'ErrorHandler')

      // 清除之前的成功定时器
      if (successTimer) {
        clearTimeout(successTimer)
      }

      successTimer = setTimeout(() => {
        success.value = ''
        successTimer = null
      }, duration)
    } catch (err) {
      logger.error('Error in success handler', err, 'ErrorHandler')
    }
  }

  const clearError = () => {
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
    }
    error.value = ''
  }

  const clearSuccess = () => {
    if (successTimer) {
      clearTimeout(successTimer)
      successTimer = null
    }
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
