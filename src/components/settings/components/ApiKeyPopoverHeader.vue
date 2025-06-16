<template>
  <div class="popover-header">
    <div class="header-content">
      <div class="header-icon">
        <KeyIcon />
      </div>
      <div class="header-text">
        <h3>{{ t('settingsApiKey') }}</h3>
        <p>安全配置您的 DeepSeek API 密钥</p>
      </div>
    </div>
    <button class="close-button" @click="$emit('close')">
      <CloseIcon />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KeyIcon from '../../common/icons/KeyIcon.vue'
import CloseIcon from '../../common/icons/CloseIcon.vue'

interface Emits {
  (e: 'close'): void
}

defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ApiKeyPopoverHeader',
})
</script>

<style scoped>
.popover-header {
  padding: 2rem 2rem 1rem 2rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(
    135deg,
    rgba(var(--button-bg-color-rgb), 0.05) 0%,
    rgba(var(--button-bg-color-rgb), 0.02) 100%
  );
  position: relative;
}

.popover-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 2rem;
  right: 2rem;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--border-color-rgb), 0.3) 50%,
    transparent 100%
  );
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--button-bg-color), var(--button-hover-bg-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(var(--button-bg-color-rgb), 0.3);
  flex-shrink: 0;
}

.header-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
}

.header-text p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary-color, rgba(var(--text-color-rgb), 0.6));
  line-height: 1.4;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: rgba(var(--text-color-rgb), 0.1);
  opacity: 1;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .popover-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }

  .header-content {
    gap: 0.75rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .header-text h3 {
    font-size: 1.2rem;
  }

  .header-text p {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .popover-header {
    padding: 1.25rem 1.25rem 0.75rem 1.25rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .header-text h3 {
    font-size: 1.1rem;
  }

  .header-text p {
    font-size: 0.8rem;
  }
}
</style>
