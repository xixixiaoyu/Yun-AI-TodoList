<template>
  <div class="input-info">
    <div class="info-item">
      <CheckIcon />
      <span>密钥将安全存储在本地浏览器中</span>
    </div>
    <div class="info-item">
      <LockIcon />
      <span>不会上传到任何服务器</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import CheckIcon from '../../common/icons/CheckIcon.vue'
import LockIcon from '../../common/icons/LockIcon.vue'

defineOptions({
  name: 'ApiKeySecurityInfo',
})
</script>

<style scoped>
.input-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    rgba(var(--button-bg-color-rgb), 0.03) 0%,
    rgba(var(--button-bg-color-rgb), 0.01) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(var(--border-color-rgb), 0.2);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.7));
}

.info-item :deep(svg) {
  color: var(--button-bg-color);
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .input-info {
    padding: 0.875rem;
  }

  .info-item {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .input-info {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .info-item {
    font-size: 0.8rem;
    gap: 0.5rem;
  }
}
</style>
