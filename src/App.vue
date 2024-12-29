<script setup lang="ts">
import { onErrorCaptured, computed, onMounted, provide, ref } from 'vue'
import { useTheme } from './composables/useTheme'
import { useI18n } from 'vue-i18n'
import { setLanguage, setSystemLanguage } from './i18n'
// import AudioPlayer from './components/AudioPlayer.vue'
import DailyInspiration from './components/DailyInspiration.vue'
import { useWindowSize } from '@vueuse/core'
import router from './router'
import {
	getApiKey,
	shouldShowApiKeyReminder,
	hideApiKeyReminder,
} from './services/configService'

const { theme, systemTheme, initTheme } = useTheme()
const { locale, t } = useI18n()

// 添加提示框的状态
const showApiKeyReminder = ref(false)

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

const goToSettings = () => {
	router.push('/settings')
	showApiKeyReminder.value = false
}

provide('theme', theme)

const { width } = useWindowSize()
const isSmallScreen = computed(() => width.value < 768)

const closeReminder = (dontShowAgain = false) => {
	if (dontShowAgain) {
		hideApiKeyReminder()
	}
	showApiKeyReminder.value = false
}

onMounted(() => {
	try {
		initTheme()
		setSystemLanguage()
		// 检查是否配置了 API Key 且是否应该显示提醒
		if (!getApiKey() && shouldShowApiKeyReminder()) {
			showApiKeyReminder.value = true
		}
	} catch (error) {
		console.error('Error initializing app:', error)
	}
})
</script>

<template>
	<div class="app" :class="currentTheme">
		<div class="nav-bar">
			<button @click="router.push('/')" class="nav-button">
				{{ t('home') }}
			</button>
			<button @click="router.push('/ai-assistant')" class="nav-button">
				{{ t('aiAssistant') }}
			</button>
			<button @click="router.push('/settings')" class="nav-button">
				{{ t('settings') }}
			</button>
			<button @click="toggleLanguage" class="nav-button">
				{{ locale === 'zh' ? 'EN' : '中文' }}
			</button>
		</div>
		<div class="content-wrapper">
			<router-view />
			<div class="top-components" :class="{ 'small-screen': isSmallScreen }">
				<!-- <AudioPlayer /> -->
				<DailyInspiration />
			</div>
		</div>

		<!-- API Key 提示框 -->
		<transition name="fade">
			<div v-if="showApiKeyReminder" class="api-key-reminder">
				<div class="reminder-content">
					<div class="reminder-icon">🔑</div>
					<div class="reminder-text">
						<h3>{{ t('welcome') }}</h3>
						<p>{{ t('apiKeyReminder') }}</p>
					</div>
					<div class="reminder-actions">
						<button @click="goToSettings" class="reminder-button">
							{{ t('goToSettings') }}
						</button>
						<button
							@click="closeReminder(false)"
							class="reminder-button secondary"
						>
							{{ t('later') }}
						</button>
						<button
							@click="closeReminder(true)"
							class="reminder-button secondary"
						>
							{{ t('dontShowAgain') }}
						</button>
					</div>
				</div>
			</div>
		</transition>
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
	--language-toggle-hover-bg: rgba(
		122,
		137,
		194,
		0.4
	); /* 浅色主题下的悬停背景 */
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
	--language-toggle-hover-bg: rgba(
		142,
		158,
		204,
		0.4
	); /* 深色主题下的悬停背景 */
}

body {
	background: var(--bg-color);
	color: var(--text-color);
	font-family: 'LXGW WenKai Screen', -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue',
		sans-serif;
	-webkit-font-smoothing: var(--font-smoothing);
	-moz-osx-font-smoothing: var(--font-smoothing);
	font-weight: var(--font-weight);
	padding-top: 1rem;
}

.app {
	color: var(--text-color);
}

/* 移除全局过渡效果 */
* {
	transition: none;
}

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
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: bold;
	transition: all 0.3s ease;
	padding: 5px 10px;
	white-space: nowrap;
}

.nav-button:hover {
	background-color: var(--language-toggle-hover-bg);
	transform: translateY(-2px);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 添加响应式样式 */
@media (max-width: 768px) {
	.nav-bar {
		position: fixed;
		top: auto;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--card-bg-color);
		padding: 0.5rem;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		justify-content: space-around;
		gap: 0.25rem;
	}

	.nav-button {
		flex: 1;
		font-size: 12px;
		padding: 8px 4px;
		text-align: center;
		min-width: 60px;
	}

	.nav-button:hover {
		transform: translateY(-1px);
	}

	.content-wrapper {
		padding-bottom: 60px;
	}
}

@media (max-width: 360px) {
	.nav-bar {
		gap: 0.15rem;
	}

	.nav-button {
		font-size: 11px;
		padding: 6px 2px;
		min-width: 50px;
	}
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
	position: relative;
	z-index: 1000;
	width: 100%;
	max-width: 600px;
	margin: 4rem auto;
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

.content-wrapper {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

.top-components {
	display: flex;
	justify-content: space-between;
	padding: 1rem;
}

.top-components.small-screen {
	flex-direction: column;
	order: 1;
}

@media (max-width: 768px) {
	.content-wrapper {
		flex-direction: column;
	}

	.top-components {
		margin-top: 1rem;
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

/* 添加以下样式 */
@media (min-width: 1201px) {
	html,
	body {
		overflow: hidden;
	}

	.app {
		height: 100vh;
		overflow-y: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* Internet Explorer 10+ */
	}

	.app::-webkit-scrollbar {
		/* WebKit */
		width: 0;
		height: 0;
	}
}

/* 添加新的提示框样式 */
.api-key-reminder {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1001;
	padding: 1rem;
}

.reminder-content {
	background-color: var(--card-bg-color);
	border-radius: 16px;
	padding: 2rem;
	max-width: 450px;
	width: 100%;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
	text-align: center;
}

.reminder-icon {
	font-size: 3rem;
	margin-bottom: 1rem;
}

.reminder-text h3 {
	margin-bottom: 0.5rem;
	color: var(--text-color);
}

.reminder-text p {
	color: var(--text-color);
	opacity: 0.8;
	margin-bottom: 1.5rem;
}

.reminder-actions {
	display: flex;
	gap: 0.75rem;
	justify-content: center;
	flex-wrap: wrap;
}

.reminder-button {
	padding: 0.75rem 1rem;
	border-radius: 8px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 0.9rem;
}

.reminder-button:not(.secondary) {
	background-color: var(--button-bg-color);
	color: white;
	border: none;
}

.reminder-button.secondary {
	background-color: transparent;
	border: 1px solid var(--button-bg-color);
	color: var(--text-color);
}

.reminder-button:hover {
	transform: translateY(-2px);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

@media (max-width: 768px) {
	.reminder-content {
		margin: 1rem;
		padding: 1.5rem;
	}

	.reminder-actions {
		flex-direction: column;
		gap: 0.5rem;
	}

	.reminder-button {
		width: 100%;
	}
}
</style>
