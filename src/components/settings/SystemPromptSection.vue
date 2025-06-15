<template>
  <div class="system-prompt-container" :class="{ fullscreen: isFullscreen }">
    <!-- 头部区域 -->
    <div class="prompt-header-section">
      <SystemPromptHeader
        :is-fullscreen="isFullscreen"
        @toggle-fullscreen="$emit('toggleFullscreen')"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="prompt-main-content">
      <!-- 左侧：选择器和信息区域 -->
      <div class="prompt-sidebar">
        <div class="prompt-selector-card">
          <EnhancedPromptTemplateSelector
            :selected-template="selectedPromptTemplate"
            :custom-prompts="customPrompts"
            @update:selected-template="$emit('update:selectedPromptTemplate', $event)"
            @template-change="$emit('templateChange')"
            @duplicate-prompt="$emit('duplicatePrompt')"
            @toggle-favorite="$emit('toggleFavorite', $event)"
            @confirm-delete-prompt="$emit('confirmDeletePrompt')"
            @show-add-prompt="$emit('showAddPrompt')"
          />
        </div>

        <!-- 快速操作区域 -->
        <div class="quick-actions-card">
          <h4 class="quick-actions-title">{{ t('quickActions') }}</h4>
          <div class="quick-actions-grid">
            <button class="quick-action-btn" @click="$emit('showAddPrompt')">
              <PlusIcon />
              <span>{{ t('addNewPrompt') }}</span>
            </button>
            <button
              v-if="selectedPromptTemplate !== 'none'"
              class="quick-action-btn"
              @click="$emit('duplicatePrompt')"
            >
              <CopyIcon />
              <span>{{ t('duplicatePrompt') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：编辑区域 -->
      <div class="prompt-editor-section">
        <div class="editor-card">
          <div class="editor-header">
            <h4 class="editor-title">{{ t('promptContent') }}</h4>
            <div class="editor-meta">
              <span class="char-count">{{ localSystemPrompt.length }}/10000</span>
            </div>
          </div>

          <SystemPromptTextarea
            :value="localSystemPrompt"
            @input="$emit('update:localSystemPrompt', $event)"
          />

          <SystemPromptActions
            :is-valid="isSystemPromptValid"
            @save="$emit('saveSystemPrompt')"
            @reset="$emit('resetSystemPrompt')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import EnhancedPromptTemplateSelector from './EnhancedPromptTemplateSelector.vue'
import SystemPromptHeader from './SystemPromptHeader.vue'
import SystemPromptTextarea from './SystemPromptTextarea.vue'
import SystemPromptActions from './SystemPromptActions.vue'
import PlusIcon from '../common/icons/PlusIcon.vue'
import CopyIcon from '../common/icons/CopyIcon.vue'
import type { CustomPrompt, PromptTemplate } from '../../types/settings'

interface Props {
  localSystemPrompt: string
  isFullscreen: boolean
  selectedPromptTemplate: PromptTemplate
  customPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'update:localSystemPrompt', value: string): void
  (e: 'update:selectedPromptTemplate', value: PromptTemplate): void
  (e: 'templateChange'): void
  (e: 'saveSystemPrompt'): void
  (e: 'resetSystemPrompt'): void
  (e: 'confirmDeletePrompt'): void
  (e: 'duplicatePrompt'): void
  (e: 'toggleFavorite', promptId: string): void
  (e: 'showAddPrompt'): void
  (e: 'toggleFullscreen'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

const isSystemPromptValid = computed(() => {
  return props.localSystemPrompt.trim() !== ''
})

defineOptions({
  name: 'SystemPromptSection'
})
</script>

<style scoped>
.system-prompt-container {
  background-color: var(--card-bg-color);
  border-radius: 16px;
  padding: 0;
  box-shadow: var(--card-shadow);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;
}

.prompt-header-section {
  padding: 1.5rem 1.5rem 0;
}

.prompt-main-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  min-height: 500px;
}

.prompt-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.prompt-selector-card,
.quick-actions-card,
.editor-card {
  background-color: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.prompt-selector-card:hover,
.quick-actions-card:hover,
.editor-card:hover {
  border-color: var(--button-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-actions-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.quick-actions-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  background-color: var(--card-bg-color);
  color: var(--text-color);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.quick-action-btn:hover {
  border-color: var(--button-bg-color);
  background-color: var(--button-bg-color);
  color: white;
  transform: translateY(-1px);
}

.quick-action-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.prompt-editor-section {
  display: flex;
  flex-direction: column;
}

.editor-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--input-border-color);
}

.editor-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.editor-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--text-secondary-color);
  padding: 0.25rem 0.5rem;
  background-color: var(--card-bg-color);
  border-radius: 4px;
}

.system-prompt-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  z-index: 1000;
  border-radius: 0;
  padding: 0;
  border: none;
  transform: none !important;
}

.system-prompt-container.fullscreen .prompt-header-section {
  padding: 2rem 2rem 0;
}

.system-prompt-container.fullscreen .prompt-main-content {
  padding: 2rem;
  min-height: calc(100vh - 120px);
  grid-template-columns: 350px 1fr;
}

.system-prompt-container.fullscreen:hover {
  box-shadow: none;
}

.system-prompt-container.fullscreen :deep(.system-prompt-input) {
  max-width: none;
  width: 100%;
  flex: 1;
  max-height: none;
  font-size: 1rem;
}

/* 平板和小屏幕适配 */
@media (max-width: 1024px) {
  .prompt-main-content {
    grid-template-columns: 280px 1fr;
    gap: 1rem;
  }

  .system-prompt-container.fullscreen .prompt-main-content {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 768px) {
  .system-prompt-container {
    max-width: 100%;
    border-radius: 12px;
  }

  .prompt-header-section {
    padding: 1rem 1rem 0;
  }

  .prompt-main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
    min-height: auto;
  }

  .prompt-sidebar {
    order: 2;
  }

  .prompt-editor-section {
    order: 1;
  }

  .quick-actions-grid {
    flex-direction: row;
    gap: 0.5rem;
  }

  .quick-action-btn {
    flex: 1;
    justify-content: center;
    padding: 0.5rem;
  }

  .system-prompt-container.fullscreen {
    position: relative;
    border-radius: 0;
  }

  .system-prompt-container.fullscreen .prompt-header-section {
    padding: 1.5rem 1.5rem 0;
  }

  .system-prompt-container.fullscreen .prompt-main-content {
    padding: 1.5rem;
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .system-prompt-container.fullscreen :deep(.system-prompt-input) {
    font-size: 0.95rem;
  }
}

@media (max-height: 800px) {
  .prompt-main-content {
    min-height: 400px;
  }
}

@media (max-height: 700px) {
  .prompt-main-content {
    min-height: 350px;
  }

  .prompt-selector-card,
  .quick-actions-card,
  .editor-card {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .prompt-header-section {
    padding: 0.75rem 0.75rem 0;
  }

  .prompt-main-content {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .quick-actions-grid {
    flex-direction: column;
  }

  .quick-action-btn {
    font-size: 0.75rem;
    padding: 0.5rem;
  }
}
</style>
