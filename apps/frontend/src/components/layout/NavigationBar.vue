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
      :class="{ 'nav-button-active': $route.path === '/calendar' }"
      @click="router.push('/calendar')"
    >
      <i class="i-carbon-calendar text-sm mr-1"></i>
      {{ t('calendar') }}
    </button>

    <button
      class="nav-button"
      :class="{ 'nav-button-active': $route.path === '/settings' }"
      @click="router.push('/settings')"
    >
      {{ t('settings') }}
    </button>

    <!-- 认证状态按钮 -->
    <div v-if="!isAuthenticated" class="auth-buttons">
      <button class="nav-button auth-button" @click="router.push('/login')">
        <i class="i-carbon-login text-sm mr-1"></i>
        {{ t('auth.login') }}
      </button>
    </div>

    <!-- 用户菜单 -->
    <div v-else ref="userMenuRef" class="user-menu" @click="toggleUserMenu">
      <button class="nav-button user-button">
        <i class="i-carbon-user text-sm mr-1"></i>
        {{ user?.username || user?.email?.split('@')[0] }}
        <i class="i-carbon-chevron-down text-xs ml-1" :class="{ 'rotate-180': showUserMenu }"></i>
      </button>

      <!-- 用户下拉菜单 -->
      <div v-if="showUserMenu" class="user-dropdown">
        <div class="user-info">
          <div class="user-avatar">
            <i class="i-carbon-user text-lg"></i>
          </div>
          <div class="user-details">
            <div class="user-name">{{ user?.username || '用户' }}</div>
            <div class="user-email">{{ user?.email }}</div>
          </div>
        </div>
        <div class="menu-divider"></div>
        <button class="menu-item" @click="handleLogout">
          <i class="i-carbon-logout text-sm mr-2"></i>
          {{ t('auth.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useNotifications } from '../../composables/useNotifications'
import router from '../../router'

const { t } = useI18n()
const { isAuthenticated, user, logout } = useAuth()
const { success, error } = useNotifications()

// 用户菜单状态
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement>()

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    await logout()
    showUserMenu.value = false
    success('登出成功', '您已安全登出')
    router.push('/')
  } catch (err) {
    console.error('Logout failed:', err)
    error('登出失败', '请稍后重试')
  }
}

// 点击外部关闭用户菜单
onMounted(() => {
  const handleClickOutside = (event: Event) => {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
      showUserMenu.value = false
    }
  }

  document.addEventListener('click', handleClickOutside)

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

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

/* 认证按钮样式 */
.auth-buttons {
  @apply flex gap-2;
}

.auth-button {
  @apply flex items-center;
}

.register-button {
  @apply bg-primary text-white;
}

.register-button:hover {
  @apply bg-primary-hover;
}

/* 用户菜单样式 */
.user-menu {
  @apply relative;
}

.user-button {
  @apply flex items-center bg-primary text-white;
}

.user-button:hover {
  @apply bg-primary-hover;
}

.user-dropdown {
  @apply absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg backdrop-blur-sm z-50;
  @apply transform transition-all duration-200 ease-out;
}

.user-info {
  @apply flex items-center gap-3 p-4;
}

.user-avatar {
  @apply w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary;
}

.user-details {
  @apply flex-1 min-w-0;
}

.user-name {
  @apply font-medium text-text text-sm truncate;
}

.user-email {
  @apply text-text-secondary text-xs truncate;
}

.menu-divider {
  @apply h-px bg-border mx-4;
}

.menu-item {
  @apply w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-text hover:bg-bg-secondary transition-colors;
  @apply rounded-none first:rounded-t-none last:rounded-b-xl;
}

.menu-item:hover {
  @apply bg-bg-secondary;
}

/* 深色主题适配 */
[data-theme='dark'] .user-dropdown {
  @apply bg-card-dark border-border-dark;
}

[data-theme='dark'] .user-name {
  @apply text-text-dark;
}

[data-theme='dark'] .user-email {
  @apply text-text-secondary-dark;
}

[data-theme='dark'] .menu-item {
  @apply text-text-dark hover:bg-bg-secondary-dark;
}
</style>
