<template>
  <div class="todo-completion-chart">
    <div class="stats-overview">
      <div class="stat-item">
        <div class="stat-value">{{ getOverallStats.total }}</div>
        <div class="stat-label">{{ t('totalTasks') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ getOverallStats.completed }}</div>
        <div class="stat-label">{{ t('completed') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ getOverallStats.pending }}</div>
        <div class="stat-label">{{ t('pending') }}</div>
      </div>
      <div class="stat-item completion-rate">
        <div class="stat-value">{{ getOverallStats.completionRate }}%</div>
        <div class="stat-label">{{ t('completionRate') }}</div>
      </div>
    </div>

    <div class="chart-container">
      <canvas ref="chartRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto'
import { useTodos } from '../../composables/useTodos'

const { t } = useI18n()
const { todos, getCompletedTodosByDate } = useTodos()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const getCompletionTrendData = () => {
  const completedByDate = getCompletedTodosByDate()
  const today = new Date()
  const labels: string[] = []
  const data: number[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const displayDate = date.toLocaleDateString(t('locale'), {
      month: 'short',
      day: 'numeric',
    })

    labels.push(displayDate)
    data.push(completedByDate[dateStr] || 0)
  }

  return { labels, data }
}

const getOverallStats = computed(() => {
  const total = todos.value.length
  const completed = todos.value.filter((todo) => todo.completed).length
  const pending = total - completed
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    pending,
    completionRate,
  }
})

const updateChart = () => {
  if (!chartRef.value) {
    return
  }

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) {
    return
  }

  const { labels, data } = getCompletionTrendData()

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('completedTodos'),
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: t('completionTrend'),
          font: {
            size: 16,
            weight: 'bold',
          },
          color: 'var(--text-color)',
          padding: {
            bottom: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (context) => {
              return context[0].label
            },
            label: (context) => {
              const value = context.parsed.y
              return `${t('completed')}: ${value} ${value === 1 ? t('task') : t('tasks')}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'var(--text-color)',
            font: {
              size: 12,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: 'var(--text-color)',
            font: {
              size: 12,
            },
            stepSize: 1,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  })
}

onMounted(updateChart)
watch(() => todos.value, updateChart, { deep: true })

onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
})

defineOptions({
  name: 'TodoCompletionChart',
})
</script>

<style scoped>
.todo-completion-chart {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 126, 103, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 126, 103, 0.15);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.75;
  font-weight: 600;
  letter-spacing: 0.025em;
}

.completion-rate .stat-value {
  background: linear-gradient(135deg, #ff7e67, #68a295);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chart-container {
  height: 420px;
  padding: 1.5rem;
  background: var(--card-bg-color);
  border-radius: 16px;
  border: 1px solid rgba(255, 126, 103, 0.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .todo-completion-chart {
    max-width: 800px;
  }

  .stats-overview {
    gap: 1.5rem;
    padding: 2rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .chart-container {
    height: 450px;
    padding: 2rem;
  }
}

/* 中等屏幕 */
@media (max-width: 1024px) {
  .stats-overview {
    gap: 1rem;
    padding: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .chart-container {
    height: 380px;
    padding: 1.25rem;
  }
}

/* 平板设备 */
@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.4rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .chart-container {
    height: 320px;
    padding: 1rem;
  }
}

/* 大手机 */
@media (max-width: 640px) {
  .stats-overview {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .stat-item {
    padding: 0.5rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .chart-container {
    height: 300px;
    padding: 0.75rem;
  }
}

/* 小手机 */
@media (max-width: 480px) {
  .todo-completion-chart {
    max-width: 100%;
  }

  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .stat-item {
    padding: 0.5rem;
  }

  .stat-value {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .chart-container {
    height: 280px;
    padding: 0.75rem;
  }
}
</style>
