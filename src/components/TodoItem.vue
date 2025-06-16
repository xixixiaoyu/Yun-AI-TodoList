<template>
  <div
    class="card-todo"
    :class="{ completed: isCompleted }"
    :data-todo-id="todo.id"
    @click="toggleTodo"
  >
    <div class="todo-content">
      <span class="checkbox-wrapper">
        <transition name="fade">
          <i v-show="true" class="checkbox" :class="{ checked: isCompleted }" />
        </transition>
      </span>
      <div class="todo-text-wrapper">
        <span class="todo-text" :title="formattedTitle">
          <transition>
            <span v-show="true" class="text-content">{{ formattedTitle }}</span>
          </transition>
        </span>
      </div>
    </div>
    <button
      class="delete-btn"
      :title="t('delete')"
      :aria-label="t('delete')"
      @click.stop="removeTodo"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti'
import { useErrorHandler } from '../composables/useErrorHandler'
import type { Todo } from '../types/todo'

const props = defineProps<{
  todo: Todo
}>()

const { showError } = useErrorHandler()
const { t } = useI18n()

const emit = defineEmits(['toggle', 'remove'])
const isCompleted = ref(false)

watchEffect(() => {
  isCompleted.value = props.todo.completed
})

const toggleTodo = () => {
  try {
    emit('toggle', props.todo.id)
    if (!isCompleted.value) {
      requestAnimationFrame(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        })
      })
    }
    isCompleted.value = !isCompleted.value
  } catch (error) {
    console.error('Error toggling todo:', error)
    showError(t('toggleError'))
  }
}

const removeTodo = () => {
  try {
    emit('remove', props.todo.id)
  } catch (error) {
    console.error('Error removing todo:', error)
    showError(t('removeError'))
  }
}

const formattedTitle = computed(() => {
  try {
    if (!props.todo?.text) {
      return ''
    }

    const text = props.todo.text.trim()
    const MAX_LENGTH = 50

    if (text.length <= MAX_LENGTH) {
      return text
    }
    return `${text.slice(0, MAX_LENGTH)}...`
  } catch (error) {
    console.error('Error formatting title:', error)
    return ''
  }
})

let renderStartTime = 0
onBeforeMount(() => {
  renderStartTime = performance.now()
})

onMounted(() => {
  const renderTime = performance.now() - renderStartTime
  if (renderTime > 50) {
    console.warn(`TodoItem render time: ${renderTime}ms`)
  }
})

const handleError = (error: Error) => {
  console.error('TodoItem error:', error)
  showError(t('generalError'))
}

onErrorCaptured(handleError)
</script>

<style scoped>
.card-todo {
  @apply font-sans flex items-center w-full box-border gap-2 will-change-transform;
  padding: 0.7rem;
  margin-bottom: 0.75rem;
  background-color: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.checkbox-wrapper {
  @apply flex items-center;
}

.card-todo:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--input-focus-color);
}

.card-todo.completed {
  animation: completedTodo 0.3s ease forwards;
}

@keyframes completedTodo {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.card-todo.completed .text-content {
  @apply line-through opacity-60;
  color: var(--completed-todo-text-color);
}

.todo-content {
  @apply flex items-center flex-grow min-w-0 gap-2;
}

.todo-text-wrapper {
  @apply flex flex-col flex-grow min-w-0 gap-1;
}

.todo-text {
  @apply flex items-center cursor-pointer gap-2;
  color: var(--todo-text-color);
  font-family: 'LXGW WenKai Lite Medium', sans-serif;
}

.text-content {
  @apply text-left whitespace-nowrap overflow-hidden text-ellipsis transition-all-300 flex-1;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid var(--button-bg-color);
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  background-color: transparent;
}

.checkbox.checked {
  background-color: var(--button-bg-color);
  transform: scale(0.95);
}

.checkbox.checked::after {
  content: '✓';
  color: var(--card-bg-color);
  font-size: 12px;
  font-weight: bold;
  transform: scale(1.2);
  transition: transform 0.2s ease;
}

.delete-btn {
  @apply bg-transparent text-completed border border-input-border rounded-md p-1.5 text-sm cursor-pointer transition-all duration-200 opacity-60 transform translate-x-1.25 ml-2 flex items-center justify-center min-w-8 h-8;
}

.card-todo:hover .delete-btn {
  @apply opacity-100 transform translate-x-0 text-error;
}

.delete-btn:hover {
  @apply bg-red-50 bg-opacity-10 text-error transform scale-105;
}

@media (max-width: 768px) {
  .card-todo {
    @apply flex-row items-center;
  }

  .todo-content {
    @apply flex-1 min-w-0;
  }

  .delete-btn {
    @apply opacity-80 transform translate-x-0 ml-3 relative;
  }

  .delete-btn:active {
    @apply transform scale-95;
  }
}
</style>
