import { ref, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useTheme } from './useTheme'
import { useI18n } from 'vue-i18n'
import confetti from 'canvas-confetti'

export function useUIState() {
  const showHistory = ref(false)
  const showCharts = ref(false)
  const { width } = useWindowSize()
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()

  const isSmallScreen = computed(() => width.value < 768)

  // 计算主题图标
  const themeIcon = computed(() => {
    if (theme.value === 'auto') {
      return 'auto'
    }
    return theme.value === 'light' ? 'moon' : 'sun'
  })

  // 计算主题切换提示文本
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

  // 切换历史记录显示状态
  const toggleHistory = () => {
    showHistory.value = !showHistory.value
  }

  // 关闭历史记录
  const closeHistory = () => {
    showHistory.value = false
  }

  // 关闭图表
  const closeCharts = () => {
    showCharts.value = false
  }

  // 显示大型礼花效果
  const showBigConfetti = () => {
    confetti({
      particleCount: 300,
      spread: 100,
      origin: { y: 0.6 },
    })
  }

  // 处理番茄钟完成事件
  const handlePomodoroComplete = (isBreakStarted: boolean) => {
    if (isBreakStarted) {
      showBigConfetti()
      localStorage.setItem('pomodoroCompleted', 'true')
    } else {
      localStorage.removeItem('pomodoroCompleted')
    }
  }

  // 检查番茄钟完成状态并显示礼花效果
  const checkPomodoroCompletion = () => {
    if (!document.hidden) {
      const pomodoroCompleted = localStorage.getItem('pomodoroCompleted')
      if (pomodoroCompleted === 'true') {
        showBigConfetti()
        localStorage.removeItem('pomodoroCompleted')
      }
    }
  }

  // 处理按键事件
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showCharts.value) {
      showCharts.value = false
    }
  }

  return {
    showHistory,
    showCharts,
    isSmallScreen,
    themeIcon,
    themeTooltip,
    toggleTheme,
    toggleHistory,
    closeHistory,
    closeCharts,
    handlePomodoroComplete,
    checkPomodoroCompletion,
    onKeyDown,
  }
}
