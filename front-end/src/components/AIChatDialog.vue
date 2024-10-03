<script setup lang="ts">
import { ref, nextTick, onMounted, watch, computed } from 'vue'
import {
	getAIStreamResponse,
	abortCurrentRequest,
	Message,
} from '../services/deepseekService'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github.css'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

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
}

// 修改: 切换对话的函数
const switchConversation = (id: number) => {
	currentConversationId.value = id
	const conversation = conversationHistory.value.find(c => c.id === id)
	if (conversation) {
		chatHistory.value = [...conversation.messages] // 使用扩展运算符创建新数组
	}
	isDrawerOpen.value = false // 切换对话后关闭抽屉
}

// 新增: 删除对话
const deleteConversation = (id: number) => {
	conversationHistory.value = conversationHistory.value.filter(c => c.id !== id)
	if (currentConversationId.value === id) {
		if (conversationHistory.value.length > 0) {
			switchConversation(conversationHistory.value[0].id)
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

// 新增: 点击非抽屉区域时关闭抽屉
const closeDrawerOnOutsideClick = (event: MouseEvent) => {
	const drawer = document.querySelector('.drawer-container')
	const toggleButton = document.querySelector('.toggle-drawer-btn')
	if (
		isDrawerOpen.value &&
		drawer &&
		!drawer.contains(event.target as Node) &&
		event.target !== toggleButton
	) {
		isDrawerOpen.value = false
	}
}

const sendMessage = async () => {
	if (!userMessage.value.trim()) return

	const userMessageContent = userMessage.value
	chatHistory.value.push({ role: 'user', content: userMessageContent })
	userMessage.value = ''
	isGenerating.value = true
	currentAIResponse.value = ''

	const aiResponseIndex = chatHistory.value.length
	chatHistory.value.push({ role: 'ai', content: '' })

	try {
		const messages: Message[] = chatHistory.value
			.filter(msg => msg.content.trim() !== '')
			.map(msg => ({
				role: msg.role === 'user' ? 'user' : 'assistant',
				content: msg.content,
			}))

		const languageInstruction =
			locale.value === 'zh' ? '请用中文回复。' : '请用英文回复。'
		messages.unshift({ role: 'system', content: languageInstruction })

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
						// 更新对话标题
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
			nextTick(scrollToBottom)
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

const scrollToBottom = () => {
	if (chatHistoryRef.value) {
		chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
	}
}

const newline = (event: KeyboardEvent) => {
	const textarea = event.target as HTMLTextAreaElement
	const start = textarea.selectionStart
	const end = textarea.selectionEnd
	const value = textarea.value
	textarea.value = value.substring(0, start) + '\n' + value.substring(end)
	textarea.selectionStart = textarea.selectionEnd = start + 1
}

onMounted(() => {
	if (inputRef.value) {
		inputRef.value.focus()
	}
	loadConversationHistory()
	if (conversationHistory.value.length === 0) {
		createNewConversation()
	} else {
		switchConversation(conversationHistory.value[0].id)
	}
	document.addEventListener('click', closeDrawerOnOutsideClick)
})

watch([chatHistory, currentAIResponse], scrollToBottom, { deep: true, immediate: true })
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
		<div class="dialog-content">
			<div class="drawer-container" :class="{ 'drawer-open': isDrawerOpen }">
				<div class="drawer">
					<div class="drawer-header">
						<h3 class="drawer-title">{{ t('conversations') }}</h3>
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
			<div ref="chatHistoryRef" class="chat-history">
				<div
					v-for="(message, index) in sanitizedMessages"
					:key="index"
					class="message-container"
					:class="message.role"
				>
					<div class="message-content" dir="ltr">
						<p v-if="message.role === 'user'">{{ message.content }}</p>
						<div v-else v-html="message.sanitizedContent"></div>
					</div>
				</div>
			</div>
			<div class="conversation-controls">
				<button @click="createNewConversation" class="new-conversation-btn">
					{{ t('newConversation') }}
				</button>
				<!-- 修改: 更新抽屉切换按钮 -->
				<button @click="toggleDrawer" class="toggle-drawer-btn">
					{{ isDrawerOpen ? t('hideConversations') : t('showConversations') }}
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
				<button v-if="!isGenerating" @click="sendMessage">{{ t('send') }}</button>
				<button v-else @click="stopGenerating" class="stop-btn">{{ t('stop') }}</button>
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
	z-index: 1000;
	text-align: left;
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15px 25px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dialog-header h2 {
	margin: 0;
	font-size: 24px;
	font-weight: 500;
}

.close-button {
	background: none;
	border: none;
	color: var(--card-bg-color);
	cursor: pointer;
	transition: all 0.2s ease;
	padding: 5px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.close-button:hover {
	transform: scale(1.1);
}

.dialog-content {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	padding: 20px 0;
	overflow: hidden;
	height: calc(100% - 60px);
}

.chat-history {
	flex-grow: 1;
	overflow-y: auto;
	margin-bottom: 20px;
	display: flex;
	flex-direction: column;
	scroll-behavior: smooth;
	padding-right: 20px;
	height: 100%;
}

.message-container {
	max-width: 80%;
	margin-bottom: 10px;
	animation: fadeIn 0.3s ease-out;
}

.message-content {
	padding: 6px 10px;
	border-radius: 18px;
	line-height: 1.6;
	font-size: 16px;
	direction: ltr;
	unicode-bidi: isolate;
	text-align: left;
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
}

.user .message-content {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
}

.ai {
	align-self: flex-start;
}

.ai .message-content {
	background-color: var(--input-bg-color);
	color: var(--text-color);
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.chat-input {
	display: flex;
	gap: 10px;
	padding: 0 10px 10px;
}

.chat-input textarea {
	flex-grow: 1;
	padding: 12px 16px;
	font-size: 16px;
	border: 1px solid var(--input-border-color);
	border-radius: 24px;
	outline: none;
	transition: all 0.3s ease;
	background-color: var(--input-bg-color);
	color: var(--text-color);
	resize: vertical;
	max-height: 150px;
	font-family: inherit;
}

.chat-input textarea:focus {
	border-color: var(--button-bg-color);
	box-shadow: 0 0 0 2px rgba(255, 154, 139, 0.2);
}

.chat-input button {
	padding: 12px 24px;
	font-size: 16px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 24px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.chat-input button:hover:not(:disabled) {
	background-color: var(--button-hover-bg-color);
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.chat-input button:disabled {
	background-color: var(--input-border-color);
	cursor: not-allowed;
}

/* 添加 Markdown 渲染相关的样式 */
.ai :deep(h1),
.ai :deep(h2),
.ai :deep(h3),
.ai :deep(h4),
.ai :deep(h5),
.ai :deep(h6) {
	margin-top: 0.8em;
	margin-bottom: 0.4em;
	font-weight: bold;
	color: var(--text-color);
}

.ai :deep(p) {
	margin-bottom: 0.8em;
}

.ai :deep(ul),
.ai :deep(ol) {
	margin-bottom: 0.8em;
	padding-left: 1.5em;
}

.ai :deep(li) {
	margin-bottom: 0.4em;
}

.ai :deep(code) {
	background-color: var(--input-bg-color);
	padding: 0.2em 0.4em;
	border-radius: 3px;
	font-family: monospace;
	color: var(--text-color);
}

.ai :deep(pre) {
	background-color: var(--input-bg-color);
	border-radius: 6px;
	padding: 16px;
	overflow: auto;
}

.ai :deep(pre code) {
	background-color: transparent;
	padding: 0;
}

.ai :deep(.hljs) {
	background: transparent;
}

.ai :deep(blockquote) {
	border-left: 4px solid var(--button-bg-color);
	padding-left: 0.8em;
	margin-left: 0;
	margin-right: 0;
	font-style: italic;
	color: var(--text-color);
}

.ai :deep(a) {
	color: var(--button-bg-color);
	text-decoration: none;
}

.ai :deep(a:hover) {
	text-decoration: underline;
}

.ai :deep(table) {
	border-collapse: collapse;
	margin-bottom: 0.8em;
	width: 100%;
}

.ai :deep(th),
.ai :deep(td) {
	border: 1px solid var(--input-border-color);
	padding: 0.4em;
}

.ai :deep(th) {
	background-color: var(--input-bg-color);
	font-weight: bold;
}

.stop-btn {
	background-color: var(--button-hover-bg-color);
}

.stop-btn:hover {
	background-color: var(--button-bg-color);
}

@media (max-width: 768px) {
	.dialog-header {
		padding: 12px 16px;
	}

	.dialog-header h2 {
		font-size: 20px;
	}

	.dialog-content {
		padding: 16px;
		height: calc(100% - 52px);
	}

	.chat-input {
		padding: 0 16px 16px;
	}
}

.conversation-list {
	overflow-y: auto;
}

.new-conversation-btn {
	padding: 8px 10px;
	margin-bottom: 10px;
	margin-left: 14px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 4px;
	cursor: pointer;
}

.conversation-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 5px;
	margin-bottom: 5px;
	cursor: pointer;
}

.conversation-item span {
	flex-grow: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.conversation-item span.active {
	font-weight: bold;
}

.delete-conversation-btn {
	background: none;
	border: none;
	color: var(--button-bg-color);
	cursor: pointer;
}

.dialog-content {
	display: flex;
}

.chat-history {
	flex-grow: 1;
	padding-left: 20px;
}

.chat-history.full-width {
	padding-left: 0;
}

.toggle-drawer-btn {
	border: 1px solid var(--card-bg-color);
	color: var(--card-bg-color);
	padding: 10px;
	font-size: 14px;
	margin-right: 10px;
	transition: all 0.3s ease;
	margin-left: 14px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 4px;
	cursor: pointer;
	margin-bottom: 10px;
}

.conversation-controls {
	display: flex;
	align-items: center;
}

.drawer-container {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: 280px;
	z-index: 10;
	transition: transform 0.3s ease;
	transform: translateX(-100%);
	background-color: var(--card-bg-color);
	box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.drawer-container.drawer-open {
	transform: translateX(0);
}

.drawer {
	width: 280px;
	height: 100%;
	background-color: var(--card-bg-color);
	display: flex;
	flex-direction: column;
}

.drawer-title {
	padding: 6px 8px;
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: var(--text-color);
}

.conversation-list {
	flex-grow: 1;
	overflow-y: auto;
	padding: 10px;
}

.conversation-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	margin-bottom: 5px;
	cursor: pointer;
	border-radius: 8px;
	transition: background-color 0.2s ease;
}

.conversation-item:hover {
	background-color: var(--input-bg-color);
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
	margin-right: 10px;
}

.delete-conversation-btn {
	background: none;
	border: none;
	cursor: pointer;
	opacity: 0.6;
	transition: opacity 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.delete-conversation-btn:hover {
	opacity: 1;
}

.delete-conversation-btn svg {
	fill: currentColor;
}

.chat-history {
	height: 100%;
	overflow-y: auto;
}

.toggle-drawer-btn {
	padding: 8px 16px;
	font-size: 14px;
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 20px;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.toggle-drawer-btn:hover {
	background-color: var(--button-hover-bg-color);
}

.toggle-drawer-btn svg {
	margin-right: 5px;
}

@media (max-width: 768px) {
	.drawer {
		width: 100%;
	}
}

.drawer-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 16px;
	border-bottom: 1px solid var(--input-border-color);
}

.close-drawer-btn {
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
	color: var(--text-color);
	transition: color 0.3s ease;
}

.close-drawer-btn:hover {
	color: var(--button-bg-color);
}

.close-drawer-btn svg {
	fill: currentColor;
}
</style>
