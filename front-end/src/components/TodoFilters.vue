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
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-buttons button {
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

.clear-btn {
  background-color: #e74c3c !important;
  color: white !important;
  border-color: #e74c3c !important;
}

.clear-btn:hover {
  background-color: #c0392b !important;
  border-color: #c0392b !important;
}

@media (max-width: 768px) {
  .filter-buttons {
    flex-direction: column;
  }

  .filter-buttons button {
    width: 100%;
  }
}
</style>
