import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { logger } from '../utils/logger'

export function useErrorHandler() {
  const { t, te } = useI18n() // te 用于检查翻译键是否存在
  const error = ref('')
  const errorHistory = ref<Array<{ message: string; timestamp: Date }>>([])

  const showError = (message: string, duration = 3000) => {
    try {
      // 检查翻译键是否存在，如果不存在则使用原始消息
      const translatedMessage = te(message) ? t(message) : message

      error.value = translatedMessage

      // 记录错误历史
      errorHistory.value.push({
        message: translatedMessage,
        timestamp: new Date()
      })

      // 限制错误历史记录数量
      if (errorHistory.value.length > 10) {
        errorHistory.value = errorHistory.value.slice(-10)
      }

      // 记录到日志系统
      logger.warn('User error displayed', { message: translatedMessage }, 'ErrorHandler')

      setTimeout(() => {
        error.value = ''
      }, duration)
    } catch (err) {
      // 如果错误处理本身失败，使用备用方案
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
