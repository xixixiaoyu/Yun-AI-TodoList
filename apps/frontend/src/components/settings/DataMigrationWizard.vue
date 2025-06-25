<template>
  <div v-if="isOpen" class="migration-wizard-overlay" @click.self="closeWizard">
    <div class="migration-wizard">
      <div class="wizard-header">
        <h2 class="wizard-title">{{ t('dataMigrationWizard') }}</h2>
        <button class="close-button" @click="closeWizard">
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="wizard-content">
        <!-- Step 1: Choose Migration Direction -->
        <div v-if="currentStep === 1" class="wizard-step">
          <div class="step-header">
            <h3 class="step-title">{{ t('chooseMigrationDirection') }}</h3>
            <p class="step-description">{{ t('chooseMigrationDirectionDesc') }}</p>
          </div>

          <div class="migration-options">
            <div
              class="migration-option"
              :class="{ active: migrationDirection === 'toCloud' }"
              @click="migrationDirection = 'toCloud'"
            >
              <div class="option-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                  <polyline points="12,16 16,12 12,8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div class="option-content">
                <h4 class="option-title">{{ t('migrateToCloud') }}</h4>
                <p class="option-description">{{ t('migrateToCloudDesc') }}</p>
              </div>
            </div>

            <div
              class="migration-option"
              :class="{ active: migrationDirection === 'toLocal' }"
              @click="migrationDirection = 'toLocal'"
            >
              <div class="option-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
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
                  <polyline points="12,8 8,12 12,16" />
                  <line x1="16" y1="12" x2="8" y2="12" />
                </svg>
              </div>
              <div class="option-content">
                <h4 class="option-title">{{ t('migrateToLocal') }}</h4>
                <p class="option-description">{{ t('migrateToLocalDesc') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Migration Options -->
        <div v-if="currentStep === 2" class="wizard-step">
          <div class="step-header">
            <h3 class="step-title">{{ t('migrationOptions') }}</h3>
            <p class="step-description">{{ t('migrationOptionsDesc') }}</p>
          </div>

          <div class="options-form">
            <div class="form-group">
              <label class="form-label">
                <input
                  v-model="migrationOptions.preserveLocalData"
                  type="checkbox"
                  class="form-checkbox"
                />
                {{ t('preserveLocalData') }}
              </label>
              <p class="form-description">{{ t('preserveLocalDataDesc') }}</p>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('conflictResolutionStrategy') }}</label>
              <select v-model="migrationOptions.mergeStrategy" class="form-select">
                <option value="ask-user">{{ t('askUser') }}</option>
                <option value="local-wins">{{ t('localWins') }}</option>
                <option value="remote-wins">{{ t('remoteWins') }}</option>
                <option value="merge">{{ t('autoMerge') }}</option>
              </select>
              <p class="form-description">{{ t('conflictResolutionStrategyDesc') }}</p>
            </div>
          </div>
        </div>

        <!-- Step 3: Migration Progress -->
        <div v-if="currentStep === 3" class="wizard-step">
          <div class="step-header">
            <h3 class="step-title">{{ t('migrationProgress') }}</h3>
            <p class="step-description">{{ getCurrentOperation }}</p>
          </div>

          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${getProgressPercentage}%` }"></div>
            </div>
            <div class="progress-text">{{ getProgressPercentage }}% {{ t('complete') }}</div>
          </div>

          <div v-if="progress?.errors.length" class="error-list">
            <h4 class="error-title">{{ t('errors') }}</h4>
            <div class="error-items">
              <div v-for="error in progress.errors" :key="error.id" class="error-item">
                <span class="error-id">{{ error.id }}</span>
                <span class="error-message">{{ error.error }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Migration Complete -->
        <div v-if="currentStep === 4" class="wizard-step">
          <div class="step-header">
            <div class="success-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            </div>
            <h3 class="step-title">{{ t('migrationComplete') }}</h3>
            <p class="step-description">{{ getMigrationSummary() }}</p>
          </div>

          <div v-if="lastResult?.conflicts.length" class="conflicts-section">
            <h4 class="conflicts-title">{{ t('conflictsDetected') }}</h4>
            <p class="conflicts-description">{{ t('conflictsDetectedDesc') }}</p>
            <button class="resolve-conflicts-button" @click="showConflictResolution = true">
              {{ t('resolveConflicts') }}
            </button>
          </div>
        </div>

        <!-- Conflict Resolution -->
        <div v-if="showConflictResolution" class="conflict-resolution">
          <h4 class="conflicts-title">{{ t('resolveConflicts') }}</h4>
          <div class="conflicts-list">
            <div v-for="(conflict, index) in conflicts" :key="index" class="conflict-item">
              <div class="conflict-header">
                <h5 class="conflict-title">{{ conflict.local.title || conflict.remote.title }}</h5>
                <span class="conflict-reason">{{ conflict.reason }}</span>
              </div>
              <div class="conflict-options">
                <label class="conflict-option">
                  <input
                    v-model="conflictResolutions[index]"
                    type="radio"
                    :name="`conflict-${index}`"
                    value="local"
                  />
                  {{ t('useLocal') }}
                </label>
                <label class="conflict-option">
                  <input
                    v-model="conflictResolutions[index]"
                    type="radio"
                    :name="`conflict-${index}`"
                    value="remote"
                  />
                  {{ t('useRemote') }}
                </label>
                <label class="conflict-option">
                  <input
                    v-model="conflictResolutions[index]"
                    type="radio"
                    :name="`conflict-${index}`"
                    value="merge"
                  />
                  {{ t('merge') }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="wizard-footer">
        <button
          v-if="currentStep > 1 && currentStep < 4"
          class="wizard-button secondary"
          @click="previousStep"
        >
          {{ t('previous') }}
        </button>

        <div class="wizard-actions">
          <button
            v-if="currentStep < 3"
            :disabled="!canProceed"
            class="wizard-button primary"
            @click="nextStep"
          >
            {{ currentStep === 2 ? t('startMigration') : t('next') }}
          </button>

          <button v-if="currentStep === 4" class="wizard-button primary" @click="closeWizard">
            {{ t('finish') }}
          </button>

          <button
            v-if="showConflictResolution"
            :disabled="!allConflictsResolved"
            class="wizard-button primary"
            @click="resolveConflicts"
          >
            {{ t('applyResolutions') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataMigrationOptions, ConflictResolutionStrategy } from '@shared/types'
import { useI18n } from 'vue-i18n'
import { useDataMigration } from '../../composables/useDataMigration'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

const _props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const {
  isInProgress,
  progress,
  lastResult,
  conflicts,
  migrateToCloud,
  migrateToLocal,
  resolveConflicts: resolveDataConflicts,
  getProgressPercentage,
  getCurrentOperation,
} = useDataMigration()

const currentStep = ref(1)
const migrationDirection = ref<'toCloud' | 'toLocal'>('toCloud')
const migrationOptions = ref<DataMigrationOptions>({
  preserveLocalData: true,
  mergeStrategy: 'ask-user' as ConflictResolutionStrategy,
})

const showConflictResolution = ref(false)
const conflictResolutions = ref<string[]>([])

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return migrationDirection.value !== null
  }
  return true
})

const allConflictsResolved = computed(() => {
  return conflictResolutions.value.every((resolution) => resolution !== '')
})

const nextStep = async () => {
  if (currentStep.value === 2) {
    // Start migration
    currentStep.value = 3
    await startMigration()
  } else {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const startMigration = async () => {
  try {
    let _success = false

    if (migrationDirection.value === 'toCloud') {
      _success = await migrateToCloud(migrationOptions.value)
    } else {
      _success = await migrateToLocal(migrationOptions.value)
    }

    // Wait for migration to complete
    await new Promise((resolve) => {
      const checkProgress = () => {
        if (!isInProgress.value) {
          resolve(void 0)
        } else {
          setTimeout(checkProgress, 100)
        }
      }
      checkProgress()
    })

    currentStep.value = 4

    // Initialize conflict resolutions if there are conflicts
    if (conflicts.value.length > 0) {
      conflictResolutions.value = new Array(conflicts.value.length).fill('')
    }
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

const resolveConflicts = async () => {
  const resolutions = conflicts.value.map((conflict, index) => ({
    todoId: conflict.local?.id || conflict.remote?.id || '',
    resolution: conflictResolutions.value[index] as 'local' | 'remote' | 'merge',
  }))

  const success = await resolveDataConflicts(resolutions)
  if (success) {
    showConflictResolution.value = false
  }
}

const getMigrationSummary = () => {
  if (!lastResult.value) return ''

  const { migratedCount, conflictCount, errorCount } = lastResult.value

  if (errorCount > 0) {
    return t('migrationCompletedWithErrors', { migrated: migratedCount, errors: errorCount })
  } else if (conflictCount > 0) {
    return t('migrationCompletedWithConflicts', {
      migrated: migratedCount,
      conflicts: conflictCount,
    })
  } else {
    return t('migrationCompletedSuccessfully', { migrated: migratedCount })
  }
}

const closeWizard = () => {
  currentStep.value = 1
  migrationDirection.value = 'toCloud'
  showConflictResolution.value = false
  conflictResolutions.value = []
  emit('close')
}

defineOptions({
  name: 'DataMigrationWizard',
})
</script>

<style scoped>
.migration-wizard-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.migration-wizard {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden;
}

.wizard-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.wizard-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.close-button {
  @apply p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.wizard-content {
  @apply p-6 overflow-y-auto max-h-[60vh];
}

.wizard-step {
  @apply space-y-6;
}

.step-header {
  @apply text-center space-y-2;
}

.step-title {
  @apply text-lg font-medium text-gray-900 dark:text-white;
}

.step-description {
  @apply text-gray-600 dark:text-gray-400;
}

.migration-options {
  @apply space-y-4;
}

.migration-option {
  @apply p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer;
  @apply hover:border-primary transition-colors;
}

.migration-option.active {
  @apply border-primary bg-primary/5;
}

.option-icon {
  @apply text-primary mb-3;
}

.option-title {
  @apply font-medium text-gray-900 dark:text-white mb-1;
}

.option-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.options-form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply flex items-center gap-2 font-medium text-gray-900 dark:text-white;
}

.form-checkbox {
  @apply rounded border-gray-300 text-primary focus:ring-primary;
}

.form-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
}

.form-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.progress-container {
  @apply space-y-4;
}

.progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2;
}

.progress-fill {
  @apply bg-primary h-2 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-center text-gray-600 dark:text-gray-400;
}

.success-icon {
  @apply text-green-500 mb-4;
}

.wizard-footer {
  @apply flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700;
}

.wizard-actions {
  @apply flex gap-3;
}

.wizard-button {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.wizard-button.primary {
  @apply bg-primary text-white hover:bg-primary/90;
}

.wizard-button.secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
}

.wizard-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.error-list {
  @apply mt-6 space-y-2;
}

.error-title {
  @apply font-medium text-red-600 dark:text-red-400;
}

.error-items {
  @apply space-y-1;
}

.error-item {
  @apply flex gap-2 text-sm;
}

.error-id {
  @apply font-mono text-gray-500;
}

.error-message {
  @apply text-red-600 dark:text-red-400;
}

.conflicts-section {
  @apply mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg;
}

.conflicts-title {
  @apply font-medium text-orange-800 dark:text-orange-200 mb-2;
}

.conflicts-description {
  @apply text-sm text-orange-600 dark:text-orange-300 mb-4;
}

.resolve-conflicts-button {
  @apply px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700;
}

.conflict-resolution {
  @apply mt-6 space-y-4;
}

.conflicts-list {
  @apply space-y-4;
}

.conflict-item {
  @apply p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
}

.conflict-header {
  @apply mb-3;
}

.conflict-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.conflict-reason {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.conflict-options {
  @apply flex gap-4;
}

.conflict-option {
  @apply flex items-center gap-2 text-sm;
}
</style>
