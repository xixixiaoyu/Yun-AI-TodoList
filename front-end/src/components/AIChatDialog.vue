<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
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
    await nextTick()
    scrollToBottom()
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
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
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
  right: 20px;
  width: 90%;
  height: 90%;
  max-width: 500px;
  max-height: 700px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  border-radius: 20px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background-color: #3498db;
  color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
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
  padding: 25px;
  overflow: hidden;
}

.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  padding-right: 15px;
}

.chat-history .user,
.chat-history .ai {
  max-width: 80%;
  margin-bottom: 20px;
  padding: 15px 20px;
  border-radius: 18px;
  line-height: 1.5;
}

.chat-history .user {
  align-self: flex-end;
  background-color: #3498db;
  color: white;
}

.chat-history .ai {
  align-self: flex-start;
  background-color: #f0f0f0;
  color: #333;
}

.chat-input {
  display: flex;
  gap: 15px;
}

.chat-input input {
  flex-grow: 1;
  padding: 15px;
  font-size: 16px;
  border: 1px solid #d5d8dc;
  border-radius: 25px;
  outline: none;
  transition: all 0.3s ease;
}

.chat-input input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.chat-input button {
  padding: 15px 25px;
  font-size: 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
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
  .ai-chat-dialog {
    top: 10px;
    right: 10px;
    width: calc(100% - 20px);
    height: calc(100% - 20px);
    max-width: none;
    max-height: none;
  }
}
</style>
