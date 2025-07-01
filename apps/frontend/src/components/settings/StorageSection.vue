<template>
  <div class="settings-section">
    <div class="section-header">
      <div class="section-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      </div>
      <div class="section-info">
        <h3 class="section-title">{{ t('storage.title') }}</h3>
        <p class="section-description">{{ t('storage.description') }}</p>
      </div>
    </div>

    <div class="settings-content">
      <!-- 云端存储状态概览 -->
      <div class="status-overview">
        <div class="status-header">
          <div class="status-icon" :class="getNetworkStatusClass()">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
          </div>
          <div class="status-info">
            <h4 class="status-title">{{ t('storage.cloudStorage') }}</h4>
            <div class="status-indicators">
              <div class="status-indicator" :class="getConnectionStatusClass()">
                <div class="indicator-dot"></div>
                <span class="indicator-text">{{ getConnectionStatusText() }}</span>
              </div>
              <div v-if="networkStatus.lastCheckTime" class="check-info">
                <span class="check-text">{{
                  t('lastCheckTime', { time: formatTime(networkStatus.lastCheckTime) })
                }}</span>
              </div>
            </div>
          </div>
          <div v-if="isCheckingHealth" class="health-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- 云端存储特性说明 -->
      <div class="cloud-features">
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">
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
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-title">{{ t('storage.realTimeSync') }}</span>
              <span class="feature-desc">{{ t('storage.realTimeSyncDesc') }}</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
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
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
                <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
                <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
                <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-title">{{ t('storage.autoRetry') }}</span>
              <span class="feature-desc">{{ t('storage.autoRetryDesc') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="storage-actions">
        <div class="action-group">
          <button
            :disabled="isCheckingHealth"
            class="action-button secondary small"
            @click="checkHealth"
          >
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            {{ isCheckingHealth ? t('checking') : t('checkHealth') }}
          </button>
          <div class="health-status" :class="getHealthStatusClass()">
            {{ getHealthStatusText() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useStorageMode } from '../../composables/useStorageMode'
import { useSyncManager } from '../../composables/useSyncManager'

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { networkStatus, checkStorageHealth, initializeStorageMode } = useStorageMode()
const { initialize, checkServerHealth, networkStatusText } = useSyncManager()

const isCheckingHealth = ref(false)
const healthStatus = ref<boolean | null>(null)

const getNetworkStatusClass = () => {
  if (!networkStatus.value.isOnline) return 'text-red-500'
  if (!networkStatus.value.isServerReachable) return 'text-orange-500'
  if (networkStatus.value.consecutiveFailures > 0) return 'text-yellow-500'
  return 'text-green-500'
}

const getConnectionStatusClass = () => {
  if (!networkStatus.value.isOnline) return 'status-offline'
  if (!networkStatus.value.isServerReachable) return 'status-error'
  if (networkStatus.value.consecutiveFailures > 0) return 'status-warning'
  return 'status-online'
}

const getConnectionStatusText = () => {
  return networkStatusText.value || t('unknown')
}

const getHealthStatusClass = () => {
  if (healthStatus.value === null) return 'text-gray-500'
  return healthStatus.value ? 'text-green-500' : 'text-red-500'
}

const getHealthStatusText = () => {
  if (healthStatus.value === null) return t('unknown')
  return healthStatus.value ? t('healthy') : t('unhealthy')
}

const formatTime = (time: string | Date) => {
  const date = typeof time === 'string' ? new Date(time) : time
  return date.toLocaleString()
}

const checkHealth = async () => {
  isCheckingHealth.value = true
  try {
    // 检查云端存储健康状态
    healthStatus.value = await checkStorageHealth()
    // 同时检查服务器健康状态
    await checkServerHealth()
  } catch (error) {
    console.error('Health check failed:', error)
    healthStatus.value = false
  } finally {
    isCheckingHealth.value = false
  }
}

// 初始化云端存储和健康检查
onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      await initializeStorageMode()
      await initialize()
      await checkHealth()
    } catch (error) {
      console.error('Failed to initialize cloud storage:', error)
    }
  }
})

defineOptions({
  name: 'StorageSection',
})
</script>

