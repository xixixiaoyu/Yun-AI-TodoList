<template>
  <div class="nav-bar">
    <button
      class="nav-button"
      :class="{ 'nav-button-active': $route.path === '/' }"
      @click="router.push('/')"
    >
      {{ t('home') }}
    </button>

    <button
      class="nav-button"
      :class="{ 'nav-button-active': $route.path === '/settings' }"
      @click="router.push('/settings')"
    >
      {{ t('settings') }}
    </button>
    <button class="nav-button" @click="toggleLanguage">
      {{ locale === 'zh' ? 'EN' : '中文' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLanguage } from '../../i18n'
import router from '../../router'

const { locale, t } = useI18n()

// 移除了 AI 助手相关的事件定义，因为已移动到待办事项卡片内

const toggleLanguage = () => {
  const newLocale = locale.value === 'zh' ? 'en' : 'zh'
  setLanguage(newLocale)
}

defineOptions({
  name: 'NavigationBar',
})
</script>

<style scoped>
.nav-bar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
}

.nav-button {
  background-color: var(--language-toggle-bg);
  color: var(--language-toggle-color);
  border: 1px solid var(--language-toggle-color);
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  padding: 10px 16px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.nav-button:hover {
  background-color: var(--language-toggle-hover-bg);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  border-color: var(--primary-color);
}

.nav-button-active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(121, 180, 166, 0.3);
}

.nav-button-active:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(121, 180, 166, 0.4);
}

@media (max-width: 768px) {
  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    background-color: var(--card-bg-color);
    padding: 0.5rem;
    margin: 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    justify-content: space-around;
    gap: 0.25rem;
    backdrop-filter: blur(10px);
    box-sizing: border-box;
    z-index: 1000;
  }

  .nav-button {
    flex: 1;
    font-size: 13px;
    padding: 12px 8px;
    text-align: center;
    min-width: 70px;
    border-radius: 8px;
    font-weight: 600;
  }

  .nav-button:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 360px) {
  .nav-bar {
    gap: 0.15rem;
  }

  .nav-button {
    font-size: 11px;
    padding: 8px 4px;
    min-width: 50px;
  }
}
</style>
