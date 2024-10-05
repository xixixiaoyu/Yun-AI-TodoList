<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { Chart, ChartData, ChartOptions } from 'chart.js/auto'
import { useI18n } from 'vue-i18n'

// 定义 `Todo` 类型
type Todo = {
	id: number
	title: string
	completed: boolean
	tags: string[]
	// 添加其他属性
}

const props = defineProps<{
	todos: Todo[]
}>()

const { t } = useI18n()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const MIN_TAGS_TO_SHOW = 2 // 最少需要显示的标签数量

const tagCounts = computed(() => {
	const counts: { [key: string]: number } = {}
	props.todos.forEach(todo => {
		todo.tags.forEach(tag => {
			counts[tag] = (counts[tag] || 0) + 1
		})
	})
	return counts
})

const hasEnoughTags = computed(
	() => Object.keys(tagCounts.value).length >= MIN_TAGS_TO_SHOW
)

const updateChart = async () => {
	if (!hasEnoughTags.value) return

	// 等待下一个 DOM 更新周期
	await nextTick()

	const ctx = chartRef.value?.getContext('2d')
	if (!ctx) return

	const labels = Object.keys(tagCounts.value)
	const data = Object.values(tagCounts.value)

	const chartData: ChartData = {
		labels,
		datasets: [
			{
				data,
				backgroundColor: [
					'#FF6384',
					'#36A2EB',
					'#FFCE56',
					'#4BC0C0',
					'#9966FF',
					'#FF9F40',
					'#FF6384',
					'#36A2EB',
					'#FFCE56',
				],
			},
		],
	}

	const options: ChartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'right',
			},
			title: {
				display: true,
				text: t('tagDistribution'),
			},
		},
	}

	if (chart) {
		chart.data = chartData
		chart.options = options
		chart.update()
	} else {
		chart = new Chart(ctx, {
			type: 'pie',
			data: chartData,
			options,
		})
	}
}

onMounted(updateChart)

// 使用 watch 来监听 todos 的变化，并在变化时更新图表
watch(() => props.todos, updateChart, { deep: true, immediate: true })
</script>

<template>
	<div class="tags-pie-chart">
		<h2>{{ t('tagDistribution') }}</h2>
		<template v-if="hasEnoughTags">
			<canvas ref="chartRef"></canvas>
		</template>
		<template v-else>
			<div class="empty-state">
				<p>{{ t('notEnoughTags') }}</p>
				<p>{{ t('addMoreTags') }}</p>
			</div>
		</template>
	</div>
</template>

<style scoped>
.tags-pie-chart {
	margin-top: 2rem;
	padding: 1rem;
	background-color: var(--card-bg-color);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
}

h2 {
	margin-bottom: 1rem;
	color: var(--text-color);
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 200px;
	text-align: center;
	color: var(--text-color-light);
}
</style>
