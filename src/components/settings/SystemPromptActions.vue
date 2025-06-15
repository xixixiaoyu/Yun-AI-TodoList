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
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--input-border-color);
}

.save-button,
.reset-button {
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: 40px;
  min-width: 100px;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.save-button {
  background-color: var(--button-bg-color);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.save-button:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none;
}

.reset-button {
  background-color: transparent;
  color: var(--text-secondary-color);
  border-color: var(--input-border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.reset-button:hover {
  background-color: var(--input-bg-color);
  border-color: var(--button-bg-color);
  color: var(--button-bg-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
