<template>
  <textarea
    :value="value"
    :placeholder="t('enterSystemPrompt')"
    class="system-prompt-input"
    rows="10"
    @input="$emit('input', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  value: string
}

interface Emits {
  (e: 'input', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'SystemPromptTextarea'
})
</script>

<style scoped>
.system-prompt-input {
  width: 100%;
  max-width: 100%;
  padding: 1rem;
  border: 2px solid var(--input-border-color);
  border-radius: 10px;
  font-size: 0.875rem;
  background-color: var(--card-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 200px;
  max-height: 500px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  line-height: 1.6;
  margin: 0;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05);
  flex: 1;
}

.system-prompt-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow:
    0 0 0 3px rgba(var(--button-bg-color-rgb), 0.15),
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.system-prompt-input::placeholder {
  color: var(--text-secondary-color);
  opacity: 0.7;
}

@media (max-height: 800px) {
  .system-prompt-input {
    min-height: 100px;
    max-height: 250px;
  }
}

@media (max-height: 700px) {
  .system-prompt-input {
    min-height: 80px;
    max-height: 200px;
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .system-prompt-input {
    min-height: 100px;
    max-height: 250px;
  }
}
</style>
