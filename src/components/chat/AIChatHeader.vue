<template>
  <div class="dialog-header">
    <div class="header-left">
      <h2>{{ t('aiAssistant') }}</h2>
      <div class="prompt-template-selector">
        <select :value="selectedPromptTemplate" @change="handleTemplateChange">
          <option value="none">{{ t('nonePrompt') }}</option>

          <optgroup v-if="customPrompts.length > 0" :label="t('customPrompts')">
            <option v-for="prompt in customPrompts" :key="prompt.id" :value="prompt.id">
              {{ prompt.name }}
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
import { useI18n } from 'vue-i18n'
import CloseIcon from '../common/icons/CloseIcon.vue'

interface CustomPrompt {
  id: string
  name: string
  content: string
}

interface Props {
  selectedPromptTemplate: string
  customPrompts: CustomPrompt[]
}

interface Emits {
  (e: 'templateChange', template: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

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
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.prompt-template-selector {
  margin-left: 1rem;
  flex: 1;
  min-width: 0;
}

.prompt-template-selector select {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--card-bg-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.2em;
  width: 100%;
  max-width: 300px;
}

.prompt-template-selector select:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.prompt-template-selector select:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.3);
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
    padding: 8px 12px;
    gap: 8px;
  }

  .dialog-header h2 {
    font-size: 16px;
    white-space: nowrap;
  }

  .header-left {
    gap: 0.5rem;
    overflow: hidden;
  }

  .prompt-template-selector {
    margin-left: 0.5rem;
    position: relative;
  }

  .prompt-template-selector select {
    font-size: 0.85rem;
    padding: 0.4rem 1.8rem 0.4rem 0.8rem;
    background-size: 1em;
    background-position: right 0.3rem center;
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
    padding: 6px 10px;
  }

  .dialog-header h2 {
    font-size: 15px;
  }

  .prompt-template-selector select {
    font-size: 0.8rem;
    padding: 0.35rem 1.6rem 0.35rem 0.6rem;
  }

  .close-button :deep(svg) {
    width: 18px;
    height: 18px;
  }
}
</style>
