<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="filter-icon"
  >
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
  </svg>
</template>

<script setup lang="ts">
defineOptions({
  name: 'FilterIcon',
})
</script>

<style scoped>
.filter-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}
</style>
