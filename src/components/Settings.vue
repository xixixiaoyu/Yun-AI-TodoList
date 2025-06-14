<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">{{ t('settings') }}</h1>
        <p class="page-subtitle">配置您的 AI 助手和系统设置</p>
      </div>

      <!-- 设置内容区域 -->
      <div class="settings-content">
        <!-- API 密钥配置区域 -->
        <div class="settings-section-wrapper">
          <ApiKeySection
            v-model:local-api-key="localApiKey"
            v-model:show-api-key="showApiKey"
            v-model:show-api-key-popover="showApiKeyPopover"
            @show-success-toast="showSuccessToast"
          />
        </div>

        <!-- 系统提示词配置区域 -->
        <div class="settings-section-wrapper">
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

.page-header {
  text-align: center;
  margin-bottom: 1rem;
}

.page-title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  background: linear-gradient(
    135deg,
    var(--button-bg-color),
    var(--button-hover-bg-color)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
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

/* 设置页面专用滚动条样式 */
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

/* 深色主题下的设置页面滚动条样式 */
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .settings-page {
    padding: 1.5rem 1rem;
    align-items: flex-start;
    justify-content: flex-start;
    padding-top: 3rem;
  }

  .page-title {
    font-size: 2.2rem;
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

  .page-title {
    font-size: 1.8rem;
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

  .page-title {
    font-size: 1.6rem;
  }

  .page-subtitle {
    font-size: 0.9rem;
  }

  .settings-content {
    gap: 1rem;
  }
}
</style>
