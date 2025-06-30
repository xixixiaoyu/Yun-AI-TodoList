<template>
  <div
    v-if="shouldShow"
    class="sync-indicator"
    :class="[indicatorClass, { 'fade-out': shouldFadeOut }]"
  >
    <div class="sync-content">
      <i :class="statusIcon" class="sync-icon"></i>
      <span class="sync-text">{{ statusText }}</span>

      <!-- 重试按钮 -->
      <button
        v-if="showRetryButton"
        class="retry-button"
        :disabled="syncState.syncInProgress"
        :title="t('storage.retrySync')"
        @click="handleRetry"
      >
        <i class="i-carbon-restart text-xs"></i>
      </button>

      <!-- 关闭按钮 -->
      <button
        v-if="showCloseButton"
        class="close-button"
        :title="t('common.close')"
        @click="handleDismiss"
      >
        <i class="i-carbon-close text-xs"></i>
      </button>
    </div>

    <!-- 进度条 -->
    <div v-if="syncState.syncInProgress" class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useDataSync } from '../../composables/useDataSync'

interface Props {
  // 显示模式：'auto' | 'always' | 'never'
  mode?: 'auto' | 'always' | 'never'
  // 是否显示重试按钮
  showRetry?: boolean
  // 是否显示关闭按钮
  showClose?: boolean
  // 自动隐藏延迟（毫秒）
  autoHideDelay?: number
  // 用户关闭后的静默期（毫秒）
  dismissSilencePeriod?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'auto',
  showRetry: true,
  showClose: true,
  autoHideDelay: 2000, // 减少到2秒，让成功通知更快消失
  dismissSilencePeriod: 30000, // 30秒
})

const { t } = useI18n()
const { syncState, syncStatusText, manualSync } = useDataSync()
const { isAuthenticated } = useAuth()

// 用户关闭状态管理
const userDismissedAt = ref<number | null>(null)
const lastSyncTimeWhenDismissed = ref<Date | null>(null)

// 强制更新时间计算的响应式变量
const forceUpdateTrigger = ref(0)

// 定时器用于强制更新时间相关的计算
let updateTimer: number | null = null

// 组件挂载时启动定时器
onMounted(() => {
  // 只有在有同步时间时才启动定时器，避免不必要的性能开销
  const startUpdateTimer = () => {
    if (updateTimer) return // 避免重复启动

    updateTimer = window.setInterval(() => {
      // 只有在有同步时间且可能需要隐藏时才更新
      if (syncState.lastSyncTime && !syncState.syncInProgress && !syncState.syncError) {
        forceUpdateTrigger.value++

        // 如果通知应该已经隐藏了，停止定时器
        const now = Date.now()
        const syncTime =
          syncState.lastSyncTime instanceof Date
            ? syncState.lastSyncTime.getTime()
            : new Date(syncState.lastSyncTime).getTime()
        const timeSinceSync = now - syncTime

        if (timeSinceSync > props.autoHideDelay + 1000) {
          // 多等1秒确保隐藏
          window.clearInterval(updateTimer as number)
          updateTimer = null
        }
      }
    }, 500)
  }

  // 监听同步状态变化，智能启动/停止定时器
  watch(
    () => syncState.lastSyncTime,
    (newTime, oldTime) => {
      if (import.meta.env.DEV) {
        console.warn('[SyncStatusIndicator] lastSyncTime changed:', {
          old: oldTime,
          new: newTime,
          type: newTime ? typeof newTime : 'null',
          isDate: newTime instanceof Date,
        })
      }

      if (newTime && !syncState.syncInProgress && !syncState.syncError) {
        console.warn('[SyncStatusIndicator] Starting update timer for notification auto-hide')
        startUpdateTimer()
      }
    },
    { immediate: true }
  )
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (updateTimer) {
    window.clearInterval(updateTimer)
    updateTimer = null
  }
})

// 这个 watch 已经合并到上面的 onMounted 中了

// 监听同步状态变化，处理关闭状态重置
watch(
  () => [syncState.lastSyncTime, userDismissedAt.value, lastSyncTimeWhenDismissed.value],
  () => {
    // 如果有新的同步活动（同步时间比关闭时记录的时间更新），重置关闭状态
    if (
      syncState.lastSyncTime &&
      lastSyncTimeWhenDismissed.value &&
      syncState.lastSyncTime > lastSyncTimeWhenDismissed.value
    ) {
      userDismissedAt.value = null
      lastSyncTimeWhenDismissed.value = null
    }
  }
)

