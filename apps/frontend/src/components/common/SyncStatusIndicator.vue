<template>
  <div
    v-if="shouldShow"
    class="network-indicator"
    :class="[indicatorClass, { 'fade-out': shouldFadeOut }]"
  >
    <div class="network-content">
      <i :class="statusIcon" class="network-icon"></i>
      <span class="network-text">{{ statusText }}</span>

      <!-- 重试按钮 -->
      <button
        v-if="showRetryButton"
        class="retry-button"
        :disabled="isCheckingConnection"
        :title="t('network.retryConnection')"
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

    <!-- 连接检查进度条 -->
    <div v-if="isCheckingConnection" class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useStorageMode } from '../../composables/useStorageMode'
import { useSyncManager } from '../../composables/useSyncManager'

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
const { isAuthenticated } = useAuth()
const { networkStatus, reconnectCloudStorage } = useStorageMode()
const { networkStatusText, checkServerHealth, isInitialized } = useSyncManager()

// 用户关闭状态管理
const userDismissedAt = ref<number | null>(null)
const lastCheckTimeWhenDismissed = ref<Date | null>(null)

// 连接检查状态
const isCheckingConnection = ref(false)

// 强制更新时间计算的响应式变量
const forceUpdateTrigger = ref(0)

// 定时器用于强制更新时间相关的计算
let updateTimer: number | null = null

