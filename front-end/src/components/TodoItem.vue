<script setup lang="ts">
const props = defineProps<{
  todo: {
    id: number
    text: string
    completed: boolean
  }
}>()

const emit = defineEmits(['toggle', 'remove'])

const toggleTodo = () => {
  emit('toggle', props.todo.id)
}

const removeTodo = () => {
  emit('remove', props.todo.id)
}
</script>

<template>
  <div class="todo-item" :class="{ completed: todo.completed }">
    <span @click="toggleTodo" class="todo-text">
      <transition name="fade">
        <i class="checkbox" :class="{ checked: todo.completed }"></i>
      </transition>
      {{ todo.text }}
    </span>
    <button @click="removeTodo" class="delete-btn">删除</button>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem;
  margin-bottom: 0.5rem;
  background-color: #f8f9f9;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.todo-item:hover {
  background-color: #eaf2f8;
}

.todo-item.completed span {
  text-decoration: line-through;
  color: #95a5a6;
}

.todo-text {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #85c1e9;
  border-radius: 50%;
  margin-right: 10px;
  vertical-align: middle;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.checkbox.checked {
  background-color: #85c1e9;
}

.checkbox.checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.delete-btn:hover {
  opacity: 1;
}
</style>
