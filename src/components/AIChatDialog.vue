<script setup lang="ts">
import { ref, nextTick, onMounted, watch, computed } from 'vue'
import { getAIStreamResponse, abortCurrentRequest } from '../services/deepseekService'
import { Message } from '../services/types'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// 配置 marked 使用 highlight.js
marked.setOptions({
	highlight: function (code, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(code, { language: lang }).value
			} catch (e) {
				console.error(e)
			}
		}
		return code // 如果没有指定语言或出错，返回原始代码
	},
	langPrefix: 'hljs language-',
})

const userMessage = ref('')
const chatHistory = ref<{ role: 'user' | 'ai'; content: string }[]>([])
const chatHistoryRef = ref<HTMLDivElement | null>(null)
const currentAIResponse = ref('')
const isGenerating = ref(false)
const inputRef = ref<HTMLTextAreaElement | null>(null)

// 新增: 对话历史列表
const conversationHistory = ref<
	{ id: number; title: string; messages: { role: 'user' | 'ai'; content: string }[] }[]
>([])
const currentConversationId = ref<number | null>(null)

// 修改: 将 showConversationList 重命名为 isDrawerOpen
const isDrawerOpen = ref(false)

// 新增: 从 localStorage 加载对话历史列表
const loadConversationHistory = () => {
	const savedHistory = localStorage.getItem('aiConversationHistory')
	if (savedHistory) {
		conversationHistory.value = JSON.parse(savedHistory)
	}
}

// 新增: 保存对话历史列表到 localStorage
const saveConversationHistory = () => {
	localStorage.setItem('aiConversationHistory', JSON.stringify(conversationHistory.value))
}

// 新增: 保存当前会话 ID 到 localStorage
const saveCurrentConversationId = () => {
	if (currentConversationId.value) {
		localStorage.setItem('currentConversationId', currentConversationId.value.toString())
	}
}

// 新增: 创建新对话
const createNewConversation = () => {
	const newId = Date.now()
	const newConversation = {
		id: newId,
		title: t('newConversation'),
		messages: [],
	}
	conversationHistory.value.unshift(newConversation)
	currentConversationId.value = newId
	chatHistory.value = []
	saveConversationHistory()
	saveCurrentConversationId() // 保存当前会话 ID
}

// 修改: 切换对话的函数，添加可选参数控制是否关闭抽屉
const switchConversation = (id: number, closeDrawer: boolean = true) => {
	currentConversationId.value = id
	const conversation = conversationHistory.value.find(c => c.id === id)
	if (conversation) {
		chatHistory.value = [...conversation.messages]
	}
	if (closeDrawer) {
		isDrawerOpen.value = false
	}
	saveCurrentConversationId()
}

// 修改: 删除对话时保持抽屉打开
const deleteConversation = (id: number) => {
	conversationHistory.value = conversationHistory.value.filter(c => c.id !== id)
	if (currentConversationId.value === id) {
		if (conversationHistory.value.length > 0) {
			switchConversation(conversationHistory.value[0].id, false) // 不关闭抽屉
		} else {
			createNewConversation()
		}
	}
	saveConversationHistory()
}

// 修改: 重命名函数
const toggleDrawer = () => {
	isDrawerOpen.value = !isDrawerOpen.value
}

// 修改: 优化关闭抽屉的处理逻辑
const closeDrawerOnOutsideClick = (event: MouseEvent) => {
	const drawer = document.querySelector('.drawer-container')
	const toggleButton = document.querySelector('.toggle-drawer-btn')
	const conversationControls = document.querySelector('.conversation-controls')

	// 如果点击的是抽屉按钮或对话控制区域内的元素，不处理
	if (
		toggleButton?.contains(event.target as Node) ||
		conversationControls?.contains(event.target as Node)
	) {
		return
	}

	// 如果抽屉打开且点击在抽屉外部，则关闭抽屉
	if (isDrawerOpen.value && drawer && !drawer.contains(event.target as Node)) {
		isDrawerOpen.value = false
	}
}

// 修改 scrollToBottom 函数，添加平滑滚动和延迟检查
const scrollToBottom = () => {
	if (chatHistoryRef.value) {
		const element = chatHistoryRef.value
		const isScrolledToBottom =
			element.scrollHeight - element.scrollTop <= element.clientHeight + 100

		// 只有当用户已经在底部附近时才自动滚动
		if (isScrolledToBottom) {
			nextTick(() => {
				element.scrollTo({
					top: element.scrollHeight,
					behavior: 'smooth',
				})
			})
		}
	}
}

