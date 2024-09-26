<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

interface HistoryItem {
  date: string
  todos: Todo[]
}

const MAX_TODO_LENGTH = 50

const todos = ref<Todo[]>([])
const filter = ref('active')
const history = ref<HistoryItem[]>([])
const showHistory = ref(false)
const isMultiColumn = ref(false)
const duplicateError = ref('')

const filteredTodos = computed(() => {
  if (filter.value === 'active') {
    return todos.value.filter(todo => !todo.completed)
  } else if (filter.value === 'completed') {
    return todos.value.filter(todo => todo.completed)
  }
  return todos.value
})

onMounted(() => {
  const storedTodos = localStorage.getItem('todos')
  if (storedTodos) {
    todos.value = JSON.parse(storedTodos)
  }
  const storedHistory = localStorage.getItem('todoHistory')
  if (storedHistory) {
    history.value = JSON.parse(storedHistory)
  }
  checkLayout()
  window.addEventListener('resize', checkLayout)
})

watch(
  todos,
  newTodos => {
    localStorage.setItem('todos', JSON.stringify(newTodos))
    saveToHistory()
  },
  { deep: true }
)

watch(
  history,
  newHistory => {
    localStorage.setItem('todoHistory', JSON.stringify(newHistory))
  },
  { deep: true }
)

const addTodo = (text: string) => {
  if (todos.value.some(todo => todo.text === text)) {
    duplicateError.value = '该待办事项已存在'
    setTimeout(() => {
      duplicateError.value = ''
    }, 3000)
    return
  }
  todos.value.push({
    id: Date.now(),
    text,
    completed: false
  })
  duplicateError.value = '' // 清除错误信息
}

const toggleTodo = (id: number) => {
  const todo = todos.value.find(todo => todo.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

const removeTodo = (id: number) => {
  todos.value = todos.value.filter(todo => todo.id !== id)
}

const saveToHistory = () => {
  const today = new Date().toISOString().split('T')[0]
  const existingIndex = history.value.findIndex(item => item.date === today)

  if (existingIndex !== -1) {
    history.value[existingIndex].todos = JSON.parse(JSON.stringify(todos.value))
  } else {
    history.value.push({
      date: today,
      todos: JSON.parse(JSON.stringify(todos.value))
    })
  }
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const restoreHistory = (date: string) => {
  const historyItem = history.value.find(item => item.date === date)
  if (historyItem) {
    todos.value = JSON.parse(JSON.stringify(historyItem.todos))
  }
}

const deleteHistoryItem = (date: string) => {
  history.value = history.value.filter(item => item.date !== date)
}

const deleteAllHistory = () => {
  history.value = []
}

const checkLayout = async () => {
  await nextTick()
  const todoList = document.querySelector('.todo-list') as HTMLElement
  const todoGrid = document.querySelector('.todo-grid') as HTMLElement
  if (todoList && todoGrid) {
    const listHeight = todoList.offsetHeight
    const windowHeight = window.innerHeight
    isMultiColumn.value = listHeight > windowHeight * 0.9
  }
}

watch(
  filteredTodos,
  () => {
    checkLayout()
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', checkLayout)
})
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
    <button @click="toggleHistory" class="history-icon" :class="{ active: showHistory }">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm1-8h4v2h-6V7h2v5z"
        />
      </svg>
    </button>
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
</style>