<style scoped>
/* 状态概览 */
.status-overview {
  @apply mb-6 p-4 bg-card-bg border border-card-border rounded-lg;
}

.status-header {
  @apply flex items-center gap-3;
}

.status-icon {
  @apply flex-shrink-0;
}

.status-info {
  @apply flex-1 min-w-0;
}

.status-title {
  @apply font-medium text-text-primary mb-1;
}

.status-indicators {
  @apply flex items-center gap-4 text-sm;
}

.status-indicator {
  @apply flex items-center gap-2;
}

.status-indicator.status-online {
  @apply text-green-500;
}

.status-indicator.status-offline {
  @apply text-red-500;
}

.indicator-dot {
  @apply w-2 h-2 rounded-full;
}

.status-online .indicator-dot {
  @apply bg-green-500;
}

.status-offline .indicator-dot {
  @apply bg-red-500;
}

.sync-info {
  @apply text-text-secondary;
}

.sync-spinner {
  @apply flex items-center justify-center;
}

.spinner {
  @apply w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin;
}

/* 存储模式选择 */
.storage-mode-selection {
  @apply mb-6;
}

.selection-title {
  @apply text-sm font-medium text-text-primary mb-3;
}

.storage-mode-options {
  @apply space-y-1;
}

.storage-mode-option {
  @apply px-4 py-2.5 rounded-md cursor-pointer transition-all duration-200;
  background: transparent;
  border: 1px solid transparent;
}

.storage-mode-option:hover {
  background: var(--settings-primary-ultra-light);
  border-color: var(--settings-primary-ultra-light);
  box-shadow: 0 1px 3px rgba(121, 180, 166, 0.06);
}

.storage-mode-option.active {
  background: var(--settings-primary-soft);
  border-color: var(--settings-primary-medium);
}

.storage-mode-option.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.storage-mode-option.disabled:hover {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.option-content {
  @apply flex items-center gap-3;
}

.option-icon {
  @apply flex-shrink-0;
  color: var(--settings-primary);
}

.option-info {
  @apply flex-1 min-w-0;
}

.option-title {
  @apply font-medium text-text;
}

.option-description {
  @apply text-sm text-text-secondary mt-1;
}

.option-disabled-reason {
  @apply text-xs mt-1;
  color: var(--error-color);
}

.selected-indicator {
  @apply flex items-center justify-center;
  color: var(--settings-primary);
}

/* 混合存储特性 */
.hybrid-features {
  @apply mb-6;
}

.features-grid {
  @apply space-y-3;
}

.feature-item {
  @apply flex items-start space-x-3 p-3 rounded-lg;
  background: var(--settings-primary-ultra-light);
}

.feature-icon {
  @apply flex-shrink-0 mt-0.5;
  color: var(--settings-primary);
}

.feature-text {
  @apply flex-1;
}

.feature-title {
  @apply block font-medium text-text text-sm;
}

.feature-desc {
  @apply block text-xs text-text-secondary mt-1;
}

/* 操作按钮区域 */
.storage-actions {
  @apply flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-card-border;
}

.action-group {
  @apply flex items-center gap-3;
}

.action-button {
  @apply px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200;
  @apply flex items-center gap-1.5;
}

.action-button.primary {
  background: var(--settings-button-primary-bg);
  color: white;
  transition: all 0.2s ease;
}

.action-button.primary:hover {
  background: var(--settings-button-primary-hover);
  box-shadow: var(--settings-input-focus-shadow);
}

.action-button.secondary {
  background: var(--settings-button-secondary-bg);
  color: var(--settings-button-secondary-text);
  transition: all 0.2s ease;
}

.action-button.secondary:hover {
  background: var(--settings-button-secondary-hover);
  box-shadow: var(--settings-input-focus-shadow);
}

.action-button.small {
  @apply px-2 py-1 text-xs;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.health-status {
  @apply text-sm font-medium;
}

.health-status.text-green-500 {
  @apply text-green-500;
}

.health-status.text-red-500 {
  @apply text-red-500;
}

.health-status.text-gray-500 {
  @apply text-gray-500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-indicators {
    @apply flex-col items-start gap-2;
  }

  .storage-actions {
    @apply flex-col items-stretch;
  }

  .action-group {
    @apply justify-between;
  }
}
</style>
