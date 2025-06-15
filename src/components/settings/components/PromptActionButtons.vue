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
  gap: 0.25rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 5px;
  background-color: var(--input-bg-color);
  color: var(--text-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn:hover {
  background-color: var(--button-bg-color);
  color: white;
}

.favorite-btn.active {
  background-color: #fbbf24;
  color: white;
}

.delete-btn:hover {
  background-color: #ef4444;
}

.add-btn:hover {
  background-color: #10b981;
}

@media (max-width: 768px) {
  .selector-actions {
    justify-content: center;
  }
}
</style>
