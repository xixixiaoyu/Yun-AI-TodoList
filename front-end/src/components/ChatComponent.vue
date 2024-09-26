<script setup lang="ts">
import { ref } from 'vue'
import { getSuggestedTodos } from '../services/deepseekService'

const userMessage = ref('')
const aiResponse = ref('')
const isLoading = ref(false)

const emit = defineEmits(['addTodos'])

const sendMessage = async () => {
  if (!userMessage.value.trim()) return

  isLoading.value = true
  try {
    const response = await getSuggestedTodos(userMessage.value)
    aiResponse.value = response
  } catch (error) {
    console.error('Error getting AI response:', error)
    aiResponse.value = '抱歉，获取 AI 回复时出现错误。请稍后再试。'
  } finally {
    isLoading.value = false
  }
}

const addSuggestedTodos = () => {
  const todos = aiResponse.value.split('\n').filter(todo => todo.trim() !== '')
  emit('addTodos', todos)
  aiResponse.value = ''
}
</script>

<template>
  <div class="chat-component">
    <h2>AI 助手</h2>
    <div class="chat-input">
      <input
        v-model="userMessage"
        @keyup.enter="sendMessage"
        placeholder="询问 AI 助手..."
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading">发送</button>
    </div>
    <div v-if="isLoading" class="loading">正在思考中...</div>
    <div v-else-if="aiResponse" class="ai-response">
      <p>{{ aiResponse }}</p>
      <button @click="addSuggestedTodos">添加建议的待办事项</button>
    </div>
  </div>
</template>

<style scoped>
.chat-component {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f0f8ff;
  border-radius: 8px;
}

h2 {
  color: #5d6d7e;
  margin-bottom: 1rem;
}

.chat-input {
  display: flex;
  margin-bottom: 1rem;
}

input {
  flex-grow: 1;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #d5d8dc;
  border-radius: 4px;
  margin-right: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #85c1e9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #5dade2;
}

button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.loading {
  font-style: italic;
  color: #7f8c8d;
}

.ai-response {
  background-color: white;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.ai-response p {
  margin-bottom: 1rem;
}
</style>
