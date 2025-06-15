<template>
  <div v-if="show" class="suggested-todos-dialog">
    <h3>{{ t('suggestedTodos') }}</h3>
    <p>{{ t('confirmOrModify') }}</p>
    <ul>
      <li v-for="(todo, index) in suggestedTodos" :key="index">
        <input
          :value="todo"
          class="suggested-todo-input"
          @input="handleTodoUpdate(index, $event)"
        />
      </li>
    </ul>
    <div class="dialog-actions">
      <button class="confirm-btn" @click="$emit('confirm')">
        {{ t('confirmAdd') }}
      </button>
      <button class="cancel-btn" @click="$emit('cancel')">
        {{ t('cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
  suggestedTodos: string[]
}

interface Emits {
  (e: 'updateTodo', index: number, value: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

/**
 * 处理待办事项更新
 */
const handleTodoUpdate = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  emit('updateTodo', index, target.value)
}

defineOptions({
  name: 'SuggestedTodosDialog'
})
</script>

<style scoped>
.suggested-todos-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--card-bg-color);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 500px;
  width: calc(100% - 2rem);
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

.suggested-todos-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
}

.suggested-todos-dialog p {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary-color);
  text-align: center;
  font-size: 0.9rem;
}

.suggested-todos-dialog ul {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.suggested-todos-dialog li {
  margin-bottom: 0.75rem;
}

.suggested-todo-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--input-border-color);
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.suggested-todo-input:focus {
  outline: none;
  border-color: var(--button-bg-color);
  box-shadow: 0 0 0 3px rgba(var(--button-bg-color-rgb), 0.1);
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.confirm-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.confirm-btn {
  background-color: var(--button-bg-color);
  color: white;
}

.confirm-btn:hover {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
}

.cancel-btn {
  background-color: var(--language-toggle-bg);
  color: var(--language-toggle-color);
}

.cancel-btn:hover {
  background-color: var(--language-toggle-hover-bg);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .suggested-todos-dialog {
    padding: 1.5rem;
    max-width: calc(100% - 1rem);
  }

  .suggested-todos-dialog h3 {
    font-size: 1.1rem;
  }

  .suggested-todo-input {
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
  }

  .dialog-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .confirm-btn,
  .cancel-btn {
    width: 100%;
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .suggested-todos-dialog {
    padding: 1rem;
    border-radius: 12px;
  }

  .suggested-todos-dialog h3 {
    font-size: 1rem;
  }

  .suggested-todos-dialog p {
    font-size: 0.85rem;
  }

  .suggested-todo-input {
    padding: 0.5rem 0.7rem;
    font-size: 0.8rem;
  }

  .confirm-btn,
  .cancel-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>
