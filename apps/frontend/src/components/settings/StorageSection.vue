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
      <!-- 当前存储状态概览 -->
      <div class="status-overview">
        <div class="status-header">
          <div class="status-icon" :class="getModeStatusClass()">
            <component :is="getCurrentModeIcon()" class="w-5 h-5" />
          </div>
          <div class="status-info">
            <h4 class="status-title">{{ getCurrentModeLabel() }}</h4>
            <div class="status-indicators">
              <div class="status-indicator" :class="getConnectionStatusClass()">
                <div class="indicator-dot"></div>
                <span class="indicator-text">{{ getConnectionStatusText() }}</span>
              </div>
              <div v-if="currentMode === 'hybrid' && syncStatus.lastSyncTime" class="sync-info">
                <span class="sync-text">{{
                  t('lastSyncTime', { time: formatTime(syncStatus.lastSyncTime) })
                }}</span>
              </div>
            </div>
          </div>
          <div v-if="isInProgress" class="sync-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- 存储模式选择 -->
      <div class="storage-mode-selection">
        <h4 class="selection-title">{{ t('storage.selectMode') }}</h4>
        <div class="storage-mode-options">
          <div
            v-for="option in storageModeOptions"
            :key="option.value"
            class="storage-mode-option"
            :class="{
              active: selectedMode === option.value,
              disabled: option.disabled,
            }"
            @click="!option.disabled && selectStorageMode(option.value)"
          >
            <div class="option-content">
              <div class="option-icon">
                <component :is="option.icon" class="w-5 h-5" />
              </div>
              <div class="option-info">
                <div class="option-title">{{ option.label }}</div>
                <div class="option-description">{{ option.description }}</div>
                <div v-if="option.disabled" class="option-disabled-reason">
                  {{ option.disabledReason }}
                </div>
              </div>
              <div class="radio-button" :class="{ checked: selectedMode === option.value }">
                <div v-if="selectedMode === option.value" class="radio-dot" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 混合存储特性说明 -->
      <div v-if="selectedMode === 'hybrid'" class="hybrid-features">
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
              <span class="feature-title">{{ t('storage.offlineFirst') }}</span>
              <span class="feature-desc">{{ t('storage.offlineFirstDesc') }}</span>
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
                <path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                />
                <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-title">{{ t('storage.autoMerge') }}</span>
              <span class="feature-desc">{{ t('storage.autoMergeDesc') }}</span>
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
        <div v-if="isAuthenticated" class="action-group">
          <button class="action-button primary small" @click="openMigrationWizard">
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <path d="M16 13H8M16 17H8M10 9H8" />
            </svg>
            {{ t('dataMigration') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StorageConfig, StorageMode } from '@shared/types'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useStorageMode } from '../../composables/useStorageMode'
import { useSyncManager } from '../../composables/useSyncManager'
import HybridIcon from '../icons/HybridIcon.vue'
import LocalIcon from '../icons/LocalIcon.vue'

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const {
  currentMode,
  config,
  switchStorageMode,
  updateStorageConfig,
  getStorageStatus,
  checkStorageHealth,
  initializeStorageMode,
} = useStorageMode()
const {
  initialize,
  syncAll: _syncAll,
  isInProgress,
  syncStatus,
  isSyncEnabled,
  performManualSync,
  enableAutoSync,
  disableAutoSync,
} = useSyncManager()

const isCheckingHealth = ref(false)
const healthStatus = ref<boolean | null>(null)

const selectedMode = computed({
  get: () => currentMode.value,
  set: (value: StorageMode) => {
    switchStorageModeInternal(value)
  },
})

const storageModeOptions = computed(() => [
  {
    value: 'local' as StorageMode,
    label: t('storage.localStorage'),
    description: t('storage.localStorageDesc'),
    icon: LocalIcon,
    disabled: false,
  },
  {
    value: 'hybrid' as StorageMode,
    label: t('storage.hybridStorage'),
    description: t('storage.hybridStorageDesc'),
    icon: HybridIcon,
    disabled: !isAuthenticated.value,
    disabledReason: !isAuthenticated.value ? t('storage.requiresLogin') : undefined,
  },
])

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

const switchStorageModeInternal = async (mode: StorageMode) => {
  try {
    await switchStorageMode(mode)

    // 如果切换到混合模式，且用户已登录，初始化同步
    if (mode === 'hybrid' && isAuthenticated.value) {
      await initialize()
    }
    return true
  } catch (error) {
    console.error('Failed to switch storage mode:', error)
    return false
  }
}

const selectStorageMode = async (mode: StorageMode) => {
  const success = await switchStorageModeInternal(mode)
  if (!success) {
    console.error('Failed to switch storage mode')
  }
}

const updateConfig = async (updates: Partial<StorageConfig>) => {
  const success = await updateStorageConfig(updates)
  if (!success) {
    console.error('Failed to update storage config')
  }
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
  @apply space-y-3;
}

.storage-mode-option {
  @apply p-3 border border-input-border rounded-lg cursor-pointer transition-all duration-200;
  @apply hover:border-primary hover:bg-primary/5;
}

.storage-mode-option.active {
  @apply border-primary bg-primary/10;
}

.storage-mode-option.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.storage-mode-option.disabled:hover {
  @apply border-input-border bg-transparent;
}

.option-content {
  @apply flex items-center gap-3;
}

.option-icon {
  @apply flex-shrink-0 text-primary;
}

.option-info {
  @apply flex-1 min-w-0;
}

.option-title {
  @apply font-medium text-text-primary;
}

.option-description {
  @apply text-sm text-text-secondary mt-1;
}

.option-disabled-reason {
  @apply text-xs text-red-500 mt-1;
}

.radio-button {
  @apply w-5 h-5 border-2 border-input-border rounded-full flex items-center justify-center;
  @apply transition-all duration-200;
}

.radio-button.checked {
  @apply border-primary bg-primary;
}

.radio-dot {
  @apply w-2 h-2 bg-white rounded-full;
}

/* 混合存储特性 */
.hybrid-features {
  @apply mb-6;
}

.features-grid {
  @apply space-y-3;
}

.feature-item {
  @apply flex items-start space-x-3 p-3 bg-primary/5 rounded-lg;
}

.feature-icon {
  @apply flex-shrink-0 text-primary mt-0.5;
}

.feature-text {
  @apply flex-1;
}

.feature-title {
  @apply block font-medium text-text-primary text-sm;
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
