import { useWindowSize } from '@vueuse/core'
import confetti from 'canvas-confetti'
import { computed, ref } from 'vue'

export function useUIState() {
  const showCharts = ref(false)
  const { width } = useWindowSize()

  const isSmallScreen = computed(() => width.value < 768)

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
      origin: { y: 0.6 },
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
      }
    }
  }

  return {
    showCharts,
    isSmallScreen,
    toggleCharts,
    closeCharts,
    handlePomodoroComplete,
    checkPomodoroCompletion,
    onKeyDown,
  }
}
