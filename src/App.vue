<template>
  <div class="app" :class="[currentTheme, ...getPlatformClasses()]">
    <NavigationBar />

    <div class="content-wrapper">
      <div class="router-view-container">
        <router-view />
      </div>
      <div class="top-components" :class="{ 'small-screen': isSmallScreen }"></div>
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
import { useTheme } from './composables/useTheme'
import { useMobile } from './composables/useMobile'
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

<style>
@import './styles/themes.css';
@import './styles/global.css';
@import './styles/mobile.css';
</style>
