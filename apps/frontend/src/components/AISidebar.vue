<template>
  <!-- 遮罩层 -->
  <Overlay :visible="isOpen" @click="handleOverlayClick" />

  <!-- 侧边栏 -->
  <Transition
    name="sidebar"
    enter-active-class="transition-transform duration-300 ease-in-out"
    leave-active-class="transition-transform duration-300 ease-in-out"
    enter-from-class="transform -translate-x-full"
    enter-to-class="transform translate-x-0"
    leave-from-class="transform translate-x-0"
    leave-to-class="transform -translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed top-0 left-0 h-full bg-bg/95 backdrop-blur-xl border-r border-input-border shadow-2xl z-[10000] flex flex-col sidebar-width"
    >
      <!-- 侧边栏头部 -->
      <div
        class="flex items-center justify-between px-4 py-3.5 md:px-3 md:py-3 bg-gradient-to-r from-button-bg to-button-hover text-white shadow-lg border-b border-white/10"
      >
        <h2 class="m-0 text-lg md:text-base font-semibold text-white leading-tight">
          {{ t('aiAssistant') }}
        </h2>

        <!-- 关闭按钮 -->
        <button
          class="flex items-center justify-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
          :title="t('close')"
          @click="closeSidebar"
        >
          <CloseIcon class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      <!-- AI 聊天内容 -->
      <AIChatContent
        ref="messageListRef"
        :is-drawer-open="isDrawerOpen"
        :conversation-history="conversationHistory"
        :current-conversation-id="currentConversationId"
        :chat-history="chatHistory"
        :current-ai-response="currentAIResponse"
        :current-thinking-content="currentThinkingContent"
        :user-message="userMessage"
        :is-generating="isGenerating"
        :is-optimizing="isOptimizing"
        :is-retrying="isRetrying"
        :retry-count="retryCount"
        :has-error="false"
        @toggle-drawer="isDrawerOpen = !isDrawerOpen"
        @update:is-drawer-open="isDrawerOpen = $event"
        @switch-conversation="switchConversation"
        @delete-conversation="deleteConversation"
        @clear-conversations="clearAllConversations"
        @new-conversation="createNewConversation"
        @optimize="optimizeMessage"
        @retry="handleRetry"
        @send="handleSendMessage"
        @stop="stopGenerating"
        @scroll="handleScroll"
        @update:user-message="userMessage = $event"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChat } from '../composables/useChat'
import AIChatContent from './chat/AIChatContent.vue'
import Overlay from './common/Overlay.vue'
import CloseIcon from './common/icons/CloseIcon.vue'

const { t } = useI18n()

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  chatHistory,
  userMessage,
  isGenerating,
  isOptimizing,
  conversationHistory,
  currentConversationId,
  currentAIResponse,
  currentThinkingContent,
  loadConversationHistory,
  createNewConversation,
  switchConversation,
  deleteConversation,
  clearAllConversations,
  sendMessage,
  stopGenerating,
  optimizeMessage,
  // 重试相关
  retryLastMessage,
  isRetrying,
  retryCount,
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

const handleRetry = async (messageIndex: number) => {
  shouldAutoScroll.value = true
  await retryLastMessage(messageIndex)
}

const closeSidebar = () => {
  emit('close')
}

const handleOverlayClick = (event: Event) => {
  // 确保点击的是遮罩层本身
  if (event.target === event.currentTarget) {
    closeSidebar()
  }
}

onMounted(() => {
  loadConversationHistory()
})

defineOptions({
  name: 'AISidebar',
})
</script>

<style scoped>
.sidebar-width {
  width: 80vw;
  max-width: 900px;
  min-width: 400px;
}

/* 响应式宽度设计 */
@media (max-width: 640px) {
  .sidebar-width {
    width: 95vw;
    min-width: 320px;
    max-width: none;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .sidebar-width {
    width: 90vw;
    min-width: 350px;
    max-width: 700px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar-width {
    width: 85vw;
    min-width: 400px;
    max-width: 800px;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .sidebar-width {
    width: 80vw;
    min-width: 450px;
    max-width: 900px;
  }
}

/* 超大屏幕优化 */
@media (min-width: 1441px) {
  .sidebar-width {
    width: 80vw;
    min-width: 500px;
    max-width: 1000px;
  }
}

/* 优化移动端的头部按钮 */
@media (max-width: 640px) {
  .sidebar-width .flex.items-center.justify-between {
    padding: 0.75rem 1rem;
  }

  .sidebar-width h2 {
    font-size: 1rem;
  }
}
</style>
