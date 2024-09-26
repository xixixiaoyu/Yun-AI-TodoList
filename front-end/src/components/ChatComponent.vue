<script setup lang="ts">
import { ref } from 'vue'
import { getSuggestedTodos } from '../services/deepseekService'

const userMessage = ref('')
const aiResponse = ref('')
const isLoading = ref(false)

const suggestedTodos = ref<string[]>([])

const props = defineProps<{
  historicalTodos: string[]
}>()

const emit = defineEmits(['addTodos'])

const sendMessage = async () => {
  if (!userMessage.value.trim()) return

  isLoading.value = true
  try {
    const response = await getSuggestedTodos(userMessage.value, props.historicalTodos)
    aiResponse.value = response
  } catch (error) {
    console.error('Error getting AI response:', error)
    aiResponse.value = '抱歉，获取 AI 回复时出现错误。请稍后再试。'
  } finally {
    isLoading.value = false
  }
}

const addSuggestedTodos = () => {
  emit('addTodos', suggestedTodos.value)
  aiResponse.value = ''
  suggestedTodos.value = []
}

const generateSuggestedTodos = async () => {
  isLoading.value = true
  try {
    const response = await getSuggestedTodos(
      '请根据我的历史待办事项为我生成 5 个建议的待办事项，如果无法很好预测则自己生成对自我提升最佳的具体一点的待办事项。',
      props.historicalTodos
    )
    suggestedTodos.value = response.split('\n').filter((todo: string) => todo.trim() !== '')
    aiResponse.value = '以下是为您生成的建议待办事项：\n' + suggestedTodos.value.join('\n')
  } catch (error) {
    console.error('Error generating suggested todos:', error)
    aiResponse.value = '抱歉，生成建议待办事项时出现错误。请稍后再试。'
  } finally {
    isLoading.value = false
  }
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
      <button @click="generateSuggestedTodos" :disabled="isLoading" class="generate-btn">
        生成建议待办事项
      </button>
    </div>
    <div v-if="isLoading" class="loading">正在思考中...</div>
    <div v-else-if="aiResponse" class="ai-response">
      <p>{{ aiResponse }}</p>
      <button v-if="suggestedTodos.length > 0" @click="addSuggestedTodos">
        添加建议的待办事项
      </button>
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

.generate-btn {
  margin-left: 0.5rem;
  background-color: #2ecc71;
}

.generate-btn:hover {
  background-color: #27ae60;
}

/* 为了适应新按钮，可能需要调整一下布局 */
.chat-input {
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .chat-input {
    flex-direction: column;
  }

  .chat-input button {
    width: 100%;
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>
