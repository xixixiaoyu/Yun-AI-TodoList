<template>
  <div class="header">
    <h1 style="margin-right: 10px">
      {{ t('appTitle') }}
    </h1>
    <div class="header-actions">
      <button
        class="icon-button ai-assistant-button"
        :title="t('aiAssistant')"
        :aria-label="t('aiAssistant')"
        @click="$emit('openAiSidebar')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="button-icon"
        >
          <!-- AI 神经网络风格图标 -->
          <!-- 中心节点 -->
          <circle cx="12" cy="12" r="2" fill="currentColor" />

          <!-- 外围节点 -->
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          <circle cx="18" cy="6" r="1.5" fill="currentColor" />
          <circle cx="6" cy="18" r="1.5" fill="currentColor" />
          <circle cx="18" cy="18" r="1.5" fill="currentColor" />

          <!-- 连接线 -->
          <path d="M7.5 7.5L10 10" stroke="currentColor" opacity="0.6" />
          <path d="M16.5 7.5L14 10" stroke="currentColor" opacity="0.6" />
          <path d="M7.5 16.5L10 14" stroke="currentColor" opacity="0.6" />
          <path d="M16.5 16.5L14 14" stroke="currentColor" opacity="0.6" />

          <!-- 脉冲效果线条 -->
          <path d="M12 8V6" stroke="currentColor" opacity="0.4" />
          <path d="M12 18V16" stroke="currentColor" opacity="0.4" />
          <path d="M8 12H6" stroke="currentColor" opacity="0.4" />
          <path d="M18 12H16" stroke="currentColor" opacity="0.4" />
        </svg>
      </button>

      <button
        class="icon-button search-button"
        :class="{ active: showSearch }"
        :title="`${showSearch ? t('closeSearch') : t('openSearch')}`"
        :aria-label="showSearch ? t('closeSearch') : t('openSearch')"
        @click="$emit('toggleSearch')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="button-icon"
        >
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" />
          <path d="m21 21-6-6" />
        </svg>
      </button>

      <button
        class="icon-button charts-button"
        :class="{ active: showCharts }"
        :title="`${showCharts ? t('closeCharts') : t('openCharts')} (Ctrl+S)`"
        :aria-label="showCharts ? t('closeCharts') : t('openCharts')"
        @click="$emit('toggleCharts')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="button-icon"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  showCharts: boolean
  showSearch: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'toggleCharts'): void
  (e: 'toggleSearch'): void
  (e: 'openAiSidebar'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'TodoListHeader',
})
</script>

<style scoped>
.header {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

h1 {
  color: #ff7e67;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(255, 126, 103, 0.2);
  background: linear-gradient(135deg, #ff7e67 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  white-space: nowrap;
  flex-wrap: wrap;
}

.icon-button {
  background: linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 126, 103, 0.1);
  border-radius: 12px;
  cursor: pointer;
  padding: 0.75rem;
  color: var(--text-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.85;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.icon-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 126, 103, 0.1), transparent);
  transition: left 0.5s ease;
  z-index: 0;
}

.icon-button:hover::before {
  left: 100%;
}

.button-icon {
  fill: currentColor;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.icon-button:hover {
  color: #ff7e67;
  opacity: 1;
  transform: translateY(-1px);
  border-color: rgba(255, 126, 103, 0.3);
  box-shadow:
    0 4px 16px rgba(255, 126, 103, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.icon-button:hover .button-icon {
  transform: scale(1.1);
}

.icon-button.active {
  color: #ffffff;
  opacity: 1;
  background: linear-gradient(135deg, #ff7e67 0%, #ff6b6b 100%);
  border-color: rgba(255, 126, 103, 0.5);
  box-shadow:
    0 2px 12px rgba(255, 126, 103, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.icon-button.active .button-icon {
  transform: scale(1.05);
}

.icon-button:active {
  transform: translateY(0);
  box-shadow:
    0 1px 4px rgba(255, 126, 103, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.icon-button.loading {
  pointer-events: none;
}

.icon-button.loading .button-icon {
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

.theme-toggle {
  position: relative;
}

.icon-button {
  position: relative;
}

.icon-button:hover {
  position: relative;
}

.icon-button::after {
  content: attr(title);
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(-5px);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 400;
  white-space: nowrap;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.15s ease,
    visibility 0.15s ease,
    transform 0.15s ease;
}

.icon-button:hover::after {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
  transition:
    opacity 0.15s ease,
    visibility 0.15s ease,
    transform 0.15s ease;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    justify-content: center;
    margin-left: 0;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 0.2rem;
  }

  .icon-button {
    padding: 0.3rem;
    min-width: 28px;
    min-height: 28px;
    border-radius: 8px;
  }

  .button-icon {
    width: 14px;
    height: 14px;
  }
}

/* 超小屏幕进一步优化 */
@media (max-width: 375px) {
  .header-actions {
    gap: 0.15rem;
  }

  .icon-button {
    padding: 0.25rem;
    min-width: 24px;
    min-height: 24px;
    border-radius: 6px;
  }

  .button-icon {
    width: 12px;
    height: 12px;
  }
}
</style>
