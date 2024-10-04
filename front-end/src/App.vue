<script setup lang="ts">
import { onErrorCaptured, computed, ref, onMounted } from 'vue'
import { useTheme } from './composables/useTheme'
import { useI18n } from 'vue-i18n'
import { setLanguage } from './i18n'
import AudioPlayer from './components/AudioPlayer.vue'
import DailyInspiration from './components/DailyInspiration.vue'

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
		<div class="top-components">
			<DailyInspiration />
			<AudioPlayer />
		</div>
		<router-view />
	</div>
</template>

<style>
:root {
	--bg-color: #e2eafb;
	--text-color: #2c3e50; /* 更深的文字颜色，提高对比度 */
	--card-bg-color: rgba(255, 255, 255, 0.9);
	--card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	--input-bg-color: #f0f4f8;
	--input-border-color: #d0d9e1;
	--button-bg-color: #7a89c2; /* 稍微深一点的蓝色 */
	--button-hover-bg-color: #6b7ab3;
	--font-smoothing: antialiased;
	--font-weight: 400;
	--todo-text-color: #2c3e50; /* 与主文字颜色一致 */
	--completed-todo-text-color: #7f8c8d; /* 稍微深一点的灰色 */
	--filter-btn-bg: #f8f9f9;
	--filter-btn-text: #2c3e50;
	--filter-btn-border: #d5d8dc;
	--filter-btn-active-bg: #7a89c2;
	--filter-btn-active-text: #ffffff;
	--filter-btn-active-border: #7a89c2;
	--language-toggle-bg: rgba(122, 137, 194, 0.2); /* 浅色主题下的半透明背景 */
	--language-toggle-color: #2c3e50; /* 浅色主题下的文字颜色 */
	--language-toggle-hover-bg: rgba(122, 137, 194, 0.4); /* 浅色主题下的悬停背景 */
}

[data-theme='dark'] {
	--bg-color: #2f2b3a;
	--text-color: #ecf0f1; /* 更亮的文字颜色，提高对比度 */
	--card-bg-color: rgba(65, 62, 82, 0.9);
	--card-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
	--input-bg-color: #3d3a4d;
	--input-border-color: #5d5a6d;
	--button-bg-color: #8e9ecc; /* 稍微亮一点的蓝色 */
	--button-hover-bg-color: #7d8dbf;
	--font-smoothing: subpixel-antialiased;
	--font-weight: 300;
	--todo-text-color: #ecf0f1; /* 与主文字颜色一致 */
	--completed-todo-text-color: #bdc3c7; /* 稍微亮一点的灰色 */
	--filter-btn-bg: #3d3a4d;
	--filter-btn-text: #ecf0f1;
	--filter-btn-border: #5d5a6d;
	--filter-btn-active-bg: #8e9ecc;
	--filter-btn-active-text: #ffffff;
	--filter-btn-active-border: #8e9ecc;
	--language-toggle-bg: rgba(142, 158, 204, 0.2); /* 深色主题下的半透明背景 */
	--language-toggle-color: #ecf0f1; /* 深色主题下的文字颜色 */
	--language-toggle-hover-bg: rgba(142, 158, 204, 0.4); /* 深色主题下的悬停背景 */
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
	background-color: var(--language-toggle-bg);
	color: var(--language-toggle-color);
	border: 1px solid var(--language-toggle-color);
	border-radius: 4px;
	cursor: pointer;
	z-index: 1000;
	font-size: 14px;
	font-weight: bold;
	transition: all 0.3s ease;
}

.language-toggle:hover {
	background-color: var(--language-toggle-hover-bg);
	transform: translateY(-2px);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 替换 @media (forced-colors: active) 部分 */
@media (forced-colors: active) {
	:root {
		forced-color-adjust: none;
	}
}

.language-toggle,
button,
input[type='range'] {
	forced-color-adjust: none;
}

.language-toggle {
	background-color: ButtonFace;
	color: ButtonText;
	border: 1px solid ButtonText;
}

.language-toggle:hover {
	background-color: Highlight;
	color: HighlightText;
}

/* 添加到现有的 <style> 标签中 */
@media (forced-colors: active) {
	:root {
		forced-color-adjust: none;
	}
}

.audio-player {
	position: fixed;
	z-index: 1000;
	width: 100%;
	max-width: 600px;
	margin: 3rem auto;
}

@media (min-width: 1201px) {
	.audio-player {
		position: fixed;
		top: calc(1rem + 150px); /* 假设每日激励卡片高度约为150px */
		left: 1rem;
		width: 300px;
	}
}

@media (max-width: 1200px) {
	.audio-player {
		width: 100%;
		max-width: 600px;
		margin: 1rem auto;
	}
}

@media (max-width: 768px) {
	.audio-player {
		width: calc(100% - 2rem);
		max-width: 100%;
		margin: 1rem auto;
	}
}

.top-components {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 1rem;
}

@media (min-width: 1201px) {
	.top-components {
		position: fixed;
		top: 1rem;
		left: 1rem;
		width: 300px;
	}
}

@media (max-width: 1200px) {
	.top-components {
		width: 100%;
		max-width: 600px;
		margin: 1rem auto;
	}
}

@media (max-width: 768px) {
	.top-components {
		width: calc(100% - 2rem);
	}
}
</style>
