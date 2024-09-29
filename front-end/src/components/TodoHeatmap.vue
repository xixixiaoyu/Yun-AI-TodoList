<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, registerables } from 'chart.js'
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'
import { useTodos } from '../composables/useTodos'

// 注册所有 Chart.js 组件
Chart.register(...registerables)

// 注册 Matrix 控制器和元素
Chart.register(MatrixController, MatrixElement)

const { t } = useI18n()
const { todos, getCompletedTodosByDate } = useTodos()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const updateChart = () => {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return

  const completedTodos = getCompletedTodosByDate()
  const labels = Object.keys(completedTodos).sort()
  const data = labels.map(date => completedTodos[date])

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [
        {
          label: t('completedTodos'),
          data: labels.map((date, index) => ({
            x: new Date(date).getDay(),
            y: Math.floor(index / 7),
            v: completedTodos[date]
          })),
          backgroundColor(context) {
            const value = context.dataset.data[context.dataIndex].v
            const alpha = value / Math.max(...Object.values(completedTodos))
            return `rgba(0, 200, 0, ${alpha})`
          },
          width: ({ chart }) => (chart.chartArea || {}).width / 7 - 1,
          height: ({ chart }) => (chart.chartArea || {}).height / Math.ceil(labels.length / 7) - 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'category',
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          offset: true,
          ticks: {
            align: 'start'
          }
        },
        y: {
          type: 'category',
          labels: Array.from({ length: Math.ceil(labels.length / 7) }, (_, i) => i + 1),
          offset: true,
          reverse: true
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title(context) {
              const date = labels[context[0].dataIndex]
              return new Date(date).toLocaleDateString(t('locale'), {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            },
            label(context) {
              const value = context.dataset.data[context.dataIndex].v
              return t('completedTodosCount', { count: value })
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  })
}

onMounted(updateChart)
watch(todos, updateChart, { deep: true })
</script>

<template>
  <div class="todo-heatmap">
    <h2>{{ t('todoHeatmap') }}</h2>
    <canvas ref="chartRef"></canvas>
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

canvas {
  max-width: 100%;
  height: auto;
}
</style>
