<template>
  <transition name="fade">
    <div v-if="show" class="api-key-reminder">
      <div class="reminder-content">
        <div class="reminder-icon">🔑</div>
        <div class="reminder-text">
          <h3>{{ t('welcome') }}</h3>
          <p>{{ t('apiKeyReminder') }}</p>
        </div>
        <div class="reminder-actions">
          <button class="reminder-button" @click="$emit('goToSettings')">
            {{ t('goToSettings') }}
          </button>
          <button class="reminder-button secondary" @click="$emit('close', false)">
            {{ t('later') }}
          </button>
          <button class="reminder-button secondary" @click="$emit('close', true)">
            {{ t('dontShowAgain') }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close', dontShowAgain: boolean): void
  (e: 'goToSettings'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ApiKeyReminder'
})
</script>

<style scoped>
.api-key-reminder {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  padding: 1rem;
}

.reminder-content {
  background-color: var(--card-bg-color);
  border-radius: 16px;
  padding: 2rem;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  text-align: center;
}

.reminder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.reminder-text h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.reminder-text p {
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 1.5rem;
}

.reminder-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.reminder-button {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.reminder-button:not(.secondary) {
  background-color: var(--button-bg-color);
  color: white;
  border: none;
}

.reminder-button.secondary {
  background-color: transparent;
  border: 1px solid var(--button-bg-color);
  color: var(--text-color);
}

.reminder-button:hover {
  transform: translateY(-2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .reminder-content {
    margin: 1rem;
    padding: 1.5rem;
  }

  .reminder-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .reminder-button {
    width: 100%;
  }
}
</style>
