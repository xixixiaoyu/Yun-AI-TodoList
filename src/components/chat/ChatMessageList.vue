<template>
  <div
    ref="chatHistoryRef"
    class="flex-grow overflow-y-auto mb-4 flex flex-col px-6 py-6 md:px-4 md:py-4 gap-6 md:gap-4 bg-gradient-to-b from-white/3 to-transparent"
    @scroll="handleScroll"
  >
    <ChatMessage
      v-for="(message, index) in sanitizedMessages"
      :key="index"
      :message="message"
      @copy="copyToClipboard"
      @copy-success="handleCopySuccess"
      @copy-error="handleCopyError"
      @retry="handleRetry"
      @optimize="handleOptimize"
    />

    <!-- 搜索状态指示器 -->
    <div v-if="isSearching" class="search-indicator">
      <div class="search-content">
        <span class="search-icon">🔍</span>
        <span class="search-text">正在搜索相关信息...</span>
        <div class="search-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <ChatMessage
      v-if="currentResponse"
      :message="{
        role: 'assistant',
        content: currentResponse,
        sanitizedContent: sanitizeContent(currentResponse),
      }"
      :is-streaming="true"
      @copy="copyToClipboard"
      @copy-success="handleCopySuccess"
      @copy-error="handleCopyError"
    />
  </div>
</template>

<script setup lang="ts">
import { useMarkdown } from '../../composables/useMarkdown'
import type { ChatMessage as ChatMessageType } from '../../services/types'
import ChatMessage from './ChatMessage.vue'

const props = defineProps<{
  messages: ChatMessageType[]
  currentResponse: string
  isSearching?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'scroll',
    value: {
      isAtBottom: boolean
      scrollTop: number
      scrollHeight: number
      clientHeight: number
    }
  ): void
  (e: 'retry'): void
  (e: 'optimize'): void
}>()

const { sanitizeContent } = useMarkdown()
const chatHistoryRef = ref<HTMLDivElement | null>(null)

const sanitizedMessages = computed(() =>
  props.messages.map((message) => ({
    ...message,
    sanitizedContent:
      message.role === 'assistant' ? sanitizeContent(message.content) : message.content,
  }))
)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const handleCopySuccess = (_text: string) => {
  // 复制成功处理
  // 可以在这里添加全局通知或其他成功反馈
}

const handleCopyError = (error: Error) => {
  console.error('复制失败:', error)
  // 可以在这里添加全局错误通知
}

const handleRetry = () => {
  emit('retry')
}

const handleOptimize = () => {
  emit('optimize')
}

const isUserScrolling = ref(false)
const lastScrollTop = ref(0)

const scrollToBottomInstantly = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    element.style.scrollBehavior = 'auto'
    element.scrollTop = element.scrollHeight
  }
}

const scrollToBottom = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    element.style.scrollBehavior = 'smooth'
    element.scrollTop = element.scrollHeight
  }
}

const handleScroll = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 30

    if (element.scrollTop < lastScrollTop.value) {
      isUserScrolling.value = true
    }

    lastScrollTop.value = element.scrollTop

    emit('scroll', {
      isAtBottom,
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    })
  }
}

const smartScrollToBottom = () => {
  if (!chatHistoryRef.value) {
    return
  }

  if (!isUserScrolling.value) {
    scrollToBottomInstantly()
  }
}

onMounted(() => {
  scrollToBottomInstantly()
})

watch(
  () => props.messages,
  () => {
    isUserScrolling.value = false
    nextTick(() => {
      smartScrollToBottom()
    })
  },
  { immediate: true }
)

watch(
  () => props.currentResponse,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      nextTick(() => {
        smartScrollToBottom()
      })
    }
  }
)

defineExpose({
  scrollToBottom,
  scrollToBottomInstantly,
})
</script>

<style scoped>
.search-indicator {
  @apply flex justify-start mb-4;
}

.search-content {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
         rounded-lg px-4 py-3 flex items-center gap-3 max-w-xs;
}

.search-icon {
  @apply text-lg;
}

.search-text {
  @apply text-sm text-blue-700 dark:text-blue-300 font-medium;
}

.search-dots {
  @apply flex gap-1;
}

.search-dots span {
  @apply w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse;
}

.search-dots span:nth-child(1) {
  animation-delay: 0s;
}

.search-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.search-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

.search-dots span {
  animation: pulse 1.5s infinite;
}
</style>
