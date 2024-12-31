<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  isOptimizing: boolean
  userMessage: string
}>()

defineEmits<{
  (e: 'new'): void
  (e: 'optimize'): void
  (e: 'toggleDrawer'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="conversation-controls">
    <button class="new-conversation-btn" @click="$emit('new')">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
      {{ t('newConversation') }}
    </button>
    <button
      :disabled="!userMessage.trim() || isOptimizing"
      class="optimize-btn"
      @click="$emit('optimize')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        />
      </svg>
      {{ isOptimizing ? t('optimizing') : t('optimize') }}
    </button>
    <button class="toggle-drawer-btn" @click="$emit('toggleDrawer')">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.conversation-controls {
  display: flex;
  gap: 8px;
  padding: 0 20px;
}

.new-conversation-btn,
.optimize-btn,
.toggle-drawer-btn {
  padding: 8px 16px;
  font-size: 14px;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  height: 36px;
}

.new-conversation-btn:hover:not(:disabled),
.optimize-btn:hover:not(:disabled),
.toggle-drawer-btn:hover {
  background-color: var(--button-hover-bg-color);
  color: var(--card-bg-color);
}

.optimize-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .conversation-controls {
    padding: 0 12px;
    gap: 6px;
  }

  .new-conversation-btn,
  .optimize-btn,
  .toggle-drawer-btn {
    padding: 6px 12px;
    font-size: 13px;
    height: 32px;
  }

  .new-conversation-btn svg,
  .optimize-btn svg,
  .toggle-drawer-btn svg {
    width: 14px;
    height: 14px;
  }
}
</style>