// 添加新的强制滚动到底部函数，用于特定场景
const forceScrollToBottom = () => {
	if (chatHistoryRef.value) {
		nextTick(() => {
			chatHistoryRef.value!.scrollTo({
				top: chatHistoryRef.value!.scrollHeight,
				behavior: 'smooth',
			})
		})
	}
}

const sendMessage = async () => {
	if (!userMessage.value.trim()) return

	const userMessageContent = userMessage.value
	chatHistory.value.push({ role: 'user', content: userMessageContent })
	userMessage.value = ''
	isGenerating.value = true
	currentAIResponse.value = ''

	// 用户发送消息后强制滚动到底部
	forceScrollToBottom()

	const aiResponseIndex = chatHistory.value.length
	chatHistory.value.push({ role: 'ai', content: '' })

	try {
		const messages: Message[] = chatHistory.value
			.filter(msg => msg.content.trim() !== '')
			.map(msg => ({
				role: msg.role === 'user' ? 'user' : 'assistant',
				content: msg.content,
			}))

		await getAIStreamResponse(messages, chunk => {
			if (chunk === '[DONE]' || chunk === '[ABORTED]') {
				isGenerating.value = false
				// 更新当前对话的消息
				if (currentConversationId.value !== null) {
					const currentConversation = conversationHistory.value.find(
						c => c.id === currentConversationId.value
					)
					if (currentConversation) {
						currentConversation.messages = chatHistory.value
						if (currentConversation.messages.length === 2) {
							currentConversation.title =
								currentConversation.messages[0].content.slice(0, 30) + '...'
						}
					}
				}
				saveConversationHistory()
				return
			}
			currentAIResponse.value += chunk
			chatHistory.value[aiResponseIndex].content = currentAIResponse.value
			scrollToBottom() // 使用普通滚动逻辑处理流式响应
		})
	} catch (error) {
		console.error(t('aiResponseError'), error)
		chatHistory.value[aiResponseIndex].content = t('aiResponseErrorMessage')
	} finally {
		isGenerating.value = false
		currentAIResponse.value = ''
		nextTick(() => {
			if (inputRef.value) {
				inputRef.value.focus()
			}
		})
	}
}

const stopGenerating = () => {
	abortCurrentRequest()
	isGenerating.value = false
	nextTick(() => {
		if (inputRef.value) {
			inputRef.value.focus()
		}
	})
}

const sanitizeContent = (content: string): string => {
	const rawHtml = marked.parse(content) as string
	return DOMPurify.sanitize(rawHtml)
}

const sanitizedMessages = computed(() =>
	chatHistory.value.map(message => ({
		...message,
		sanitizedContent:
			message.role === 'ai' ? sanitizeContent(message.content) : message.content,
	}))
)

const newline = (event: KeyboardEvent) => {
	const textarea = event.target as HTMLTextAreaElement
	const start = textarea.selectionStart
	const end = textarea.selectionEnd
	const value = textarea.value
	textarea.value = value.substring(0, start) + '\n' + value.substring(end)
	textarea.selectionStart = textarea.selectionEnd = start + 1
}

// 新增：复制功能
const copyToClipboard = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text)
		// 可以添加一个提示，但这里我们保持简单
	} catch (err) {
		console.error('Failed to copy text: ', err)
	}
}

const clearAllConversations = () => {
	if (confirm(t('confirmClearAll'))) {
		conversationHistory.value = []
		localStorage.removeItem('aiConversationHistory')
		localStorage.removeItem('currentConversationId')
		createNewConversation()
	}
}

onMounted(() => {
	if (inputRef.value) {
		inputRef.value.focus()
	}
	loadConversationHistory()

	// 从 localStorage 获取上次激活的会话 ID
	const savedConversationId = localStorage.getItem('currentConversationId')

	if (conversationHistory.value.length === 0) {
		createNewConversation()
	} else if (savedConversationId) {
		// 尝试恢复上次激活的会话
		const conversationId = parseInt(savedConversationId)
		const exists = conversationHistory.value.some(c => c.id === conversationId)
		if (exists) {
			switchConversation(conversationId)
		} else {
			// 如果上次激活的会话不存在，切换到第一个会话
			switchConversation(conversationHistory.value[0].id)
		}
	} else {
		// 如果没有保存的会话 ID，切换到第一个会话
		switchConversation(conversationHistory.value[0].id)
	}

	document.addEventListener('click', closeDrawerOnOutsideClick)
})

