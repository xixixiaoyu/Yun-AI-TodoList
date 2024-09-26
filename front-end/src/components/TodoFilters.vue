<script setup lang="ts">
defineProps<{
  filter: string
}>()

const emit = defineEmits(['update:filter'])

const setFilter = (newFilter: string) => {
  emit('update:filter', newFilter)
}
</script>

<template>
  <div class="filter-buttons">
    <button @click="setFilter('active')" :class="{ active: filter === 'active' }">待完成</button>
    <button @click="setFilter('completed')" :class="{ active: filter === 'completed' }">
      已完成
    </button>
  </div>
</template>

<style scoped>
.filter-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.filter-buttons button {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: #f8f9f9;
  border: 1px solid #d5d8dc;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-buttons button.active,
.filter-buttons button:hover {
  background-color: #85c1e9;
  color: white;
  border-color: #85c1e9;
}
</style>
