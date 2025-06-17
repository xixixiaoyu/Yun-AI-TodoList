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
  @apply bg-bg-card border border-input-border rounded-lg p-4 space-y-4;
}

.monitor-header {
  @apply flex items-center justify-between;
}

.monitor-title {
  @apply text-lg font-semibold text-text m-0;
}

.monitor-controls {
  @apply flex items-center gap-2;
}

.control-button {
  @apply px-3 py-1.5 bg-primary text-white rounded-md text-sm;
  @apply hover:bg-primary-hover transition-colors;
}

.control-button.active {
  @apply bg-red-500 hover:bg-red-600;
}

.performance-score {
  @apply flex items-center gap-6 p-4 bg-bg rounded-lg border border-input-border;
}

.score-circle {
  @apply w-20 h-20 rounded-full flex flex-col items-center justify-center;
  @apply border-4 font-bold;
}

.score-circle.score-good {
  @apply border-green-500 text-green-600;
}

.score-circle.score-needs-improvement {
  @apply border-yellow-500 text-yellow-600;
}

.score-circle.score-poor {
  @apply border-red-500 text-red-600;
}

.score-value {
  @apply text-xl font-bold;
}

.score-label {
  @apply text-xs;
}

.score-details {
  @apply flex-1 space-y-3;
}

.score-item {
  @apply flex items-center gap-3;
}

.score-name {
  @apply w-20 text-sm text-text-secondary;
}

.score-bar {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.score-fill {
  @apply h-full transition-all duration-300;
}

.score-fill.score-good {
  @apply bg-green-500;
}

.score-fill.score-needs-improvement {
  @apply bg-yellow-500;
}

.score-fill.score-poor {
  @apply bg-red-500;
}

.score-number {
  @apply w-8 text-sm font-medium text-right;
}

.metrics-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

.metric-card {
  @apply p-4 bg-bg rounded-lg border border-input-border;
}

.metric-title {
  @apply text-sm font-medium text-text-secondary m-0 mb-2;
}

.metric-value {
  @apply text-xl font-bold text-text;
}

.metric-status {
  @apply text-xs font-medium mt-1;
}

.metric-status.good {
  @apply text-green-600;
}

.metric-status.needs-improvement {
  @apply text-yellow-600;
}

.metric-status.poor {
  @apply text-red-600;
}

.usage-section {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.usage-card {
  @apply p-4 bg-bg rounded-lg border border-input-border;
}

.usage-title {
  @apply text-sm font-medium text-text-secondary m-0 mb-3;
}

.usage-chart {
  @apply space-y-2;
}

.usage-bar {
  @apply h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.usage-fill {
  @apply h-full transition-all duration-300;
}

.memory-fill {
  @apply bg-blue-500;
}

.usage-text {
  @apply text-sm text-text;
}

.storage-details {
  @apply space-y-2;
}

.storage-item {
  @apply flex justify-between text-sm;
}

.custom-metrics {
  @apply space-y-3;
}

.section-title {
  @apply text-base font-semibold text-text m-0;
}

.custom-metrics-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
}

.custom-metric {
  @apply flex flex-col p-3 bg-bg rounded-lg border border-input-border;
}

.custom-metric-name {
  @apply text-sm text-text-secondary;
}

.custom-metric-value {
  @apply text-base font-medium text-text;
}

.suggestions {
  @apply space-y-3;
}

.suggestions-list {
  @apply space-y-2 m-0 pl-4;
}

.suggestion-item {
  @apply text-sm text-text-secondary;
}

.monitor-placeholder {
  @apply text-center py-8 text-text-secondary;
}
</style>