watch(chatHistory, scrollToBottom, { deep: true })
</script>

<template>
	<div class="ai-chat-dialog">
		<div class="dialog-header">
			<h2>{{ t('aiAssistant') }}</h2>

			<router-link to="/" class="close-button" aria-label="close">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					width="24"
					height="24"
				>
					<path
						d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
					/>
				</svg>
			</router-link>
		</div>
		<div class="dialog-content scrollable-container">
			<div class="drawer-container" :class="{ 'drawer-open': isDrawerOpen }">
				<div class="drawer">
					<div class="drawer-header">
						<h3 class="drawer-title">{{ t('conversations') }}</h3>
						<div class="drawer-header-controls">
							<button
								@click="clearAllConversations"
								class="clear-all-btn"
								:title="t('clearAllConversations')"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									width="18"
									height="18"
									fill="currentColor"
								>
									<path
										d="M15 2H9c-1.1 0-2 .9-2 2v2H3v2h2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8h2V6h-4V4c0-1.1-.9-2-2-2zm0 2v2H9V4h6zM7 8h10v12H7V8z"
									/>
									<path d="M9 10h2v8H9zm4 0h2v8h-2z" />
								</svg>
							</button>
							<button @click="toggleDrawer" class="close-drawer-btn">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									width="24"
									height="24"
								>
									<path fill="none" d="M0 0h24v24H0z" />
									<path
										d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
									/>
								</svg>
							</button>
						</div>
					</div>
					<div class="conversation-list">
						<div
							v-for="conversation in conversationHistory"
							:key="conversation.id"
							class="conversation-item"
							:class="{ active: currentConversationId === conversation.id }"
							@click.stop="switchConversation(conversation.id)"
						>
							<span>{{ conversation.title }}</span>
							<button
								@click.stop="deleteConversation(conversation.id)"
								class="delete-conversation-btn"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									width="18"
									height="18"
								>
									<path fill="none" d="M0 0h24v24H0z" />
									<path
										d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
			<div v-if="isDrawerOpen" class="drawer-overlay" @click="isDrawerOpen = false"></div>
			<div ref="chatHistoryRef" class="chat-history">
				<div
					v-for="(message, index) in sanitizedMessages"
					:key="index"
					class="message-container"
					:class="message.role"
				>
					<div class="message-content" dir="ltr">
						<p v-if="message.role === 'user'">{{ message.content }}</p>
						<div v-else class="ai-message">
							<div v-html="message.sanitizedContent"></div>
							<button
								class="copy-button"
								@click="copyToClipboard(message.content)"
								title="复制原始内容"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
									<path
										d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
									></path>
								</svg>
								复制
							</button>
						</div>
					</div>
				</div>
			</div>
			<div class="conversation-controls">
				<button @click="createNewConversation" class="new-conversation-btn">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="currentColor"
					>
						<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
					</svg>
					{{ t('newConversation') }}
				</button>
				<button @click="toggleDrawer" class="toggle-drawer-btn">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="currentColor"
					>
						<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
					</svg>
				</button>
			</div>
			<div class="chat-input">
				<textarea
					ref="inputRef"
					v-model="userMessage"
					@keydown.enter.exact.prevent="sendMessage"
					@keydown.enter.shift.exact="newline"
					:placeholder="t('askAiAssistant')"
					:disabled="isGenerating"
				></textarea>
				<button v-if="!isGenerating" @click="sendMessage">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="18"
						height="18"
						fill="currentColor"
					>
						<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
					</svg>
					{{ t('send') }}
				</button>
				<button v-else @click="stopGenerating" class="stop-btn">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="18"
						height="18"
						fill="currentColor"
					>
						<path d="M6 6h12v12H6z" />
					</svg>
					{{ t('stop') }}
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.ai-chat-dialog {
	overflow: hidden;
	font-family: 'LXGW WenKai Screen', sans-serif;
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: var(--bg-color);
	display: flex;
	flex-direction: column;
	z-index: 100000;
	text-align: left;
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 20px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(10px);
	position: sticky;
	top: 0;
	z-index: 1000;
}

