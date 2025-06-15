<template>
  <div class="ai-chat-dialog">
    <AIChatHeader
      :selected-prompt-template="selectedPromptTemplate"
      :custom-prompts="customPrompts"
      @template-change="handleTemplateChange"
    />

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
import { ref, onMounted } from 'vue'
import { useChat } from '../composables/useChat'
import AIChatHeader from './chat/AIChatHeader.vue'
import AIChatContent from './chat/AIChatContent.vue'

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
const selectedPromptTemplate = ref<string>('none')
const customPrompts = ref<{ id: string; name: string; content: string }[]>([])

const handleTemplateChange = (template: string) => {
  selectedPromptTemplate.value = template
  if (template === 'none') {
    localStorage.setItem('systemPrompt', '')
  } else {
    const customPrompt = customPrompts.value.find(p => p.id === template)
    if (customPrompt) {
      localStorage.setItem('systemPrompt', customPrompt.content)
    }
  }

  localStorage.setItem('lastSelectedTemplate', template)
}

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

  const savedCustomPrompts = localStorage.getItem('customPrompts')
  if (savedCustomPrompts) {
    customPrompts.value = JSON.parse(savedCustomPrompts)
  }

  const savedConversationId = localStorage.getItem('currentConversationId')
  const lastSelectedTemplate = localStorage.getItem('lastSelectedTemplate')

  if (lastSelectedTemplate) {
    selectedPromptTemplate.value = lastSelectedTemplate
  }

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
  font-family: 'LXGW WenKai Screen', sans-serif;
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
