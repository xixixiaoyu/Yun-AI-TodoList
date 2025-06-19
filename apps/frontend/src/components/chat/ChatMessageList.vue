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
      :message-index="index"
      :is-retrying="
        message.role === 'assistant' && index === sanitizedMessages.length - 1
          ? props.isRetrying
          : false
      "
      :retry-count="
        message.role === 'assistant' && index === sanitizedMessages.length - 1
          ? props.retryCount
          : 0
      "
      :has-error="
        message.role === 'assistant' && index === sanitizedMessages.length - 1
          ? props.hasError
          : false
      "
      @copy="copyToClipboard"
      @copy-success="handleCopySuccess"
      @copy-error="handleCopyError"
      @retry="handleRetry"
      @optimize="handleOptimize"
    />

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
  isRetrying?: boolean
  retryCount?: number
  hasError?: boolean
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
  (e: 'retry', messageIndex: number): void
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

const handleRetry = (messageIndex: number) => {
  emit('retry', messageIndex)
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

<style scoped></style>
