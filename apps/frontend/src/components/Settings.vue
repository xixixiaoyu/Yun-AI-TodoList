<template>
  <div class="settings-container">
    <div class="settings-wrapper">
      <!-- 页面标题区域 -->
      <div class="settings-header">
        <div class="settings-header-icon">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            ></path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </div>
        <div class="settings-header-content">
          <h1 class="settings-title">
            {{ t('settings') }}
          </h1>
          <p class="settings-subtitle">
            {{ t('settingsDescription') }}
          </p>
        </div>
        <div class="settings-header-decoration"></div>
      </div>

      <!-- 设置卡片网格 -->
      <div class="settings-grid">
        <!-- 第一行：核心配置 -->
        <div class="settings-card settings-card-primary" data-category="core">
          <ApiKeySection
            v-model:local-api-key="localApiKey"
            v-model:local-base-url="localBaseUrl"
            v-model:local-model="localModel"
            v-model:local-provider="localProvider"
            v-model:show-api-key="showApiKey"
            v-model:show-api-key-popover="showApiKeyPopover"
            @show-success-toast="showSuccessToast"
          />
        </div>

        <div class="settings-card settings-card-accent" data-category="core">
          <ThemeSection />
        </div>

        <!-- 第二行：语言和 AI 分析 -->
        <div class="settings-card settings-card-language" data-category="featured">
          <LanguageSection />
        </div>

        <div class="settings-card settings-card-ai" data-category="featured">
          <AIAnalysisSection />
        </div>

        <!-- 第三行：存储设置 -->
        <div
          class="settings-card settings-card-storage settings-card-full"
          data-category="featured"
        >
          <StorageSection />
        </div>

        <!-- 第四行：系统提示词 -->
        <div
          class="settings-card settings-card-prompts settings-card-full"
          data-category="advanced"
        >
          <SystemPromptsSection />
        </div>
      </div>
    </div>

    <!-- 浮动元素 -->
    <SettingsToast :show="showSuccessMessage" />

    <!-- 背景装饰 -->
    <div class="settings-bg-decoration">
      <div class="decoration-circle decoration-circle-1"></div>
      <div class="decoration-circle decoration-circle-2"></div>
      <div class="decoration-circle decoration-circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { useSettingsState } from '../composables/useSettingsState'
import { useStorageMode } from '../composables/useStorageMode'
import AIAnalysisSection from './settings/AIAnalysisSection.vue'
import ApiKeySection from './settings/ApiKeySection.vue'

import LanguageSection from './settings/LanguageSection.vue'
import SettingsToast from './settings/SettingsToast.vue'
import StorageSection from './settings/StorageSection.vue'
import SystemPromptsSection from './settings/SystemPromptsSection.vue'
import ThemeSection from './settings/ThemeSection.vue'

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { initializeStorageMode } = useStorageMode()

const {
  showApiKey,
  showApiKeyPopover,
  localApiKey,
  localBaseUrl,
  localModel,
  localProvider,
  showSuccessMessage,
  showSuccessToast,
} = useSettingsState()

// Initialize storage mode on component mount
onMounted(async () => {
  if (isAuthenticated.value) await initializeStorageMode()
})

defineOptions({
  name: 'AppSettings',
})
</script>

<style scoped>
/* 主容器样式 */
.settings-container {
  min-height: 100vh;
  background: var(--bg-color);
  position: relative;
  overflow: hidden;
  padding: 2rem 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.settings-wrapper {
  width: 100%;
  max-width: 1200px;
  position: relative;
  z-index: 10;
}

/* 页面标题区域 */
.settings-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
  position: relative;
  padding: 2rem;
  background: linear-gradient(
    135deg,
    var(--settings-primary-soft) 0%,
    var(--settings-primary-ultra-light) 100%
  );
  border-radius: 24px;
  border: 1px solid var(--settings-card-border);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  /* Edge 浏览器回退 */
  @supports not (backdrop-filter: blur(20px)) {
    background: rgba(255, 255, 255, 0.9);
  }
  overflow: hidden;
}

