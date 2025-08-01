<template>
  <div class="flex-grow flex flex-col py-4 md:py-2 overflow-hidden relative">
    <!-- 错误提示 -->
    <Transition name="error-alert" appear>
      <div v-if="error" class="px-6 py-3 md:px-4">
        <div
          class="error-alert flex items-center gap-3 p-4 rounded-xl shadow-soft backdrop-blur-md transition-all duration-500 hover:shadow-soft-hover"
        >
          <div class="error-icon-wrapper">
            <ExclamationIcon class="w-5 h-5 flex-shrink-0" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="error-message text-xs font-medium leading-relaxed">{{ error }}</p>
          </div>
          <button
            class="error-close-btn flex-shrink-0 p-1.5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1"
            :title="t('close', '关闭')"
            @click="$emit('clearError')"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>

    <ConversationDrawer
      :is-open="isDrawerOpen"
      :conversations="conversationHistory"
      :current-conversation-id="currentConversationId"
      :is-generating="isGenerating"
      @update:is-open="$emit('update:isDrawerOpen', $event)"
      @switch="$emit('switchConversation', $event)"
      @delete="$emit('deleteConversation', $event)"
      @clear="$emit('clearConversations')"
    />

    <ChatMessageList
      ref="messageListRef"
      :messages="chatHistory"
      :current-response="currentAiResponse || ''"
      :current-thinking="currentThinkingContent || ''"
      :is-generating="isGenerating"
      :is-retrying="isRetrying"
      :retry-count="retryCount"
      :has-error="hasError"
      :is-regenerating="isRegenerating"
      @scroll="$emit('scroll', $event)"
      @retry="(messageIndex: number) => $emit('retry', messageIndex)"
      @optimize="$emit('optimize')"
      @generate-chart="$emit('generateChart', $event)"
      @edit-message="
        (messageIndex: number, newContent: string) => $emit('editMessage', messageIndex, newContent)
      "
    />

    <div class="sticky bottom-0 bg-bg z-10 flex flex-col gap-1 py-3 sm:py-2">
      <ChatToolbar
        :is-generating="isGenerating"
        @new="$emit('newConversation')"
        @toggle-drawer="$emit('toggleDrawer')"
      />

      <ChatInput
        ref="inputRef"
        :model-value="userMessage"
        :is-generating="isGenerating"
        :is-optimizing="isOptimizing"
        :has-uploaded-file="hasUploadedFile"
        :uploaded-file-name="uploadedFileName"
        :uploaded-file-size="uploadedFileSize"
        @update:model-value="$emit('update:userMessage', $event)"
        @send="$emit('send')"
        @stop="$emit('stop')"
        @optimize="$emit('optimize')"
        @file-upload="$emit('file-upload', $event)"
        @clear-file="$emit('clear-file')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChatMessage } from '../../services/types'
import ExclamationIcon from '../common/icons/ExclamationIcon.vue'
import XIcon from '../common/icons/XIcon.vue'
import ChatInput from './ChatInput.vue'
import ChatMessageList from './ChatMessageList.vue'
import ChatToolbar from './ChatToolbar.vue'
import ConversationDrawer from './ConversationDrawer.vue'

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  lastUpdated: string
  tags?: string[]
  summary?: string
  messageCount?: number
  wordCount?: number
}

interface Props {
  isDrawerOpen: boolean
  conversationHistory: Conversation[]
  currentConversationId: string | null
  chatHistory: ChatMessage[]
  currentAiResponse: string
  currentThinkingContent: string
  userMessage: string
  isGenerating: boolean
  isOptimizing: boolean
  isRetrying?: boolean
  retryCount?: number
  hasError?: boolean
  isRegenerating?: boolean
  hasUploadedFile?: boolean
  uploadedFileName?: string
  uploadedFileSize?: number
  error?: string
}

interface ScrollInfo {
  isAtBottom: boolean
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

interface Emits {
  (e: 'toggleDrawer'): void
  (e: 'update:isDrawerOpen', value: boolean): void
  (e: 'switchConversation', id: string): void
  (e: 'deleteConversation', id: string): void
  (e: 'clearConversations'): void
  (e: 'newConversation'): void
  (e: 'optimize'): void
  (e: 'retry', messageIndex: number): void
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'scroll', scrollInfo: ScrollInfo): void
  (e: 'update:userMessage', value: string): void
  (e: 'generateChart', content: string): void
  (e: 'editMessage', messageIndex: number, newContent: string): void
  (e: 'file-upload', payload: { file: File; content: string }): void
  (e: 'clear-file'): void
  (e: 'clearError'): void
}

