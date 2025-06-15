<template>
  <div class="prompt-dialog-overlay">
    <div class="prompt-dialog">
      <div class="dialog-header">
        <h3>{{ t('addNewPrompt') }}</h3>
        <button class="close-button" @click="$emit('close')">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>

      <div class="dialog-content">
        <!-- 基本信息表单 -->
        <PromptBasicInfoForm
          :new-prompt-name="newPromptName"
          :new-prompt-description="newPromptDescription"
          :new-prompt-category="newPromptCategory"
          :new-prompt-priority="newPromptPriority"
          :new-prompt-tags="newPromptTags"
          @update:new-prompt-name="$emit('update:newPromptName', $event)"
          @update:new-prompt-description="$emit('update:newPromptDescription', $event)"
          @update:new-prompt-category="$emit('update:newPromptCategory', $event)"
          @update:new-prompt-priority="$emit('update:newPromptPriority', $event)"
          @update:new-prompt-tags="$emit('update:newPromptTags', $event)"
        />

        <!-- 内容表单 -->
        <PromptContentForm
          :new-prompt-content="newPromptContent"
          @update:new-prompt-content="$emit('update:newPromptContent', $event)"
        />

        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- 操作按钮 -->
        <div class="dialog-actions">
          <button class="cancel-button" @click="$emit('close')">
            {{ t('cancel') }}
          </button>
          <button class="save-button" :disabled="!isFormValid" @click="$emit('save')">
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PromptCategory, PromptPriority } from '../../../types/settings'
import PromptBasicInfoForm from './PromptBasicInfoForm.vue'
import PromptContentForm from './PromptContentForm.vue'

interface Props {
  newPromptName: string
  newPromptContent: string
  newPromptDescription: string
  newPromptCategory: PromptCategory
  newPromptPriority: PromptPriority
  newPromptTags: string[]
  error: string | null
  isFormValid: boolean
}

interface Emits {
  (e: 'update:newPromptName', value: string): void
  (e: 'update:newPromptContent', value: string): void
  (e: 'update:newPromptDescription', value: string): void
  (e: 'update:newPromptCategory', value: PromptCategory): void
  (e: 'update:newPromptPriority', value: PromptPriority): void
  (e: 'update:newPromptTags', value: string[]): void
  (e: 'close'): void
  (e: 'save'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'PromptFormDialog',
})
</script>

<style scoped>
.prompt-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.prompt-dialog {
  background-color: var(--card-bg-color);
  border-radius: 12px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid var(--input-border-color);
  margin-bottom: 1.5rem;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: var(--input-bg-color);
  color: var(--text-color);
}

.dialog-content {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.error-message {
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--input-border-color);
}

.cancel-button,
.save-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background-color: var(--input-bg-color);
  border: 2px solid var(--input-border-color);
  color: var(--text-color);
}

.cancel-button:hover {
  background-color: var(--input-border-color);
}

.save-button {
  background-color: var(--button-bg-color);
  border: 2px solid var(--button-bg-color);
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  border-color: var(--button-hover-bg-color);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .prompt-dialog {
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .cancel-button,
  .save-button {
    width: 100%;
  }
}
</style>
