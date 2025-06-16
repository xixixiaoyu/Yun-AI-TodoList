<template>
  <div v-if="showMonitor" class="performance-monitor" :class="{ minimized: isMinimized }">
    <div class="monitor-header" @click="toggleMinimized">
      <div class="monitor-title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="M7 12l3-3 3 3 5-5" />
        </svg>
        {{ t('performance.monitor', 'Performance') }}
      </div>
      <button class="close-button" @click.stop="close">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div v-if="!isMinimized" class="monitor-content">
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">{{ t('performance.memory', 'Memory') }}</div>
          <div class="metric-value" :class="getMemoryStatus()">
            {{ formatMemory(memoryUsage.usedJSHeapSize) }}
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">{{ t('performance.fps', 'FPS') }}</div>
          <div class="metric-value" :class="getFpsStatus()">
            {{ currentFps }}
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">{{ t('performance.renderTime', 'Render') }}</div>
          <div class="metric-value" :class="getRenderTimeStatus()">{{ averageRenderTime }}ms</div>
        </div>

        <div class="metric-item">
          <div class="metric-label">{{ t('performance.networkTime', 'Network') }}</div>
          <div class="metric-value" :class="getNetworkTimeStatus()">{{ averageNetworkTime }}ms</div>
        </div>
      </div>

      <div class="performance-chart">
        <canvas ref="chartCanvas" width="200" height="60"></canvas>
      </div>

      <div class="monitor-actions">
        <button class="action-button" @click="clearMetrics">
          {{ t('performance.clear', 'Clear') }}
        </button>
        <button class="action-button" @click="exportReport">
          {{ t('performance.export', 'Export') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePerformanceMonitor } from '@/utils/performance'

interface Props {
  autoStart?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  position: 'top-right',
})

const { t } = useI18n()
const { measure, measureAsync, getReport, getMemoryUsage } = usePerformanceMonitor()

const showMonitor = ref(props.autoStart)
const isMinimized = ref(false)
const chartCanvas = ref<HTMLCanvasElement>()

// 性能指标
const memoryUsage = ref({ usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 })
const currentFps = ref(60)
const averageRenderTime = ref(0)
const averageNetworkTime = ref(0)

// FPS 计算
let frameCount = 0
let lastTime = performance.now()
let fpsHistory: number[] = []

// 性能历史数据
const performanceHistory = ref<number[]>([])

const updateMetrics = () => {
  // 更新内存使用情况
  const memory = getMemoryUsage()
  if (memory) {
    memoryUsage.value = memory
  }

  // 更新性能报告
  const report = getReport()
  if (report.renderMetrics.length > 0) {
    averageRenderTime.value = Math.round(
      report.renderMetrics.reduce((sum, m) => sum + m.value, 0) / report.renderMetrics.length
    )
  }

  if (report.networkMetrics.length > 0) {
    averageNetworkTime.value = Math.round(
      report.networkMetrics.reduce((sum, m) => sum + m.value, 0) / report.networkMetrics.length
    )
  }
}

const calculateFPS = () => {
  frameCount++
  const now = performance.now()

  if (now - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastTime))
    currentFps.value = fps
    fpsHistory.push(fps)

    if (fpsHistory.length > 60) {
      fpsHistory = fpsHistory.slice(-60)
    }

    frameCount = 0
    lastTime = now

    updateChart()
  }

  if (showMonitor.value) {
    requestAnimationFrame(calculateFPS)
  }
}

const updateChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const width = chartCanvas.value.width
  const height = chartCanvas.value.height

  ctx.clearRect(0, 0, width, height)

  // 绘制 FPS 历史图表
  ctx.strokeStyle = '#4CAF50'
  ctx.lineWidth = 1
  ctx.beginPath()

  fpsHistory.forEach((fps, index) => {
    const x = (index / (fpsHistory.length - 1)) * width
    const y = height - (fps / 60) * height

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

// 状态判断方法
const getMemoryStatus = () => {
  const used = memoryUsage.value.usedJSHeapSize
  if (used > 100 * 1024 * 1024) return 'status-error'
  if (used > 50 * 1024 * 1024) return 'status-warning'
  return 'status-good'
}

const getFpsStatus = () => {
  if (currentFps.value < 30) return 'status-error'
  if (currentFps.value < 50) return 'status-warning'
  return 'status-good'
}

const getRenderTimeStatus = () => {
  if (averageRenderTime.value > 50) return 'status-error'
  if (averageRenderTime.value > 16) return 'status-warning'
  return 'status-good'
}

const getNetworkTimeStatus = () => {
  if (averageNetworkTime.value > 3000) return 'status-error'
  if (averageNetworkTime.value > 1000) return 'status-warning'
  return 'status-good'
}

const formatMemory = (bytes: number) => {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)}MB`
}

const toggleMinimized = () => {
  isMinimized.value = !isMinimized.value
}

const close = () => {
  showMonitor.value = false
}

const clearMetrics = () => {
  fpsHistory = []
  performanceHistory.value = []
  updateChart()
}

const exportReport = () => {
  const report = getReport()
  const data = {
    timestamp: new Date().toISOString(),
    memory: memoryUsage.value,
    fps: { current: currentFps.value, history: fpsHistory },
    performance: report,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 公开方法
const show = () => {
  showMonitor.value = true
  nextTick(() => {
    calculateFPS()
  })
}

const hide = () => {
  showMonitor.value = false
}

// 定时更新指标
let metricsInterval: number

onMounted(() => {
  if (props.autoStart) {
    calculateFPS()
  }

  metricsInterval = setInterval(updateMetrics, 1000)
})

onUnmounted(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval)
  }
})

defineExpose({
  show,
  hide,
  measure,
  measureAsync,
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  z-index: 9999;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  font-size: 0.8rem;
  min-width: 200px;
  max-width: 300px;
}

.performance-monitor.minimized {
  min-width: auto;
}

/* 根据 position prop 设置位置 */
.performance-monitor {
  top: 20px;
  right: 20px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--hover-bg-color);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  user-select: none;
}

.monitor-title {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
  color: var(--text-color);
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0.7;
  padding: 0.25rem;
  border-radius: 2px;
}

.close-button:hover {
  opacity: 1;
  background: var(--error-color);
  color: white;
}

.monitor-content {
  padding: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.metric-item {
  text-align: center;
}

.metric-label {
  font-size: 0.7rem;
  color: var(--text-color);
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-weight: bold;
  font-size: 0.9rem;
}

.status-good {
  color: #4caf50;
}
.status-warning {
  color: #ff9800;
}
.status-error {
  color: #f44336;
}

.performance-chart {
  margin: 0.5rem 0;
  text-align: center;
}

.performance-chart canvas {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
}

.monitor-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  flex: 1;
  padding: 0.25rem 0.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
}

.action-button:hover {
  background: var(--primary-hover-color);
}

@media (max-width: 768px) {
  .performance-monitor {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    max-width: none;
  }
}
</style>