defineProps<Props>()
const _emit = defineEmits<Emits>()
const { t } = useI18n()

const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)
const inputRef = ref<InstanceType<typeof ChatInput> | null>(null)

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})

defineExpose({
  messageListRef,
  inputRef,
})

defineOptions({
  name: 'AIChatContent',
})
</script>

<style scoped>
/* 柔和优雅的错误提示样式 */
.error-alert {
  background: linear-gradient(135deg, rgba(254, 226, 226, 0.95) 0%, rgba(252, 165, 165, 0.9) 100%);
  border: 1px solid rgba(248, 113, 113, 0.2);
  color: #7f1d1d;
  backdrop-filter: blur(12px);
}

.dark .error-alert {
  background: linear-gradient(135deg, rgba(69, 26, 26, 0.9) 0%, rgba(87, 24, 24, 0.85) 100%);
  border: 1px solid rgba(153, 27, 27, 0.3);
  color: #fca5a5;
}

.error-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(248, 113, 113, 0.1);
}

.dark .error-icon-wrapper {
  background: linear-gradient(135deg, rgba(153, 27, 27, 0.2) 0%, rgba(127, 29, 29, 0.15) 100%);
  box-shadow: 0 2px 8px rgba(153, 27, 27, 0.15);
}

.error-message {
  word-break: break-word;
  line-height: 1.6;
  font-weight: 500;
}

.error-close-btn {
  background: rgba(248, 113, 113, 0.1);
  color: rgba(127, 29, 29, 0.8);
  border: 1px solid rgba(248, 113, 113, 0.15);
  backdrop-filter: blur(8px);
}

.dark .error-close-btn {
  background: rgba(153, 27, 27, 0.15);
  color: rgba(252, 165, 165, 0.9);
  border: 1px solid rgba(153, 27, 27, 0.2);
}

.error-close-btn:hover {
  background: rgba(248, 113, 113, 0.15);
  color: #7f1d1d;
  border-color: rgba(248, 113, 113, 0.25);
  transform: scale(1.05);
}

.dark .error-close-btn:hover {
  background: rgba(153, 27, 27, 0.25);
  color: #fca5a5;
  border-color: rgba(153, 27, 27, 0.3);
}

.error-close-btn:focus {
  ring-color: rgba(248, 113, 113, 0.4);
  ring-offset-color: rgba(254, 226, 226, 0.1);
}

.dark .error-close-btn:focus {
  ring-color: rgba(153, 27, 27, 0.5);
  ring-offset-color: rgba(69, 26, 26, 0.1);
}

/* 柔和的阴影效果 */
.shadow-soft {
  box-shadow:
    0 4px 20px rgba(248, 113, 113, 0.08),
    0 2px 8px rgba(248, 113, 113, 0.04);
}

.shadow-soft-hover {
  box-shadow:
    0 8px 30px rgba(248, 113, 113, 0.12),
    0 4px 12px rgba(248, 113, 113, 0.06);
}

.dark .shadow-soft {
  box-shadow:
    0 4px 20px rgba(153, 27, 27, 0.15),
    0 2px 8px rgba(153, 27, 27, 0.08);
}

.dark .shadow-soft-hover {
  box-shadow:
    0 8px 30px rgba(153, 27, 27, 0.2),
    0 4px 12px rgba(153, 27, 27, 0.1);
}

/* 柔和优雅的错误提示动画 */
.error-alert-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.error-alert-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.error-alert-enter-from {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
  filter: blur(4px);
}

.error-alert-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
  filter: blur(2px);
}

.error-alert-enter-to,
.error-alert-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .error-alert {
    gap: 0.75rem;
    padding: 0.875rem;
  }

  .error-icon-wrapper {
    width: 1.75rem;
    height: 1.75rem;
  }

  .error-close-btn {
    padding: 0.375rem;
  }
}
</style>