.dialog-header h2 {
	margin: 0;
	font-size: 20px;
	font-weight: 500;
}

.close-button {
	background: none;
	border: none;
	color: var(--card-bg-color);
	cursor: pointer;
	padding: 5px;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.8;
}

.close-button:hover {
	opacity: 1;
}

.dialog-content {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	padding: 16px 0;
	overflow: hidden;
	height: calc(100% - 60px);
	position: relative;
}

.chat-history {
	flex-grow: 1;
	overflow-y: auto;
	margin-bottom: 16px;
	display: flex;
	flex-direction: column;
	scroll-behavior: smooth;
	padding: 0 20px;
	gap: 16px;
}

.message-container {
	max-width: 85%;
	animation: fadeIn 0.3s ease-out;
	position: relative;
}

.message-content {
	padding: 12px 16px;
	border-radius: 16px;
	line-height: 1.6;
	font-size: 15px;
	direction: ltr;
	unicode-bidi: isolate;
	text-align: left;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
	position: relative;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.user {
	align-self: flex-end;
	margin-right: 10px;
}

.user .message-content {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border-bottom-right-radius: 4px;
}

.ai {
	align-self: flex-start;
	margin-left: 10px;
}

.ai .message-content {
	background-color: var(--input-bg-color);
	color: var(--text-color);
	border-bottom-left-radius: 4px;
}

.chat-input textarea {
	flex-grow: 1;
	padding: 12px 16px;
	font-size: 15px;
	border: 1px solid var(--input-border-color);
	border-radius: 12px;
	outline: none;
	background-color: var(--input-bg-color);
	color: var(--text-color);
	resize: none;
	height: 48px;
	max-height: 150px;
	font-family: inherit;
}

.chat-input textarea:focus {
	border-color: var(--button-bg-color);
}

.chat-input button {
	padding: 0 20px;
	font-size: 15px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 12px;
	cursor: pointer;
	height: 48px;
	min-width: 90px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
}

.chat-input button:hover:not(:disabled) {
	opacity: 0.9;
}

.chat-input button:disabled {
	background-color: var(--input-border-color);
	cursor: not-allowed;
	opacity: 0.7;
}

.stop-btn {
	background-color: var(--button-hover-bg-color) !important;
}

/* Drawer styles */
.drawer-container {
	position: fixed;
	left: -300px;
	top: 0;
	height: 100%;
	width: 300px;
	background-color: var(--bg-color);
	transition: transform 0.3s ease;
	box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
	z-index: 1000;
}

.drawer-container.drawer-open {
	transform: translateX(300px);
}

.drawer {
	height: 100%;
	display: flex;
	flex-direction: column;
	padding: 16px;
}

.drawer-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid var(--input-border-color);
}

.drawer-title {
	margin: 0;
	font-size: 18px;
	font-weight: 500;
}

.close-drawer-btn {
	background: none;
	border: none;
	cursor: pointer;
	padding: 4px;
	color: var(--text-color);
	opacity: 0.7;
	transition: all 0.2s ease;
}

.close-drawer-btn:hover {
	opacity: 1;
}

.conversation-list {
	flex-grow: 1;
	overflow-y: auto;
	padding-right: 8px;
}

.conversation-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 12px;
	margin-bottom: 8px;
	cursor: pointer;
	border-radius: 8px;
	background-color: var(--input-bg-color);
}

.conversation-item:hover {
	opacity: 0.9;
}

.conversation-item.active {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
}

.conversation-item span {
	flex-grow: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-right: 8px;
}

.delete-conversation-btn {
	background: none;
	border: none;
	padding: 4px;
	cursor: pointer;
	opacity: 0.7;
	transition: all 0.2s ease;
	color: inherit;
}

.delete-conversation-btn:hover {
	opacity: 1;
}

.conversation-controls {
	display: flex;
	gap: 12px;
	padding: 0 20px;
}

.new-conversation-btn,
.toggle-drawer-btn {
	padding: 10px 16px;
	font-size: 14px;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	background-color: var(--input-bg-color);
	color: var(--text-color);
}

