<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePomodoroStats } from '../composables/usePomodoroStats'
import Chart from 'chart.js/auto'

const { t } = useI18n()
const { getTotalWorkTime, getPomodoroCountByDay } = usePomodoroStats()

const chartRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const updateChart = () => {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return

  const countByDay = getPomodoroCountByDay.value
  const labels = Object.keys(countByDay)
  const data = Object.values(countByDay)

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: t('pomodorosCompleted'),
          data,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

onMounted(updateChart)
watch(getPomodoroCountByDay, updateChart)
</script>

<template>
  <div class="pomodoro-stats">
    <h2>{{ t('pomodoroStats') }}</h2>
    <p>{{ t('totalWorkTime', { time: getTotalWorkTime }) }}</p>
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<style scoped>
.pomodoro-stats {
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
