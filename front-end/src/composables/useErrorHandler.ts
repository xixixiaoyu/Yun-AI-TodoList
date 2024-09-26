import { ref } from 'vue'

export function useErrorHandler() {
  const error = ref('')

  const showError = (message: string, duration = 3000) => {
    error.value = message
    setTimeout(() => {
      error.value = ''
    }, duration)
  }

  return {
    error,
    showError
  }
}
