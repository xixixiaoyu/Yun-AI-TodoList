<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="loading-icon"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
</template>

<script setup lang="ts">
defineOptions({
  name: 'LoadingIcon',
})
</script>

<style scoped>
.loading-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
