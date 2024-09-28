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

		// 添加语言指示到消息中
		const languageInstruction =
			locale.value === 'zh' ? '请用中文回复。' : '请用英文或者用户输入的语言回复。'
		messages.unshift({ role: 'system', content: languageInstruction })

		await getAIStreamResponse(messages, chunk => {
			if (chunk === '[DONE]' || chunk === '[ABORTED]') {
				isGenerating.value = false
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
	font-family: 'LXGW WenKai Screen', sans-serif;
	position: fixed;
	overflow: hidden;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: var(--bg-color);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	z-index: 1000;
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
	padding: 20px;
	overflow: hidden;
	height: calc(100% - 60px);
}

.chat-history {
	flex-grow: 1;
	overflow-y: auto;
	margin-bottom: 20px;
	display: flex;
	flex-direction: column;
	padding-right: 10px;
	scroll-behavior: smooth;
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
</style>
