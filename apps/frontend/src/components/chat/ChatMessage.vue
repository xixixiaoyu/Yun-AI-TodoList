<template>
  <div
    class="relative opacity-100 translate-y-0 transition-all-300 m-0 group"
    :class="{
      'user-message-responsive': message.role === 'user',
      'ai-message-responsive self-start': message.role === 'assistant',
    }"
  >
    <div
      class="rounded-xl leading-6 ltr relative transition-all duration-300 tracking-[0.2px] word-break-break-word"
      :class="{
        'bg-button-bg text-white spacing-responsive-sm shadow-[0_2px_8px_rgba(121,180,166,0.3)] hover:shadow-[0_4px_12px_rgba(121,180,166,0.4)] leading-[1.4] font-medium text-responsive-base':
          message.role === 'user',
        'ai-message-container': message.role === 'assistant',
      }"
      dir="ltr"
    >
      <p v-if="message.role === 'user'" class="m-0 whitespace-pre-wrap break-words">
        {{ message.content }}
      </p>
      <div v-else class="relative">
        <div
          class="ai-message-prose ai-message-headings ai-message-paragraphs ai-message-lists ai-message-code-inline ai-message-code-block ai-message-blockquote ai-message-table ai-message-links break-words"
          v-html="message.sanitizedContent"
        />
        <MessageActionBar
          v-if="!isStreaming"
          :message-content="message.content"
          :message-role="message.role"
          :is-visible="true"
          :can-retry="message.role === 'assistant'"
          :can-optimize="message.role === 'user'"
          @copy-success="handleCopySuccess"
          @copy-error="handleCopyError"
          @retry="handleRetry"
          @optimize="handleOptimize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MessageActionBar from './MessageActionBar.vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sanitizedContent?: string
}

interface Props {
  message: Message
  isStreaming?: boolean
}

interface Emits {
  (e: 'copy', text: string): void
  (e: 'copy-success', text: string): void
  (e: 'copy-error', error: Error): void
  (e: 'retry'): void
  (e: 'optimize'): void
}

const _props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 注入 Toast 实例
const toast = inject('toast') as ReturnType<typeof import('../../composables/useToast').useToast>

const handleCopySuccess = (text: string) => {
  emit('copy', text)
  emit('copy-success', text)

  // 显示 Toast 通知
  if (toast) {
    toast.copySuccess()
  }
}

const handleCopyError = (error: Error) => {
  emit('copy-error', error)

  // 显示 Toast 通知
  if (toast) {
    toast.copyError(error)
  }
}

const handleRetry = () => {
  emit('retry')
}

const handleOptimize = () => {
  emit('optimize')
}

defineOptions({
  name: 'ChatMessage',
})
</script>
