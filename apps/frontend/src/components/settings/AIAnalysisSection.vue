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
              @change="updateConfig({ enablePriorityAnalysis: $event.target.checked })"
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
              @change="updateConfig({ enableTimeEstimation: $event.target.checked })"
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
              @change="updateConfig({ autoAnalyzeNewTodos: $event.target.checked })"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- 分析状态显示 -->
      <div v-if="isAnalysisEnabled" class="analysis-status">
        <div class="status-item">
          <span class="status-label">{{ t('priorityLevel') }}:</span>
          <span
            class="status-value"
            :class="{ 'status-enabled': analysisConfig.enablePriorityAnalysis }"
          >
            {{ analysisConfig.enablePriorityAnalysis ? t('enabled') : t('disabled') }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">{{ t('estimatedTime') }}:</span>
          <span
            class="status-value"
            :class="{ 'status-enabled': analysisConfig.enableTimeEstimation }"
          >
            {{ analysisConfig.enableTimeEstimation ? t('enabled') : t('disabled') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAIAnalysis } from '@/composables/useAIAnalysis'

const { t } = useI18n()
const { analysisConfig, updateAnalysisConfig, isAnalysisEnabled } = useAIAnalysis()

const updateConfig = (config: Record<string, unknown>) => {
  updateAnalysisConfig(config)
}

defineOptions({
  name: 'AIAnalysisSection',
})
</script>

<style scoped>
.settings-section {
  @apply space-y-6;
}

.section-header {
  @apply flex items-start gap-4;
}

.section-icon {
  @apply flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 bg-opacity-20 text-purple-600 flex-shrink-0;
}

.section-title-group {
  @apply flex-1 min-w-0;
}

.section-title {
  @apply text-lg font-semibold text-text mb-1;
}

.section-description {
  @apply text-sm text-text-secondary leading-relaxed;
}

.settings-content {
  @apply space-y-4 ml-14;
}

.setting-item {
  @apply flex items-center justify-between gap-4 p-4 rounded-xl bg-white bg-opacity-5 border border-white/10 transition-all duration-200 hover:bg-opacity-10;
}

.setting-info {
  @apply flex-1 min-w-0;
}

.setting-label {
  @apply block text-sm font-medium text-text mb-1;
}

.setting-description {
  @apply text-xs text-text-secondary leading-relaxed;
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
  @apply absolute inset-0 bg-gray-300 rounded-full transition-all duration-300 ease-in-out;
}

.toggle-slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300 ease-in-out;
}

.toggle-switch input:checked + .toggle-slider {
  @apply bg-purple-500;
}

.toggle-switch input:checked + .toggle-slider:before {
  @apply transform translate-x-6;
}

.analysis-status {
  @apply mt-6 p-4 rounded-xl bg-purple-50 bg-opacity-10 border border-purple-200/20;
}

.status-item {
  @apply flex items-center justify-between py-2;
}

.status-label {
  @apply text-sm font-medium text-text-secondary;
}

.status-value {
  @apply text-sm font-medium text-gray-500;
}

.status-enabled {
  @apply text-purple-600;
}

@media (max-width: 768px) {
  .settings-content {
    @apply ml-0;
  }

  .section-header {
    @apply flex-col gap-2;
  }

  .setting-item {
    @apply flex-col items-start gap-3 p-3;
  }

  .setting-control {
    @apply self-end;
  }
}
</style>