.settings-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--settings-primary) 50%, transparent 100%);
}

.settings-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    var(--settings-primary) 0%,
    var(--settings-primary-dark) 100%
  );
  box-shadow: 0 8px 32px var(--settings-primary-medium);
  position: relative;
  overflow: hidden;
}

.settings-header-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 70%
  );
  transform: rotate(-45deg);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translate3d(-100%, -100%, 0) rotate(-45deg);
  }
  100% {
    transform: translate3d(100%, 100%, 0) rotate(-45deg);
  }
}

.settings-header-content {
  flex: 1;
}

.settings-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(
    135deg,
    var(--text-color) 0%,
    var(--settings-primary) 50%,
    var(--text-color) 100%
  );
  -webkit-background-clip: text;
  -moz-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  /* Edge 浏览器回退 */
  @supports not (background-clip: text) {
    color: #2d3748;
  }
  margin: 0;
  line-height: 1.2;
}

.settings-subtitle {
  color: var(--text-secondary-color);
  font-size: 1.1rem;
  margin: 0.5rem 0 0 0;
  font-weight: 400;
}

.settings-header-decoration {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--settings-primary-soft) 0%,
    var(--settings-primary-ultra-light) 100%
  );
  position: relative;
  overflow: hidden;
}

.settings-header-decoration::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--settings-primary-medium) 0%,
    var(--settings-primary-soft) 100%
  );
  transform: translate(-50%, -50%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: translate3d(-50%, -50%, 0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate3d(-50%, -50%, 0) scale(1.05);
    opacity: 0.9;
  }
}

/* 设置网格 */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  width: 100%;
}

/* 系统提示词卡片占满整行 */
.settings-card-full {
  grid-column: 1 / -1;
}

/* 设置卡片基础样式 */
.settings-card {
  background: var(--settings-card-bg);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  /* Edge 浏览器回退 */
  @supports not (backdrop-filter: blur(20px)) {
    background: var(--settings-card-hover-bg);
  }
  border: 1px solid var(--settings-card-border);
  border-radius: 24px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--settings-card-shadow);
  min-height: 240px;
}

/* 大卡片样式 */
.settings-card-large {
  min-height: 320px;
}

/* 第二行：语言、AI分析、存储并列展示 */
.settings-card:nth-child(4) {
  grid-column: span 1;
}

.settings-card:nth-child(5) {
  grid-column: span 1;
}

.settings-card:nth-child(6) {
  grid-column: span 1;
}

/* 第三行：系统提示词独占一行 */
.settings-card:nth-child(7) {
  grid-column: 1 / -1;
}

.settings-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.settings-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.settings-card:hover {
  background: var(--settings-card-hover-bg);
  box-shadow: var(--settings-card-hover-shadow);
  border-color: var(--settings-card-hover-border);
}

.settings-card:hover::before,
.settings-card:hover::after {
  opacity: 1;
}

/* 不同类型卡片的特殊样式 - 基于主色调的和谐变体 */
.settings-card-primary {
  background: linear-gradient(
    135deg,
    var(--settings-card-primary-accent) 0%,
    var(--settings-card-bg) 100%
  );
  border-color: var(--settings-primary-medium);
}

.settings-card-primary:hover {
  background: linear-gradient(
    135deg,
    var(--settings-primary-soft) 0%,
    var(--settings-card-hover-bg) 100%
  );
}

.settings-card-secondary {
  background: linear-gradient(
    135deg,
    var(--settings-card-secondary-accent) 0%,
    var(--settings-card-bg) 100%
  );
  border-color: var(--settings-primary-soft);
}

.settings-card-secondary:hover {
  background: linear-gradient(
    135deg,
    var(--settings-primary-medium) 0%,
    var(--settings-card-hover-bg) 100%
  );
}

.settings-card-accent {
  background: linear-gradient(
    135deg,
    var(--settings-card-tertiary-accent) 0%,
    var(--settings-card-bg) 100%
  );
  border-color: var(--settings-primary-ultra-light);
}

