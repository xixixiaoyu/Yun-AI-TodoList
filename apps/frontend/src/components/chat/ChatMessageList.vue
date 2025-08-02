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
        :ref="(el) => setChatMessageRef(el, index)"
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
        :is-regenerating="props.isRegenerating && message.role === 'user'"
        @copy="copyToClipboard"
        @copy-success="handleCopySuccess"
        @copy-error="handleCopyError"
        @retry="handleRetry"
        @generate-chart="handleGenerateChart"
        @edit-message="handleEditMessage"
      />
    </div>
    <!-- AI 助手正在准备回复的 loading 状态 -->
    <div
      v-if="props.isGenerating && !props.currentResponse && !props.currentThinking"
      class="message-group"
    >
      <LoadingIndicator />
    </div>
    <!-- 当前流式响应 -->
    <div v-if="props.currentResponse || props.currentThinking" class="message-group">
      <!-- 思考内容组件 -->
      <ThinkingContent
        v-if="props.currentThinking"
        :content="props.currentThinking"
        :default-expanded="true"
        :auto-collapse="true"
        :ai-response-started="!!props.currentResponse"
      />
      <!-- 响应内容 -->
      <ChatMessage
        v-if="props.currentResponse"
        :message="{
          role: 'assistant',
          content: props.currentResponse,
          sanitizedContent: currentResponseSanitized,
        }"
        :is-streaming="true"
        @copy="copyToClipboard"
        @copy-success="handleCopySuccess"
        @copy-error="handleCopyError"
        @generate-chart="handleGenerateChart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown'
import type { ChatMessage as ChatMessageType } from '../../services/types'
import ChatMessage from './ChatMessage.vue'
import LoadingIndicator from './LoadingIndicator.vue'
import ThinkingContent from './ThinkingContent.vue'

const props = defineProps<{
  messages: ChatMessageType[]
  currentResponse: string
  currentThinking?: string
  isGenerating?: boolean
  isRetrying?: boolean
  retryCount?: number
  hasError?: boolean
  isRegenerating?: boolean
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
  (e: 'generate-chart', content: string): void
  (e: 'edit-message', messageIndex: number, newContent: string): void
}>()

const { sanitizeContent, extractThinkingContent, setupCodeCopyFunction } = useMarkdown()
const chatHistoryRef = ref<HTMLDivElement | null>(null)

// ChatMessage 组件引用管理
const chatMessageRefs = ref<Map<number, InstanceType<typeof ChatMessage>>>(new Map())

const setChatMessageRef = (el: unknown, index: number) => {
  if (el && typeof el === 'object' && '$' in el) {
    chatMessageRefs.value.set(index, el as InstanceType<typeof ChatMessage>)
  } else {
    chatMessageRefs.value.delete(index)
  }
}

// 重置所有消息的编辑状态
const resetAllEditStates = () => {
  chatMessageRefs.value.forEach((chatMessageRef) => {
    if (chatMessageRef && typeof chatMessageRef.resetEditState === 'function') {
      chatMessageRef.resetEditState()
    }
  })
}

// 扩展消息类型以包含思考内容
type ExtendedMessage = ChatMessageType & {
  sanitizedContent: string
  thinkingContent?: string
}

// 处理消息，提取思考内容（异步版本）
const sanitizedMessages = ref<ExtendedMessage[]>([])
const currentResponseSanitized = ref('')

// 异步处理消息内容
const processSanitizedMessages = async () => {
  const processed: ExtendedMessage[] = []

  for (const message of props.messages) {
    if (message.role === 'assistant') {
      const { thinking, response } = extractThinkingContent(message.content)
      const sanitizedContent = await sanitizeContent(response)
      processed.push({
        ...message,
        content: response,
        sanitizedContent,
        thinkingContent: thinking || undefined,
      })
    } else {
      const sanitizedContent = await sanitizeContent(message.content)
      processed.push({
        ...message,
        sanitizedContent,
        thinkingContent: undefined,
      })
    }
  }

  sanitizedMessages.value = processed
}

// 异步处理当前响应
const processCurrentResponse = async () => {
  if (props.currentResponse) {
    currentResponseSanitized.value = await sanitizeContent(props.currentResponse)
  } else {
    currentResponseSanitized.value = ''
  }
}

// 监听消息变化
watch(
  () => props.messages,
  async (newMessages, oldMessages) => {
    await processSanitizedMessages()

    // 当消息数组发生变化时（通常是切换对话），重置所有编辑状态
    if (newMessages !== oldMessages) {
      nextTick(() => {
        resetAllEditStates()
      })
    }
  },
  { immediate: true, deep: true }
)

watch(() => props.currentResponse, processCurrentResponse, { immediate: true })

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

const handleGenerateChart = (content: string) => {
  emit('generate-chart', content)
}

const handleEditMessage = (messageIndex: number, newContent: string) => {
  emit('edit-message', messageIndex, newContent)
}

const isUserScrolling = ref(false)
const lastScrollTop = ref(0)

const scrollToBottomInstantly = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    element.style.scrollBehavior = 'auto'
    // 强制滚动到底部，使用 requestAnimationFrame 确保渲染完成
    requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight
      // 双重保险，再次确保滚动到底部
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight
      })
    })
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

    // 检测用户滚动方向
    if (element.scrollTop < lastScrollTop.value) {
      // 向上滚动，禁用自动滚动
      isUserScrolling.value = true
    } else if (isAtBottom) {
      // 用户滚动到底部，重新启用自动滚动
      isUserScrolling.value = false
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
  // 设置代码复制功能
  setupCodeCopyFunction()
})

watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    // 只有在消息数量增加时才可能需要自动滚动
    if (newMessages.length > (oldMessages?.length || 0)) {
      // 检查最新添加的消息是否是用户消息
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        // 用户发送消息时，重置滚动状态并强制滚动到底部
        isUserScrolling.value = false
        nextTick(() => {
          // 使用 setTimeout 确保 DOM 完全更新后再滚动
          setTimeout(() => {
            scrollToBottomInstantly()
          }, 0)
        })
      } else {
        // AI 消息或其他情况，使用智能滚动
        nextTick(() => {
          smartScrollToBottom()
        })
      }
    }
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

// 监听思考内容变化
watch(
  () => props.currentThinking,
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
.message-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-group + .message-group {
  margin-top: 1.5rem;
}
</style>

<style scoped></style>
