<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch, computed } from 'vue'
import {
	getAIStreamResponse,
	abortCurrentRequest,
	Message,
} from '../services/deepseekService'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 您可以选择其他样式

const emit = defineEmits(['close'])

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

	try {
		// 创建一个包含历史消息的数组，但不包括空的 AI 回复
		const messages: Message[] = chatHistory.value
			.filter(msg => msg.content.trim() !== '') // 过滤掉空消息
			.map(msg => ({
				role: msg.role === 'user' ? 'user' : 'assistant',
				content: msg.content,
			}))

		let aiResponse = ''
		await getAIStreamResponse(messages, chunk => {
			if (chunk === '[DONE]' || chunk === '[ABORTED]') {
				isGenerating.value = false
				return
			}
			aiResponse += chunk
			currentAIResponse.value = aiResponse
			nextTick(scrollToBottom)
		})

		// 在接收到完整响应后，再将 AI 回复添加到聊天历史
		chatHistory.value.push({ role: 'ai', content: aiResponse })
	} catch (error) {
		console.error('获取 AI 回复时出错:', error)
		chatHistory.value.push({
			role: 'ai',
			content: '抱歉，获取 AI 回复时出现错误。请稍后再试。',
		})
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
	const rawHtml = marked.parse(content)
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

const handleEscKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		emit('close')
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
	document.addEventListener('keydown', handleEscKey)
	if (inputRef.value) {
		inputRef.value.focus()
	}
})

onUnmounted(() => {
	document.removeEventListener('keydown', handleEscKey)
})

watch(chatHistory, scrollToBottom, { deep: true, immediate: true })
</script>

<template>
	<div class="ai-chat-dialog">
		<div class="dialog-header">
			<h2>AI 助手</h2>
			<button @click="$emit('close')" class="close-button" aria-label="关闭">
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
			</button>
		</div>
		<div class="dialog-content">
			<div ref="chatHistoryRef" class="chat-history">
				<div
					v-for="(message, index) in sanitizedMessages"
					:key="index"
					class="message-container"
					:class="message.role"
				>
					<div class="message-content">
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
					placeholder="询问 AI 助手... (按 Shift + Enter 换行，Enter 发送)"
					:disabled="isGenerating"
				></textarea>
				<button v-if="!isGenerating" @click="sendMessage">发送</button>
				<button v-else @click="stopGenerating" class="stop-btn">停止</button>
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
	background-color: #fff6f6;
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
	background-color: #ff9a8b;
	color: white;
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
	color: white;
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
	height: calc(100% - 60px); /* 减去头部高度 */
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
	background-color: #ff9a8b;
	color: white;
}

.ai {
	align-self: flex-start;
}

.ai .message-content {
	background-color: #ffecd2;
	color: #3c3c3c;
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
	border: 1px solid #ffd3c5;
	border-radius: 24px;
	outline: none;
	transition: all 0.3s ease;
	background-color: #fff0eb;
	resize: vertical;
	max-height: 150px;
	font-family: inherit;
}

.chat-input textarea:focus {
	border-color: #ff9a8b;
	box-shadow: 0 0 0 2px rgba(255, 154, 139, 0.2);
}

.chat-input button {
	padding: 12px 24px;
	font-size: 16px;
	background-color: #ff9a8b;
	color: white;
	border: none;
	border-radius: 24px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.chat-input button:hover:not(:disabled) {
	background-color: #ff8c7f;
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.chat-input button:disabled {
	background-color: #ffc1b5;
	cursor: not-allowed;
}

.loading-spinner {
	display: inline-block;
	width: 20px;
	height: 20px;
	border: 2px solid #ffffff;
	border-radius: 50%;
	border-top: 2px solid #ff9a8b;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
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
		height: calc(100% - 52px); /* 调整移动端头部高度 */
	}

	.chat-input {
		padding: 0 16px 16px;
	}
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
	background-color: rgba(0, 0, 0, 0.05);
	padding: 0.2em 0.4em;
	border-radius: 3px;
	font-family: monospace;
}

.ai :deep(pre) {
	background-color: #f6f8fa;
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
	border-left: 4px solid #ff9a8b;
	padding-left: 0.8em;
	margin-left: 0;
	margin-right: 0;
	font-style: italic;
}

.ai :deep(a) {
	color: #ff9a8b;
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
	border: 1px solid #ddd;
	padding: 0.4em;
}

.ai :deep(th) {
	background-color: rgba(0, 0, 0, 0.05);
	font-weight: bold;
}

.stop-btn {
	background-color: #e74c3c;
}

.stop-btn:hover {
	background-color: #c0392b;
}
</style>
