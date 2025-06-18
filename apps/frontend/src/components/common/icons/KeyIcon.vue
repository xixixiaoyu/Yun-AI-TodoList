<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- 钥匙头部（圆形） -->
    <circle cx="7" cy="11" r="3" />
    <!-- 钥匙柄 -->
    <path d="M10 11h10" />
    <!-- 钥匙齿 -->
    <path d="M18 9v4" />
    <path d="M20 9v2" />
  </svg>
</template>

<script setup lang="ts">
defineOptions({
  name: 'KeyIcon',
})
</script>
