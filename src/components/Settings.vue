<template>
  <div class="settings-container">
    <h2>{{ t('settings') }}</h2>
    <div class="settings-grid">
      <!-- API 密钥配置组件 -->
      <ApiKeySection
        v-model:local-api-key="localApiKey"
        v-model:show-api-key="showApiKey"
        v-model:show-api-key-popover="showApiKeyPopover"
        @show-success-toast="showSuccessToast"
      />

      <!-- 系统提示词配置组件 -->
      <SystemPromptSection
        v-model:local-system-prompt="localSystemPrompt"
        v-model:selected-prompt-template="selectedPromptTemplate"
        :is-fullscreen="isFullscreen"
        :custom-prompts="customPrompts"
        @template-change="handleTemplateChange"
        @save-system-prompt="saveSystemPrompt"
        @reset-system-prompt="resetSystemPrompt"
        @confirm-delete-prompt="confirmDeletePrompt"
        @show-add-prompt="showAddPrompt"
        @toggle-fullscreen="toggleFullscreen"
      />
    </div>

    <!-- 通知提示组件 -->
    <SettingsToast :show="showSuccessMessage" />

    <!-- 自定义提示词管理组件 -->
    <CustomPromptManager
      v-model:show-add-prompt-popover="showAddPromptPopover"
      v-model:new-prompt-name="newPromptName"
      v-model:new-prompt-content="newPromptContent"
      @save-new-prompt="saveNewPrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSettingsState } from '../composables/useSettingsState'
import { usePromptManagement } from '../composables/usePromptManagement'
import ApiKeySection from './settings/ApiKeySection.vue'
import SystemPromptSection from './settings/SystemPromptSection.vue'
import CustomPromptManager from './settings/CustomPromptManager.vue'
import SettingsToast from './settings/SettingsToast.vue'

const { t } = useI18n()

// 使用设置状态管理 composable
const {
  showApiKey,
  showApiKeyPopover,
  localApiKey,
  localSystemPrompt,
  isFullscreen,
  selectedPromptTemplate,
  showAddPromptPopover,
  newPromptName,
  newPromptContent,
  customPrompts,
  showSuccessMessage,
  showSuccessToast,
  toggleFullscreen,
} = useSettingsState()

// 使用提示词管理 composable
const {
  handleTemplateChange,
  saveNewPrompt,
  saveSystemPrompt,
  resetSystemPrompt,
  confirmDeletePrompt,
} = usePromptManagement(
  customPrompts,
  selectedPromptTemplate,
  localSystemPrompt,
  newPromptName,
  newPromptContent,
  showAddPromptPopover,
  showSuccessToast
)

// 显示添加提示词弹窗
const showAddPrompt = () => {
  showAddPromptPopover.value = true
}

defineOptions({
  name: 'AppSettings',
})
</script>

<style scoped>
.settings-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 600px), 1fr));
  gap: 2rem;
  width: 100%;
  align-items: start;
}

/* 设置页面专用滚动条样式 */
.settings-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 154, 139, 0.6) rgba(0, 0, 0, 0.05);
}

.settings-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.settings-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.settings-container::-webkit-scrollbar-thumb {
  background: rgba(255, 154, 139, 0.6);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.settings-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 140, 127, 0.8);
}

/* 深色主题下的设置页面滚动条样式 */
@media (prefers-color-scheme: dark) {
  .settings-container {
    scrollbar-color: rgba(255, 154, 139, 0.7) rgba(255, 255, 255, 0.1);
  }

  .settings-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-container::-webkit-scrollbar-thumb {
    background: rgba(255, 154, 139, 0.7);
  }

  .settings-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 140, 127, 0.9);
  }
}

@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }

  .settings-grid {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .settings-container {
    padding: 0.75rem;
  }
}
</style>
