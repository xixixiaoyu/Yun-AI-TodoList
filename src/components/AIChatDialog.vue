<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChat } from '../composables/useChat'
import ChatMessageList from './chat/ChatMessageList.vue'
import ChatInput from './chat/ChatInput.vue'
import ConversationDrawer from './chat/ConversationDrawer.vue'
import ChatToolbar from './chat/ChatToolbar.vue'

const { t } = useI18n()

const {
  chatHistory,
  userMessage,
  isGenerating,
  isOptimizing,
  conversationHistory,
  currentConversationId,
  loadConversationHistory,
  createNewConversation,
  switchConversation,
  deleteConversation,
  clearAllConversations,
  sendMessage,
  stopGenerating,
  optimizeMessage,
} = useChat()

const isDrawerOpen = ref(false)
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)
const inputRef = ref<InstanceType<typeof ChatInput> | null>(null)
const userHasScrolled = ref(false)

// 处理滚动状态
const handleScroll = (hasScrolled: boolean) => {
  userHasScrolled.value = hasScrolled
}

// 监听消息变化，自动滚动到底部
watch(chatHistory, () => {
  if (!userHasScrolled.value && messageListRef.value) {
    messageListRef.value.scrollToBottom()
  }
})

// 初始化
onMounted(() => {
  loadConversationHistory()

  // 从 localStorage 获取上次激活的会话 ID
  const savedConversationId = localStorage.getItem('currentConversationId')

  if (conversationHistory.value.length === 0) {
    createNewConversation()
  } else if (savedConversationId) {
    // 尝试恢复上次激活的会话
    const conversationId = parseInt(savedConversationId)
    const exists = conversationHistory.value.some((c) => c.id === conversationId)
    if (exists) {
      switchConversation(conversationId)
    } else {
      // 如果上次激活的会话不存在，切换到第一个会话
      switchConversation(conversationHistory.value[0].id)
    }
  } else {
    // 如果没有保存的会话 ID，切换到第一个会话
    switchConversation(conversationHistory.value[0].id)
  }

  // 聚焦输入框
  if (inputRef.value) {
    inputRef.value.focus()
  }
})
</script>

<template>
  <div class="ai-chat-dialog">
    <div class="dialog-header">
      <h2>{{ t('aiAssistant') }}</h2>
      <router-link to="/" class="close-button" aria-label="close">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="24"
          height="24"
        >
          <path
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </router-link>
    </div>

    <div class="dialog-content">
      <ConversationDrawer
        v-model:isOpen="isDrawerOpen"
        :conversations="conversationHistory"
        :current-conversation-id="currentConversationId"
        @switch="switchConversation"
        @delete="deleteConversation"
        @clear="clearAllConversations"
      />

      <ChatMessageList
        ref="messageListRef"
        :messages="chatHistory"
        @scroll="handleScroll"
      />

      <div class="input-section">
        <ChatToolbar
          :is-optimizing="isOptimizing"
          :user-message="userMessage"
          @new="createNewConversation"
          @optimize="optimizeMessage"
          @toggle-drawer="isDrawerOpen = !isDrawerOpen"
        />

        <ChatInput
          ref="inputRef"
          v-model="userMessage"
          :is-generating="isGenerating"
          :is-optimizing="isOptimizing"
          @send="sendMessage"
          @stop="stopGenerating"
          @optimize="optimizeMessage"
        />
      </div>
    </div>
  </div>
</template>

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

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: var(--card-bg-color);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
}

.close-button:hover {
  opacity: 1;
}

.dialog-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  overflow: hidden;
  height: calc(100% - 60px);
  position: relative;
}

@media (max-width: 768px) {
  .dialog-header {
    padding: 8px 12px;
  }

  .dialog-header h2 {
    font-size: 18px;
  }

  .dialog-content {
    padding: 8px 0;
  }
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
</style>
