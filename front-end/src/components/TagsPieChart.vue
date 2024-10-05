<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, ChartData, ChartOptions } from 'chart.js/auto'
import { useI18n } from 'vue-i18n'
import { useTodos } from '../composables/useTodos'

const { t } = useI18n()
const { todos } = useTodos()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const updateChart = () => {
	if (!chartRef.value) return

	const ctx = chartRef.value.getContext('2d')
	if (!ctx) return

	const tagCounts: { [key: string]: number } = {}
	todos.value.forEach(todo => {
		todo.tags.forEach(tag => {
			tagCounts[tag] = (tagCounts[tag] || 0) + 1
		})
	})

	const labels = Object.keys(tagCounts)
	const data = Object.values(tagCounts)

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
		chart.destroy()
	}

	chart = new Chart(ctx, {
		type: 'pie',
		data: chartData,
		options,
	})
}

onMounted(updateChart)
watch(todos, updateChart, { deep: true })
</script>

<template>
	<div class="tags-pie-chart">
		<canvas ref="chartRef"></canvas>
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
</style>
