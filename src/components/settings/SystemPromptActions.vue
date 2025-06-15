<template>
  <div class="button-group">
    <button class="save-button" :disabled="!isValid" @click="$emit('save')">
      {{ t('save') }}
    </button>
    <button class="reset-button" @click="$emit('reset')">
      {{ t('reset') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  isValid: boolean
}

interface Emits {
  (e: 'save'): void
  (e: 'reset'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'SystemPromptActions'
})
</script>

<style scoped>
.button-group {
  width: 100%;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  align-items: center;
  margin-top: 0.5rem;
}

.save-button,
.reset-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  height: 32px;
  min-width: 80px;
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

@media (max-height: 700px) {
  .save-button,
  .reset-button {
    height: 28px;
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
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
