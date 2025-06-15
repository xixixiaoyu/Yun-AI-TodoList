<template>
  <div class="nav-bar">
    <button class="nav-button" @click="router.push('/')">
      {{ t('home') }}
    </button>
    <button class="nav-button" @click="router.push('/ai-assistant')">
      {{ t('aiAssistant') }}
    </button>
    <button class="nav-button" @click="router.push('/settings')">
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

const toggleLanguage = () => {
  const newLocale = locale.value === 'zh' ? 'en' : 'zh'
  setLanguage(newLocale)
}

defineOptions({
  name: 'NavigationBar'
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
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  padding: 5px 10px;
  white-space: nowrap;
}

.nav-button:hover {
  background-color: var(--language-toggle-hover-bg);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: var(--card-bg-color);
    padding: 0.5rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    justify-content: space-around;
    gap: 0.25rem;
  }

  .nav-button {
    flex: 1;
    font-size: 12px;
    padding: 8px 4px;
    text-align: center;
    min-width: 60px;
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
    padding: 6px 2px;
    min-width: 50px;
  }
}
</style>
