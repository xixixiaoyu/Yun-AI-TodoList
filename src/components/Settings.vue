<template>
  <div
    class="h-full bg-bg flex flex-col items-center justify-center p-4 py-8 md:py-12 overflow-hidden"
  >
    <div class="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div class="text-center space-y-1">
        <h1 class="settings-title text-2xl md:text-3xl font-bold text-text tracking-tight">
          {{ t('settings') }}
        </h1>
        <p class="text-sm md:text-base text-text-secondary max-w-2xl mx-auto">
          管理您的应用配置和偏好设置
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 items-start">
        <div
          class="settings-card bg-card rounded-2xl p-6 shadow-card border border-white/10 backdrop-blur-20 transition-all-300 hover:transform-hover-up hover:shadow-hover md:col-span-2 xl:col-span-1"
        >
          <ApiKeySection
            v-model:local-api-key="localApiKey"
            v-model:show-api-key="showApiKey"
            v-model:show-api-key-popover="showApiKeyPopover"
            @show-success-toast="showSuccessToast"
          />
        </div>

        <div
          class="settings-card bg-card rounded-2xl p-6 shadow-card border border-white/10 backdrop-blur-20 transition-all-300 hover:transform-hover-up hover:shadow-hover"
        >
          <ModelSelectionSection />
        </div>

        <div
          class="settings-card bg-card rounded-2xl p-6 shadow-card border border-white/10 backdrop-blur-20 transition-all-300 hover:transform-hover-up hover:shadow-hover md:col-span-2 xl:col-span-1"
        >
          <ThemeSection />
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

const { t } = useI18n()

const { showApiKey, showApiKeyPopover, localApiKey, showSuccessMessage, showSuccessToast } =
  useSettingsState()

defineOptions({
  name: 'AppSettings',
})
</script>

<style scoped>
.settings-card {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, var(--card-bg-color) 100%);
  position: relative;
  overflow: hidden;
}

.settings-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.settings-card:hover::before {
  left: 100%;
}

.settings-title {
  background: linear-gradient(135deg, var(--text-color) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 768px) {
  .settings-card {
    min-height: auto;
  }
}
</style>
