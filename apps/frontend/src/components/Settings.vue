<template>
  <div
    class="min-h-screen bg-gradient-to-br from-bg via-bg to-bg/95 flex flex-col items-center justify-start p-6 md:p-8 overflow-auto"
  >
    <div class="w-full max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div class="flex items-center gap-3 mb-6 md:mb-8">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </div>
        <div>
          <h1 class="settings-title text-xl md:text-2xl font-semibold text-text">
            {{ t('settings') }}
          </h1>
          <p class="text-sm text-text-secondary mt-0.5">
            {{ t('settingsDescription') }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        <!-- 左侧列 -->
        <div class="space-y-6">
          <div class="settings-card group">
            <ApiKeySection
              v-model:local-api-key="localApiKey"
              v-model:show-api-key="showApiKey"
              v-model:show-api-key-popover="showApiKeyPopover"
              @show-success-toast="showSuccessToast"
            />
          </div>

          <div class="settings-card group">
            <ModelSelectionSection />
          </div>
        </div>

        <!-- 右侧列 -->
        <div class="space-y-6">
          <div class="settings-card group">
            <ThemeSection />
          </div>

          <div class="settings-card group">
            <AIAnalysisSection />
          </div>
        </div>
      </div>
    </div>

    <SettingsToast :show="showSuccessMessage" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSettingsState } from '../composables/useSettingsState'
import ApiKeySection from './settings/ApiKeySection.vue'
import ModelSelectionSection from './settings/ModelSelectionSection.vue'
import SettingsToast from './settings/SettingsToast.vue'
import ThemeSection from './settings/ThemeSection.vue'
import AIAnalysisSection from './settings/AIAnalysisSection.vue'

const { t } = useI18n()

const { showApiKey, showApiKeyPopover, localApiKey, showSuccessMessage, showSuccessToast } =
  useSettingsState()

defineOptions({
  name: 'AppSettings',
})
</script>

<style scoped>
.settings-card {
  @apply bg-card rounded-2xl p-6 shadow-lg border border-white/5 backdrop-blur-sm;
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}

.settings-card:hover::before {
  left: 100%;
}

.settings-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.settings-card:hover::after {
  opacity: 1;
}

.settings-title {
  background: linear-gradient(135deg, var(--text-color) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 响应式优化 */
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .settings-card {
    @apply p-4 rounded-xl;
    min-height: auto;
  }

  .space-y-6 > * + * {
    margin-top: 1rem;
  }
}
</style>
