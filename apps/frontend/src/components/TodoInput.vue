<template>
  <form class="add-todo-form" @submit.prevent="addTodo">
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
  <p v-if="errorMessage || duplicateError" class="text-error text-sm mt-2 w-full font-weight">
    {{ errorMessage || duplicateError }}
  </p>
</template>

<script setup lang="ts">
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

<style scoped>
.add-todo-form {
  @apply font-sans flex mb-6 flex-wrap gap-3 p-4 rounded;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  align-items: center;
}

.input-wrapper {
  @apply flex gap-3 relative flex-grow;
  min-width: 250px;
}

@media (max-width: 480px) {
  .input-wrapper {
    min-width: unset;
    width: 100%;
  }
}

.todo-input {
  @apply flex-grow text-base outline-none transition-all-300;
  padding: 0.875rem 1rem;
  background-color: var(--input-bg-color);
  border: 2px solid var(--input-border-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  height: 48px;
  box-sizing: border-box;
}

.todo-input:focus {
  border-color: var(--input-focus-color);
  box-shadow:
    0 0 8px rgba(121, 180, 166, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.add-btn {
  @apply text-button-text border-none rounded cursor-pointer transition-all-300 font-semibold;
  padding: 0.875rem 1.25rem;
  font-size: 0.95rem;
  background-color: var(--button-bg-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
  letter-spacing: 0.3px;
  height: 48px;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .add-todo-form {
    @apply flex-col;
  }

  .input-wrapper {
    @apply mb-2 w-full;
    min-width: unset;
  }

  .add-btn {
    @apply w-full py-2 px-4;
  }
}
</style>
