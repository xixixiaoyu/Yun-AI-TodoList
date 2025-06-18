<template>
  <div class="filter-buttons">
    <button
      class="filter-btn"
      :class="{ active: filter === 'active' }"
      @click="setFilter('active')"
    >
      {{ t('active') }}
    </button>
    <button
      class="filter-btn"
      :class="{ active: filter === 'completed' }"
      @click="setFilter('completed')"
    >
      {{ t('completed') }}
    </button>
  </div>
</template>

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

<style scoped>
.filter-buttons {
  @apply font-sans flex justify-center mb-4 flex-wrap gap-2;
}

.filter-btn {
  @apply py-2 px-4 text-sm cursor-pointer transition-all-300;
  background-color: var(--filter-btn-bg);
  color: var(--filter-btn-text);
  border: 1px solid var(--filter-btn-border);
  border-radius: 20px;
}

.filter-btn.active,
.filter-btn:hover {
  background-color: var(--filter-btn-active-bg);
  color: var(--filter-btn-active-text);
  border-color: var(--filter-btn-active-border);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(121, 180, 166, 0.2);
}

@media (max-width: 768px) {
  .filter-buttons {
    @apply flex-col;
  }

  .filter-btn {
    @apply w-full;
  }
}
</style>
