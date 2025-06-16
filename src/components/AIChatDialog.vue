<template>
  <div class="ai-chat-dialog">
    <AIChatHeader />

    <AIChatContent
      ref="messageListRef"
      :is-drawer-open="isDrawerOpen"
      :conversation-history="conversationHistory"
      :current-conversation-id="currentConversationId"
      :chat-history="chatHistory"
      :current-ai-response="currentAIResponse"
      :user-message="userMessage"
      :is-generating="isGenerating"
      :is-optimizing="isOptimizing"
      @toggle-drawer="isDrawerOpen = !isDrawerOpen"
      @update:is-drawer-open="isDrawerOpen = $event"
      @switch-conversation="switchConversation"
      @delete-conversation="deleteConversation"
      @clear-conversations="clearAllConversations"
      @new-conversation="createNewConversation"
      @optimize="optimizeMessage"
      @send="handleSendMessage"
      @stop="stopGenerating"
      @scroll="handleScroll"
      @update:user-message="userMessage = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChat } from '../composables/useChat'
import AIChatContent from './chat/AIChatContent.vue'
import AIChatHeader from './chat/AIChatHeader.vue'

const {
  chatHistory,
  userMessage,
  isGenerating,
  isOptimizing,
  conversationHistory,
  currentConversationId,
  currentAIResponse,
  loadConversationHistory,
  createNewConversation,
  switchConversation,
  deleteConversation,
  clearAllConversations,
  sendMessage,
  stopGenerating,
  optimizeMessage
} = useChat()

const isDrawerOpen = ref(false)
const messageListRef = ref<InstanceType<typeof AIChatContent> | null>(null)
const shouldAutoScroll = ref(true)

const handleScroll = (scrollInfo: {
  isAtBottom: boolean
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}) => {
  if (
    !scrollInfo.isAtBottom &&
    scrollInfo.scrollTop < scrollInfo.scrollHeight - scrollInfo.clientHeight - 100
  ) {
    shouldAutoScroll.value = false
  } else {
    shouldAutoScroll.value = true
  }
}

const handleSendMessage = async () => {
  shouldAutoScroll.value = true
  await sendMessage()
}

onMounted(() => {
  loadConversationHistory()

  const savedConversationId = localStorage.getItem('currentConversationId')

  if (conversationHistory.value.length === 0) {
    createNewConversation()
  } else if (savedConversationId) {
    const exists = conversationHistory.value.some(c => c.id === savedConversationId)
    if (exists) {
      switchConversation(savedConversationId)
    } else {
      switchConversation(conversationHistory.value[0].id)
    }
  } else {
    switchConversation(conversationHistory.value[0].id)
  }
})

defineOptions({
  name: 'AIChatDialog'
})
</script>

<style scoped>
.ai-chat-dialog {
  overflow: hidden;
  font-family: 'LXGW WenKai Lite Medium', sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
  z-index: 100000;
  text-align: left;
}
</style>
