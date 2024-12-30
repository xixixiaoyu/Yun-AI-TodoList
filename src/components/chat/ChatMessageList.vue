<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown'
import type { ChatMessage } from '../../services/types'

const props = defineProps<{
  messages: ChatMessage[]
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
  props.messages.map((message) => ({
    ...message,
    sanitizedContent:
      message.role === 'assistant' ? sanitizeContent(message.content) : message.content,
  }))
)

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const isUserScrolling = ref(false)
const lastScrollTop = ref(0)

// 立即滚动到底部（无动画）
const scrollToBottomInstantly = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    element.style.scrollBehavior = 'auto'
    element.scrollTop = element.scrollHeight
  }
}

// 平滑滚动到底部
const scrollToBottom = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    element.style.scrollBehavior = 'smooth'
    element.scrollTop = element.scrollHeight
  }
}

// 处理滚动事件
const handleScroll = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 30

    // 检测是否是用户主动滚动
    if (Math.abs(element.scrollTop - lastScrollTop.value) > 10) {
      isUserScrolling.value = true
      setTimeout(() => {
        isUserScrolling.value = false
      }, 100)
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

// 智能滚动到底部
const smartScrollToBottom = () => {
  if (chatHistoryRef.value && !isUserScrolling.value) {
    const element = chatHistoryRef.value
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 30

    if (isAtBottom) {
      scrollToBottomInstantly()
    }
  }
}

// 组件挂载时立即滚动到底部
onMounted(() => {
  scrollToBottomInstantly()
})

// 监听消息变化
watch(
  () => props.messages,
  () => {
    nextTick(() => {
      smartScrollToBottom()
    })
  },
  { immediate: true }
)

// 监听当前响应变化
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

<template>
  <div ref="chatHistoryRef" class="chat-history" @scroll="handleScroll">
    <div
      v-for="(message, index) in sanitizedMessages"
      :key="index"
      class="message-container"
      :class="message.role"
    >
      <div class="message-content" dir="ltr">
        <p v-if="message.role === 'user'">
          {{ message.content }}
        </p>
        <div v-else class="ai-message">
          <div v-html="message.sanitizedContent" />
          <button
            class="copy-button"
            title="复制原始内容"
            @click="copyToClipboard(message.content)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            复制
          </button>
        </div>
      </div>
    </div>
    <!-- 显示正在生成的回答 -->
    <div v-if="currentResponse" class="message-container ai">
      <div class="message-content" dir="ltr">
        <div class="ai-message">
          <div v-html="sanitizeContent(currentResponse)" />
        </div>
      </div>
    </div>
  </div>
</template>

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

.message-container {
  max-width: 92%;
  position: relative;
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0;
}

.user.message-container {
  max-width: 75%;
}

.message-container.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  font-size: 15px;
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  background-color: var(--input-bg-color);
}

.user {
  align-self: flex-end;
}

.user .message-content {
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
  padding: 8px 14px;
  font-size: 15px;
  line-height: 1.4;
  max-width: 85%;
  background-image: linear-gradient(
    to right bottom,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0)
  );
}

.user .message-content:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.ai {
  align-self: flex-start;
}

.ai .message-content {
  background-color: var(--input-bg-color);
  color: var(--text-color);
}

.ai .message-content:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.ai-message {
  position: relative;
}

.copy-button {
  position: absolute;
  right: 0;
  top: 0;
  padding: 6px 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.copy-button svg {
  width: 14px;
  height: 14px;
}

.message-content:hover .copy-button {
  opacity: 0.7;
}

.copy-button:hover {
  opacity: 1 !important;
}

@media (max-width: 768px) {
  .chat-history {
    padding: 16px 12px;
    gap: 16px;
  }

  .message-container {
    max-width: 95%;
  }

  .user.message-container {
    max-width: 85%;
  }

  .message-content {
    padding: 10px 14px;
    font-size: 15px;
  }

  .copy-button {
    opacity: 0.7;
  }
}
</style>
