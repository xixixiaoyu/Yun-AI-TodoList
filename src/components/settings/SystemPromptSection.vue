<template>
  <div class="settings-section" :class="{ fullscreen: isFullscreen }">
    <!-- 区域标题 -->
    <div class="section-header">
      <div class="header-content">
        <h3 class="section-title">{{ t('systemPrompt') }}</h3>
        <p class="section-description">自定义 AI 助手的行为和回复风格</p>
      </div>
      <div class="header-actions">
        <button
          class="fullscreen-button"
          @click="$emit('toggleFullscreen')"
          :title="isFullscreen ? t('exitFullscreen') : t('enterFullscreen')"
        >
          <svg
            v-if="!isFullscreen"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 提示词控制区域 -->
    <div class="prompt-controls">
      <div class="template-selector-wrapper">
        <PromptTemplateSelector
          :selected-template="selectedPromptTemplate"
          :custom-prompts="customPrompts"
          @update:selected-template="$emit('update:selectedPromptTemplate', $event)"
          @template-change="$emit('templateChange')"
        />
      </div>
      <div class="prompt-actions">
        <button
          v-if="isCustomPrompt"
          class="delete-prompt-button"
          @click="$emit('confirmDeletePrompt')"
          :title="t('deleteCustomPrompt')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
            />
          </svg>
          {{ t('deleteCustomPrompt') }}
        </button>
        <button
          class="add-prompt-button"
          @click="$emit('showAddPrompt')"
          :title="t('addNewPrompt')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
          >
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          {{ t('addPrompt') }}
        </button>
      </div>
    </div>
    <textarea
      :value="localSystemPrompt"
      @input="
        $emit('update:localSystemPrompt', ($event.target as HTMLTextAreaElement).value)
      "
      :placeholder="t('enterSystemPrompt')"
      class="system-prompt-input"
      rows="10"
    />
    <div class="button-group">
      <button
        class="save-button"
        :disabled="!isSystemPromptValid"
        @click="$emit('saveSystemPrompt')"
      >
        {{ t('save') }}
      </button>
      <button class="reset-button" @click="$emit('resetSystemPrompt')">
        {{ t('reset') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PromptTemplateSelector from './PromptTemplateSelector.vue'
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
  (e: 'showAddPrompt'): void
  (e: 'toggleFullscreen'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

// 计算属性
const isCustomPrompt = computed(() => {
  return props.selectedPromptTemplate.startsWith('custom_')
})

const isSystemPromptValid = computed(() => {
  return props.localSystemPrompt.trim() !== ''
})

defineOptions({
  name: 'SystemPromptSection',
})
</script>

<style scoped>
.settings-section {
  background-color: var(--card-bg-color);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  transition: all 0.3s ease;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-content {
  flex: 1;
}

.section-title {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: var(--text-color);
}

.section-description {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.7));
  line-height: 1.5;
}

.header-actions {
  flex-shrink: 0;
}

.prompt-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.template-selector-wrapper {
  width: 100%;
}

.prompt-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.system-prompt-input {
  width: 100%;
  max-width: 900px;
  padding: 1rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 0.95rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 200px;
  max-height: 500px;
  font-family: inherit;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.system-prompt-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow:
    0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.button-group {
  width: 100%;
  max-width: 900px;
  display: flex;
  gap: 1.5rem;
  justify-content: flex-end;
  align-items: center;
  margin-top: 1rem;
}

.save-button,
.reset-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 42px;
  min-width: 120px;
  white-space: nowrap;
}

.save-button {
  background-color: var(--button-bg-color);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.save-button:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.reset-button {
  background-color: var(--language-toggle-bg);
  color: var(--language-toggle-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reset-button:hover {
  background-color: var(--language-toggle-hover-bg);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.fullscreen-button {
  background: none;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--input-bg-color);
}

.fullscreen-button:hover {
  border-color: var(--button-bg-color);
  background-color: var(--button-bg-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--button-bg-color-rgb), 0.3);
}

.add-prompt-button,
.delete-prompt-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 2px solid var(--input-border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.add-prompt-button:hover {
  border-color: var(--button-bg-color);
  background-color: var(--button-bg-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--button-bg-color-rgb), 0.3);
}

.delete-prompt-button:hover {
  border-color: #dc3545;
  background-color: #dc3545;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.settings-section.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  z-index: 1000;
  border-radius: 0;
  padding: 2rem;
  border: none;
  transform: none !important;
}

.settings-section.fullscreen:hover {
  box-shadow: none;
}

.settings-section.fullscreen .section-header {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto 2rem auto;
}

.settings-section.fullscreen .section-header h3 {
  font-size: 1.5rem;
}

.settings-section.fullscreen .system-prompt-input {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  max-height: none;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .settings-section {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .section-description {
    font-size: 0.9rem;
  }

  .prompt-controls {
    gap: 1rem;
  }

  .prompt-actions {
    width: 100%;
    justify-content: flex-start;
    gap: 0.75rem;
  }

  .add-prompt-button,
  .delete-prompt-button {
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    justify-content: center;
  }

  .fullscreen-button {
    align-self: flex-end;
  }

  .settings-section.fullscreen {
    position: relative;
    padding: 1.5rem;
    max-width: 100%;
    border-radius: 0;
  }

  .settings-section.fullscreen .section-title {
    font-size: 1.2rem;
  }

  .settings-section.fullscreen .system-prompt-input {
    max-width: 100%;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .button-group {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .button-group button {
    width: 100%;
  }
}
</style>
