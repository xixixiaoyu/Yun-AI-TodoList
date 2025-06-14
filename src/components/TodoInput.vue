<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  maxLength: number
  duplicateError: string
  placeholder: string
}>()

const emit = defineEmits(['add'])

const { t } = useI18n()

const newTodo = ref('')
const errorMessage = ref('')

const addTodo = async () => {
  const trimmedTodo = newTodo.value.trim()
  if (trimmedTodo.length === 0) {
    errorMessage.value = t('emptyTodoError')
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }
  if (trimmedTodo.length > props.maxLength) {
    errorMessage.value = t('maxLengthError', { maxLength: props.maxLength })
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  emit('add', trimmedTodo, [])
  newTodo.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <form class="add-todo" @submit.prevent="addTodo">
    <div class="input-wrapper">
      <input
        v-model.trim="newTodo"
        class="todo-input"
        :placeholder="placeholder"
        :maxlength="maxLength"
      />
    </div>
    <button type="submit" class="add-btn">
      {{ t('add') }}
    </button>
  </form>
  <p v-if="errorMessage || duplicateError" class="error-message">
    {{ errorMessage || duplicateError }}
  </p>
</template>

<style scoped>
.add-todo {
  font-family: 'LXGW WenKai Screen', sans-serif;
  display: flex;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 126, 103, 0.1);
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  position: relative;
  flex-grow: 1;
  min-width: 250px;
}

.todo-input {
  flex-grow: 1;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--input-border-color);
  border-radius: calc(var(--border-radius) / 1.5);
  outline: none;
  transition: all 0.3s ease;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

input:focus {
  border-color: var(--input-focus-color);
  box-shadow:
    0 0 8px rgba(121, 180, 166, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.add-btn {
  padding: 0.875rem 1.25rem;
  font-size: 0.95rem;
  background: linear-gradient(
    135deg,
    var(--button-bg-color) 0%,
    rgba(121, 180, 166, 0.9) 100%
  );
  color: var(--button-text-color);
  border: none;
  border-radius: calc(var(--border-radius) / 1.5);
  box-shadow: 0 2px 6px rgba(121, 180, 166, 0.3);
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: var(--font-weight);
  letter-spacing: 0.5px;
  height: 42px;
  min-width: 80px;
}

.add-btn:hover {
  background-color: var(--button-hover-bg-color);
}

.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  width: 100%;
  font-weight: var(--font-weight);
}

@media (max-width: 768px) {
  .add-todo {
    flex-direction: column;
  }

  .input-wrapper {
    margin-bottom: 0.5rem;
    width: 100%;
  }

  .add-btn {
    width: 100%;
    padding: 0.5rem 1rem;
  }
}
</style>
