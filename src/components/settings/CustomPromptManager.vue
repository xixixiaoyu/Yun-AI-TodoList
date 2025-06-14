<template>
  <div class="custom-prompt-manager">
    <!-- 添加新提示词弹窗 -->
    <div v-if="showAddPromptPopover" class="api-key-popover">
      <div class="popover-header">
        <h3>{{ t('addNewPrompt') }}</h3>
        <button class="close-button" @click="closeAddPromptPopover">
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
      <div class="popover-content">
        <div class="input-group">
          <label>{{ t('enterPromptName') }}</label>
          <input
            v-model="newPromptName"
            type="text"
            :placeholder="t('enterPromptName')"
            class="prompt-name-input"
          />
        </div>
        <div class="input-group">
          <label>{{ t('enterPromptContent') }}</label>
          <textarea
            v-model="newPromptContent"
            :placeholder="t('enterPromptContent')"
            class="prompt-content-input"
            rows="6"
          />
        </div>
        <div class="button-group">
          <button class="save-button" :disabled="!isFormValid" @click="saveNewPrompt">
            {{ t('save') }}
          </button>
          <button class="clear-button" @click="closeAddPromptPopover">
            {{ t('cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      v-if="showAddPromptPopover"
      class="popover-overlay"
      @click="closeAddPromptPopover"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  showAddPromptPopover: boolean
  newPromptName: string
  newPromptContent: string
}

interface Emits {
  (e: 'update:showAddPromptPopover', value: boolean): void
  (e: 'update:newPromptName', value: string): void
  (e: 'update:newPromptContent', value: string): void
  (e: 'saveNewPrompt'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

// 计算属性
const newPromptName = computed({
  get: () => props.newPromptName,
  set: (value) => emit('update:newPromptName', value),
})

const newPromptContent = computed({
  get: () => props.newPromptContent,
  set: (value) => emit('update:newPromptContent', value),
})

const isFormValid = computed(() => {
  return newPromptName.value.trim() !== '' && newPromptContent.value.trim() !== ''
})

// 方法
const closeAddPromptPopover = () => {
  emit('update:showAddPromptPopover', false)
}

const saveNewPrompt = () => {
  if (isFormValid.value) {
    emit('saveNewPrompt')
  }
}

defineOptions({
  name: 'CustomPromptManager',
})
</script>

<style scoped>
.api-key-popover {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 600px;
  background-color: var(--card-bg-color);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  animation: popoverIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.popover-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--card-bg-color);
}

.popover-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: var(--hover-bg-color);
}

.popover-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.prompt-name-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.prompt-content-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--input-border-color);
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  min-height: 120px;
  max-height: 300px;
  transition: all 0.2s ease;
}

.prompt-name-input:focus,
.prompt-content-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15);
}

.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.save-button,
.clear-button {
  flex: 1;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 42px;
}

.save-button {
  background-color: var(--button-bg-color);
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.clear-button {
  background-color: var(--language-toggle-bg);
  color: var(--language-toggle-color);
}

.clear-button:hover {
  background-color: var(--language-toggle-hover-bg);
  transform: translateY(-1px);
}

.popover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: overlayIn 0.3s ease;
}

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes overlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-height: 600px) {
  .api-key-popover {
    max-height: 95vh;
  }

  .prompt-content-input {
    min-height: 80px;
    max-height: 200px;
  }
}

@media (max-width: 480px) {
  .api-key-popover {
    width: calc(100% - 1rem);
    max-width: none;
    border-radius: 16px;
  }

  .popover-header {
    padding: 1rem 1.25rem;
  }

  .popover-header h3 {
    font-size: 1.1rem;
  }

  .popover-content {
    padding: 1.25rem;
    gap: 1rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
