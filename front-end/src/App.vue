<script setup lang="ts">
import TodoList from './components/TodoList.vue'
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
