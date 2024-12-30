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
  margin: 0 12px;
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
  border-radius: 16px;
  line-height: 1.5;
  font-size: 14px;
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 1px rgba(0, 0, 0, 0.1);
}

.user {
  align-self: flex-end;
  margin-right: 10px;
}

.user .message-content {
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
  border-bottom-right-radius: 4px;
  padding: 8px 14px;
  font-size: 14px;
  line-height: 1.4;
  max-width: 85%;
  background-image: linear-gradient(
    to right bottom,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0)
  );
}

.user .message-content:hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 0 1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.ai {
  align-self: flex-start;
  margin-left: 10px;
}

.ai .message-content {
  background-color: var(--input-bg-color);
  color: var(--text-color);
  border-bottom-left-radius: 4px;
  border-left: 4px solid var(--button-bg-color);
  padding: 14px 18px;
  font-size: 15px;
  line-height: 1.6;
  background-image: linear-gradient(
    to right bottom,
    rgba(255, 255, 255, 0.08),
    transparent
  );
}

.ai .message-content:hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 0 1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.copy-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: var(--bg-color);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-color);
  backdrop-filter: blur(8px);
}

.message-content:hover .copy-button {
  opacity: 0.9;
  transform: translateY(-2px);
}

.copy-button:hover {
  opacity: 1 !important;
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
  border-color: transparent;
}

.copy-button svg {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.copy-button:hover svg {
  transform: scale(1.1);
}

/* Markdown content styles */
.ai-message {
  position: relative;
  padding-right: 32px;
  font-size: 15px;
}

.ai :deep(p) {
  margin-bottom: 1em;
  line-height: 1.7;
  letter-spacing: 0.3px;
  font-size: 15px;
}

.ai :deep(p:last-child) {
  margin-bottom: 0;
}

.ai :deep(ul),
.ai :deep(ol) {
  margin: 0.8em 0;
  padding-left: 1.6em;
}

.ai :deep(li) {
  margin-bottom: 0.5em;
  line-height: 1.6;
}

.ai :deep(code) {
  background-color: rgba(0, 0, 0, 0.04);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
  border: 1px solid rgba(0, 0, 0, 0.04);
  color: var(--button-bg-color);
}

.ai :deep(pre) {
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 16px;
  overflow: auto;
  margin: 1em 0;
  position: relative;
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ai :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.5;
  font-family: 'Fira Code', monospace;
  color: #d4d4d4;
  border: none;
}

.ai :deep(blockquote) {
  border-left: 4px solid var(--button-bg-color);
  padding: 0.8em 1.2em;
  margin: 1em 0;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  font-style: italic;
  color: var(--text-color);
}

.ai :deep(h1),
.ai :deep(h2),
.ai :deep(h3),
.ai :deep(h4),
.ai :deep(h5),
.ai :deep(h6) {
  margin: 1.2em 0 0.6em;
  font-weight: 600;
  line-height: 1.3;
  color: var(--button-bg-color);
}

.ai :deep(a) {
  color: var(--button-bg-color);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
  padding: 0 2px;
}

.ai :deep(a:hover) {
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  border-bottom-color: currentColor;
}

.ai :deep(table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.2em 0;
  font-size: 0.9em;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.ai :deep(th),
.ai :deep(td) {
  border: 1px solid var(--input-border-color);
  padding: 0.8em 1em;
  text-align: left;
}

.ai :deep(th) {
  background-color: rgba(0, 0, 0, 0.02);
  font-weight: 600;
  border-bottom: 2px solid var(--input-border-color);
}

.ai :deep(tr:nth-child(even)) {
  background-color: rgba(0, 0, 0, 0.01);
}

.ai :deep(tr:hover) {
  background-color: rgba(0, 0, 0, 0.02);
}

@media (max-width: 768px) {
  .chat-history {
    padding: 16px 12px;
    gap: 20px;
  }

  .message-container {
    max-width: 92%;
    margin: 0 8px;
  }

  .message-content {
    padding: 14px 16px;
    font-size: 14px;
  }

  .copy-button {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
