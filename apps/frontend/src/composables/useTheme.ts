import type { ThemeValue } from '../types/theme'
import { configurePWAThemeColor } from '../utils/pwa-config'

export function useTheme() {
  const theme = ref<ThemeValue>((localStorage.getItem('theme') as ThemeValue) || 'auto')
  const systemTheme = ref<'light' | 'dark'>(getSystemTheme())

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const toggleTheme = () => {
    if (theme.value === 'auto') {
      theme.value = 'light'
    } else if (theme.value === 'light') {
      theme.value = 'dark'
    } else {
      theme.value = 'auto'
    }
  }

  const updateTheme = () => {
    const currentTheme = theme.value === 'auto' ? systemTheme.value : theme.value
    document.documentElement.setAttribute('data-theme', currentTheme)

    // 更新 PWA 状态栏主题色
    try {
      configurePWAThemeColor()
    } catch (error) {
      console.warn('Failed to update PWA theme color:', error)
    }
  }

  const initTheme = () => {
    updateTheme()
  }

  watch(
    [theme, systemTheme],
    () => {
      localStorage.setItem('theme', theme.value)
      updateTheme()
    },
    { immediate: true }
  )

  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    systemTheme.value = e.matches ? 'dark' : 'light'
  }

  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addListener(handleSystemThemeChange)
    updateTheme()
  })

  onUnmounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.removeListener(handleSystemThemeChange)
  })

  return {
    theme,
    systemTheme,
    toggleTheme,
    initTheme,
  }
}
