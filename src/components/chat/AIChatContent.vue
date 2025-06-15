<template>
  <div class="dialog-content">
    <ConversationDrawer
      :is-open="isDrawerOpen"
      :conversations="conversationHistory"
      :current-conversation-id="currentConversationId"
      @update:is-open="$emit('update:isDrawerOpen', $event)"
      @switch="$emit('switchConversation', $event)"
      @delete="$emit('deleteConversation', $event)"
      @clear="$emit('clearConversations')"
    />

    <ChatMessageList
      ref="messageListRef"
      :messages="chatHistory"
      :current-response="currentAiResponse"
      @scroll="$emit('scroll', $event)"
    />

    <div class="input-section">
      <ChatToolbar
        :is-optimizing="isOptimizing"
        :user-message="userMessage"
        @new="$emit('newConversation')"
        @optimize="$emit('optimize')"
        @toggle-drawer="$emit('toggleDrawer')"
      />

      <ChatInput
        ref="inputRef"
        :model-value="userMessage"
        :is-generating="isGenerating"
        :is-optimizing="isOptimizing"
        @update:model-value="$emit('update:userMessage', $event)"
        @send="$emit('send')"
        @stop="$emit('stop')"
        @optimize="$emit('optimize')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatMessageList from './ChatMessageList.vue'
import ChatInput from './ChatInput.vue'
import ConversationDrawer from './ConversationDrawer.vue'
import ChatToolbar from './ChatToolbar.vue'
import type { ChatMessage } from '../../services/types'

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}

interface Props {
  isDrawerOpen: boolean
  conversationHistory: Conversation[]
  currentConversationId: string | null
  chatHistory: ChatMessage[]
  currentAiResponse: string
  userMessage: string
  isGenerating: boolean
  isOptimizing: boolean
}

interface ScrollInfo {
  isAtBottom: boolean
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

interface Emits {
  (e: 'toggleDrawer'): void
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'switchConversation', id: string): void
  (e: 'deleteConversation', id: string): void
  (e: 'clearConversations'): void
  (e: 'newConversation'): void
  (e: 'optimize'): void
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'scroll', scrollInfo: ScrollInfo): void
  (e: 'update:userMessage', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()

const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)
const inputRef = ref<InstanceType<typeof ChatInput> | null>(null)

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})

defineExpose({
  messageListRef,
  inputRef
})

defineOptions({
  name: 'AIChatContent'
})
</script>

<style scoped>
.dialog-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  overflow: hidden;
  height: calc(100% - 60px);
  position: relative;
}

.input-section {
  position: sticky;
  bottom: 0;
  background-color: var(--bg-color);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

@media (max-width: 768px) {
  .dialog-content {
    padding: 8px 0;
  }
}

@media (max-width: 480px) {
  .input-section {
    padding: 6px 0;
  }
}
</style>
