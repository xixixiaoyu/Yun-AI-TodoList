<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { getAIResponse } from '../services/deepseekService'

const emit = defineEmits(['close'])

const userMessage = ref('')
const chatHistory = ref<{ role: 'user' | 'ai'; content: string }[]>([])
const isLoading = ref(false)
const chatHistoryRef = ref<HTMLDivElement | null>(null)

const sendMessage = async () => {
  if (!userMessage.value.trim()) return

  const userMessageContent = userMessage.value
  chatHistory.value.push({ role: 'user', content: userMessageContent })
  userMessage.value = ''
  isLoading.value = true

  try {
    const response = await getAIResponse(userMessageContent)
    chatHistory.value.push({ role: 'ai', content: response })
  } catch (error) {
    console.error('Error getting AI response:', error)
    chatHistory.value.push({ role: 'ai', content: '抱歉，获取 AI 回复时出现错误。请稍后再试。' })
  } finally {
    isLoading.value = false
  }
}

const scrollToBottom = () => {
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
  }
}

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
  scrollToBottom()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})

// 监听 chatHistory 的变化，当有新消息时滚动到底部
watch(chatHistory, () => {
  nextTick(() => {
    scrollToBottom()
  })
})
</script>

<template>
  <div class="ai-chat-dialog">
    <div class="dialog-header">
      <h2>AI 助手</h2>
      <button @click="$emit('close')" class="close-button">&times;</button>
    </div>
    <div class="dialog-content">
      <div ref="chatHistoryRef" class="chat-history">
        <div v-for="(message, index) in chatHistory" :key="index" :class="message.role">
          <p>{{ message.content }}</p>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="userMessage"
          @keyup.enter="sendMessage"
          placeholder="询问 AI 助手..."
          :disabled="isLoading"
        />
        <button @click="sendMessage" :disabled="isLoading">
          <span v-if="!isLoading">发送</span>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-chat-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background-color: #3498db;
  color: white;
}

.dialog-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  transform: scale(1.1);
}

.dialog-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 30px 40px;
  overflow: hidden;
}

.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  padding-right: 20px;
}

.chat-history .user,
.chat-history .ai {
  max-width: 80%;
  margin-bottom: 25px;
  padding: 15px 20px;
  border-radius: 18px;
  line-height: 1.6;
  font-size: 16px;
}

.chat-history .user {
  align-self: flex-end;
  background-color: #3498db;
  color: white;
}

.chat-history .ai {
  align-self: flex-start;
  background-color: white;
  color: #333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.chat-input {
  display: flex;
  gap: 20px;
  padding: 0 40px 30px;
}

.chat-input input {
  flex-grow: 1;
  padding: 15px 20px;
  font-size: 16px;
  border: 1px solid #d5d8dc;
  border-radius: 30px;
  outline: none;
  transition: all 0.3s ease;
}

.chat-input input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.chat-input button {
  padding: 15px 30px;
  font-size: 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-input button:hover:not(:disabled) {
  background-color: #2980b9;
}

.chat-input button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top: 2px solid #3498db;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .dialog-header {
    padding: 15px 20px;
  }

  .dialog-header h2 {
    font-size: 24px;
  }

  .dialog-content {
    padding: 20px;
  }

  .chat-input {
    padding: 0 20px 20px;
  }
}
</style>