// 计算属性
const shouldShow = computed(() => {
  if (props.mode === 'never') return false
  if (!isAuthenticated.value) return false

  if (props.mode === 'always') return true

  // auto 模式的显示逻辑
  const now = Date.now()

  // 如果用户最近关闭了通知，检查是否在静默期内
  if (userDismissedAt.value) {
    const timeSinceDismiss = now - userDismissedAt.value
    const isInSilencePeriod = timeSinceDismiss < props.dismissSilencePeriod

    // 如果在静默期内，只显示重要状态（同步中或错误）
    if (isInSilencePeriod) {
      return syncState.syncInProgress || syncState.syncError
    }
  }

  // 显示条件：同步中、有错误或刚完成同步
  return (
    syncState.syncInProgress ||
    syncState.syncError ||
    (syncState.lastSyncTime && isRecentSync.value)
  )
})

const isRecentSync = computed(() => {
  // 依赖强制更新触发器，确保时间计算能够及时响应
  forceUpdateTrigger.value

  if (!syncState.lastSyncTime) {
    return false
  }

  try {
    const now = Date.now()

    // 确保 lastSyncTime 是有效的 Date 对象
    let syncTime: number
    if (syncState.lastSyncTime instanceof Date) {
      syncTime = syncState.lastSyncTime.getTime()
    } else if (typeof syncState.lastSyncTime === 'string') {
      syncTime = new Date(syncState.lastSyncTime).getTime()
    } else {
      console.warn(
        '[SyncStatusIndicator] Invalid lastSyncTime type:',
        typeof syncState.lastSyncTime
      )
      return false
    }

    // 检查时间是否有效
    if (isNaN(syncTime)) {
      console.warn('[SyncStatusIndicator] Invalid syncTime:', syncState.lastSyncTime)
      return false
    }

    const timeSinceSync = now - syncTime

    // 防止负数时间差（时钟同步问题）
    if (timeSinceSync < 0) {
      console.warn('[SyncStatusIndicator] Negative time difference, hiding indicator')
      return false
    }

    const hideDelay = syncState.syncError
      ? props.autoHideDelay * 2 // 错误状态显示4秒
      : props.autoHideDelay // 成功状态显示2秒

    const shouldShow = timeSinceSync < hideDelay

    // 调试信息：通知状态变化
    if (import.meta.env.DEV) {
      if (!shouldShow && timeSinceSync >= hideDelay) {
        console.warn('[SyncStatusIndicator] Notification hiding:', {
          timeSinceSync,
          hideDelay,
          hasError: !!syncState.syncError,
        })
      } else if (shouldShow) {
        console.warn('[SyncStatusIndicator] Notification showing:', {
          timeSinceSync,
          hideDelay,
          hasError: !!syncState.syncError,
        })
      }
    }

    return shouldShow
  } catch (error) {
    console.error('[SyncStatusIndicator] Error in isRecentSync calculation:', error)
    return false
  }
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

const showCloseButton = computed(() => {
  return props.showClose && !syncState.syncInProgress
})

const shouldFadeOut = computed(() => {
  if (!syncState.lastSyncTime || syncState.syncInProgress || syncState.syncError) {
    return false
  }

  const now = Date.now()
  const syncTime = syncState.lastSyncTime.getTime()
  const timeSinceSync = now - syncTime

  // 在最后500ms开始淡出效果
  return timeSinceSync > props.autoHideDelay - 500 && timeSinceSync < props.autoHideDelay
})

// 方法
const handleRetry = async () => {
  try {
    await manualSync()
  } catch (error) {
    console.error('Retry sync failed:', error)
  }
}

const handleDismiss = () => {
  userDismissedAt.value = Date.now()
  lastSyncTimeWhenDismissed.value = syncState.lastSyncTime
}

defineOptions({
  name: 'SyncStatusIndicator',
})
</script>

<style scoped>
.sync-indicator {
  @apply fixed top-4 right-4 z-[1001] max-w-sm;
  @apply bg-card border border-border rounded-lg shadow-lg backdrop-blur-sm;
  @apply transform transition-all duration-300;
  animation: slideInRight 0.3s ease-out;
}

.sync-indicator.fade-out {
  @apply opacity-60;
  transform: translateX(10px);
  transition:
    opacity 0.5s ease-out,
    transform 0.5s ease-out;
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

.retry-button,
.close-button {
  @apply flex-shrink-0 p-1 rounded hover:bg-bg-secondary transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.close-button {
  @apply text-text-secondary hover:text-text;
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
