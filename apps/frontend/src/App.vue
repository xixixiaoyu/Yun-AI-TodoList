<template>
  <div
    class="min-h-screen flex flex-col text-text"
    :class="[currentTheme, ...getPlatformClasses()]"
  >
    <NavigationBar />

    <div
      class="flex-1 flex flex-col justify-center items-center p-4 min-h-[calc(100vh-60px)] overflow-hidden transition-all duration-300 ease-in-out pt-16 md:pt-4 md:pb-2 md:justify-start md:overflow-y-auto"
    >
      <div class="w-full max-w-screen-xl flex flex-col justify-center px-2 md:px-4">
        <router-view @open-ai-sidebar="openAISidebar" />
      </div>
      <div
        class="flex flex-col gap-4 mb-4 flex-shrink-0"
        :class="{ 'small-screen': isSmallScreen }"
      ></div>
    </div>

    <ApiKeyReminder
      :show="showApiKeyReminder"
      @close="closeReminder"
      @go-to-settings="goToSettings"
    />

    <!-- Toast 通知组件 -->
    <SimpleToast ref="toastRef" />

    <!-- 全局通知系统 -->
    <NotificationContainer />

    <!-- 同步状态指示器 -->
    <SyncStatusIndicator />

    <!-- AI 助手侧边栏 -->
    <AISidebar :is-open="isAISidebarOpen" @close="closeAISidebar" />
  </div>
</template>

<script setup lang="ts">
import AISidebar from './components/AISidebar.vue'
import NotificationContainer from './components/common/NotificationContainer.vue'
import SimpleToast from './components/common/SimpleToast.vue'
import SyncStatusIndicator from './components/common/SyncStatusIndicator.vue'
import ApiKeyReminder from './components/layout/ApiKeyReminder.vue'
import NavigationBar from './components/layout/NavigationBar.vue'
import { useAISidebar } from './composables/useAISidebar'
import { useAppState } from './composables/useAppState'
import { useMobile } from './composables/useMobile'
import { useTheme } from './composables/useTheme'
import { useToast } from './composables/useToast'
import { getPlatformClasses } from './utils/platform'

const { theme, systemTheme, initTheme } = useTheme()

const { showApiKeyReminder, closeReminder, goToSettings } = useAppState()

// AI 侧边栏状态管理
const {
  isOpen: isAISidebarOpen,
  openSidebar: openAISidebar,
  closeSidebar: closeAISidebar,
} = useAISidebar()

const { isReady: _mobileReady, platformInfo: _platformInfo } = useMobile()

onErrorCaptured((err, instance, info) => {
  console.error('Captured error:', err, instance, info)
  return false
})

const currentTheme = computed(() => {
  return theme.value === 'auto' ? systemTheme.value : theme.value
})

provide('theme', theme)

const { width } = useWindowSize()
const isSmallScreen = computed(() => width.value < 768)

// Toast 设置
const toastRef = ref()
const toast = useToast()

onMounted(() => {
  try {
    initTheme()

    // 设置 Toast 实例
    if (toastRef.value) {
      toast.setToastInstance(toastRef.value)
    }
  } catch (error) {
    console.error('Error initializing app:', error)
  }
})

// 提供 Toast 实例给子组件
provide('toast', toast)
</script>
