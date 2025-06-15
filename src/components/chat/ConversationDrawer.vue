<template>
  <div class="drawer-container" :class="{ 'drawer-open': isOpen }">
    <div class="drawer">
      <div class="drawer-header">
        <h3 class="drawer-title">
          {{ t('conversations') }}
        </h3>
        <div class="drawer-header-controls">
          <button class="clear-all-btn" :title="t('clearAllConversations')" @click="$emit('clear')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path
                d="M15 2H9c-1.1 0-2 .9-2 2v2H3v2h2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8h2V6h-4V4c0-1.1-.9-2-2-2zm0 2v2H9V4h6zM7 8h10v12H7V8z"
              />
              <path d="M9 10h2v8H9zm4 0h2v8h-2z" />
            </svg>
          </button>
          <button class="close-drawer-btn" @click="$emit('update:isOpen', false)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div class="conversation-list">
        <div
          v-for="conversation in conversations"
          :key="conversation.id"
          class="conversation-item"
          :class="{ active: currentConversationId === conversation.id }"
          @click.stop="$emit('switch', conversation.id)"
        >
          <span>{{ conversation.title }}</span>
          <button class="delete-conversation-btn" @click.stop="$emit('delete', conversation.id)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="isOpen" class="drawer-overlay" @click="$emit('update:isOpen', false)" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Conversation } from '../../services/types'

defineProps<{
  isOpen: boolean
  conversations: Conversation[]
  currentConversationId: string | null
}>()

defineEmits<{
  'update:isOpen': [value: boolean]
  switch: [id: string]
  delete: [id: string]
  clear: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.drawer-container {
  position: fixed;
  left: -300px;
  top: 0;
  height: 100%;
  width: 300px;
  background-color: var(--bg-color);
  transition: transform 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.drawer-container.drawer-open {
  transform: translateX(300px);
}

.drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--input-border-color);
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.drawer-header-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.clear-all-btn,
.close-drawer-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-color);
  opacity: 0.7;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-all-btn:hover {
  opacity: 1;
  color: #ff4d4f;
}

.close-drawer-btn:hover {
  opacity: 1;
}

.conversation-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.conversation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 8px;
  background-color: var(--input-bg-color);
  transition: all 0.2s ease;
}

.conversation-item:hover {
  opacity: 0.9;
}

.conversation-item.active {
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
}

.conversation-item span {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.delete-conversation-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
  color: inherit;
}

.delete-conversation-btn:hover {
  opacity: 1;
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

@media (max-width: 768px) {
  .drawer-container {
    width: 85%;
    max-width: 300px;
    left: -85%;
  }

  .drawer-container.drawer-open {
    transform: translateX(100%);
  }
}
</style>
