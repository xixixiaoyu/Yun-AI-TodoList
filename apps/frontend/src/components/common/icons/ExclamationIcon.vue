<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="exclamation-icon"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ExclamationIcon',
})
</script>

<style scoped>
.exclamation-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}
</style>
