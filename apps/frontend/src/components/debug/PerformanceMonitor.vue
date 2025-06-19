<template>
  <div class="performance-monitor">
    <div class="monitor-header">
      <h3 class="monitor-title">性能监控</h3>
      <div class="monitor-controls">
        <button class="control-button" :class="{ active: isMonitoring }" @click="toggleMonitoring">
          {{ isMonitoring ? '停止监控' : '开始监控' }}
        </button>
        <button class="control-button" @click="refreshMetrics">刷新数据</button>
        <button class="control-button" @click="exportReport">导出报告</button>
      </div>
    </div>

    <div v-if="performanceData" class="monitor-content">
      <!-- 性能评分 -->
      <div class="performance-score">
        <div class="score-circle" :class="getScoreClass(performanceScore.overall)">
          <span class="score-value">{{ performanceScore.overall }}</span>
          <span class="score-label">总分</span>
        </div>

        <div class="score-details">
          <div class="score-item">
            <span class="score-name">加载性能</span>
            <div class="score-bar">
              <div
                class="score-fill"
                :style="{ width: `${performanceScore.details.loading}%` }"
                :class="getScoreClass(performanceScore.details.loading)"
              ></div>
            </div>
            <span class="score-number">{{ performanceScore.details.loading }}</span>
          </div>

          <div class="score-item">
            <span class="score-name">交互性</span>
            <div class="score-bar">
              <div
                class="score-fill"
                :style="{ width: `${performanceScore.details.interactivity}%` }"
                :class="getScoreClass(performanceScore.details.interactivity)"
              ></div>
            </div>
            <span class="score-number">{{ performanceScore.details.interactivity }}</span>
          </div>

          <div class="score-item">
            <span class="score-name">视觉稳定性</span>
            <div class="score-bar">
              <div
                class="score-fill"
                :style="{ width: `${performanceScore.details.visualStability}%` }"
                :class="getScoreClass(performanceScore.details.visualStability)"
              ></div>
            </div>
            <span class="score-number">{{ performanceScore.details.visualStability }}</span>
          </div>

          <div class="score-item">
            <span class="score-name">内存使用</span>
            <div class="score-bar">
              <div
                class="score-fill"
                :style="{ width: `${performanceScore.details.memory}%` }"
                :class="getScoreClass(performanceScore.details.memory)"
              ></div>
            </div>
            <span class="score-number">{{ performanceScore.details.memory }}</span>
          </div>
        </div>
      </div>

      <!-- 核心指标 -->
      <div class="metrics-grid">
        <div class="metric-card">
          <h4 class="metric-title">首次内容绘制</h4>
          <div class="metric-value">{{ formatTime(performanceData.firstContentfulPaint) }}</div>
          <div
            class="metric-status"
            :class="getMetricStatus('fcp', performanceData.firstContentfulPaint)"
          >
            {{ getMetricStatusText('fcp', performanceData.firstContentfulPaint) }}
          </div>
        </div>

        <div class="metric-card">
          <h4 class="metric-title">最大内容绘制</h4>
          <div class="metric-value">{{ formatTime(performanceData.largestContentfulPaint) }}</div>
          <div
            class="metric-status"
            :class="getMetricStatus('lcp', performanceData.largestContentfulPaint)"
          >
            {{ getMetricStatusText('lcp', performanceData.largestContentfulPaint) }}
          </div>
        </div>

        <div class="metric-card">
          <h4 class="metric-title">首次输入延迟</h4>
          <div class="metric-value">{{ formatTime(performanceData.firstInputDelay) }}</div>
          <div
            class="metric-status"
            :class="getMetricStatus('fid', performanceData.firstInputDelay)"
          >
            {{ getMetricStatusText('fid', performanceData.firstInputDelay) }}
          </div>
        </div>

        <div class="metric-card">
          <h4 class="metric-title">累积布局偏移</h4>
          <div class="metric-value">{{ formatCLS(performanceData.cumulativeLayoutShift) }}</div>
          <div
            class="metric-status"
            :class="getMetricStatus('cls', performanceData.cumulativeLayoutShift)"
          >
            {{ getMetricStatusText('cls', performanceData.cumulativeLayoutShift) }}
          </div>
        </div>
      </div>

      <!-- 内存和存储使用 -->
      <div class="usage-section">
        <div class="usage-card">
          <h4 class="usage-title">内存使用</h4>
          <div class="usage-chart">
            <div class="usage-bar">
              <div
                class="usage-fill memory-fill"
                :style="{ width: `${performanceData.memoryUsage?.percentage || 0}%` }"
              ></div>
            </div>
            <div class="usage-text">
              {{ formatBytes(performanceData.memoryUsage?.used || 0) }} /
              {{ formatBytes(performanceData.memoryUsage?.total || 0) }}
              ({{ Math.round(performanceData.memoryUsage?.percentage || 0) }}%)
            </div>
          </div>
        </div>

        <div class="usage-card">
          <h4 class="usage-title">存储使用</h4>
          <div class="storage-details">
            <div class="storage-item">
              <span>localStorage:</span>
              <span>{{ formatBytes(performanceData.storageUsage?.localStorage || 0) }}</span>
            </div>
            <div class="storage-item">
              <span>sessionStorage:</span>
              <span>{{ formatBytes(performanceData.storageUsage?.sessionStorage || 0) }}</span>
            </div>
            <div class="storage-item">
              <span>IndexedDB:</span>
              <span>{{ formatBytes(performanceData.storageUsage?.indexedDB || 0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义指标 -->
      <div v-if="hasCustomMetrics" class="custom-metrics">
        <h4 class="section-title">自定义指标</h4>
        <div class="custom-metrics-grid">
          <div v-if="performanceData.aiResponseTime?.length" class="custom-metric">
            <span class="custom-metric-name">AI 响应时间</span>
            <span class="custom-metric-value">
              平均: {{ formatTime(getAverageResponseTime()) }}
            </span>
          </div>

          <div v-if="performanceData.messageRenderTime?.length" class="custom-metric">
            <span class="custom-metric-name">消息渲染时间</span>
            <span class="custom-metric-value">
              平均: {{ formatTime(getAverageRenderTime()) }}
            </span>
          </div>

          <div v-if="performanceData.searchTime?.length" class="custom-metric">
            <span class="custom-metric-name">搜索时间</span>
            <span class="custom-metric-value">
              平均: {{ formatTime(getAverageSearchTime()) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 优化建议 -->
      <div v-if="optimizationSuggestions.length" class="suggestions">
        <h4 class="section-title">优化建议</h4>
        <ul class="suggestions-list">
          <li
            v-for="(suggestion, index) in optimizationSuggestions"
            :key="index"
            class="suggestion-item"
          >
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="monitor-placeholder">
      <p>点击"开始监控"开始收集性能数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  performanceMonitor,
  getPerformanceOptimizationSuggestions,
} from '../../utils/performanceMonitor'
import type { PerformanceMetrics } from '../../utils/performanceMonitor'

const isMonitoring = ref(false)
const performanceData = ref<PerformanceMetrics | null>(null)
const updateInterval = ref<number | null>(null)

const performanceScore = computed(() => {
  if (!performanceData.value) {
    return { overall: 0, details: { loading: 0, interactivity: 0, visualStability: 0, memory: 0 } }
  }
  return performanceMonitor.getPerformanceScore()
})

const optimizationSuggestions = computed(() => {
  if (!performanceData.value) return []
  return getPerformanceOptimizationSuggestions(performanceData.value)
})

const hasCustomMetrics = computed(() => {
  return !!(
    performanceData.value?.aiResponseTime?.length ||
    performanceData.value?.messageRenderTime?.length ||
    performanceData.value?.searchTime?.length
  )
})

const toggleMonitoring = () => {
  if (isMonitoring.value) {
    stopMonitoring()
  } else {
    startMonitoring()
  }
}

const startMonitoring = () => {
  isMonitoring.value = true
  refreshMetrics()

  // 每 5 秒更新一次数据
  updateInterval.value = window.setInterval(() => {
    refreshMetrics()
  }, 5000)
}

const stopMonitoring = () => {
  isMonitoring.value = false
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
    updateInterval.value = null
  }
}

const refreshMetrics = async () => {
  try {
    performanceData.value = await performanceMonitor.getPerformanceReport()
  } catch (error) {
    console.error('获取性能数据失败:', error)
  }
}

const exportReport = () => {
  if (!performanceData.value) return

  const report = {
    timestamp: new Date().toISOString(),
    metrics: performanceData.value,
    score: performanceScore.value,
    suggestions: optimizationSuggestions.value,
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 格式化函数
const formatTime = (time: number | undefined): string => {
  if (!time) return 'N/A'
  if (time < 1000) return `${Math.round(time)}ms`
  return `${(time / 1000).toFixed(2)}s`
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatCLS = (cls: number | undefined): string => {
  if (!cls) return 'N/A'
  return cls.toFixed(3)
}

// 评分相关函数
const getScoreClass = (score: number): string => {
  if (score >= 90) return 'score-good'
  if (score >= 50) return 'score-needs-improvement'
  return 'score-poor'
}

const getMetricStatus = (metric: string, value: number | undefined): string => {
  if (!value) return 'unknown'

  switch (metric) {
    case 'fcp':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
    case 'lcp':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
    case 'fid':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
    case 'cls':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
    default:
      return 'unknown'
  }
}

const getMetricStatusText = (metric: string, value: number | undefined): string => {
  const status = getMetricStatus(metric, value)
  switch (status) {
    case 'good':
      return '良好'
    case 'needs-improvement':
      return '需要改进'
    case 'poor':
      return '较差'
    default:
      return '未知'
  }
}

// 自定义指标计算
const getAverageResponseTime = (): number => {
  const times = performanceData.value?.aiResponseTime || []
  return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
}

const getAverageRenderTime = (): number => {
  const times = performanceData.value?.messageRenderTime || []
  return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
}

const getAverageSearchTime = (): number => {
  const times = performanceData.value?.searchTime || []
  return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
}

onMounted(() => {
  // 初始化时获取一次数据
  refreshMetrics()
})

onUnmounted(() => {
  stopMonitoring()
  performanceMonitor.cleanup()
})

defineOptions({
  name: 'PerformanceMonitor',
})
</script>

<style scoped>
.performance-monitor {
  @apply bg-gradient-to-br from-bg-card to-bg-card/95 border border-input-border rounded-xl p-6 space-y-6;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .performance-monitor {
  background: linear-gradient(135deg, rgba(37, 43, 50, 0.95) 0%, rgba(47, 53, 61, 0.9) 100%);
  border-color: rgba(121, 180, 166, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(121, 180, 166, 0.1);
}

.monitor-header {
  @apply flex items-center justify-between pb-4 border-b border-input-border/50;
}

.monitor-title {
  @apply text-xl font-bold text-text m-0;
  background: linear-gradient(135deg, var(--primary-color), #68a295);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.monitor-controls {
  @apply flex items-center gap-3;
}

.control-button {
  @apply px-4 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg text-sm font-medium;
  @apply hover:shadow-lg hover:scale-105 transition-all duration-200;
  box-shadow: 0 4px 12px rgba(121, 180, 166, 0.3);
}

.control-button.active {
  @apply bg-gradient-to-r from-red-500 to-red-600;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

[data-theme='dark'] .control-button {
  box-shadow: 0 4px 12px rgba(121, 180, 166, 0.2);
}

[data-theme='dark'] .control-button.active {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.performance-score {
  @apply flex items-center gap-8 p-6 rounded-xl border border-input-border/50;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
  backdrop-filter: blur(8px);
}

[data-theme='dark'] .performance-score {
  background: linear-gradient(135deg, rgba(47, 53, 61, 0.8) 0%, rgba(37, 43, 50, 0.6) 100%);
  border-color: rgba(121, 180, 166, 0.15);
}

.score-circle {
  @apply w-24 h-24 rounded-full flex flex-col items-center justify-center;
  @apply border-4 font-bold relative;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
}

[data-theme='dark'] .score-circle {
  background: radial-gradient(circle, rgba(121, 180, 166, 0.1) 0%, transparent 70%);
}

.score-circle.score-good {
  @apply border-green-500 text-green-600;
  box-shadow:
    0 0 20px rgba(34, 197, 94, 0.3),
    inset 0 0 20px rgba(34, 197, 94, 0.1);
}

.score-circle.score-needs-improvement {
  @apply border-yellow-500 text-yellow-600;
  box-shadow:
    0 0 20px rgba(234, 179, 8, 0.3),
    inset 0 0 20px rgba(234, 179, 8, 0.1);
}

.score-circle.score-poor {
  @apply border-red-500 text-red-600;
  box-shadow:
    0 0 20px rgba(239, 68, 68, 0.3),
    inset 0 0 20px rgba(239, 68, 68, 0.1);
}

[data-theme='dark'] .score-circle.score-good {
  @apply text-green-400;
  box-shadow:
    0 0 20px rgba(34, 197, 94, 0.4),
    inset 0 0 20px rgba(34, 197, 94, 0.15);
}

[data-theme='dark'] .score-circle.score-needs-improvement {
  @apply text-yellow-400;
  box-shadow:
    0 0 20px rgba(234, 179, 8, 0.4),
    inset 0 0 20px rgba(234, 179, 8, 0.15);
}

[data-theme='dark'] .score-circle.score-poor {
  @apply text-red-400;
  box-shadow:
    0 0 20px rgba(239, 68, 68, 0.4),
    inset 0 0 20px rgba(239, 68, 68, 0.15);
}

.score-value {
  @apply text-2xl font-bold;
}

.score-label {
  @apply text-xs opacity-80;
}

.score-details {
  @apply flex-1 space-y-4;
}

.score-item {
  @apply flex items-center gap-4;
}

.score-name {
  @apply w-24 text-sm font-medium text-text-secondary;
}

.score-bar {
  @apply flex-1 h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .score-bar {
  background: rgba(64, 70, 80, 0.5);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.score-fill {
  @apply h-full transition-all duration-500 ease-out relative;
  background: linear-gradient(90deg, currentColor 0%, currentColor 100%);
}

.score-fill.score-good {
  @apply bg-green-500;
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.score-fill.score-needs-improvement {
  @apply bg-yellow-500;
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}

.score-fill.score-poor {
  @apply bg-red-500;
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}

[data-theme='dark'] .score-fill.score-good {
  background: linear-gradient(90deg, #059669 0%, #10b981 100%);
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

[data-theme='dark'] .score-fill.score-needs-improvement {
  background: linear-gradient(90deg, #d97706 0%, #f59e0b 100%);
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
}

[data-theme='dark'] .score-fill.score-poor {
  background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
}

.score-number {
  @apply w-8 text-sm font-medium text-right;
}

.metrics-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6;
}

.metric-card {
  @apply p-5 rounded-xl border border-input-border/50 transition-all duration-300;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .metric-card {
  background: linear-gradient(135deg, rgba(47, 53, 61, 0.9) 0%, rgba(37, 43, 50, 0.7) 100%);
  border-color: rgba(121, 180, 166, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .metric-card:hover {
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(121, 180, 166, 0.2);
}

.metric-title {
  @apply text-sm font-semibold text-text-secondary m-0 mb-2 uppercase tracking-wide;
}

.metric-value {
  @apply text-2xl font-bold text-text;
  background: linear-gradient(135deg, var(--text-color), var(--primary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-status {
  @apply text-xs font-semibold mt-1 px-3 py-1.5 rounded-full uppercase tracking-wide;
  backdrop-filter: blur(8px);
}

.metric-status.good {
  @apply bg-green-100/80 text-green-800 dark:bg-green-900/50 dark:text-green-300;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.metric-status.needs-improvement {
  @apply bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.2);
}

.metric-status.poor {
  @apply bg-red-100/80 text-red-800 dark:bg-red-900/50 dark:text-red-300;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.usage-section {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.usage-card {
  @apply p-5 rounded-xl border border-input-border/50 transition-all duration-300;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.usage-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

[data-theme='dark'] .usage-card {
  background: linear-gradient(135deg, rgba(47, 53, 61, 0.9) 0%, rgba(37, 43, 50, 0.7) 100%);
  border-color: rgba(121, 180, 166, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .usage-card:hover {
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(121, 180, 166, 0.2);
}

.usage-title {
  @apply text-sm font-semibold text-text-secondary m-0 mb-3 uppercase tracking-wide;
}

.usage-chart {
  @apply space-y-3;
}

.usage-bar {
  @apply h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .usage-bar {
  background: rgba(64, 70, 80, 0.5);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.usage-fill {
  @apply h-full transition-all duration-500 ease-out relative;
}

.memory-fill {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

[data-theme='dark'] .memory-fill {
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.usage-text {
  @apply text-sm text-text font-medium;
}

.storage-details {
  @apply space-y-3;
}

.storage-item {
  @apply flex justify-between text-sm p-2 rounded-lg;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
}

[data-theme='dark'] .storage-item {
  background: rgba(47, 53, 61, 0.5);
}

.custom-metrics {
  @apply space-y-4;
}

.section-title {
  @apply text-base font-semibold text-text m-0 mb-4;
  background: linear-gradient(135deg, var(--text-color), var(--primary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.custom-metrics-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
}

.custom-metric {
  @apply flex flex-col p-4 rounded-xl border border-input-border/50 transition-all duration-300;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.custom-metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .custom-metric {
  background: linear-gradient(135deg, rgba(47, 53, 61, 0.8) 0%, rgba(37, 43, 50, 0.6) 100%);
  border-color: rgba(121, 180, 166, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .custom-metric:hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(121, 180, 166, 0.2);
}

.custom-metric-name {
  @apply text-sm text-text-secondary font-medium mb-1;
}

.custom-metric-value {
  @apply text-base font-bold text-text;
  background: linear-gradient(135deg, var(--text-color), var(--primary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.suggestions {
  @apply space-y-4;
}

.suggestions-list {
  @apply space-y-3 m-0 pl-0;
}

.suggestion-item {
  @apply text-sm text-text-secondary p-4 rounded-xl border border-input-border/50 transition-all duration-300;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.08) 100%);
  border-color: rgba(59, 130, 246, 0.2);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  list-style: none;
  position: relative;
  padding-left: 3rem;
}

.suggestion-item:before {
  content: '💡';
  position: absolute;
  left: 1rem;
  top: 1rem;
}

.suggestion-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

[data-theme='dark'] .suggestion-item {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.12) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  color: rgba(147, 197, 253, 0.9);
}

[data-theme='dark'] .suggestion-item:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.monitor-placeholder {
  @apply text-center py-8 text-text-secondary;
}
</style>
