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
        :title="themeTooltip"
        :aria-label="themeTooltip"
        @click="$emit('toggleTheme')"
      >
        <!-- 根据当前主题显示不同的图标 -->
        <svg
          v-if="themeIcon === 'moon'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
        >
          <path
            d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
          />
        </svg>
        <svg
          v-else-if="themeIcon === 'sun'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
        >
          <path
            d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-4V3a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm0 18v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm10-10h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zM2 12h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2zm16.95-5.66l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm-14.9 14.9l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm14.9 0a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 1.414-1.414l1.414 1.414zm-14.9-14.9a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
        >
          <path
            d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 3v6h5v-2h-3V7h-2z"
          />
        </svg>
        {{ t('theme') }}
      </button>
      <!-- 历史记录按钮 -->
      <button
        class="icon-button"
        :class="{ active: showHistory }"
        @click="$emit('toggleHistory')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
          />
        </svg>
        <span>{{ t('history') }}</span>
      </button>

      <button class="icon-button" @click="$emit('toggleCharts')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
        >
          <path d="M3 3v18h18v-2H5V3H3zm4 14h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-7h-2v7z" />
        </svg>
        <span>{{ t('showCharts') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  themeIcon: string
  themeTooltip: string
  showHistory: boolean
}

interface Emits {
  (e: 'toggleTheme'): void
  (e: 'toggleHistory'): void
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
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  white-space: nowrap;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
  font-weight: bold;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.icon-button svg {
  fill: currentColor;
}

.icon-button:hover,
.icon-button.active {
  color: #ff7e67;
  opacity: 1;
}
</style>
