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
	}
}
