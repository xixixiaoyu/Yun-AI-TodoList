<template>
  <div class="selector-actions">
    <button
      v-if="isCustomPrompt"
      class="action-btn duplicate-btn"
      :title="t('duplicatePrompt')"
      @click="$emit('duplicatePrompt')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z"
        />
      </svg>
    </button>

    <button
      v-if="isCustomPrompt"
      class="action-btn favorite-btn"
      :class="{ active: currentPrompt?.isFavorite }"
      :title="currentPrompt?.isFavorite ? t('promptUnfavorite') : t('promptFavorite')"
      @click="$emit('toggleFavorite')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        />
      </svg>
    </button>

    <button
      v-if="isCustomPrompt"
      class="action-btn delete-btn"
      :title="t('deleteCustomPrompt')"
      @click="$emit('confirmDeletePrompt')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"
        />
      </svg>
    </button>

    <button class="action-btn add-btn" :title="t('addNewPrompt')" @click="$emit('showAddPrompt')">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CustomPrompt } from '../../../types/settings'

interface Props {
  isCustomPrompt: boolean
  currentPrompt?: CustomPrompt | null
}

interface Emits {
  (e: 'duplicatePrompt'): void
  (e: 'toggleFavorite'): void
  (e: 'confirmDeletePrompt'): void
  (e: 'showAddPrompt'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'PromptActionButtons'
})
</script>

<style scoped>
.selector-actions {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--input-border-color);
  border-radius: 6px;
  background-color: var(--card-bg-color);
  color: var(--text-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:hover {
  background-color: var(--button-bg-color);
  border-color: var(--button-bg-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.favorite-btn.active {
  background-color: #fbbf24;
  border-color: #fbbf24;
  color: white;
}

.favorite-btn.active:hover {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.delete-btn:hover {
  background-color: #ef4444;
  border-color: #ef4444;
}

.add-btn:hover {
  background-color: #10b981;
  border-color: #10b981;
}

.duplicate-btn:hover {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

@media (max-width: 768px) {
  .selector-actions {
    justify-content: center;
    gap: 0.5rem;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  .action-btn svg {
    width: 18px;
    height: 18px;
  }
}
</style>
