<template>
  <div class="header">
    <!-- 应用标题 -->
    <h1 style="margin-right: 10px">
      {{ t('appTitle') }}
    </h1>
    <div class="header-actions">
      <!-- 主题切换按钮 -->
      <button
        class="icon-button theme-toggle"
        :class="{ active: themeIcon !== 'auto' }"
        :title="`${themeTooltip} (Ctrl+T)`"
        :aria-label="themeTooltip"
        @click="$emit('toggleTheme')"
      >
        <!-- 根据当前主题显示不同的图标 -->
        <svg
          v-if="themeIcon === 'moon'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="currentColor"
          class="button-icon"
        >
          <path
            d="M17.75 4.09L15.5 6.34l1.42 1.42L19.34 5.34A8.95 8.95 0 0 0 17.75 4.09zM4.66 5.34l2.42 2.42 1.42-1.42L6.08 4.09A8.95 8.95 0 0 0 4.66 5.34zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"
          />
        </svg>
        <svg
          v-else-if="themeIcon === 'sun'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="currentColor"
          class="button-icon"
        >
          <path
            d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="currentColor"
          class="button-icon"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.48.41-2.86 1.12-4.06l10.94 10.94C14.86 19.59 13.48 20 12 20zm6.88-3.94L8.94 6.12C10.14 4.41 11.52 4 12 4c4.41 0 8 3.59 8 8 0 1.48-.41 2.86-1.12 4.06z"
          />
        </svg>
      </button>

      <!-- 统计图表按钮 -->
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
          fill="currentColor"
          class="button-icon"
        >
          <path
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  themeIcon: string
  themeTooltip: string
  showCharts: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'toggleTheme'): void
  (e: 'toggleCharts'): void
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
  background: linear-gradient(
    135deg,
    var(--card-bg-color) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
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
  color: #ff7e67;
  opacity: 1;
  background: linear-gradient(
    135deg,
    rgba(255, 126, 103, 0.1) 0%,
    rgba(255, 107, 107, 0.05) 100%
  );
  border-color: rgba(255, 126, 103, 0.3);
  box-shadow:
    0 2px 12px rgba(255, 126, 103, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
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

/* 主题切换按钮特殊样式 */
.theme-toggle {
  position: relative;
}

/* 工具提示样式 */
.icon-button {
  position: relative;
}

.icon-button:hover {
  position: relative;
}

.icon-button:hover::after {
  content: attr(title);
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 400;
  white-space: nowrap;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: tooltipFadeIn 0.3s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式设计 */
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
    gap: 0.4rem;
  }

  .icon-button {
    padding: 0.6rem;
    min-width: 40px;
    min-height: 40px;
  }

  .button-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
