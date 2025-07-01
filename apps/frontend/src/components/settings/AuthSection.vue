<template>
  <div class="auth-section">
    <!-- 标题 -->
    <div class="section-header">
      <div class="flex items-center gap-2">
        <i class="i-carbon-user text-lg text-primary"></i>
        <h3 class="section-title">{{ t('authSettings.title') }}</h3>
      </div>
      <p class="section-description">{{ t('authSettings.description') }}</p>
    </div>

    <!-- 未登录状态 -->
    <div v-if="!isAuthenticated" class="auth-content">
      <div class="auth-prompt">
        <div class="prompt-icon">
          <i class="i-carbon-user-plus text-2xl text-text-secondary"></i>
        </div>
        <div class="prompt-content">
          <h4 class="prompt-title">{{ t('authSettings.notLoggedIn') }}</h4>
          <p class="prompt-description">{{ t('authSettings.loginBenefits') }}</p>
        </div>
      </div>

      <div class="auth-actions">
        <router-link to="/login" class="auth-button auth-button-primary">
          <i class="i-carbon-login text-sm"></i>
          <span>{{ t('authSettings.login') }}</span>
        </router-link>
        <router-link to="/register" class="auth-button auth-button-secondary">
          <i class="i-carbon-user-plus text-sm"></i>
          <span>{{ t('authSettings.register') }}</span>
        </router-link>
      </div>

      <div class="auth-note">
        <i class="i-carbon-information text-sm text-text-secondary"></i>
        <span class="note-text">{{ t('authSettings.optionalNote') }}</span>
      </div>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="auth-content">
      <div class="user-info">
        <div class="user-avatar">
          <i class="i-carbon-user text-xl text-primary"></i>
        </div>
        <div class="user-details">
          <h4 class="user-name">{{ user?.username || user?.email }}</h4>
          <p class="user-email">{{ user?.email }}</p>
          <p class="user-joined">
            {{ t('authSettings.joinedAt', { date: formatDate(user?.createdAt) }) }}
          </p>
        </div>
      </div>

      <div class="sync-status">
        <div class="status-indicator" :class="syncStatusClass">
          <i :class="syncStatusIcon" class="text-sm"></i>
          <span class="status-text">{{ syncStatusText }}</span>
        </div>
        <div class="cloud-info">
          <span class="info-text">{{ t('authSettings.cloudStorageInfo') }}</span>
        </div>
      </div>

      <div class="auth-actions">
        <button class="auth-button auth-button-danger" :disabled="isLoading" @click="handleLogout">
          <i v-if="!isLoading" class="i-carbon-logout text-sm"></i>
          <i v-else class="i-carbon-circle-dash animate-spin text-sm"></i>
          <span>{{ isLoading ? t('authSettings.loggingOut') : t('authSettings.logout') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useStorageMode } from '../../composables/useStorageMode'
import { useNotifications } from '../../composables/useNotifications'

const { t } = useI18n()
const _router = useRouter()
const { user, isAuthenticated, isLoading, logout } = useAuth()
const { networkStatus } = useStorageMode()
const { success, error } = useNotifications()

// 计算属性
const syncStatusClass = computed(() => {
  if (!networkStatus.value.isOnline) return 'status-error'
  if (!networkStatus.value.isServerReachable) return 'status-error'
  if (networkStatus.value.consecutiveFailures > 0) return 'status-warning'
  return 'status-synced'
})

const syncStatusIcon = computed(() => {
  if (!networkStatus.value.isOnline) return 'i-carbon-wifi-off'
  if (!networkStatus.value.isServerReachable) return 'i-carbon-warning'
  if (networkStatus.value.consecutiveFailures > 0) return 'i-carbon-warning-alt'
  return 'i-carbon-checkmark'
})

const syncStatusText = computed(() => {
  if (!networkStatus.value.isOnline) return '网络已断开'
  if (!networkStatus.value.isServerReachable) return '服务器不可达'
  if (networkStatus.value.consecutiveFailures > 0) return '连接不稳定'
  return '云端存储已连接'
})

// 方法
const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const _formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// 云端存储模式下不需要手动同步

const handleLogout = async () => {
  try {
    await logout()
    success('登出成功', '您已安全登出')
  } catch (err) {
    console.error('Logout failed:', err)
    error('登出失败', '请稍后重试')
  }
}

defineOptions({
  name: 'AuthSection',
})
</script>

<style scoped>
.auth-section {
  @apply space-y-6;
}

.section-header {
  @apply space-y-2;
}

.section-title {
  @apply text-lg font-semibold text-text;
}

.section-description {
  @apply text-sm text-text-secondary;
}

.auth-content {
  @apply space-y-4;
}

/* 未登录状态样式 */
.auth-prompt {
  @apply flex items-start gap-4 p-4 bg-bg-secondary rounded-xl border border-border;
}

.prompt-icon {
  @apply flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg;
}

.prompt-content {
  @apply flex-1 space-y-1;
}

.prompt-title {
  @apply font-medium text-text;
}

.prompt-description {
  @apply text-sm text-text-secondary;
}

.auth-actions {
  @apply flex gap-3;
}

.auth-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all-300;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.auth-button-primary {
  @apply bg-primary text-white hover:bg-primary-hover focus:ring-primary;
}

.auth-button-secondary {
  @apply bg-bg-secondary text-text border border-border hover:bg-bg-tertiary focus:ring-primary;
}

.auth-button-danger {
  @apply bg-error text-white hover:bg-error/90 focus:ring-error;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.auth-note {
  @apply flex items-center gap-2 text-xs text-text-secondary;
}

.note-text {
  @apply leading-relaxed;
}

/* 已登录状态样式 */
.user-info {
  @apply flex items-start gap-4 p-4 bg-bg-secondary rounded-xl border border-border;
}

.user-avatar {
  @apply flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg;
}

.user-details {
  @apply flex-1 space-y-1;
}

.user-name {
  @apply font-medium text-text;
}

.user-email {
  @apply text-sm text-text-secondary;
}

.user-joined {
  @apply text-xs text-text-secondary;
}

.sync-status {
  @apply flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border;
}

.status-indicator {
  @apply flex items-center gap-2 text-sm;
}

.status-syncing {
  @apply text-primary;
}

.status-synced {
  @apply text-success;
}

.status-pending {
  @apply text-warning;
}

.status-error {
  @apply text-error;
}

.status-text {
  @apply font-medium;
}

.sync-button {
  @apply flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg;
  @apply hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .auth-actions {
    @apply flex-col;
  }

  .auth-button {
    @apply justify-center;
  }

  .sync-status {
    @apply flex-col items-start gap-2;
  }
}
</style>