.settings-card-accent:hover {
  background: linear-gradient(
    135deg,
    var(--settings-primary-soft) 0%,
    var(--settings-card-hover-bg) 100%
  );
}

.settings-card-language {
  background: linear-gradient(
    135deg,
    var(--settings-card-secondary-accent) 0%,
    var(--settings-card-bg) 100%
  );
  border-color: var(--settings-primary-soft);
}

.settings-card-language:hover {
  background: linear-gradient(
    135deg,
    var(--settings-primary-medium) 0%,
    var(--settings-card-hover-bg) 100%
  );
}

.settings-card-storage {
  background: linear-gradient(
    135deg,
    var(--settings-card-primary-accent) 0%,
    var(--settings-card-bg) 100%
  );
  border-color: var(--settings-primary-medium);
}

.settings-card-storage:hover {
  background: linear-gradient(
    135deg,
    var(--settings-primary-soft) 0%,
    var(--settings-card-hover-bg) 100%
  );
}

.settings-card-ai {
  background: linear-gradient(
    135deg,
    var(--settings-card-secondary-accent) 0%,
    var(--settings-card-bg) 100%
  );
  border-color: var(--settings-primary-soft);
}

.settings-card-ai:hover {
  background: linear-gradient(
    135deg,
    var(--settings-primary-medium) 0%,
    var(--settings-card-hover-bg) 100%
  );
}

.settings-card-prompts {
  background: linear-gradient(
    135deg,
    var(--settings-card-primary-accent) 0%,
    var(--settings-card-bg) 100%
  );
  border-color: var(--settings-primary-medium);
}

.settings-card-prompts:hover {
  background: linear-gradient(
    135deg,
    var(--settings-primary-soft) 0%,
    var(--settings-card-hover-bg) 100%
  );
}

.settings-card-full {
  grid-column: 1 / -1;
}

/* 背景装饰 */
.settings-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--settings-primary-ultra-light) 0%, transparent 100%);
  animation: float 6s ease-in-out infinite;
}

.decoration-circle-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  right: -150px;
  animation-delay: 0s;
}

.decoration-circle-2 {
  width: 200px;
  height: 200px;
  bottom: 20%;
  left: -100px;
  animation-delay: 2s;
}

.decoration-circle-3 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  33% {
    transform: translate3d(0, -10px, 0) rotate(60deg);
  }
  66% {
    transform: translate3d(0, 5px, 0) rotate(120deg);
  }
}

/* 响应式设计 */
@media (min-width: 768px) and (max-width: 1023px) {
  .settings-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .settings-card {
    min-height: 240px;
    padding: 2rem;
  }

  .settings-card-full {
    grid-column: 1 / -1;
  }

  .settings-container {
    padding: 2.5rem 1.5rem;
  }

  .settings-title {
    font-size: 2.25rem;
  }
}

@media (min-width: 1024px) {
  .settings-grid {
    gap: 2.5rem;
  }

  .settings-card {
    padding: 2.5rem;
    min-height: 280px;
  }
}

@media (max-width: 767px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .settings-card {
    min-height: 200px;
    padding: 1.5rem;
  }

  .settings-container {
    padding: 1.5rem 1rem;
  }

  .settings-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
  }

  .settings-header-decoration {
    display: none;
  }

  .settings-title {
    font-size: 2rem;
  }

  .settings-header-icon {
    width: 3rem;
    height: 3rem;
  }
}

/* 深色主题适配已通过 CSS 变量系统自动处理 */

/* 动画性能优化 */
.settings-card {
  will-change: transform;
  transform: translateZ(0); /* 启用硬件加速 */
}

.settings-header-icon,
.decoration-circle {
  will-change: transform;
  transform: translateZ(0); /* 启用硬件加速 */
}

/* 减少重绘和回流 */
.settings-card::before,
.settings-card::after {
  will-change: opacity;
}

/* 减少动画的用户偏好 */
@media (prefers-reduced-motion: reduce) {
  .settings-card,
  .settings-header-icon::before,
  .decoration-circle {
    animation: none;
    transition: none;
  }

  .settings-card:hover {
    transform: none;
  }
}
</style>
