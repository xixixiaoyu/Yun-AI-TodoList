<template>
  <div class="dialog-header">
    <div class="header-left">
      <div class="header-title-section">
        <h2>{{ t('aiAssistant') }}</h2>
        <div class="current-prompt-indicator">
          <span class="prompt-label">{{ t('currentPrompt') }}:</span>
          <span class="prompt-name">{{ currentPromptName }}</span>
        </div>
      </div>

      <div class="prompt-template-selector">
        <select :value="selectedPromptTemplate" @change="handleTemplateChange">
          <option value="none">{{ t('nonePrompt') }}</option>

          <optgroup v-if="customPrompts.length > 0" :label="t('customPrompts')">
            <option v-for="prompt in customPrompts" :key="prompt.id" :value="prompt.id">
              {{ prompt.name }}
              <span v-if="prompt.isFavorite">⭐</span>
            </option>
          </optgroup>
        </select>
      </div>
    </div>

    <router-link to="/" class="close-button" aria-label="close">
      <CloseIcon />
    </router-link>
  </div>
</template>

<script setup lang="ts">
import CloseIcon from '../common/icons/CloseIcon.vue'

interface CustomPrompt {
  id: string
  name: string
  content: string
  isFavorite?: boolean
}

interface Props {
  selectedPromptTemplate: string
  customPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'templateChange', template: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const currentPromptName = computed(() => {
  if (props.selectedPromptTemplate === 'none') {
    return t('nonePrompt')
  }

  const customPrompt = props.customPrompts.find(p => p.id === props.selectedPromptTemplate)
  return customPrompt?.name || t('nonePrompt')
})

const handleTemplateChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('templateChange', target.value)
}

defineOptions({
  name: 'AIChatHeader'
})
</script>

<style scoped>
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.current-prompt-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.9;
}

.prompt-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.prompt-name {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-template-selector {
  flex: 1;
  min-width: 0;
  max-width: 300px;
}

.prompt-template-selector select {
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.15);
  color: var(--card-bg-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.2em;
  width: 100%;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.prompt-template-selector select:hover {
  background-color: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.prompt-template-selector select:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.prompt-template-selector select option,
.prompt-template-selector select optgroup {
  background-color: var(--card-bg-color);
  color: var(--text-color);
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: var(--card-bg-color);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  text-decoration: none;
}

.close-button:hover {
  opacity: 1;
}

.close-button :deep(svg) {
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .dialog-header {
    padding: 10px 12px;
    gap: 8px;
  }

  .dialog-header h2 {
    font-size: 16px;
    white-space: nowrap;
  }

  .header-left {
    gap: 0.75rem;
    overflow: hidden;
  }

  .header-title-section {
    flex-shrink: 0;
  }

  .current-prompt-indicator {
    font-size: 0.7rem;
  }

  .prompt-name {
    max-width: 100px;
  }

  .prompt-template-selector {
    max-width: 200px;
  }

  .prompt-template-selector select {
    font-size: 0.8rem;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    background-size: 1em;
    background-position: right 0.5rem center;
  }

  .close-button {
    padding: 4px;
  }

  .close-button :deep(svg) {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 8px 10px;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .header-left {
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-title-section {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .dialog-header h2 {
    font-size: 15px;
  }

  .current-prompt-indicator {
    font-size: 0.65rem;
  }

  .prompt-name {
    max-width: 80px;
  }

  .prompt-template-selector {
    max-width: none;
  }

  .prompt-template-selector select {
    font-size: 0.8rem;
    padding: 0.5rem 1.8rem 0.5rem 0.75rem;
  }

  .close-button {
    position: absolute;
    top: 8px;
    right: 10px;
  }

  .close-button :deep(svg) {
    width: 18px;
    height: 18px;
  }
}
</style>
