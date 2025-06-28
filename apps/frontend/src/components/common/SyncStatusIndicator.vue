<template>
  <div v-if="shouldShow" class="sync-indicator" :class="indicatorClass">
    <div class="sync-content">
      <i :class="statusIcon" class="sync-icon"></i>
      <span class="sync-text">{{ statusText }}</span>
      <button
        v-if="showRetryButton"
        class="retry-button"
        :disabled="syncState.syncInProgress"
        @click="handleRetry"
      >
        <i class="i-carbon-restart text-xs"></i>
      </button>
    </div>

    <!-- 进度条 -->
    <div v-if="syncState.syncInProgress" class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useDataSync } from '../../composables/useDataSync'

interface Props {
  // 显示模式：'auto' | 'always' | 'never'
  mode?: 'auto' | 'always' | 'never'
  // 是否显示重试按钮
  showRetry?: boolean
  // 自动隐藏延迟（毫秒）
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'auto',
  showRetry: true,
  autoHideDelay: 3000,
})

const { t } = useI18n()
const { syncState, syncStatusText, manualSync } = useDataSync()
const { isAuthenticated } = useAuth()

// 计算属性
const shouldShow = computed(() => {
  if (props.mode === 'never') return false
  if (props.mode === 'always') return isAuthenticated.value

  // auto 模式：同步中、有错误或刚完成同步时显示
  return (
    isAuthenticated.value &&
    (syncState.syncInProgress ||
      syncState.syncError ||
      (syncState.lastSyncTime && isRecentSync.value))
  )
})

const isRecentSync = computed(() => {
  if (!syncState.lastSyncTime) return false
  const now = Date.now()
  const syncTime = syncState.lastSyncTime.getTime()
  return now - syncTime < props.autoHideDelay
})

const indicatorClass = computed(() => {
  if (syncState.syncInProgress) return 'indicator-syncing'
  if (syncState.syncError) return 'indicator-error'
  if (syncState.lastSyncTime) return 'indicator-success'
  return 'indicator-pending'
})

const statusIcon = computed(() => {
  if (syncState.syncInProgress) return 'i-carbon-circle-dash animate-spin'
  if (syncState.syncError) return 'i-carbon-warning'
  if (syncState.lastSyncTime) return 'i-carbon-checkmark'
  return 'i-carbon-cloud-offline'
})

const statusText = computed(() => {
  if (syncState.syncError) return `${t('storage.syncFailed')}: ${syncState.syncError}`
  return syncStatusText.value
})

const showRetryButton = computed(() => {
  return props.showRetry && syncState.syncError && !syncState.syncInProgress
})

// 方法
const handleRetry = async () => {
  try {
    await manualSync()
  } catch (error) {
    console.error('Retry sync failed:', error)
  }
}

defineOptions({
  name: 'SyncStatusIndicator',
})
</script>

<style scoped>
.sync-indicator {
  @apply fixed top-4 right-4 z-[1001] max-w-sm;
  @apply bg-card border border-border rounded-lg shadow-lg backdrop-blur-sm;
  @apply transform transition-all-300;
  animation: slideInRight 0.3s ease-out;
}

.sync-content {
  @apply flex items-center gap-2 p-3;
}

.sync-icon {
  @apply flex-shrink-0 text-sm;
}

.sync-text {
  @apply flex-1 text-sm font-medium text-text;
}

.retry-button {
  @apply flex-shrink-0 p-1 rounded hover:bg-bg-secondary transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.progress-bar {
  @apply h-1 bg-bg-secondary overflow-hidden rounded-b-lg;
}

.progress-fill {
  @apply h-full bg-primary rounded-full;
  animation: progress 2s ease-in-out infinite;
}

/* 状态样式 */
.indicator-syncing {
  @apply border-primary/30;
}

.indicator-syncing .sync-icon {
  @apply text-primary;
}

.indicator-success {
  @apply border-success/30;
}

.indicator-success .sync-icon {
  @apply text-success;
}

.indicator-error {
  @apply border-error/30;
}

.indicator-error .sync-icon {
  @apply text-error;
}

.indicator-pending {
  @apply border-warning/30;
}

.indicator-pending .sync-icon {
  @apply text-warning;
}

/* 动画 */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .sync-indicator {
    @apply top-16 right-2 left-2 max-w-none z-[1001];
  }

  .sync-content {
    @apply p-2;
  }

  .sync-text {
    @apply text-xs;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .sync-indicator {
  @apply bg-card-dark border-border-dark;
}

[data-theme='dark'] .sync-text {
  @apply text-text-dark;
}

[data-theme='dark'] .retry-button:hover {
  @apply bg-bg-secondary-dark;
}
</style>
