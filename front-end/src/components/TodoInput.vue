<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  maxLength: number
  duplicateError: string
}>()

const emit = defineEmits(['add'])

const newTodo = ref('')
const errorMessage = ref('')

const charCount = computed(() => {
  return `${newTodo.value.length}/${props.maxLength}`
})

const addTodo = () => {
  const trimmedTodo = newTodo.value.trim()
  if (trimmedTodo.length === 0) {
    errorMessage.value = '待办事项不能为空'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }
  if (trimmedTodo.length > props.maxLength) {
    errorMessage.value = `待办事项不能超过 ${props.maxLength} 个字符`
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }
  emit('add', trimmedTodo)
  newTodo.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <div class="add-todo">
    <div class="input-wrapper">
      <input
        v-model="newTodo"
        @keyup.enter="addTodo"
        placeholder="添加新的待办事项..."
        :maxlength="maxLength"
      />
      <span class="char-count">
        {{ charCount }}
      </span>
    </div>
    <button @click="addTodo" class="add-btn">添加</button>
  </div>
  <p v-if="errorMessage || duplicateError" class="error-message">
    {{ errorMessage || duplicateError }}
  </p>
</template>

<style scoped>
.add-todo {
  display: flex;
  margin-bottom: 1rem;
}

.input-wrapper {
  position: relative;
  flex-grow: 1;
  display: flex;
}

input {
  flex-grow: 1;
  padding: 0.7rem;
  padding-right: 3rem;
  font-size: 1rem;
  border: 1px solid #d5d8dc;
  border-radius: 5px 0 0 5px;
  outline: none;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #85c1e9;
  box-shadow: 0 0 5px rgba(133, 193, 233, 0.5);
}

.char-count {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: #7f8c8d;
}

.add-btn {
  padding: 0.7rem 1rem;
  font-size: 1rem;
  background-color: #85c1e9;
  color: white;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background-color: #5dade2;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>