.new-conversation-btn:hover,
.toggle-drawer-btn:hover {
	opacity: 0.9;
}

.new-conversation-btn {
	display: flex;
	align-items: center;
	gap: 6px;
}

.new-conversation-btn svg {
	width: 16px;
	height: 16px;
}

.toggle-drawer-btn {
	padding: 10px 14px;
}

.chat-input {
	display: flex;
	gap: 12px;
	padding: 16px 20px;
	position: sticky;
	bottom: 0;
	background-color: var(--bg-color);
	z-index: 10;
}

.chat-input textarea {
	flex-grow: 1;
	padding: 12px 16px;
	font-size: 15px;
	border: 1px solid var(--input-border-color);
	border-radius: 12px;
	outline: none;
	background-color: var(--input-bg-color);
	color: var(--text-color);
	resize: none;
	height: 48px;
	max-height: 150px;
	font-family: inherit;
}

.chat-input textarea:focus {
	border-color: var(--button-bg-color);
}

.chat-input button {
	padding: 0 20px;
	font-size: 15px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 12px;
	cursor: pointer;
	height: 48px;
	min-width: 90px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
}

.chat-input button:hover:not(:disabled) {
	opacity: 0.9;
}

.chat-input button:disabled {
	background-color: var(--input-border-color);
	cursor: not-allowed;
	opacity: 0.7;
}

.stop-btn {
	background-color: var(--button-hover-bg-color) !important;
}

@media (max-width: 768px) {
	.conversation-controls {
		padding: 0 12px;
		margin-bottom: 8px;
	}

	.new-conversation-btn,
	.toggle-drawer-btn {
		padding: 8px 12px;
		font-size: 13px;
	}

	.chat-input {
		padding: 12px;
	}

	.chat-input textarea {
		padding: 10px 14px;
		font-size: 14px;
		height: 44px;
		border-radius: 10px;
	}

	.chat-input button {
		padding: 0 16px;
		font-size: 14px;
		height: 44px;
		min-width: 80px;
		border-radius: 10px;
	}
}

/* Copy button styles */
.copy-button {
	position: absolute;
	bottom: 0px;
	right: 8px;
	background: var(--bg-color);
	border: none;
	border-radius: 4px;
	padding: 4px 8px;
	font-size: 12px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	opacity: 0;
	transition: all 0.2s ease;
	color: var(--text-color);
}

.message-content:hover .copy-button {
	opacity: 0.7;
}

.copy-button:hover {
	opacity: 1 !important;
}

.copy-button svg {
	width: 14px;
	height: 14px;
}

/* Responsive design */
@media (max-width: 768px) {
	.dialog-header {
		padding: 10px 16px;
	}

	.dialog-content {
		padding: 12px 0;
	}

	.chat-history {
		padding: 0 12px;
	}

	.message-container {
		max-width: 90%;
	}

	.chat-input {
		padding: 0 12px 12px;
	}

	.chat-input textarea {
		padding: 12px 16px;
		font-size: 14px;
	}

	.chat-input button {
		padding: 0 16px;
		font-size: 14px;
		min-width: 80px;
	}

	.drawer-container {
		width: 280px;
		left: -280px;
	}

	.drawer-container.drawer-open {
		transform: translateX(280px);
	}
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
	.message-content {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}

	.copy-button {
		background: var(--input-bg-color);
	}

	.drawer-container {
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
	}
}

/* Markdown content styles */
.ai-message {
	position: relative;
}

.ai :deep(h1),
.ai :deep(h2),
.ai :deep(h3),
.ai :deep(h4),
.ai :deep(h5),
.ai :deep(h6) {
	margin-top: 1em;
	margin-bottom: 0.5em;
	font-weight: 600;
	line-height: 1.3;
}

.ai :deep(p) {
	margin-bottom: 1em;
	line-height: 1.6;
}

.ai :deep(ul),
.ai :deep(ol) {
	margin-bottom: 1em;
	padding-left: 1.5em;
}

.ai :deep(li) {
	margin-bottom: 0.5em;
}

.ai :deep(code) {
	background-color: rgba(0, 0, 0, 0.05);
	padding: 0.2em 0.4em;
	border-radius: 4px;
	font-family: 'Fira Code', monospace;
	font-size: 0.9em;
}

