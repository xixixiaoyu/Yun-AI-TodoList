<script setup lang="ts">
import { onErrorCaptured, computed, onMounted, provide, ref } from 'vue'
import { useTheme } from './composables/useTheme'
import { useI18n } from 'vue-i18n'
import { setLanguage } from './i18n'
// import AudioPlayer from './components/AudioPlayer.vue'

import { useWindowSize } from '@vueuse/core'
import router from './router'
import {
  getApiKey,
  shouldShowApiKeyReminder,
  hideApiKeyReminder,
} from './services/configService'

const { theme, systemTheme, initTheme } = useTheme()
const { locale, t } = useI18n()

// 添加提示框的状态
const showApiKeyReminder = ref(false)

onErrorCaptured((err, instance, info) => {
  console.error('Captured error:', err, instance, info)
  return false
})

const currentTheme = computed(() => {
  return theme.value === 'auto' ? systemTheme.value : theme.value
})

const toggleLanguage = () => {
  const newLocale = locale.value === 'zh' ? 'en' : 'zh'
  setLanguage(newLocale)
}

const goToSettings = () => {
  router.push('/settings')
  showApiKeyReminder.value = false
}

provide('theme', theme)

const { width } = useWindowSize()
const isSmallScreen = computed(() => width.value < 768)

const closeReminder = (dontShowAgain = false) => {
  if (dontShowAgain) {
    hideApiKeyReminder()
  }
  showApiKeyReminder.value = false
}

onMounted(() => {
  try {
    initTheme()
    // 检查是否配置了 API Key 且是否应该显示提醒
    if (!getApiKey() && shouldShowApiKeyReminder()) {
      showApiKeyReminder.value = true
    }
  } catch (error) {
    console.error('Error initializing app:', error)
  }
})
</script>

<template>
  <div class="app" :class="currentTheme">
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
    <div class="content-wrapper">
      <div class="router-view-container">
        <router-view />
      </div>
      <div class="top-components" :class="{ 'small-screen': isSmallScreen }">
        <!-- <AudioPlayer /> -->
      </div>
    </div>

    <!-- API Key 提示框 -->
    <transition name="fade">
      <div v-if="showApiKeyReminder" class="api-key-reminder">
        <div class="reminder-content">
          <div class="reminder-icon">🔑</div>
          <div class="reminder-text">
            <h3>{{ t('welcome') }}</h3>
            <p>{{ t('apiKeyReminder') }}</p>
          </div>
          <div class="reminder-actions">
            <button class="reminder-button" @click="goToSettings">
              {{ t('goToSettings') }}
            </button>
            <button class="reminder-button secondary" @click="closeReminder(false)">
              {{ t('later') }}
            </button>
            <button class="reminder-button secondary" @click="closeReminder(true)">
              {{ t('dontShowAgain') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style>
:root {
  --bg-color: #f8f9fa;
  --text-color: #3c4858;
  --card-bg-color: #ffffff;
  --card-shadow: 0 4px 16px rgba(140, 152, 164, 0.08);
  --input-bg-color: #ffffff;
  --input-border-color: #e9ecef;
  --button-bg-color: #79b4a6;
  --button-hover-bg-color: #68a295;
  --font-smoothing: antialiased;
  --font-weight: 400;
  --todo-text-color: #3c4858;
  --completed-todo-text-color: #8898aa;
  --filter-btn-bg: #ffffff;
  --filter-btn-text: #3c4858;
  --filter-btn-border: #e9ecef;
  --filter-btn-active-bg: #79b4a6;
  --filter-btn-active-text: #ffffff;
  --filter-btn-active-border: #79b4a6;
  --language-toggle-bg: rgba(121, 180, 166, 0.08);
  --language-toggle-color: #3c4858;
  --language-toggle-hover-bg: rgba(121, 180, 166, 0.16);
}

[data-theme='dark'] {
  --bg-color: #1a1f25;
  --text-color: #e2e8f0;
  --card-bg-color: #252b32;
  --card-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  --input-bg-color: #2f353d;
  --input-border-color: #404650;
  --button-bg-color: #79b4a6;
  --button-hover-bg-color: #68a295;
  --font-smoothing: subpixel-antialiased;
  --font-weight: 300;
  --todo-text-color: #e2e8f0;
  --completed-todo-text-color: #a0aec0;
  --filter-btn-bg: #2f353d;
  --filter-btn-text: #e2e8f0;
  --filter-btn-border: #404650;
  --filter-btn-active-bg: #79b4a6;
  --filter-btn-active-text: #1a1f25;
  --filter-btn-active-border: #79b4a6;
  --language-toggle-bg: rgba(121, 180, 166, 0.12);
  --language-toggle-color: #e2e8f0;
  --language-toggle-hover-bg: rgba(121, 180, 166, 0.24);
}

body {
  background: var(--bg-color);
  color: var(--text-color);
  font-family:
    'LXGW WenKai Screen',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen-Sans,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: var(--font-smoothing);
  -moz-osx-font-smoothing: var(--font-smoothing);
  font-weight: var(--font-weight);
}

.app {
  color: var(--text-color);
}

/* 移除全局过渡效果 */
* {
  transition: none;
}

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

/* 添加响应式样式 */
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

/* 替换 @media (forced-colors: active) 部分 */
@media (forced-colors: active) {
  :root {
    forced-color-adjust: none;
  }
}

.language-toggle,
button,
input[type='range'] {
  forced-color-adjust: none;
}

.language-toggle {
  background-color: ButtonFace;
  color: ButtonText;
  border: 1px solid ButtonText;
}

.language-toggle:hover {
  background-color: Highlight;
  color: HighlightText;
}

/* 添加到现有的 <style> 标签中 */
@media (forced-colors: active) {
  :root {
    forced-color-adjust: none;
  }
}

.audio-player {
  position: relative;
  z-index: 1000;
  width: 100%;
  max-width: 600px;
  margin: 4rem auto;
}

@media (min-width: 1201px) {
  .audio-player {
    position: fixed;
    top: calc(1rem + 150px); /* 假设每日激励卡片高度约为150px */
    left: 1rem;
    width: 300px;
  }
}

@media (max-width: 1200px) {
  .audio-player {
    width: 100%;
    max-width: 600px;
    margin: 1rem auto;
  }
}

@media (max-width: 768px) {
  .audio-player {
    width: calc(100% - 2rem);
    max-width: 100%;
    margin: 1rem auto;
  }
}

.content-wrapper {
  padding: 1rem;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .content-wrapper {
    padding-top: 4rem;
    padding-bottom: 1rem;
    height: 100vh;
  }
}

.top-components {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.top-components.small-screen {
  flex-direction: column;
  order: 1;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }

  .top-components {
    margin-top: 0;
    margin-bottom: 0;
  }
}

.top-components {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 1201px) {
  .top-components {
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: 300px;
  }
}

@media (max-width: 1200px) {
  .top-components {
    width: 100%;
    max-width: 600px;
    margin: 1rem auto;
  }
}

/* 添加以下样式 */
@media (min-width: 1201px) {
  html,
  body {
    overflow: hidden;
  }

  .app {
    height: 100vh;
    overflow: hidden;
  }
}

/* 添加新的提示框样式 */
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

/* 确保路由视图内容可以自适应剩余空间 */
.router-view-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .router-view-container {
    padding-bottom: 1rem;
  }
}
</style>
