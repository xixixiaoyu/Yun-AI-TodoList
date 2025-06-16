<template>
  <div
    class="min-h-screen flex flex-col text-text"
    :class="[currentTheme, ...getPlatformClasses()]"
  >
    <NavigationBar />

    <div
      class="flex-1 flex flex-col justify-center items-center p-4 min-h-[calc(100vh-60px)] overflow-hidden transition-all-300 md:pt-16 md:pb-2 md:justify-start md:overflow-y-auto"
    >
      <div class="w-full max-w-screen-xl flex flex-col justify-center">
        <router-view />
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
  </div>
</template>

<script setup lang="ts">
import ApiKeyReminder from './components/layout/ApiKeyReminder.vue'
import NavigationBar from './components/layout/NavigationBar.vue'
import { useAppState } from './composables/useAppState'
import { useMobile } from './composables/useMobile'
import { useTheme } from './composables/useTheme'
import { getPlatformClasses } from './utils/platform'

const { theme, systemTheme, initTheme } = useTheme()

const { showApiKeyReminder, closeReminder, goToSettings } = useAppState()

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

onMounted(() => {
  try {
    initTheme()
  } catch (error) {
    console.error('Error initializing app:', error)
  }
})
</script>

<!-- 样式已迁移到 UnoCSS 和 variables.css -->
