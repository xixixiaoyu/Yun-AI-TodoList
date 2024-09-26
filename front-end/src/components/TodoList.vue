<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'
import ChatComponent from './ChatComponent.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useTodos } from '../composables/useTodos'
import { useLayout } from '../composables/useLayout'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useConfirmDialog } from '../composables/useConfirmDialog'

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
const { isMultiColumn, checkLayout } = useLayout()
const { error: duplicateError, showError } = useErrorHandler()
const { showConfirmDialog, confirmDialogConfig, handleConfirm, handleCancel } = useConfirmDialog()

const filter = ref('active')
const showHistory = ref(false)
const MAX_TODO_LENGTH = 50 // 定义最大待办事项长度

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

onMounted(() => {
  checkLayout()
  window.addEventListener('resize', checkLayout)
})

watch(filteredTodos, checkLayout, { deep: true })

onUnmounted(() => {
  window.removeEventListener('resize', checkLayout)
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
</script>

<template>
  <div class="todo-list">
    <h1>我的待办事项</h1>
    <TodoInput :maxLength="MAX_TODO_LENGTH" @add="addTodo" :duplicateError="duplicateError" />
    <TodoFilters v-model:filter="filter" />
    <div class="todo-grid" :class="{ 'multi-column': isMultiColumn }">
      <TodoItem
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        @toggle="toggleTodo"
        @remove="removeTodo"
      />
    </div>
    <div class="clear-buttons">
      <button v-if="filter === 'active' && hasActiveTodos" @click="clearActive" class="clear-btn">
        清除待完成
      </button>
    </div>
    <ChatComponent @addTodos="addMultipleTodos" :historicalTodos="historicalTodos" />
    <button @click="toggleHistory" class="history-icon" :class="{ active: showHistory }">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm1-8h4v2h-6V7h2v5z"
        />
      </svg>
    </button>
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogConfig.title"
      :message="confirmDialogConfig.message"
      :confirmText="confirmDialogConfig.confirmText"
      :cancelText="confirmDialogConfig.cancelText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
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
  max-width: 800px;
  width: 90%;
  margin: 0 auto;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
}

h1 {
  color: #5d6d7e;
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 300;
}

.todo-grid {
  display: flex;
  flex-direction: column;
}

.todo-grid.multi-column {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.history-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  transition: all 0.3s ease;
}

.history-icon svg {
  fill: #85c1e9;
  transition: all 0.3s ease;
}

.history-icon:hover svg {
  fill: #5dade2;
}

.history-icon.active svg {
  fill: #e74c3c;
}

@media (max-width: 768px) {
  .todo-list {
    width: 95%;
    padding: 1rem;
  }

  h1 {
    font-size: 1.8rem;
  }

  .todo-grid.multi-column {
    grid-template-columns: 1fr;
  }

  .history-icon {
    top: 5px;
    right: 5px;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.clear-buttons {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
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
  .clear-buttons {
    flex-direction: column;
    align-items: center;
  }

  .clear-btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
