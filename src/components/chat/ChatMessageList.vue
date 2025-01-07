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

    // 检测用户是否在向上滚动
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

// 智能滚动到底部
const smartScrollToBottom = () => {
  if (!chatHistoryRef.value) return
}

// 组件挂载时立即滚动到底部
onMounted(() => {
  scrollToBottomInstantly()
})

// 监听消息变化
watch(
  () => props.messages,
  () => {
    // 新消息来时重置滚动状态
    isUserScrolling.value = false
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
  max-width: 88%;
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
  padding-bottom: 8px; /* 为复制按钮留出空间 */
}

/* 添加代码高亮样式 */
.ai-message :deep(pre) {
  background-color: var(--input-bg-color);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid var(--input-border-color);
}

.ai-message :deep(code) {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
  line-height: 1.5;
}

.ai-message :deep(code:not(pre code)) {
  background-color: var(--input-bg-color);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

/* 代码块语言标识 */
.ai-message :deep(pre[class*='language-']) {
  position: relative;
}

.ai-message :deep(pre[class*='language-'])::before {
  content: attr(class);
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.2em 0.5em;
  font-size: 0.8em;
  background: var(--button-bg-color);
  color: var(--card-bg-color);
  border-radius: 0 8px 0 8px;
  opacity: 0.8;
}

/* 代码高亮主题颜色 */
.ai-message :deep(.hljs-keyword),
.ai-message :deep(.hljs-tag),
.ai-message :deep(.hljs-name) {
  color: #c678dd;
}

.ai-message :deep(.hljs-attr),
.ai-message :deep(.hljs-attribute) {
  color: #98c379;
}

.ai-message :deep(.hljs-string),
.ai-message :deep(.hljs-regexp) {
  color: #98c379;
}

.ai-message :deep(.hljs-number),
.ai-message :deep(.hljs-literal) {
  color: #d19a66;
}

.ai-message :deep(.hljs-comment) {
  color: #7f848e;
  font-style: italic;
}

.ai-message :deep(.hljs-doctag),
.ai-message :deep(.hljs-meta) {
  color: #61afef;
}

.ai-message :deep(.hljs-class),
.ai-message :deep(.hljs-title) {
  color: #e5c07b;
}

.ai-message :deep(.hljs-function),
.ai-message :deep(.hljs-built_in) {
  color: #61afef;
}

.ai-message :deep(.hljs-variable),
.ai-message :deep(.hljs-template-variable) {
  color: #e06c75;
}

.ai-message :deep(.hljs-operator),
.ai-message :deep(.hljs-punctuation) {
  color: #abb2bf;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .ai-message :deep(pre) {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .ai-message :deep(code:not(pre code)) {
    background-color: rgba(0, 0, 0, 0.2);
  }
}

.copy-button {
  position: absolute;
  right: 0;
  bottom: 0;
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
    padding: 12px 6px;
    gap: 10px;
  }

  .message-container {
    max-width: 94%;
  }

  .user.message-container {
    max-width: 90%;
  }

  .message-content {
    padding: 10px 14px;
    font-size: 15px;
    line-height: 1.5;
    letter-spacing: 0.2px;
  }

  .ai .message-content {
    background-color: var(--input-bg-color);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .ai-message {
    padding-bottom: 32px; /* 增加底部空间以容纳复制按钮 */
  }

  .copy-button {
    opacity: 0.8;
    padding: 6px 12px;
    font-size: 13px;
    background-color: var(--button-bg-color);
    border-radius: 6px;
    bottom: 4px;
    right: 4px;
    color: var(--card-bg-color);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .copy-button svg {
    width: 13px;
    height: 13px;
  }

  .copy-button:active {
    opacity: 1;
    transform: scale(0.96);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.1);
  }
}

/* 添加深色模式下的样式优化 */
@media (prefers-color-scheme: dark) {
  .copy-button {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .ai .message-content {
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
