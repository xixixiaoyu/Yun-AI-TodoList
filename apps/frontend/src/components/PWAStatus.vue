<template>
  <div class="pwa-status">
    <!-- 安装提示 -->
    <div v-if="canInstall && !isInstalled" class="install-prompt" @click="handleInstall">
      <div class="install-content">
        <div class="install-icon">📱</div>
        <div class="install-text">
          <div class="install-title">安装应用</div>
          <div class="install-desc">添加到主屏幕，获得更好的体验</div>
        </div>
        <button class="install-btn" @click.stop="handleInstall">安装</button>
        <button class="close-btn" @click.stop="dismissInstall">✕</button>
      </div>
    </div>

    <!-- 离线状态提示 -->
    <div v-if="!isOnline" class="offline-banner">
      <div class="offline-content">
        <div class="offline-icon">📡</div>
        <div class="offline-text">
          <div class="offline-title">离线模式</div>
          <div class="offline-desc">网络连接已断开，部分功能可能受限</div>
        </div>
      </div>
    </div>

    <!-- 更新提示 -->
    <div v-if="showUpdatePrompt" class="update-prompt">
      <div class="update-content">
        <div class="update-icon">🔄</div>
        <div class="update-text">
          <div class="update-title">发现新版本</div>
          <div class="update-desc">包含功能改进和错误修复</div>
        </div>
        <button class="update-btn" @click="handleUpdate">更新</button>
        <button class="close-btn" @click="dismissUpdate">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { canInstall, isInstalled, isOnline, showInstallPrompt } from '../utils/pwa'
import { logger } from '../utils/logger'

// 组件状态
const showUpdatePrompt = ref(false)
const installDismissed = ref(false)

// 处理安装
async function handleInstall() {
  try {
    const success = await showInstallPrompt()
    if (success) {
      logger.info('PWA 安装成功', undefined, 'PWA')
    }
  } catch (error) {
    logger.error('PWA 安装失败', error, 'PWA')
  }
}

// 关闭安装提示
function dismissInstall() {
  installDismissed.value = true
  // 24小时后重新显示
  setTimeout(
    () => {
      installDismissed.value = false
    },
    24 * 60 * 60 * 1000
  )
}

// 处理更新
function handleUpdate() {
  // 这里应该调用 SW 更新逻辑
  window.location.reload()
}

// 关闭更新提示
function dismissUpdate() {
  showUpdatePrompt.value = false
}

// 监听 SW 更新事件
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdatePrompt.value = true
  })
}
</script>

<style scoped>
.pwa-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
}

.install-prompt,
.offline-banner,
.update-prompt {
  pointer-events: auto;
  margin: 8px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease-out;
}

.install-prompt {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.install-prompt:hover {
  transform: translateY(-2px);
}

.offline-banner {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.update-prompt {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.install-content,
.offline-content,
.update-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.install-icon,
.offline-icon,
.update-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.install-text,
.offline-text,
.update-text {
  flex: 1;
  min-width: 0;
}

.install-title,
.offline-title,
.update-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.install-desc,
.offline-desc,
.update-desc {
  font-size: 12px;
  opacity: 0.9;
}

.install-btn,
.update-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.install-btn:hover,
.update-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 1;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .install-content,
  .offline-content,
  .update-content {
    padding: 10px 12px;
    gap: 10px;
  }

  .install-icon,
  .offline-icon,
  .update-icon {
    font-size: 20px;
  }

  .install-title,
  .offline-title,
  .update-title {
    font-size: 13px;
  }

  .install-desc,
  .offline-desc,
  .update-desc {
    font-size: 11px;
  }
}
</style>
