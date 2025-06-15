import { ref, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useTheme } from './useTheme'
import { useI18n } from 'vue-i18n'
import confetti from 'canvas-confetti'

export function useUIState() {
  const showCharts = ref(false)
  const { width } = useWindowSize()
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()

  const isSmallScreen = computed(() => width.value < 768)

  const themeIcon = computed(() => {
    if (theme.value === 'auto') {
      return 'auto'
    }
    return theme.value === 'light' ? 'sun' : 'moon'
  })

  const themeTooltip = computed(() => {
    switch (theme.value) {
      case 'light':
        return t('switchToDarkMode')
      case 'dark':
        return t('switchToAutoMode')
      case 'auto':
        return t('switchToLightMode')
      default:
        return t('switchToLightMode')
    }
  })

  const toggleCharts = () => {
    showCharts.value = !showCharts.value
  }

  const closeCharts = () => {
    showCharts.value = false
  }

  const showBigConfetti = () => {
    confetti({
      particleCount: 300,
      spread: 100,
      origin: { y: 0.6 }
    })
  }

  const handlePomodoroComplete = (isBreakStarted: boolean) => {
    if (isBreakStarted) {
      showBigConfetti()
      localStorage.setItem('pomodoroCompleted', 'true')
    } else {
      localStorage.removeItem('pomodoroCompleted')
    }
  }

  const checkPomodoroCompletion = () => {
    if (!document.hidden) {
      const pomodoroCompleted = localStorage.getItem('pomodoroCompleted')
      if (pomodoroCompleted === 'true') {
        showBigConfetti()
        localStorage.removeItem('pomodoroCompleted')
      }
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showCharts.value) {
        showCharts.value = false
        return
      }
    }

    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault()
          toggleCharts()
          break
        case 't':
          event.preventDefault()
          toggleTheme()
          break
      }
    }
  }

  return {
    showCharts,
    isSmallScreen,
    themeIcon,
    themeTooltip,
    toggleTheme,
    toggleCharts,
    closeCharts,
    handlePomodoroComplete,
    checkPomodoroCompletion,
    onKeyDown
  }
}
