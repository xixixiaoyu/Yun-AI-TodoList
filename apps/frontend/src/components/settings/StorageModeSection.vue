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
        <h3 class="section-title">{{ t('storageMode') }}</h3>
        <p class="section-description">{{ t('storageModeDescription') }}</p>
      </div>
    </div>

    <div class="settings-content">
      <!-- 存储模式选择 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('selectStorageMode') }}</label>
          <p class="setting-description">{{ t('selectStorageModeDesc') }}</p>
        </div>
        <div class="setting-control">
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
      </div>

      <!-- 自动同步设置 -->
      <div v-if="selectedMode !== 'local'" class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('autoSync') }}</label>
          <p class="setting-description">{{ t('autoSyncDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="config.autoSync"
              @change="updateConfig({ autoSync: ($event.target as HTMLInputElement).checked })"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 同步间隔设置 -->
      <div v-if="selectedMode !== 'local' && config.autoSync" class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('syncInterval') }}</label>
          <p class="setting-description">{{ t('syncIntervalDesc') }}</p>
        </div>
        <div class="setting-control">
          <select
            :value="config.syncInterval"
            class="select-input"
            @change="
              updateConfig({ syncInterval: parseInt(($event.target as HTMLSelectElement).value) })
            "
          >
            <option value="1">1 {{ t('minute') }}</option>
            <option value="5">5 {{ t('minutes') }}</option>
            <option value="10">10 {{ t('minutes') }}</option>
            <option value="15">15 {{ t('minutes') }}</option>
            <option value="30">30 {{ t('minutes') }}</option>
            <option value="60">1 {{ t('hour') }}</option>
          </select>
        </div>
      </div>

      <!-- 离线模式设置 -->
      <div v-if="selectedMode !== 'local'" class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('offlineMode') }}</label>
          <p class="setting-description">{{ t('offlineModeDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="config.offlineMode"
              @change="updateConfig({ offlineMode: ($event.target as HTMLInputElement).checked })"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 冲突解决策略 -->
      <div v-if="selectedMode !== 'local'" class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('conflictResolution') }}</label>
          <p class="setting-description">{{ t('conflictResolutionDesc') }}</p>
        </div>
        <div class="setting-control">
          <select
            :value="config.conflictResolution"
            class="select-input"
            @change="
              updateConfig({
                conflictResolution: ($event.target as HTMLSelectElement).value as any,
              })
            "
          >
            <option value="ask-user">{{ t('askUser') }}</option>
            <option value="local-wins">{{ t('localWins') }}</option>
            <option value="remote-wins">{{ t('remoteWins') }}</option>
            <option value="merge">{{ t('autoMerge') }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StorageMode, StorageConfig } from '@shared/types'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useStorageMode } from '../../composables/useStorageMode'
import { useSyncManager } from '../../composables/useSyncManager'
import LocalIcon from '../icons/LocalIcon.vue'
import CloudIcon from '../icons/CloudIcon.vue'
import HybridIcon from '../icons/HybridIcon.vue'

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { currentMode, config, switchStorageMode, updateStorageConfig } = useStorageMode()
const { initialize, syncAll: _syncAll } = useSyncManager()

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
    value: 'remote' as StorageMode,
    label: t('storage.cloudStorage'),
    description: t('storage.cloudStorageDesc'),
    icon: CloudIcon,
    disabled: !isAuthenticated.value,
    disabledReason: !isAuthenticated.value ? t('storage.requiresLogin') : undefined,
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

const switchStorageModeInternal = async (mode: StorageMode) => {
  try {
    await switchStorageMode(mode)

    // 如果切换到云端或混合模式，且用户已登录，初始化同步
    if ((mode === 'remote' || mode === 'hybrid') && isAuthenticated.value) {
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

defineOptions({
  name: 'StorageModeSection',
})
</script>

<style scoped>
.storage-mode-options {
  @apply space-y-3;
}

.storage-mode-option {
  @apply p-4 border border-input-border rounded-lg cursor-pointer transition-all duration-200;
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

.select-input {
  @apply px-3 py-2 border border-input-border rounded-lg bg-input-bg text-text-primary;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
  @apply transition-all duration-200;
}

.number-input {
  @apply px-3 py-2 border border-input-border rounded-lg bg-input-bg text-text-primary;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
  @apply transition-all duration-200 w-20;
}

.toggle-switch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full transition-colors;
  @apply bg-gray-200 dark:bg-gray-700;
}

.toggle-switch input:checked + .toggle-slider {
  @apply bg-primary;
}

.toggle-slider {
  @apply absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform;
  @apply shadow-sm;
}

.toggle-switch input:checked + .toggle-slider {
  @apply translate-x-5;
}

.toggle-switch input {
  @apply sr-only;
}
</style>
