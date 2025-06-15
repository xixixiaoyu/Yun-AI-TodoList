<template>
  <div class="message-container" :class="message.role">
    <div class="message-content" dir="ltr">
      <p v-if="message.role === 'user'">
        {{ message.content }}
      </p>
      <div v-else class="ai-message">
        <div v-html="message.sanitizedContent" />
        <button
          v-if="!isStreaming"
          class="copy-button"
          title="复制原始内容"
          @click="$emit('copy', message.content)"
        >
          <CopyIcon />
          复制
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyIcon from '../common/icons/CopyIcon.vue'
import '../../styles/chat-message.css'

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
}

defineProps<Props>()
defineEmits<Emits>()

defineOptions({
  name: 'ChatMessage'
})
</script>

<style scoped>
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
  padding-bottom: 8px;
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

.copy-button :deep(svg) {
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
    padding-bottom: 32px;
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

  .copy-button :deep(svg) {
    width: 13px;
    height: 13px;
  }

  .copy-button:active {
    opacity: 1;
    transform: scale(0.96);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.1);
  }
}

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
