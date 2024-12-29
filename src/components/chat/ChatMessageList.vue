<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown'
import type { ChatMessage } from '../../services/types'

const props = defineProps<{
  messages: ChatMessage[]
  currentResponse: string
}>()

const emit = defineEmits<{
  (e: 'scroll', value: boolean): void
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

// 处理滚动事件
const handleScroll = () => {
  if (chatHistoryRef.value) {
    const element = chatHistoryRef.value
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 30
    emit('scroll', !isAtBottom)
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTo({
      top: chatHistoryRef.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

defineExpose({
  scrollToBottom,
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
  scroll-behavior: smooth;
  padding: 0 20px;
  gap: 16px;
}

.message-container {
  max-width: 85%;
  animation: fadeIn 0.3s ease-out;
  position: relative;
}

.message-content {
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.6;
  font-size: 15px;
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  position: relative;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user {
  align-self: flex-end;
  margin-right: 10px;
}

.user .message-content {
  background-color: var(--button-bg-color);
  color: var(--card-bg-color);
  border-bottom-right-radius: 4px;
}

.ai {
  align-self: flex-start;
  margin-left: 10px;
}

.ai .message-content {
  background-color: var(--input-bg-color);
  color: var(--text-color);
  border-bottom-left-radius: 4px;
}

.copy-button {
  position: absolute;
  bottom: 0px;
  right: 8px;
  background: var(--bg-color);
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: all 0.2s ease;
  color: var(--text-color);
}

.message-content:hover .copy-button {
  opacity: 0.7;
}

.copy-button:hover {
  opacity: 1 !important;
}

.copy-button svg {
  width: 14px;
  height: 14px;
}

@media (max-width: 768px) {
  .chat-history {
    padding: 0 12px;
  }

  .message-container {
    max-width: 90%;
  }
}

/* Markdown content styles */
.ai-message {
  position: relative;
}

.ai :deep(h1),
.ai :deep(h2),
.ai :deep(h3),
.ai :deep(h4),
.ai :deep(h5),
.ai :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

.ai :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

.ai :deep(ul),
.ai :deep(ol) {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.ai :deep(li) {
  margin-bottom: 0.5em;
}

.ai :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

.ai :deep(pre) {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  margin: 1em 0;
  position: relative;
}

.ai :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.5;
  font-family: 'Fira Code', monospace;
  color: #d4d4d4;
}

.ai :deep(blockquote) {
  border-left: 4px solid var(--button-bg-color);
  padding: 0.5em 1em;
  margin: 1em 0;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.ai :deep(a) {
  color: var(--button-bg-color);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.ai :deep(a:hover) {
  border-bottom-color: currentColor;
}

.ai :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.9em;
}

.ai :deep(th),
.ai :deep(td) {
  border: 1px solid var(--input-border-color);
  padding: 0.5em 0.8em;
  text-align: left;
}

.ai :deep(th) {
  background-color: rgba(0, 0, 0, 0.03);
  font-weight: 600;
}

.ai :deep(tr:nth-child(even)) {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
