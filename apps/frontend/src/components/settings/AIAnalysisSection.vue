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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { analysisConfig, updateAnalysisConfig } = useAIAnalysis()

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
  background: rgba(121, 180, 166, 0.12);
  color: var(--primary-color);
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
  @apply ml-11;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.setting-item {
  @apply flex items-center justify-between gap-3 p-3 rounded-lg border transition-all duration-200;
  background: var(--ai-accent-color);
  border-color: var(--ai-message-border);
}

.setting-item:hover {
  background: var(--ai-accent-hover);
  border-color: rgba(121, 180, 166, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--ai-message-shadow);
}

.setting-info {
  @apply flex-1 min-w-0;
}

.setting-label {
  @apply block text-sm font-medium text-text mb-0.5;
}

.setting-description {
  @apply text-xs text-text-secondary leading-snug;
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
  background: rgba(156, 163, 175, 0.4);
}

[data-theme='dark'] .toggle-slider {
  background: rgba(107, 114, 128, 0.6);
}

.toggle-slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300 ease-in-out;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--primary-color);
}

.toggle-switch input:checked + .toggle-slider:before {
  @apply transform translate-x-6;
}

.analysis-status {
  @apply mt-4 p-3 rounded-lg border;
  background: var(--ai-accent-color);
  border-color: var(--ai-message-border);
  grid-column: 1 / -1;
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
  color: var(--primary-color);
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
