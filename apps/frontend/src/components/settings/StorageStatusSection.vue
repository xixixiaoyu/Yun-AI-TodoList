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
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <div class="section-info">
        <h3 class="section-title">{{ t('storageStatus') }}</h3>
        <p class="section-description">{{ t('storageStatusDescription') }}</p>
      </div>
    </div>

    <div class="settings-content">
      <!-- 当前存储模式 -->
      <div class="status-card">
        <div class="status-header">
          <div class="status-icon" :class="getModeStatusClass()">
            <component :is="getCurrentModeIcon()" class="w-5 h-5" />
          </div>
          <div class="status-info">
            <h4 class="status-title">{{ getCurrentModeLabel() }}</h4>
            <p class="status-subtitle">{{ t('currentStorageMode') }}</p>
          </div>
          <div class="status-indicator" :class="getConnectionStatusClass()">
            <div class="indicator-dot"></div>
            <span class="indicator-text">{{ getConnectionStatusText() }}</span>
          </div>
        </div>
      </div>

      <!-- 同步状态 -->
      <div v-if="currentMode !== 'local'" class="status-card">
        <div class="status-header">
          <div class="status-icon text-blue-500">
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
              <path
                d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"
              />
            </svg>
          </div>
          <div class="status-info">
            <h4 class="status-title">{{ t('syncStatus') }}</h4>
            <p class="status-subtitle">
              {{
                syncStatus.lastSyncTime
                  ? t('lastSyncTime', { time: formatTime(syncStatus.lastSyncTime) })
                  : t('neverSynced')
              }}
            </p>
          </div>
          <div v-if="isInProgress" class="sync-spinner">
            <div class="spinner"></div>
          </div>
        </div>

        <!-- 简化的混合存储状态 -->
        <div v-if="currentMode === 'hybrid'" class="status-details">
          <div class="hybrid-status-info">
            <div class="info-item">
              <div class="info-icon text-primary">
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
              <span class="info-text">{{ t('storage.offlineFirst') }}</span>
            </div>
            <div class="info-item">
              <div class="info-icon text-primary">
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
                  <path
                    d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"
                  />
                </svg>
              </div>
              <span class="info-text">{{ t('storage.autoMerge') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 存储健康状态 -->
      <div class="status-card">
        <div class="status-header">
          <div class="status-icon" :class="getHealthStatusClass()">
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div class="status-info">
            <h4 class="status-title">{{ t('storageHealth') }}</h4>
            <p class="status-subtitle">{{ getHealthStatusText() }}</p>
          </div>
          <button
            :disabled="isCheckingHealth"
            class="action-button small primary"
            @click="checkHealth"
          >
            {{ isCheckingHealth ? t('checking') : t('checkHealth') }}
          </button>
        </div>
      </div>

      <!-- 数据迁移入口 -->
      <div v-if="isAuthenticated" class="status-card">
        <div class="status-header">
          <div class="status-icon text-purple-500">
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
              <path d="M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <div class="status-info">
            <h4 class="status-title">{{ t('dataMigration') }}</h4>
            <p class="status-subtitle">{{ t('dataMigrationDescription') }}</p>
          </div>
          <button class="action-button primary" @click="openMigrationWizard">
            {{ t('openMigrationWizard') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useStorageMode } from '../../composables/useStorageMode'
import { useSyncManager } from '../../composables/useSyncManager'
import CloudIcon from '../icons/CloudIcon.vue'
import HybridIcon from '../icons/HybridIcon.vue'
import LocalIcon from '../icons/LocalIcon.vue'

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { currentMode, getStorageStatus, checkStorageHealth, initializeStorageMode } =
  useStorageMode()

const {
  isInProgress,
  syncStatus,
  isSyncEnabled,
  performManualSync,
  enableAutoSync,
  disableAutoSync,
} = useSyncManager()

const isCheckingHealth = ref(false)
const healthStatus = ref<boolean | null>(null)

const getCurrentModeIcon = () => {
  switch (currentMode.value) {
    case 'local':
      return LocalIcon
    case 'hybrid':
      return HybridIcon
    default:
      return LocalIcon
  }
}

const getCurrentModeLabel = () => {
  switch (currentMode.value) {
    case 'local':
      return t('storage.localStorage')
    case 'hybrid':
      return t('storage.hybridStorage')
    default:
      return t('storage.localStorage')
  }
}

const getModeStatusClass = () => {
  switch (currentMode.value) {
    case 'local':
      return 'text-gray-500'
    case 'hybrid':
      return 'text-purple-500'
    default:
      return 'text-gray-500'
  }
}

const getConnectionStatusClass = () => {
  const status = getStorageStatus()
  return status.isOnline ? 'status-online' : 'status-offline'
}

const getConnectionStatusText = () => {
  const status = getStorageStatus()
  return status.isOnline ? t('online') : t('offline')
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
    healthStatus.value = await checkStorageHealth()
  } catch (_error) {
    healthStatus.value = false
  } finally {
    isCheckingHealth.value = false
  }
}

const openMigrationWizard = () => {
  // TODO: Open migration wizard modal
  console.warn('Open migration wizard')
}

// Check health on mount
onMounted(async () => {
  await initializeStorageMode()
  checkHealth()
})

defineOptions({
  name: 'StorageStatusSection',
})
</script>

<style scoped>
.status-card {
  @apply bg-card-bg border border-card-border rounded-lg p-4 space-y-3;
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
  @apply font-medium text-text-primary;
}

.status-subtitle {
  @apply text-sm text-text-secondary;
}

.status-indicator {
  @apply flex items-center gap-2 text-sm;
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

.status-details {
  @apply space-y-2 pl-8;
}

.detail-item {
  @apply flex justify-between items-center text-sm;
}

.detail-label {
  @apply text-text-secondary;
}

.detail-value {
  @apply font-medium text-text-primary;
}

.status-actions {
  @apply flex gap-2 pl-8;
}

.action-button {
  @apply px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200;
  @apply flex items-center gap-1.5;
}

.action-button.primary {
  @apply bg-primary text-white hover:bg-primary/90;
}

.action-button.secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  @apply dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600;
}

.action-button.small {
  @apply px-2 py-1 text-xs;
}

.action-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.sync-spinner {
  @apply flex items-center justify-center;
}

.spinner {
  @apply w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin;
}

.hybrid-status-info {
  @apply space-y-2;
}

.info-item {
  @apply flex items-center space-x-2;
}

.info-icon {
  @apply flex-shrink-0;
}

.info-text {
  @apply text-sm text-text-secondary;
}
</style>
