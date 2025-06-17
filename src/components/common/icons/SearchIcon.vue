<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="search-icon"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SearchIcon',
})
</script>

<style scoped>
.search-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}
</style>
