<template>
  <div class="app" :class="currentTheme">
    <!-- 导航栏组件 -->
    <NavigationBar />

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <div class="router-view-container">
        <router-view />
      </div>
      <div class="top-components" :class="{ 'small-screen': isSmallScreen }">
        <!-- 预留位置用于其他组件 -->
      </div>
    </div>

    <!-- API Key 提醒组件 -->
    <ApiKeyReminder
      :show="showApiKeyReminder"
      @close="closeReminder"
      @go-to-settings="goToSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, computed, onMounted, provide } from 'vue'
import { useTheme } from './composables/useTheme'
import { useWindowSize } from '@vueuse/core'
import NavigationBar from './components/layout/NavigationBar.vue'
import ApiKeyReminder from './components/layout/ApiKeyReminder.vue'
import { useAppState } from './composables/useAppState'

const { theme, systemTheme, initTheme } = useTheme()

// 使用应用状态管理
const { showApiKeyReminder, closeReminder, goToSettings } = useAppState()

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
/* 引入全局样式 */
@import './styles/themes.css';
@import './styles/global.css';
</style>
