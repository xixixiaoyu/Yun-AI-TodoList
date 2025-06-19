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

        <!-- 系统提示词选择器 -->
        <div class="flex items-center gap-2">
          <div class="relative">
            <select
              :value="config.enabled ? config.activePromptId || '' : ''"
              @change="handlePromptChange"
              class="px-3 py-1.5 pr-8 text-sm bg-white/10 text-white border border-white/20 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/15 focus:bg-white/15 focus:border-white/40 focus:outline-none backdrop-blur-sm min-w-[140px] md:min-w-[120px] md:text-xs appearance-none"
              :disabled="!config.enabled"
            >
              <option value="" class="text-gray-800">{{ t('noSystemPrompt') }}</option>
              <option
                v-for="prompt in enabledPrompts"
                :key="prompt.id"
                :value="prompt.id"
                class="text-gray-800"
              >
                {{ prompt.name }}
              </option>
            </select>

            <!-- 自定义下拉箭头 -->
            <div
              class="absolute right-2 top-0 bottom-0 flex items-center justify-center pointer-events-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-white/70 transition-colors duration-200"
              >
                <polyline points="6,8 10,12 14,8"></polyline>
              </svg>
            </div>
          </div>

          <!-- 关闭按钮 -->
          <button
            class="flex items-center justify-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
            :title="t('close')"
            @click="closeSidebar"
          >
            <CloseIcon class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
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
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChat } from '../composables/useChat'
import { useSystemPrompts } from '../composables/useSystemPrompts'
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

const props = defineProps<Props>()
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

// 系统提示词管理
const {
  config,
  enabledPrompts,
  setActivePrompt,
  initialize: initializeSystemPrompts,
} = useSystemPrompts()

// 处理系统提示词切换
const handlePromptChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const promptId = target.value || null
  try {
    await setActivePrompt(promptId)
  } catch (error) {
    console.error('切换系统提示词失败:', error)
  }
}

// 刷新系统提示词列表
const refreshSystemPrompts = () => {
  initializeSystemPrompts()
}

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

// 监听侧边栏打开状态，打开时刷新系统提示词列表
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      refreshSystemPrompts()
    }
  }
)

onMounted(() => {
  loadConversationHistory()
  refreshSystemPrompts()
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