// 组件挂载时启动定时器
onMounted(() => {
  // 启动定时器用于更新时间显示
  const startUpdateTimer = () => {
    if (updateTimer) return // 避免重复启动

    updateTimer = window.setInterval(() => {
      // 定期更新时间显示
      if (networkStatus.value.lastCheckTime) {
        forceUpdateTrigger.value++

        // 如果通知应该已经隐藏了，停止定时器
        const now = Date.now()
        const checkTime = new Date(networkStatus.value.lastCheckTime).getTime()
        const timeSinceCheck = now - checkTime

        if (timeSinceCheck > props.autoHideDelay + 1000) {
          // 多等1秒确保隐藏
          window.clearInterval(updateTimer as number)
          updateTimer = null
        }
      }
    }, 500)
  }

  // 监听网络状态变化，智能启动/停止定时器
  watch(
    () => networkStatus.value.lastCheckTime,
    (newTime, oldTime) => {
      if (import.meta.env.DEV) {
        console.warn('[NetworkStatusIndicator] lastCheckTime changed:', {
          old: oldTime,
          new: newTime,
        })
      }

      if (newTime && !isCheckingConnection.value) {
        console.warn('[NetworkStatusIndicator] Starting update timer for notification auto-hide')
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

// 监听网络状态变化，处理关闭状态重置
watch(
  () => [
    networkStatus.value.lastCheckTime,
    userDismissedAt.value,
    lastCheckTimeWhenDismissed.value,
  ],
  () => {
    // 如果有新的检查活动（检查时间比关闭时记录的时间更新），重置关闭状态
    if (
      networkStatus.value.lastCheckTime &&
      lastCheckTimeWhenDismissed.value &&
      new Date(networkStatus.value.lastCheckTime) > lastCheckTimeWhenDismissed.value
    ) {
      userDismissedAt.value = null
      lastCheckTimeWhenDismissed.value = null
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

    // 如果在静默期内，只显示重要状态（连接检查中或网络错误）
    if (isInSilencePeriod) {
      return (
        isCheckingConnection.value ||
        !networkStatus.value.isOnline ||
        !networkStatus.value.isServerReachable
      )
    }
  }

  // 🔧 修复：避免在初始化完成前显示"服务器不可达"
  // 只有在网络管理器初始化完成后，才显示服务器不可达的状态
  const shouldShowServerError = isInitialized.value && !networkStatus.value.isServerReachable

  // 🔧 修复：避免登录后立即显示成功状态的快速闪过通知
  // 只有在有实际问题时才显示，或者是真正需要用户关注的状态变化
  const hasActualProblem =
    isCheckingConnection.value || !networkStatus.value.isOnline || shouldShowServerError

  // 对于成功状态的检查结果，只在有意义的时候显示（比如从错误状态恢复）
  const shouldShowRecentSuccess =
    networkStatus.value.lastCheckTime &&
    isRecentCheck.value &&
    networkStatus.value.isOnline &&
    isInitialized.value &&
    networkStatus.value.isServerReachable &&
    networkStatus.value.consecutiveFailures > 0 // 只有在之前有失败时才显示恢复通知

  // 显示条件：有实际问题时正常显示，或者是从错误状态恢复的成功通知
  return hasActualProblem || shouldShowRecentSuccess
})

const isRecentCheck = computed(() => {
  // 依赖强制更新触发器，确保时间计算能够及时响应
  forceUpdateTrigger.value

  if (!networkStatus.value.lastCheckTime) {
    return false
  }

  try {
    const now = Date.now()
    const checkTime = new Date(networkStatus.value.lastCheckTime).getTime()
    // 检查时间是否有效
    if (isNaN(checkTime)) {
      console.warn('[NetworkStatusIndicator] Invalid checkTime:', networkStatus.value.lastCheckTime)
      return false
    }

    const timeSinceCheck = now - checkTime

    // 防止负数时间差（时钟同步问题）
    if (timeSinceCheck < 0) {
      console.warn('[NetworkStatusIndicator] Negative time difference, hiding indicator')
      return false
    }

    const hideDelay =
      !networkStatus.value.isOnline || !networkStatus.value.isServerReachable
        ? props.autoHideDelay * 2 // 错误状态显示4秒
        : props.autoHideDelay // 成功状态显示2秒

    const shouldShow = timeSinceCheck < hideDelay

    // 调试信息：通知状态变化
    if (import.meta.env.DEV) {
      if (!shouldShow && timeSinceCheck >= hideDelay) {
        console.warn('[NetworkStatusIndicator] Notification hiding:', {
          timeSinceCheck,
          hideDelay,
          hasError: !networkStatus.value.isOnline || !networkStatus.value.isServerReachable,
        })
      } else if (shouldShow) {
        console.warn('[NetworkStatusIndicator] Notification showing:', {
          timeSinceCheck,
          hideDelay,
          hasError: !networkStatus.value.isOnline || !networkStatus.value.isServerReachable,
        })
      }
    }

    return shouldShow
  } catch (error) {
    console.error('[NetworkStatusIndicator] Error in isRecentCheck calculation:', error)
    return false
  }
})

const indicatorClass = computed(() => {
  if (isCheckingConnection.value) return 'indicator-checking'
  if (!networkStatus.value.isOnline) return 'indicator-offline'
  if (!networkStatus.value.isServerReachable) return 'indicator-error'
  if (networkStatus.value.consecutiveFailures > 0) return 'indicator-warning'
  return 'indicator-success'
})

const statusIcon = computed(() => {
  if (isCheckingConnection.value) return 'i-carbon-circle-dash animate-spin'
  if (!networkStatus.value.isOnline) return 'i-carbon-wifi-off'
  if (!networkStatus.value.isServerReachable) return 'i-carbon-warning'
  if (networkStatus.value.consecutiveFailures > 0) return 'i-carbon-warning-alt'
  return 'i-carbon-checkmark'
})

const statusText = computed(() => {
  if (isCheckingConnection.value) return t('network.checking')
  return networkStatusText.value || t('network.unknown')
})

const showRetryButton = computed(() => {
  return (
    props.showRetry &&
    (!networkStatus.value.isOnline || !networkStatus.value.isServerReachable) &&
    !isCheckingConnection.value
  )
})

const showCloseButton = computed(() => {
  return props.showClose && !isCheckingConnection.value
})

const shouldFadeOut = computed(() => {
  if (
    !networkStatus.value.lastCheckTime ||
    isCheckingConnection.value ||
    !networkStatus.value.isOnline ||
    !networkStatus.value.isServerReachable
  ) {
    return false
  }

  const now = Date.now()
  const checkTime = new Date(networkStatus.value.lastCheckTime).getTime()
  const timeSinceCheck = now - checkTime

  // 在最后500ms开始淡出效果
  return timeSinceCheck > props.autoHideDelay - 500 && timeSinceCheck < props.autoHideDelay
})

// 方法
const handleRetry = async () => {
  try {
    isCheckingConnection.value = true
    await reconnectCloudStorage()
    await checkServerHealth()
  } catch (error) {
    console.error('Retry connection failed:', error)
  } finally {
    isCheckingConnection.value = false
  }
}

const handleDismiss = () => {
  userDismissedAt.value = Date.now()
  lastCheckTimeWhenDismissed.value = networkStatus.value.lastCheckTime
    ? new Date(networkStatus.value.lastCheckTime)
    : null
}

defineOptions({
  name: 'NetworkStatusIndicator',
})
</script>

<style scoped>
.network-indicator {
  @apply fixed top-4 right-4 z-[1001] max-w-sm;
  @apply bg-card border border-border rounded-lg shadow-lg backdrop-blur-sm;
  @apply transform transition-all duration-300;
  animation: slideInRight 0.3s ease-out;
}

.network-indicator.fade-out {
  @apply opacity-60;
  transform: translateX(10px);
  transition:
    opacity 0.5s ease-out,
    transform 0.5s ease-out;
}

.network-content {
  @apply flex items-center gap-2 p-3;
}

.network-icon {
  @apply flex-shrink-0 text-sm;
}

.network-text {
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
.indicator-checking {
  @apply border-primary/30;
}

.indicator-checking .network-icon {
  @apply text-primary;
}

.indicator-success {
  @apply border-success/30;
}

.indicator-success .network-icon {
  @apply text-success;
}

.indicator-error {
  @apply border-error/30;
}

.indicator-error .network-icon {
  @apply text-error;
}

.indicator-warning {
  @apply border-warning/30;
}

.indicator-warning .network-icon {
  @apply text-warning;
}

.indicator-offline {
  @apply border-gray-500/30;
}

.indicator-offline .network-icon {
  @apply text-gray-500;
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
  .network-indicator {
    @apply top-16 right-2 left-2 max-w-none z-[1001];
  }

  .network-content {
    @apply p-2;
  }

  .network-text {
    @apply text-xs;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .network-indicator {
  @apply bg-card-dark border-border-dark;
}

[data-theme='dark'] .network-text {
  @apply text-text-dark;
}

[data-theme='dark'] .retry-button:hover {
  @apply bg-bg-secondary-dark;
}
</style>
