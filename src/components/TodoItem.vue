<script setup lang="ts">
import {
  computed,
  ref,
  watchEffect,
  onBeforeMount,
  onMounted,
  onErrorCaptured,
} from 'vue'
import { useI18n } from 'vue-i18n'
import confetti from 'canvas-confetti'
import { useTodos } from '../composables/useTodos'
import type { Todo } from '../types/todo'
import { useErrorHandler } from '../composables/useErrorHandler'

const props = defineProps<{
  todo: Todo
}>()

const { projects } = useTodos()
const { showError } = useErrorHandler()
const { t } = useI18n()

const emit = defineEmits(['toggle', 'remove'])
const isCompleted = ref(props.todo.completed)

// 使用 watchEffect 优化性能
watchEffect(() => {
  isCompleted.value = props.todo.completed
})

const toggleTodo = () => {
  try {
    emit('toggle', props.todo.id)
    if (!isCompleted.value) {
      // 优化礼花效果的性能
      requestAnimationFrame(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true, // 考虑可访问性
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

// 使用 computed 优化文本处理
const formattedTitle = computed(() => {
  try {
    if (!props.todo?.text) return ''

    const text = props.todo.text.trim()
    const MAX_LENGTH = 50

    if (text.length <= MAX_LENGTH) return text
    return `${text.slice(0, MAX_LENGTH)}...`
  } catch (error) {
    console.error('Error formatting title:', error)
    return ''
  }
})

// 使用 computed 和 Map 优化项目名称查找
const projectsMap = computed(() => new Map(projects.value.map((p) => [p.id, p.name])))

const projectName = computed(() => {
  try {
    if (props.todo.projectId === null) return ''
    return projectsMap.value.get(props.todo.projectId) || ''
  } catch (error) {
    console.error('Error getting project name:', error)
    return ''
  }
})

// 添加性能监控
let renderStartTime = 0
onBeforeMount(() => {
  renderStartTime = performance.now()
})

onMounted(() => {
  const renderTime = performance.now() - renderStartTime
  if (renderTime > 50) {
    // TodoItem 应该渲染得更快
    console.warn(`TodoItem render time: ${renderTime}ms`)
  }
})

// 添加错误边界处理
const handleError = (error: Error) => {
  console.error('TodoItem error:', error)
  showError(t('generalError'))
}

onErrorCaptured(handleError)
</script>

<template>
  <div class="todo-item" :class="{ completed: isCompleted }" @click="toggleTodo">
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
        <span v-if="projectName" class="project-tag">{{ projectName }}</span>
      </div>
    </div>
    <button
      class="delete-btn"
      @click.stop="removeTodo"
      :title="t('delete')"
      :aria-label="t('delete')"
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
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.todo-item {
  font-family: 'LXGW WenKai Screen', sans-serif;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem;
  margin-bottom: 0.5rem;
  background-color: var(--input-bg-color);
  border: 1px solid var(--input-border-color);
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  will-change: transform;
  backface-visibility: hidden;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
}

.todo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.todo-item.completed {
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

.todo-item.completed .text-content {
  text-decoration: line-through;
  opacity: 0.6;
  color: var(--completed-todo-text-color);
}

.todo-content {
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
  gap: 0.5rem;
}

.todo-text-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  gap: 0.25rem;
}

.todo-text {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--todo-text-color);
  gap: 0.5rem;
}

.text-content {
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
  flex: 1;
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
}

.checkbox.checked {
  background-color: var(--button-bg-color);
  transform: scale(0.95);
}

.checkbox.checked::after {
  content: '✓';
  color: var(--card-bg-color);
  font-size: 12px;
  transform: scale(1.2);
  transition: transform 0.2s ease;
}

.delete-btn {
  background-color: transparent;
  color: var(--completed-todo-text-color);
  border: 1px solid var(--input-border-color);
  border-radius: 6px;
  padding: 0.4rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.6;
  transform: translateX(5px);
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.todo-item:hover .delete-btn {
  opacity: 1;
  transform: translateX(0);
  color: var(--error-color);
  border-color: var(--error-color);
}

.delete-btn:hover {
  background-color: var(--error-color);
  color: white;
  transform: scale(1.05);
}

.project-tag {
  background-color: var(--project-tag-bg-color);
  color: var(--project-tag-text-color);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.project-tag:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .todo-item {
    flex-direction: row;
    align-items: center;
  }

  .todo-content {
    flex: 1;
    min-width: 0;
  }

  .delete-btn {
    opacity: 0.8;
    transform: translateX(0);
    margin-left: 12px;
    position: relative;
  }

  .delete-btn:active {
    transform: scale(0.95);
  }
}

.project-name {
  font-size: 0.8em;
  color: var(--completed-todo-text-color);
  margin-left: 0.5rem;
}
</style>
