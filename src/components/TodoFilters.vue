<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  filter: string
}>()

const emit = defineEmits(['update:filter'])

const { t } = useI18n()

const setFilter = (newFilter: string) => {
  emit('update:filter', newFilter)
}
</script>

<template>
  <div class="filter-buttons">
    <button :class="{ active: filter === 'active' }" @click="setFilter('active')">
      {{ t('active') }}
    </button>
    <button :class="{ active: filter === 'completed' }" @click="setFilter('completed')">
      {{ t('completed') }}
    </button>
  </div>
</template>

<style scoped>
.filter-buttons {
  font-family: 'LXGW WenKai Screen', sans-serif;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-buttons button {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: var(--filter-btn-bg);
  color: var(--filter-btn-text);
  border: 1px solid var(--filter-btn-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-buttons button.active,
.filter-buttons button:hover {
  background-color: var(--filter-btn-active-bg);
  color: var(--filter-btn-active-text);
  border-color: var(--filter-btn-active-border);
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
