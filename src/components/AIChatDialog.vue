<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChat } from '../composables/useChat'
import ChatMessageList from './chat/ChatMessageList.vue'
import ChatInput from './chat/ChatInput.vue'
import ConversationDrawer from './chat/ConversationDrawer.vue'
import ChatToolbar from './chat/ChatToolbar.vue'
import { promptsConfig } from '../config/prompts'

const { t } = useI18n()

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
  optimizeMessage,
} = useChat()

const isDrawerOpen = ref(false)
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)
const inputRef = ref<InstanceType<typeof ChatInput> | null>(null)
const shouldAutoScroll = ref(true)
const selectedPromptTemplate = ref<string>('my')
const customPrompts = ref<Array<{ id: string; name: string; content: string }>>([])

// 处理模板变更
const handleTemplateChange = () => {
  const template = selectedPromptTemplate.value
  if (template === 'my' || template === 'study' || template === 'studentStudy') {
    localStorage.setItem('systemPrompt', promptsConfig[template].content)
  } else {
    const customPrompt = customPrompts.value.find((p) => p.id === template)
    if (customPrompt) {
      localStorage.setItem('systemPrompt', customPrompt.content)
    }
  }
  // 保存当前选择的模板
  localStorage.setItem('lastSelectedTemplate', template)
}

// 处理滚动状态
const handleScroll = (scrollInfo: {
  isAtBottom: boolean
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}) => {
  // 只有用户主动向上滚动时才禁用自动滚动
  if (
    !scrollInfo.isAtBottom &&
    scrollInfo.scrollTop < scrollInfo.scrollHeight - scrollInfo.clientHeight - 100
  ) {
    shouldAutoScroll.value = false
  } else {
    shouldAutoScroll.value = true
  }
}

// 统一处理滚动到底部的逻辑
const scrollToBottom = (instant = false) => {
  if (messageListRef.value) {
    // 如果是用户发送消息，始终滚动到底部
    // 如果是接收消息，则根据 shouldAutoScroll 判断
    if (instant || shouldAutoScroll.value) {
      if (instant) {
        messageListRef.value.scrollToBottomInstantly()
      } else {
        messageListRef.value.scrollToBottom()
      }
    }
  }
}

// 监听消息变化的逻辑
watch([() => chatHistory.value, () => currentAIResponse.value], () => {
  nextTick(() => {
    // 给一个小延时确保内容已经渲染
    setTimeout(() => {
      scrollToBottom(false)
    }, 50)
  })
})

// 处理发送消息
const handleSendMessage = async () => {
  shouldAutoScroll.value = true // 发送消息时重置自动滚动状态
  await sendMessage()
  nextTick(() => {
    scrollToBottom(true)
  })
}

// 初始化
onMounted(() => {
  loadConversationHistory()

  // 加载自定义提示词
  const savedCustomPrompts = localStorage.getItem('customPrompts')
  if (savedCustomPrompts) {
    customPrompts.value = JSON.parse(savedCustomPrompts)
  }

  // 从 localStorage 获取上次激活的会话 ID 和模板
  const savedConversationId = localStorage.getItem('currentConversationId')
  const lastSelectedTemplate = localStorage.getItem('lastSelectedTemplate')

  if (lastSelectedTemplate) {
    selectedPromptTemplate.value = lastSelectedTemplate
  }

  if (conversationHistory.value.length === 0) {
    createNewConversation()
  } else if (savedConversationId) {
    // 尝试恢复上次激活的会话
    const exists = conversationHistory.value.some((c) => c.id === savedConversationId)
    if (exists) {
      switchConversation(savedConversationId)
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
      <div class="header-left">
        <h2>{{ t('aiAssistant') }}</h2>
        <div class="prompt-template-selector">
          <select v-model="selectedPromptTemplate" @change="handleTemplateChange">
            <option value="my">{{ t('defaultPrompt') }}</option>
            <option value="study">{{ t('studyPrompt') }}</option>
            <option value="studentStudy">{{ t('studentStudyPrompt') }}</option>
            <optgroup :label="t('customPrompts')" v-if="customPrompts.length > 0">
              <option v-for="prompt in customPrompts" :key="prompt.id" :value="prompt.id">
                {{ prompt.name }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>
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
        :current-response="currentAIResponse"
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
          @send="handleSendMessage"
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

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.prompt-template-selector {
  margin-left: 1rem;
}

.prompt-template-selector select {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--card-bg-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.2em;
}

.prompt-template-selector select:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.prompt-template-selector select:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.3);
}

.prompt-template-selector select option,
.prompt-template-selector select optgroup {
  background-color: var(--card-bg-color);
  color: var(--text-color);
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

  .prompt-template-selector {
    margin-left: 0.5rem;
  }

  .prompt-template-selector select {
    max-width: 120px;
    padding-right: 2rem;
    font-size: 0.85rem;
    background-size: 1em;
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
