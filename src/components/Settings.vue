<template>
  <div class="settings-page">
    <div class="settings-container">
      <div class="settings-content">
        <div class="settings-section-wrapper">
          <ApiKeySection
            v-model:local-api-key="localApiKey"
            v-model:show-api-key="showApiKey"
            v-model:show-api-key-popover="showApiKeyPopover"
            @show-success-toast="showSuccessToast"
          />
        </div>
      </div>

      <SettingsToast :show="showSuccessMessage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsState } from '../composables/useSettingsState'
import ApiKeySection from './settings/ApiKeySection.vue'
import SettingsToast from './settings/SettingsToast.vue'

const { showApiKey, showApiKeyPopover, localApiKey, showSuccessMessage, showSuccessToast } =
  useSettingsState()

defineOptions({
  name: 'AppSettings'
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.settings-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.page-subtitle {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.7));
  font-weight: 400;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}

.settings-section-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.settings-page {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 154, 139, 0.6) rgba(0, 0, 0, 0.05);
}

.settings-page::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.settings-page::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.settings-page::-webkit-scrollbar-thumb {
  background: rgba(255, 154, 139, 0.6);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.settings-page::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 140, 127, 0.8);
}

@media (prefers-color-scheme: dark) {
  .settings-page {
    scrollbar-color: rgba(255, 154, 139, 0.7) rgba(255, 255, 255, 0.1);
  }

  .settings-page::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-page::-webkit-scrollbar-thumb {
    background: rgba(255, 154, 139, 0.7);
  }

  .settings-page::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 140, 127, 0.9);
  }
}

@media (max-width: 1024px) {
  .settings-page {
    padding: 1.5rem 1rem;
    align-items: flex-start;
    justify-content: flex-start;
    padding-top: 3rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem 0.75rem;
    padding-top: 2rem;
  }

  .settings-container {
    gap: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.95rem;
  }

  .settings-content {
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .settings-page {
    padding: 0.75rem 0.5rem;
    padding-top: 1.5rem;
  }

  .settings-container {
    gap: 1rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
  }

  .settings-content {
    gap: 1rem;
  }
}
</style>
