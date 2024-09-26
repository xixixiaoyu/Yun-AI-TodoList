<script setup lang="ts">
import { ref, computed } from 'vue'
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'
import ChatComponent from './ChatComponent.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useTodos } from '../composables/useTodos'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import AIChatDialog from './AIChatDialog.vue'

const {
  todos,
  history,
  addTodo,
  toggleTodo,
  removeTodo,
  clearActiveTodos,
  restoreHistory,
  deleteHistoryItem,
  deleteAllHistory
} = useTodos()
const { error: duplicateError, showError } = useErrorHandler()
const { showConfirmDialog, confirmDialogConfig, handleConfirm, handleCancel } = useConfirmDialog()

const filter = ref('active')
const showHistory = ref(false)
const MAX_TODO_LENGTH = 50

const filteredTodos = computed(() => {
  if (filter.value === 'active') {
    return todos.value.filter(todo => !todo.completed)
  } else if (filter.value === 'completed') {
    return todos.value.filter(todo => todo.completed)
  }
  return todos.value
})

const historicalTodos = computed(() => {
  return history.value.flatMap(item => item.todos.map(todo => todo.text))
})

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const hasActiveTodos = computed(() => {
  return todos.value.some(todo => !todo.completed)
})

const clearActive = () => {
  showConfirmDialog.value = true
  confirmDialogConfig.value = {
    title: '清除未完成的待办事项',
    message: '确定要清除所有未完成的待办事项吗？此操作不可撤销。',
    confirmText: '确定清除',
    cancelText: '取消',
    action: clearActiveTodos
  }
}

const addMultipleTodos = (newTodos: string[]) => {
  newTodos.forEach(text => {
    if (!todos.value.some(todo => todo.text === text)) {
      addTodo(text)
    } else {
      showError('待办事项已存在')
    }
  })
}

const showAIChat = ref(false)

const toggleAIChat = () => {
  showAIChat.value = !showAIChat.value
}
</script>

<template>
  <div class="todo-list">
    <div class="header">
      <h1>我的待办事项</h1>
      <div class="header-actions">
        <button @click="toggleHistory" class="icon-button" :class="{ active: showHistory }">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
            />
          </svg>
          <span class="sr-only">历史记录</span>
        </button>
        <button @click="toggleAIChat" class="icon-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm0-3c-2.33 0-4.32-1.45-5.12-3.5h1.67c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2h1.67c-.8 2.05-2.79 3.5-5.12 3.5z"
            />
          </svg>
          <span>AI 助手</span>
        </button>
      </div>
    </div>
    <TodoInput :maxLength="MAX_TODO_LENGTH" @add="addTodo" :duplicateError="duplicateError" />
    <TodoFilters v-model:filter="filter" />
    <div class="todo-grid">
      <TodoItem
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        @toggle="toggleTodo"
        @remove="removeTodo"
      />
    </div>
    <div class="actions">
      <button v-if="filter === 'active' && hasActiveTodos" @click="clearActive" class="clear-btn">
        清除待完成
      </button>
    </div>
    <ChatComponent @addTodos="addMultipleTodos" :historicalTodos="historicalTodos" />
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogConfig.title"
      :message="confirmDialogConfig.message"
      :confirmText="confirmDialogConfig.confirmText"
      :cancelText="confirmDialogConfig.cancelText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
    <Transition name="slide-fade">
      <AIChatDialog v-if="showAIChat" @close="toggleAIChat" />
    </Transition>
  </div>
  <transition name="slide">
    <HistorySidebar
      v-if="showHistory"
      :history="history"
      @restore="restoreHistory"
      @deleteItem="deleteHistoryItem"
      @deleteAll="deleteAllHistory"
    />
  </transition>
</template>

<style scoped>
.todo-list {
  max-width: 600px;
  width: 90%;
  margin: 0 auto;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  backdrop-filter: blur(10px);
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  color: #5d6d7e;
  font-size: 2.2rem;
  font-weight: 300;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.todo-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #85c1e9;
  font-weight: bold;
  transition: all 0.3s ease;
}

.icon-button svg {
  fill: currentColor;
}

.icon-button:hover,
.icon-button.active {
  color: #5dade2;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.actions {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.clear-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background-color: #c0392b;
}

@media (max-width: 768px) {
  .todo-list {
    width: 95%;
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  h1 {
    font-size: 1.8rem;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .clear-btn {
    width: 100%;
  }
}

.slide-enter-active,
.slide-leave-active,
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
