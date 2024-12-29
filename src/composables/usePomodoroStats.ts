import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'pomodoroStats'

interface PomodoroStats {
	completedPomodoros: number[]
}

const getStoredStats = (): PomodoroStats => {
	const storedStats = localStorage.getItem(STORAGE_KEY)
	return storedStats ? JSON.parse(storedStats) : { completedPomodoros: [] }
}

const saveStats = (stats: PomodoroStats) => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

export function usePomodoroStats() {
	const stats = ref<PomodoroStats>(getStoredStats())

	const addCompletedPomodoro = () => {
		stats.value.completedPomodoros.push(Date.now())
		saveStats(stats.value)
	}

	const getTotalWorkTime = computed(() => {
		return stats.value.completedPomodoros.length * 25 // 25 minutes per pomodoro
	})

	const getPomodoroCountByDay = computed(() => {
		const countByDay: { [key: string]: number } = {}
		stats.value.completedPomodoros.forEach((timestamp) => {
			const date = new Date(timestamp).toLocaleDateString()
			countByDay[date] = (countByDay[date] || 0) + 1
		})
		return countByDay
	})

	// 清除统计数据的方法（可选）
	const clearStats = () => {
		stats.value = { completedPomodoros: [] }
		saveStats(stats.value)
	}

	onMounted(() => {
		// 在组件挂载时从 localStorage 加载数据
		stats.value = getStoredStats()
	})

	return {
		addCompletedPomodoro,
		getTotalWorkTime,
		getPomodoroCountByDay,
		clearStats,
	}
}
