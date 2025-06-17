<template>
  <div class="flex-grow flex flex-col py-4 md:py-2 overflow-hidden h-[calc(100%-60px)] relative">
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
      :is-searching="isSearching"
      @scroll="$emit('scroll', $event)"
    />

    <div class="sticky bottom-0 bg-bg z-10 flex flex-col gap-3 py-3 sm:py-2">
      <ChatToolbar
        :is-optimizing="isOptimizing"
        :user-message="userMessage"
        @new="$emit('newConversation')"
        @optimize="$emit('optimize')"
        @toggle-search="$emit('toggleSearch')"
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
import type { ChatMessage } from '../../services/types'
import ChatInput from './ChatInput.vue'
import ChatMessageList from './ChatMessageList.vue'
import ChatToolbar from './ChatToolbar.vue'
import ConversationDrawer from './ConversationDrawer.vue'

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
  isSearching?: boolean
}

interface ScrollInfo {
  isAtBottom: boolean
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

interface Emits {
  (e: 'toggleDrawer'): void
  (e: 'toggleSearch'): void
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
  inputRef,
})

defineOptions({
  name: 'AIChatContent',
})
</script>
