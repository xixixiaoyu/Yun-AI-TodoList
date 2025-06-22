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
  max-width: 600px;
  margin: 0 auto;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 126, 103, 0.1);
}

.stat-item {
  text-align: center;
  padding: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.7;
  font-weight: 500;
}

.completion-rate .stat-value {
  color: rgba(75, 192, 192, 1);
}

.chart-container {
  height: 800px;
  padding: 1rem;
  background: var(--card-bg-color);
  border-radius: 12px;
  border: 1px solid rgba(255, 126, 103, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .chart-container {
    height: 600px;
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .stat-item {
    padding: 0.25rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .chart-container {
    height: 450px;
    padding: 0.5rem;
  }
}
</style>
