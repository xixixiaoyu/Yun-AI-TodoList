import { ref, watch, onMounted, onUnmounted } from 'vue'

export function useTheme() {
  const theme = ref(localStorage.getItem('theme') || 'auto')
  const systemTheme = ref(getSystemTheme())

  // 获取系统主题
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // 切换主题
  const toggleTheme = () => {
    if (theme.value === 'auto') {
      theme.value = 'light'
    } else if (theme.value === 'light') {
      theme.value = 'dark'
    } else {
      theme.value = 'auto'
    }
  }

  // 更新主题
  const updateTheme = () => {
    const currentTheme = theme.value === 'auto' ? systemTheme.value : theme.value
    document.documentElement.setAttribute('data-theme', currentTheme)
  }

  // 初始化主题
  const initTheme = () => {
    updateTheme()
  }

  // 监听主题变化
  watch(
    [theme, systemTheme],
    () => {
      localStorage.setItem('theme', theme.value)
      updateTheme()
    },
    { immediate: true }
  )

  // 处理系统主题变化
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    systemTheme.value = e.matches ? 'dark' : 'light'
  }

  // 组件挂载时添加监听器
  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addListener(handleSystemThemeChange)
    updateTheme()
  })

  // 组件卸载时移除监听器
  onUnmounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.removeListener(handleSystemThemeChange)
  })

  return {
    theme,
    systemTheme,
    toggleTheme,
    initTheme // 确保这里导出了 initTheme 函数
  }
}
