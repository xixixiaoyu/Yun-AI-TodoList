import { ref, watch, onMounted, onUnmounted } from 'vue'

export function useTheme() {
	const theme = ref(localStorage.getItem('theme') || 'auto')
	const systemTheme = ref(getSystemTheme())

	function getSystemTheme() {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	}

	const toggleTheme = () => {
		if (theme.value === 'auto') {
			theme.value = systemTheme.value === 'light' ? 'dark' : 'light'
		} else {
			theme.value = theme.value === 'light' ? 'dark' : 'auto'
		}
	}

	const updateTheme = () => {
		const currentTheme = theme.value === 'auto' ? systemTheme.value : theme.value
		document.documentElement.setAttribute('data-theme', currentTheme)
		// 添加这一行来立即更新背景颜色
		document.body.style.backgroundColor = getComputedStyle(document.documentElement)
			.getPropertyValue('--bg-color')
			.trim()
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

	const initTheme = () => {
		updateTheme()
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		mediaQuery.addListener(handleSystemThemeChange)
	}

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
