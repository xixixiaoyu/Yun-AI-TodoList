<template>
  <div
    ref="chatHistoryRef"
    class="flex-grow overflow-y-auto mb-4 flex flex-col px-6 py-6 md:px-4 md:py-4 gap-6 md:gap-4 bg-gradient-to-b from-white/3 to-transparent"
    @scroll="handleScroll"
  >
    <div v-for="(message, index) in sanitizedMessages" :key="index" class="message-group">
      <!-- 思考内容组件（仅对助手消息显示） -->
      <ThinkingContent
        v-if="message.role === 'assistant' && message.thinkingContent"
        :content="message.thinkingContent"
        :default-expanded="false"
      />
      <!-- 消息内容 -->
      <ChatMessage
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
      />
    </div>
    <!-- 当前流式响应 -->
    <div v-if="props.currentResponse || props.currentThinking" class="message-group">
      <!-- 思考内容组件 -->
      <ThinkingContent
        v-if="props.currentThinking"
        :content="props.currentThinking"
        :default-expanded="true"
        :auto-collapse="true"
      />
      <!-- 响应内容 -->
      <ChatMessage
        v-if="props.currentResponse"
        :message="{
          role: 'assistant',
          content: props.currentResponse,
          sanitizedContent: sanitizeContent(props.currentResponse),
        }"
        :is-streaming="true"
        @copy="copyToClipboard"
        @copy-success="handleCopySuccess"
        @copy-error="handleCopyError"
      />
    </div>
  </div>
</template>

<style scoped>
.message-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-group + .message-group {
  margin-top: 1.5rem;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown'
import type { ChatMessage as ChatMessageType } from '../../services/types'
import ChatMessage from './ChatMessage.vue'
import ThinkingContent from './ThinkingContent.vue'

const props = defineProps<{
  messages: ChatMessageType[]
  currentResponse: string
  currentThinking?: string
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
}>()

const { sanitizeContent, extractThinkingContent } = useMarkdown()
const chatHistoryRef = ref<HTMLDivElement | null>(null)

// 扩展消息类型以包含思考内容
type ExtendedMessage = ChatMessageType & {
  sanitizedContent: string
  thinkingContent?: string
}

// 处理消息，提取思考内容
const sanitizedMessages = computed((): ExtendedMessage[] => {
  return props.messages.map((message) => {
    if (message.role === 'assistant') {
      const { thinking, response } = extractThinkingContent(message.content)
      return {
        ...message,
        content: response,
        sanitizedContent: sanitizeContent(response),
        thinkingContent: thinking || undefined,
      }
    }
    return {
      ...message,
      sanitizedContent: sanitizeContent(message.content),
      thinkingContent: undefined,
    }
  })
})

// 移除 getCurrentStreamingContent 函数，现在分别处理思考内容和响应内容

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
