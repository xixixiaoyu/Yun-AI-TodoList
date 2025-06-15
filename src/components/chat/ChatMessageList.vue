<template>
  <div ref="chatHistoryRef" class="chat-history" @scroll="handleScroll">
    <ChatMessage
      v-for="(message, index) in sanitizedMessages"
      :key="index"
      :message="message"
      @copy="copyToClipboard"
    />

    <ChatMessage
      v-if="currentResponse"
      :message="{
        role: 'assistant',
        content: currentResponse,
        sanitizedContent: sanitizeContent(currentResponse)
      }"
      :is-streaming="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown'
import ChatMessage from './ChatMessage.vue'
import type { ChatMessage as ChatMessageType } from '../../services/types'

const props = defineProps<{
  messages: ChatMessageType[]
  currentResponse: string
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
}>()

const { sanitizeContent } = useMarkdown()
const chatHistoryRef = ref<HTMLDivElement | null>(null)

const sanitizedMessages = computed(() =>
  props.messages.map(message => ({
    ...message,
    sanitizedContent:
      message.role === 'assistant' ? sanitizeContent(message.content) : message.content
  }))
)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('复制失败:', err)
  }
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
      clientHeight: element.clientHeight
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
  scrollToBottomInstantly
})
</script>

<style scoped>
.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  padding: 20px 20px;
  gap: 20px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent);
}

@media (max-width: 768px) {
  .chat-history {
    padding: 12px 6px;
    gap: 10px;
  }
}
</style>
