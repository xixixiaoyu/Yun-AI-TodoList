<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTodos } from '../composables/useTodos'
import * as d3 from 'd3'

const { t } = useI18n()
const { getCompletedTodosByDate } = useTodos()

const svgRef = ref<SVGSVGElement | null>(null)

const cellSize = ref(11)
const cellGap = ref(2)
const weekWidth = computed(() => cellSize.value + cellGap.value)

// 添加一个函数来更新尺寸
const updateDimensions = () => {
	const width = window.innerWidth
	if (width < 768) {
		cellSize.value = 8
		cellGap.value = 1
	} else {
		cellSize.value = 11
		cellGap.value = 2
	}
}

// 在组件挂载时和窗口大小改变时更新尺寸
onMounted(() => {
	updateDimensions()
	window.addEventListener('resize', updateDimensions)
})

onUnmounted(() => {
	window.removeEventListener('resize', updateDimensions)
})

const updateHeatmap = () => {
	if (!svgRef.value) return

	const completedTodos = getCompletedTodosByDate()
	const endDate = new Date()
	const startDate = new Date(endDate)
	startDate.setFullYear(startDate.getFullYear() - 1)

	const svg = d3.select(svgRef.value)
	svg.selectAll('*').remove()

	const colorScale = d3
		.scaleQuantize<string>()
		.domain([0, d3.max(Object.values(completedTodos)) || 1])
		.range(['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'])

	const weeks = d3.timeWeeks(startDate, endDate)
	const height = 7 * (cellSize.value + cellGap.value) + cellGap.value

	svg.attr('width', weeks.length * weekWidth.value + cellGap.value).attr('height', height)

	const tooltip = d3
		.select('body')
		.append('div')
		.attr('class', 'tooltip')
		.style('opacity', 0)
		.style('position', 'absolute')
		.style('background-color', 'rgba(0,0,0,0.7)')
		.style('color', 'white')
		.style('padding', '5px')
		.style('border-radius', '5px')
		.style('pointer-events', 'none')

	const days = svg
		.selectAll('.day')
		.data(d3.timeDays(startDate, endDate))
		.enter()
		.append('rect')
		.attr('class', 'day')
		.attr('width', cellSize.value)
		.attr('height', cellSize.value)
		.attr(
			'x',
			d => d3.timeWeek.count(d3.timeYear(d), d) * weekWidth.value + cellGap.value
		)
		.attr('y', d => d.getDay() * (cellSize.value + cellGap.value) + cellGap.value)
		.attr('fill', d => {
			const dateString = d.toISOString().split('T')[0]
			return colorScale(completedTodos[dateString] || 0)
		})
		.on('mouseover', (event, d) => {
			const dateString = d.toISOString().split('T')[0]
			const count = completedTodos[dateString] || 0
			tooltip.transition().duration(200).style('opacity', 0.9)
			tooltip
				.html(`${d.toLocaleDateString(t('locale'))}: ${count} ${t('completedTodos')}`)
				.style('left', event.pageX + 10 + 'px')
				.style('top', event.pageY - 28 + 'px')
		})
		.on('mouseout', () => {
			tooltip.transition().duration(500).style('opacity', 0)
		})

	// Add day labels
	const dayLabels = ['', t('mon'), '', t('wed'), '', t('fri'), '']
	svg
		.selectAll('.day-label')
		.data(dayLabels)
		.enter()
		.append('text')
		.attr('class', 'day-label')
		.attr('x', -5)
		.attr('y', (d, i) => i * (cellSize.value + cellGap.value) + cellSize.value)
		.style('text-anchor', 'end')
		.style('font-size', '9px')
		.style('fill', '#767676')
		.text(d => d)

	// Add month labels
	const monthLabels = svg
		.selectAll('.month-label')
		.data(d3.timeMonths(startDate, endDate))
		.enter()
		.append('text')
		.attr('class', 'month-label')
		.attr('x', d => d3.timeWeek.count(d3.timeYear(startDate), d) * weekWidth.value)
		.attr('y', -5)
		.style('text-anchor', 'start')
		.style('font-size', '10px')
		.style('fill', '#767676')
		.text(d => d.toLocaleDateString(t('locale'), { month: 'short' }))
}

// 当 cellSize 或 cellGap 改变时，重新渲染热力图
watch([cellSize, cellGap], updateHeatmap)

onMounted(updateHeatmap)
watch(() => getCompletedTodosByDate(), updateHeatmap, { deep: true })

// 添加这个新的函数
const handleWheel = (event: WheelEvent) => {
	const container = event.currentTarget as HTMLElement
	if (container) {
		container.scrollLeft += event.deltaY
		event.preventDefault()
	}
}
</script>

<template>
	<div class="todo-heatmap">
		<h2>{{ t('todoHeatmap') }}</h2>
		<div class="heatmap-container" @wheel="handleWheel">
			<svg ref="svgRef"></svg>
		</div>
		<div class="legend">
			<span>{{ t('less') }}</span>
			<div class="legend-colors">
				<div class="legend-color" style="background-color: #ebedf0"></div>
				<div class="legend-color" style="background-color: #9be9a8"></div>
				<div class="legend-color" style="background-color: #40c463"></div>
				<div class="legend-color" style="background-color: #30a14e"></div>
				<div class="legend-color" style="background-color: #216e39"></div>
			</div>
			<span>{{ t('more') }}</span>
		</div>
	</div>
</template>

<style scoped>
.todo-heatmap {
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

.heatmap-container {
	overflow-x: auto;
	padding-bottom: 1rem;
	white-space: nowrap;
	-webkit-overflow-scrolling: touch; /* 为 iOS 设备添加平滑滚动 */
	scrollbar-width: thin; /* 为 Firefox 设置细滚动条 */
	scrollbar-color: var(--button-bg-color) var(--bg-color); /* 为 Firefox 设置滚动条颜色 */
}

.legend {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	margin-top: 1rem;
	font-size: 12px;
	color: var(--text-color);
}

.legend-colors {
	display: flex;
	gap: 2px;
	margin: 0 4px;
}

.legend-color {
	width: 10px;
	height: 10px;
	border-radius: 2px;
}

:global(.tooltip) {
	font-family: 'LXGW WenKai Screen', sans-serif;
	font-size: 12px;
}

/* 响应式适配 */
@media (max-width: 768px) {
	.todo-heatmap {
		padding: 0.5rem;
	}

	.heatmap-container {
		overflow-x: scroll;
		-webkit-overflow-scrolling: touch;
	}

	.legend {
		justify-content: center;
		flex-wrap: wrap;
	}

	.legend > span {
		font-size: 10px;
	}

	.legend-color {
		width: 8px;
		height: 8px;
	}
}
</style>
