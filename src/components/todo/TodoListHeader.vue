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
        <div class="button-content">
          <!-- 根据当前主题显示不同的图标 -->
          <svg
            v-if="themeIcon === 'moon'"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            class="button-icon"
          >
            <path
              d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
            />
          </svg>
          <svg
            v-else-if="themeIcon === 'sun'"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            class="button-icon"
          >
            <path
              d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-4V3a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm0 18v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm10-10h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zM2 12h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2zm16.95-5.66l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm-14.9 14.9l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm14.9 0a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 1.414-1.414l1.414 1.414zm-14.9-14.9a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            class="button-icon"
          >
            <path
              d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 3v6h5v-2h-3V7h-2z"
            />
          </svg>
          <span class="button-text">{{ t('theme') }}</span>
        </div>
      </button>

      <!-- 统计图表按钮 -->
      <button
        class="icon-button charts-button"
        :class="{ active: showCharts }"
        :title="`${showCharts ? t('closeCharts') : t('openCharts')} (Ctrl+S)`"
        :aria-label="showCharts ? t('closeCharts') : t('openCharts')"
        @click="$emit('toggleCharts')"
      >
        <div class="button-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            class="button-icon"
          >
            <path d="M3 3v18h18v-2H5V3H3zm4 14h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-7h-2v7z" />
          </svg>
          <span class="button-text">{{ t('showCharts') }}</span>
        </div>
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
  padding: 0.6rem 1rem;
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.85;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
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

.button-content {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  position: relative;
  z-index: 1;
}

.button-icon {
  fill: currentColor;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.button-text {
  font-family: 'LXGW WenKai Screen', sans-serif;
  transition: color 0.3s ease;
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
    gap: 0.4rem;
  }

  .icon-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }

  .button-content {
    gap: 0.3rem;
  }

  .button-text {
    display: none;
  }

  .button-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 0.3rem;
  }

  .icon-button {
    padding: 0.4rem 0.6rem;
    min-width: 44px;
    justify-content: center;
  }
}
</style>
