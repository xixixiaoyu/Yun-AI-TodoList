<script setup lang="ts">
import { onErrorCaptured } from 'vue'
import TodoList from './components/TodoList.vue'

onErrorCaptured((err, instance, info) => {
  console.error('Captured error:', err, instance, info)
  // 这里可以添加错误处理逻辑，比如显示一个错误提示
  return false // 阻止错误继续传播
})
</script>

<template>
  <div class="app">
    <TodoList />
  </div>
</template>

<style>
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

.app {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
}
</style>
