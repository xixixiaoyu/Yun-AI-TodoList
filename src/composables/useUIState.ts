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

  // 切换图表显示状态
  const toggleCharts = () => {
    showCharts.value = !showCharts.value
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
      origin: { y: 0.6 }
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
    // ESC 键关闭弹窗
    if (event.key === 'Escape') {
      if (showCharts.value) {
        showCharts.value = false
        return
      }
    }

    // 快捷键（需要按住 Ctrl/Cmd）
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
