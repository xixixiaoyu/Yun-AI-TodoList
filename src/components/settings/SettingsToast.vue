<template>
  <transition name="toast">
    <div v-if="show" class="toast-message">
      <span class="toast-icon">✓</span>
      {{ message || t('settingsSaved') }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
  message?: string
}

defineProps<Props>()

const { t } = useI18n()

defineOptions({
  name: 'SettingsToast',
})
</script>

<style scoped>
.toast-message {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.875rem 1.5rem;
  background-color: var(--button-bg-color);
  color: white;
  border-radius: 12px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  white-space: nowrap;
}

.toast-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 1rem);
}

@media (max-width: 480px) {
  .toast-message {
    width: calc(100% - 2rem);
    white-space: normal;
    text-align: center;
    justify-content: center;
  }
}
</style>