.ai :deep(pre) {
	background-color: #1e1e1e;
	border-radius: 8px;
	padding: 16px;
	overflow: auto;
	margin: 1em 0;
	position: relative;
}

.ai :deep(pre code) {
	background-color: transparent;
	padding: 0;
	font-size: 0.9em;
	line-height: 1.5;
	font-family: 'Fira Code', monospace;
	color: #d4d4d4;
}

.ai :deep(pre code.hljs) {
	background-color: transparent;
	padding: 0;
}

/* 代码高亮主题相关的颜色 */
.ai :deep(.hljs-keyword),
.ai :deep(.hljs-selector-tag),
.ai :deep(.hljs-built_in),
.ai :deep(.hljs-name),
.ai :deep(.hljs-tag) {
	color: #569cd6;
}

.ai :deep(.hljs-string),
.ai :deep(.hljs-title),
.ai :deep(.hljs-section),
.ai :deep(.hljs-attribute),
.ai :deep(.hljs-literal),
.ai :deep(.hljs-template-tag),
.ai :deep(.hljs-template-variable),
.ai :deep(.hljs-type),
.ai :deep(.hljs-addition) {
	color: #ce9178;
}

.ai :deep(.hljs-comment),
.ai :deep(.hljs-quote),
.ai :deep(.hljs-deletion),
.ai :deep(.hljs-meta) {
	color: #6a9955;
}

.ai :deep(.hljs-number),
.ai :deep(.hljs-regexp),
.ai :deep(.hljs-symbol),
.ai :deep(.hljs-variable),
.ai :deep(.hljs-template-variable),
.ai :deep(.hljs-link),
.ai :deep(.hljs-selector-attr),
.ai :deep(.hljs-selector-pseudo) {
	color: #b5cea8;
}

.ai :deep(blockquote) {
	border-left: 4px solid var(--button-bg-color);
	padding: 0.5em 1em;
	margin: 1em 0;
	background-color: rgba(0, 0, 0, 0.03);
	border-radius: 4px;
}

.ai :deep(a) {
	color: var(--button-bg-color);
	text-decoration: none;
	border-bottom: 1px solid transparent;
	transition: all 0.2s ease;
}

.ai :deep(a:hover) {
	border-bottom-color: currentColor;
}

.ai :deep(table) {
	width: 100%;
	border-collapse: collapse;
	margin: 1em 0;
	font-size: 0.9em;
}

.ai :deep(th),
.ai :deep(td) {
	border: 1px solid var(--input-border-color);
	padding: 0.5em 0.8em;
	text-align: left;
}

.ai :deep(th) {
	background-color: rgba(0, 0, 0, 0.03);
	font-weight: 600;
}

.ai :deep(tr:nth-child(even)) {
	background-color: rgba(0, 0, 0, 0.02);
}

/* Loading animation for AI response */
@keyframes typing {
	0% {
		opacity: 0.3;
	}
	50% {
		opacity: 1;
	}
	100% {
		opacity: 0.3;
	}
}

.ai-typing {
	display: flex;
	gap: 4px;
	padding: 8px 12px;
	background-color: var(--input-bg-color);
	border-radius: 16px;
	width: fit-content;
}

.ai-typing span {
	width: 6px;
	height: 6px;
	background-color: var(--text-color);
	border-radius: 50%;
	animation: typing 1s infinite;
}

.ai-typing span:nth-child(2) {
	animation-delay: 0.2s;
}

.ai-typing span:nth-child(3) {
	animation-delay: 0.4s;
}

/* 添加遮罩层样式 */
.drawer-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.3);
	z-index: 999;
	display: none;
}

.drawer-container.drawer-open + .drawer-overlay {
	display: block;
}

/* 修改抽屉容器的 z-index */
.drawer-container {
	position: fixed;
	left: -300px;
	top: 0;
	height: 100%;
	width: 300px;
	background-color: var(--bg-color);
	transition: transform 0.3s ease;
	box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
	z-index: 1000;
}

.drawer-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid var(--input-border-color);
}

.drawer-header-controls {
	display: flex;
	gap: 8px;
	align-items: center;
}

.clear-all-btn {
	background: none;
	border: none;
	cursor: pointer;
	padding: 4px;
	color: var(--text-color);
	opacity: 0.7;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.clear-all-btn:hover {
	opacity: 1;
	color: #ff4d4f;
}
</style>
