<script setup lang="ts">
import { onErrorCaptured, computed, ref, onMounted } from 'vue'
import { useTheme } from './composables/useTheme'
import { useI18n } from 'vue-i18n'
import { setLanguage } from './i18n'

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
	const newLocale = locale.value === 'zh' ? 'en' : 'zh'
	setLanguage(newLocale)
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
	--bg-color: #2f2b3a;
	--text-color: #e6e6e6;
	--card-bg-color: rgba(65, 62, 82, 0.9);
	--card-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
	--input-bg-color: #3d3a4d;
	--input-border-color: #5d5a6d;
	--button-bg-color: #8e7cc3;
	--button-hover-bg-color: #7d6aad;
	--font-smoothing: subpixel-antialiased;
	--font-weight: 300;
	--todo-text-color: #e6e6e6;
	--completed-todo-text-color: #a6a6a6;
	--filter-btn-bg: #3d3a4d;
	--filter-btn-text: #e6e6e6;
	--filter-btn-border: #5d5a6d;
	--filter-btn-active-bg: #8e7cc3;
	--filter-btn-active-text: #ffffff;
	--filter-btn-active-border: #8e7cc3;
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
