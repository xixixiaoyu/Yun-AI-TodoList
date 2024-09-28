<script setup lang="ts">
import { onErrorCaptured, computed, ref, onMounted } from 'vue'
import { useTheme } from './composables/useTheme'
import { useI18n } from 'vue-i18n'

const { theme, systemTheme, initTheme } = useTheme()
const { locale } = useI18n()

onErrorCaptured((err, instance, info) => {
	console.error('Captured error:', err, instance, info)
	return false
})

const currentTheme = computed(() => {
	return theme.value === 'auto' ? systemTheme.value : theme.value
})

const toggleLanguage = () => {
	locale.value = locale.value === 'zh' ? 'en' : 'zh'
}

onMounted(() => {
	initTheme()
})
</script>

<template>
	<div class="app" :class="currentTheme">
		<button @click="toggleLanguage" class="language-toggle">
			{{ locale === 'zh' ? 'EN' : '中文' }}
		</button>
		<router-view></router-view>
	</div>
</template>

<style>
:root {
	--bg-color: #e2eafb;
	--text-color: #333;
	--card-bg-color: rgba(255, 255, 255, 0.9);
	--card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	--input-bg-color: #fff0eb;
	--input-border-color: #ffd3c5;
	--button-bg-color: #ff9a8b;
	--button-hover-bg-color: #ff8c7f;
	--font-smoothing: antialiased;
	--font-weight: 400;
	--todo-text-color: #333;
	--completed-todo-text-color: #888;
	--filter-btn-bg: #f8f9f9;
	--filter-btn-text: #333;
	--filter-btn-border: #d5d8dc;
	--filter-btn-active-bg: #85c1e9;
	--filter-btn-active-text: white;
	--filter-btn-active-border: #85c1e9;
}

[data-theme='dark'] {
	--bg-color: #2c3e50;
	--text-color: #ecf0f1;
	--card-bg-color: rgba(44, 62, 80, 0.9);
	--card-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	--input-bg-color: #34495e;
	--input-border-color: #7f8c8d;
	--button-bg-color: #3498db;
	--button-hover-bg-color: #2980b9;
	--font-smoothing: subpixel-antialiased;
	--font-weight: 300;
	--todo-text-color: #ecf0f1;
	--completed-todo-text-color: #95a5a6;
	--filter-btn-bg: #34495e;
	--filter-btn-text: #ecf0f1;
	--filter-btn-border: #7f8c8d;
	--filter-btn-active-bg: #3498db;
	--filter-btn-active-text: #ecf0f1;
	--filter-btn-active-border: #3498db;
}

body {
	background: var(--bg-color);
	color: var(--text-color);
	font-family: 'LXGW WenKai Screen', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
		Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
	-webkit-font-smoothing: var(--font-smoothing);
	-moz-osx-font-smoothing: var(--font-smoothing);
	font-weight: var(--font-weight);
	padding-top: 2rem; /* 添加顶部内边距 */
}

.app {
	color: var(--text-color);
}

/* 移除全局过渡效果 */
* {
	transition: none;
}

.language-toggle {
	position: fixed;
	top: 10px;
	right: 10px;
	padding: 5px 10px;
	background-color: var(--button-bg-color);
	color: var(--text-color);
	border: none;
	border-radius: 4px;
	cursor: pointer;
	z-index: 1000;
}
</style>
