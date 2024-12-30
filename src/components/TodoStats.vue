<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from 'chart.js/auto'
import { useTodos } from '../composables/useTodos'

const { t } = useI18n()
const { todos } = useTodos()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

// 计算统计数据
const getStats = () => {
  const completedCount = todos.value.filter((todo) => todo.completed).length
  const pendingCount = todos.value.filter((todo) => !todo.completed).length
  const totalCount = todos.value.length

  // 按项目分组统计
  const projectStats = todos.value.reduce(
    (acc, todo) => {
      const projectId = todo.projectId || 'default'
      if (!acc[projectId]) {
        acc[projectId] = { completed: 0, pending: 0 }
      }
      if (todo.completed) {
        acc[projectId].completed++
      } else {
        acc[projectId].pending++
      }
      return acc
    },
    {} as Record<string, { completed: number; pending: number }>
  )

  return {
    completedCount,
    pendingCount,
    totalCount,
    projectStats,
  }
}

const updateChart = () => {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return

  const stats = getStats()

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [t('completed'), t('pending')],
      datasets: [
        {
          data: [stats.completedCount, stats.pendingCount],
          backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: t('todoProgress'),
        },
      },
    },
  } as any) // 使用 any 类型来避免类型检查问题
}

onMounted(updateChart)
watch(todos, updateChart, { deep: true })

// 在组件卸载时清理图表实例
onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
})
</script>

<template>
  <div class="todo-stats">
    <h2>{{ t('todoStats') }}</h2>
    <div class="stats-container">
      <canvas ref="chartRef" />
    </div>
  </div>
</template>

<style scoped>
.todo-stats {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  width: 100%;
}

.stats-container {
  width: 100%;
  margin: 0 auto;
}

h2 {
  margin-bottom: 1rem;
  color: var(--text-color);
  font-size: 1.2rem;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>
