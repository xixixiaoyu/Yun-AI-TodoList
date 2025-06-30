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
          <path
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>
      <div class="section-title-group">
        <h3 class="section-title">{{ t('aiAnalysisConfiguration') }}</h3>
        <p class="section-description">{{ t('aiAnalysisConfigurationDescription') }}</p>
      </div>
    </div>

    <div class="settings-content">
      <!-- 启用重要等级分析 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('enablePriorityAnalysis') }}</label>
          <p class="setting-description">{{ t('enablePriorityAnalysisDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="analysisConfig.enablePriorityAnalysis"
              @change="
                updateConfig({
                  enablePriorityAnalysis: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 启用时间估算 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('enableTimeEstimation') }}</label>
          <p class="setting-description">{{ t('enableTimeEstimationDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="analysisConfig.enableTimeEstimation"
              @change="
                updateConfig({ enableTimeEstimation: ($event.target as HTMLInputElement).checked })
              "
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 自动分析新待办事项 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('autoAnalyzeNewTodos') }}</label>
          <p class="setting-description">{{ t('autoAnalyzeNewTodosDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="analysisConfig.autoAnalyzeNewTodos"
              @change="
                updateConfig({ autoAnalyzeNewTodos: ($event.target as HTMLInputElement).checked })
              "
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 启用 AI 拆分子任务 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('enableSubtaskSplitting') }}</label>
          <p class="setting-description">{{ t('enableSubtaskSplittingDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="analysisConfig.enableSubtaskSplitting"
              @change="
                updateConfig({
                  enableSubtaskSplitting: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="setting-divider">
        <div class="divider-line"></div>
        <span class="divider-text">{{ t('taskGenerationSettings') }}</span>
        <div class="divider-line"></div>
      </div>

      <!-- 启用 AI 任务生成 -->
      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('enableTaskGeneration') }}</label>
          <p class="setting-description">{{ t('enableTaskGenerationDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="taskGenerationConfig.enabled"
              @change="
                updateTaskGenerationConfig({
                  enabled: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 默认最大任务数 -->
      <div v-if="taskGenerationConfig.enabled" class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('defaultMaxTasks') }}</label>
          <p class="setting-description">{{ t('defaultMaxTasksDesc') }}</p>
        </div>
        <div class="setting-control">
          <select
            :value="taskGenerationConfig.defaultMaxTasks"
            class="setting-select"
            @change="
              updateTaskGenerationConfig({
                defaultMaxTasks: parseInt(($event.target as HTMLSelectElement).value),
              })
            "
          >
            <option value="3">3 {{ t('tasks') }}</option>
            <option value="5">5 {{ t('tasks') }}</option>
            <option value="8">8 {{ t('tasks') }}</option>
            <option value="10">10 {{ t('tasks') }}</option>
          </select>
        </div>
      </div>

      <!-- 默认启用优先级分析 -->
      <div v-if="taskGenerationConfig.enabled" class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('defaultEnablePriorityAnalysis') }}</label>
          <p class="setting-description">{{ t('defaultEnablePriorityAnalysisDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="taskGenerationConfig.defaultEnablePriorityAnalysis"
              @change="
                updateTaskGenerationConfig({
                  defaultEnablePriorityAnalysis: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 默认启用时间估算 -->
      <div v-if="taskGenerationConfig.enabled" class="setting-item">
        <div class="setting-info">
          <label class="setting-label">{{ t('defaultEnableTimeEstimation') }}</label>
          <p class="setting-description">{{ t('defaultEnableTimeEstimationDesc') }}</p>
        </div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="taskGenerationConfig.defaultEnableTimeEstimation"
              @change="
                updateTaskGenerationConfig({
                  defaultEnableTimeEstimation: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { analysisConfig, updateAnalysisConfig } = useAIAnalysis()

// 任务生成配置
const taskGenerationConfig = reactive({
  enabled: true,
  defaultMaxTasks: 5,
  defaultEnablePriorityAnalysis: true,
  defaultEnableTimeEstimation: true,
})

// 从 localStorage 加载配置
const loadTaskGenerationConfig = () => {
  try {
    const saved = localStorage.getItem('taskGenerationConfig')
    if (saved) {
      const config = JSON.parse(saved)
      Object.assign(taskGenerationConfig, config)
    }
  } catch (error) {
    console.warn('Failed to load task generation config:', error)
  }
}

// 保存配置到 localStorage
const saveTaskGenerationConfig = () => {
  try {
    localStorage.setItem('taskGenerationConfig', JSON.stringify(taskGenerationConfig))
  } catch (error) {
    console.warn('Failed to save task generation config:', error)
  }
}

// 更新任务生成配置
const updateTaskGenerationConfig = (updates: Partial<typeof taskGenerationConfig>) => {
  Object.assign(taskGenerationConfig, updates)
  saveTaskGenerationConfig()
}

// 初始化时加载配置
loadTaskGenerationConfig()

const updateConfig = (config: Record<string, unknown>) => {
  updateAnalysisConfig(config)
}

defineOptions({
  name: 'AIAnalysisSection',
})
</script>

<style scoped>
.settings-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-start gap-3;
}

.section-icon {
  @apply flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center;
  background: var(--settings-primary-soft);
  color: var(--settings-primary);
}

.section-title-group {
  @apply flex-1 min-w-0;
}

.section-title {
  @apply text-base font-semibold text-text mb-0.5;
}

.section-description {
  @apply text-xs text-text-secondary leading-relaxed;
}

.settings-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.setting-item {
  @apply flex items-center justify-between gap-2 p-2.5 rounded-lg transition-all duration-200;
  background: var(--settings-primary-ultra-light);
  border: 1px solid var(--settings-input-border);
}

.setting-item:hover {
  background: var(--settings-primary-soft);
  border-color: var(--settings-primary-medium);
  box-shadow: var(--settings-input-focus-shadow);
}

.setting-info {
  @apply flex-1 min-w-0;
}

.setting-label {
  @apply block text-sm font-medium text-text mb-0.5;
  line-height: 1.3;
}

.setting-description {
  @apply text-xs text-text-secondary leading-tight;
  line-height: 1.2;
}

.setting-control {
  @apply flex-shrink-0;
}

.toggle-switch {
  @apply relative inline-block w-12 h-6 cursor-pointer;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute inset-0 rounded-full transition-all duration-300 ease-in-out;
  background: var(--settings-input-border);
}

.toggle-slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300 ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--settings-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  @apply transform translate-x-6;
}

/* 分隔线样式 */
.setting-divider {
  @apply flex items-center gap-3 my-4;
}

.divider-line {
  @apply flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent;
}

.divider-text {
  @apply text-xs font-medium text-gray-500 dark:text-gray-400 px-2;
}

/* 选择框样式 */
.setting-select {
  @apply px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors;
}

.analysis-status {
  @apply mt-4 p-3 rounded-lg;
  background: var(--settings-primary-ultra-light);
  border: 1px solid var(--settings-input-border);
  grid-column: 1 / -1;
}

.status-item {
  @apply flex items-center justify-between py-2;
}

.status-label {
  @apply text-sm font-medium text-text-secondary;
}

.status-value {
  @apply text-sm font-medium text-text-secondary;
}

.status-enabled {
  color: var(--settings-primary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .settings-content {
    @apply ml-0;
  }

  .section-header {
    @apply flex-col gap-1.5;
  }

  .setting-item {
    @apply flex-col items-start gap-2 p-2.5;
  }

  .setting-control {
    @apply self-end;
  }
}
</style>
