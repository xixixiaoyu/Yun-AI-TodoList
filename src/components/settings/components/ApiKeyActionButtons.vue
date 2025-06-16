<template>
  <div class="button-group">
    <button class="save-button" :disabled="!localApiKey.trim()" @click="$emit('save')">
      <SaveIcon />
      {{ t('save') }}
    </button>
    <button class="clear-button" :disabled="!localApiKey" @click="$emit('clear')">
      <DeleteIcon />
      {{ t('clear') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SaveIcon from '../../common/icons/SaveIcon.vue'
import DeleteIcon from '../../common/icons/DeleteIcon.vue'

interface Props {
  localApiKey: string
}

interface Emits {
  (e: 'save'): void
  (e: 'clear'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ApiKeyActionButtons',
})
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.save-button,
.clear-button {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 16px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.save-button {
  background: linear-gradient(135deg, var(--button-bg-color), var(--button-hover-bg-color));
  color: white;
  box-shadow: 0 4px 16px rgba(var(--button-bg-color-rgb), 0.3);
}

.save-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(var(--button-bg-color-rgb), 0.4);
}

.save-button:hover:not(:disabled)::before {
  left: 100%;
}

.clear-button {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
}

.clear-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.clear-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(220, 53, 69, 0.4);
}

.clear-button:hover:not(:disabled)::before {
  left: 100%;
}

.save-button:disabled,
.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.save-button:active:not(:disabled),
.clear-button:active:not(:disabled) {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .button-group {
    gap: 0.75rem;
  }

  .save-button,
  .clear-button {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .button-group {
    flex-direction: column;
    gap: 0.75rem;
  }

  .save-button,
  .clear-button {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    border-radius: 10px;
  }
}
</style>
