<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const newTodo = ref('')
const todos = ref<Todo[]>([])
const filter = ref('all')

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
})

watch(
  todos,
  newTodos => {
    localStorage.setItem('todos', JSON.stringify(newTodos))
  },
  { deep: true }
)

const addTodo = () => {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: Date.now(),
      text: newTodo.value.trim(),
      completed: false
    })
    newTodo.value = ''
  }
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

const clearCompleted = () => {
  todos.value = todos.value.filter(todo => !todo.completed)
}
</script>

<template>
  <div class="todo-list">
    <h1>我的待办事项</h1>
    <div class="add-todo">
      <input v-model="newTodo" @keyup.enter="addTodo" placeholder="添加新的待办事项..." />
      <button @click="addTodo" class="add-btn">添加</button>
    </div>
    <div class="filter-buttons">
      <button @click="filter = 'all'" :class="{ active: filter === 'all' }">全部</button>
      <button @click="filter = 'active'" :class="{ active: filter === 'active' }">未完成</button>
      <button @click="filter = 'completed'" :class="{ active: filter === 'completed' }">
        已完成
      </button>
    </div>
    <transition-group name="list" tag="ul">
      <li v-for="todo in filteredTodos" :key="todo.id" :class="{ completed: todo.completed }">
        <span @click="toggleTodo(todo.id)">
          <i class="checkbox" :class="{ checked: todo.completed }"></i>
          {{ todo.text }}
        </span>
        <button @click="removeTodo(todo.id)" class="delete-btn">删除</button>
      </li>
    </transition-group>
    <button @click="clearCompleted" class="clear-btn" v-if="todos.some(todo => todo.completed)">
      清除已完成
    </button>
  </div>
</template>

<style scoped>
.todo-list {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background-color: rgba(255, 249, 230, 0.9);
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

h1 {
  color: #ff6b6b;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.add-todo {
  display: flex;
  margin-bottom: 1.5rem;
}

input {
  flex-grow: 1;
  padding: 0.5rem;
  font-size: 1rem;
  border: 2px solid #ffd166;
  border-radius: 5px 0 0 5px;
  outline: none;
  transition: border-color 0.3s ease;
}

input:focus {
  border-color: #ffb347;
}

.add-btn {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #ffd166;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-btn:hover {
  background-color: #ffb347;
}

.filter-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.filter-buttons button {
  margin: 0 0.5rem;
  padding: 0.3rem 0.8rem;
  font-size: 0.9rem;
  background-color: #fff;
  border: 1px solid #ffd166;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-buttons button.active,
.filter-buttons button:hover {
  background-color: #ffd166;
  color: #fff;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

li:hover {
  background-color: #fff5d7;
}

li.completed span {
  text-decoration: line-through;
  color: #aaa;
}

.checkbox {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #ffd166;
  border-radius: 50%;
  margin-right: 10px;
  vertical-align: middle;
  transition: all 0.3s ease;
}

.checkbox.checked {
  background-color: #ffd166;
  position: relative;
}

.checkbox.checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
}

.delete-btn {
  background-color: #ff6b6b;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background-color: #ff4757;
}

.clear-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: #ff9ff3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.clear-btn:hover {
  background-color: #ff7eb9;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
