<template>
  <div class="api-key-card" @click="$emit('showPopover')">
    <div class="card-content">
      <div class="status-section">
        <div class="status-indicator">
          <div
            class="status-icon"
            :class="{ configured: localApiKey, 'not-configured': !localApiKey }"
          />
          <div class="status-text">
            <span class="status-label">{{
              localApiKey ? t('apiKeyConfigured') : t('apiKeyNotConfigured')
            }}</span>
            <span class="status-detail">{{
              localApiKey ? '密钥已安全保存' : '点击配置 API 密钥'
            }}</span>
          </div>
        </div>
      </div>
      <div class="action-section">
        <button class="configure-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
            />
          </svg>
          {{ localApiKey ? t('reconfigure') : t('configure') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  localApiKey: string
}

interface Emits {
  (e: 'showPopover'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ApiKeyCard',
})
</script>

<style scoped>
.api-key-card {
  background-color: var(--card-bg-color);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  overflow: hidden;
}

.api-key-card:hover {
  transform: translateY(-4px);
  border-color: var(--button-bg-color);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.status-section {
  flex: 1;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.status-detail {
  font-size: 0.9rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
}

.action-section {
  flex-shrink: 0;
}

.status-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.status-icon.configured {
  background: linear-gradient(135deg, #4caf50, #45a049);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.status-icon.configured::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, transparent 70%);
  animation: pulse 2s infinite;
}

.status-icon.not-configured {
  background: linear-gradient(135deg, #f44336, #e53935);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.status-icon.not-configured::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(244, 67, 54, 0.2) 0%, transparent 70%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.configure-button {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    var(--button-bg-color),
    var(--button-hover-bg-color)
  );
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 3px 8px rgba(var(--button-bg-color-rgb), 0.3);
  position: relative;
  overflow: hidden;
}

.configure-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.configure-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--button-bg-color-rgb), 0.4);
}

.configure-button:hover::before {
  left: 100%;
}

.configure-button:active {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .card-content {
    padding: 1.5rem;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .status-indicator {
    justify-content: center;
  }

  .action-section {
    width: 100%;
  }

  .configure-button {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .card-content {
    padding: 1.25rem;
    gap: 1.25rem;
  }

  .status-label {
    font-size: 1rem;
  }

  .status-detail {
    font-size: 0.85rem;
  }

  .configure-button {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
