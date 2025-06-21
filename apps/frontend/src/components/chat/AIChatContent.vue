<template>
  <div class="flex-grow flex flex-col py-4 md:py-2 overflow-hidden relative">
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
      :current-thinking="currentThinkingContent"
      :is-retrying="isRetrying"
      :retry-count="retryCount"
      :has-error="hasError"
      @scroll="$emit('scroll', $event)"
      @retry="(messageIndex: number) => $emit('retry', messageIndex)"
      @optimize="$emit('optimize')"
      @generate-chart="$emit('generateChart', $event)"
    />

    <div class="sticky bottom-0 bg-bg z-10 flex flex-col gap-1 py-3 sm:py-2">
      <ChatToolbar
        :is-generating="isGenerating"
        @new="$emit('newConversation')"
        @toggle-drawer="$emit('toggleDrawer')"
      />

      <ChatInput
        ref="inputRef"
        :model-value="userMessage"
        :is-generating="isGenerating"
        :is-optimizing="isOptimizing"
        :has-uploaded-file="hasUploadedFile"
        :uploaded-file-name="uploadedFileName"
        :uploaded-file-size="uploadedFileSize"
        @update:model-value="$emit('update:userMessage', $event)"
        @send="$emit('send')"
        @stop="$emit('stop')"
        @optimize="$emit('optimize')"
        @file-upload="$emit('file-upload', $event)"
        @clear-file="$emit('clear-file')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
  lastUpdated: string
  tags?: string[]
  summary?: string
  messageCount?: number
  wordCount?: number
}

interface Props {
  isDrawerOpen: boolean
  conversationHistory: Conversation[]
  currentConversationId: string | null
  chatHistory: ChatMessage[]
  currentAiResponse: string
  currentThinkingContent: string
  userMessage: string
  isGenerating: boolean
  isOptimizing: boolean
  isRetrying?: boolean
  retryCount?: number
  hasError?: boolean
  hasUploadedFile?: boolean
  uploadedFileName?: string
  uploadedFileSize?: number
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
  (e: 'retry', messageIndex: number): void
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'scroll', scrollInfo: ScrollInfo): void
  (e: 'update:userMessage', value: string): void
  (e: 'generateChart', content: string): void
  (e: 'file-upload', payload: { file: File; content: string }): void
  (e: 'clear-file'): void
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
