<script setup lang="ts">
import { ref, computed } from 'vue'
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useTodos } from '../composables/useTodos'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { getAIResponse } from '../services/deepseekService'

const {
	todos,
	history,
	addTodo,
	addMultipleTodos,
	toggleTodo,
	removeTodo,
	clearActiveTodos,
	restoreHistory,
	deleteHistoryItem,
	deleteAllHistory,
	updateTodosOrder,
} = useTodos()
const { error: duplicateError, showError } = useErrorHandler()
const { showConfirmDialog, confirmDialogConfig, handleConfirm, handleCancel } =
	useConfirmDialog()

const filter = ref('active')
const showHistory = ref(false)
const MAX_TODO_LENGTH = 50

const filteredTodos = computed(() => {
	if (filter.value === 'active') {
		return todos.value.filter(todo => todo && !todo.completed)
	} else if (filter.value === 'completed') {
		return todos.value.filter(todo => todo && todo.completed)
	}
	return todos.value.filter(todo => todo !== null && todo !== undefined)
})

const historicalTodos = computed(() => {
	return history.value.flatMap(item => item.todos.map(todo => todo.text))
})

const toggleHistory = () => {
	showHistory.value = !showHistory.value
}

const hasActiveTodos = computed(() => {
	return todos.value.some(todo => todo && !todo.completed)
})

const clearActive = () => {
	showConfirmDialog.value = true
	confirmDialogConfig.value = {
		title: '清除未完成的待办事项',
		message: '确定要清除所有未完成的待办事项吗？此操作不可撤销。',
		confirmText: '确定清除',
		cancelText: '取消',
		action: clearActiveTodos,
	}
}

const suggestedTodos = ref<string[]>([])
const showSuggestedTodos = ref(false)
const isGenerating = ref(false)

const generateSuggestedTodos = async () => {
	isGenerating.value = true
	try {
		const response = await getAIResponse(
			`请根据我的历史待办事项：${JSON.stringify(
				historicalTodos.value
			)}，为我预测生成 5 个建议的待办事项，直接输出待办事项结果，返回格式如"看《人类简史》,散步三十分钟"，如果无法很好预测生成，则生成五个对自我提升最佳的具体一点的待办事项。`
		)
		suggestedTodos.value = response
			.split(',')
			.filter((todo: string) => todo.trim() !== '')
			.slice(0, 5) // 确保只有 5 个建议
		showSuggestedTodos.value = true
	} catch (error) {
		console.error('生成建议待办事项时出错:', error)
		showError(
			error instanceof Error ? error.message : '生成建议待办事项时出错，请稍后再试。'
		)
	} finally {
		isGenerating.value = false
	}
}

const confirmSuggestedTodos = () => {
	const duplicates = addMultipleTodos(suggestedTodos.value)
	if (duplicates.length > 0) {
		showError(`以下待办事项已存在：${duplicates.join(', ')}`)
	}
	showSuggestedTodos.value = false
	suggestedTodos.value = []
}

const cancelSuggestedTodos = () => {
	showSuggestedTodos.value = false
	suggestedTodos.value = []
}

const updateSuggestedTodo = (index: number, newText: string) => {
	suggestedTodos.value[index] = newText
}

const closeHistory = () => {
	showHistory.value = false
}

const isSorting = ref(false)

const sortActiveTodosWithAI = async () => {
	isSorting.value = true
	try {
		const activeTodos = todos.value.filter(todo => todo && !todo.completed)
		const todoTexts = activeTodos
			.map((todo, index) => `${index + 1}. ${todo.text}`)
			.join('\n')
		const prompt = `请对以下每项待办事项按照最佳优先级顺序进行排序，只返回排序后的编号（如 1,3,2,4）：\n${todoTexts}`
		const response = await getAIResponse(prompt)
		if (!response) {
			throw new Error('AI 返回了空响应')
		}
		const newOrder = response.split(',').map(Number)
		if (newOrder.length !== activeTodos.length) {
			throw new Error('AI 返回的排序数量与待办事项数量不匹配')
		}
		updateTodosOrder(newOrder)
	} catch (error) {
		console.error('AI 排序出错:', error)
		showError(error instanceof Error ? error.message : 'AI 排序失败，请稍后再试。')
	} finally {
		isSorting.value = false
	}
}

const isLoading = computed(() => isSorting.value)

const handleAddTodo = (text: string) => {
	const success = addTodo(text)
	if (!success) {
		showError('该待办事项已存在，请勿重复添加。')
	}
}
</script>

<template>
	<div class="todo-list" :class="{ 'is-loading': isLoading }">
		<!-- 添加 loading 遮罩层 -->
		<div v-if="isLoading" class="loading-overlay">
			<div class="loading-spinner"></div>
			<p>AI 正在排序中，请稍候...</p>
		</div>
		<div class="header">
			<h1>todo</h1>
			<div class="header-actions">
				<button
					@click="toggleHistory"
					class="icon-button"
					:class="{ active: showHistory }"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="24"
						height="24"
					>
						<path fill="none" d="M0 0h24v24H0z" />
						<path
							d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
						/>
					</svg>
					<span class="sr-only">历史记录</span>
				</button>
				<router-link to="/ai-assistant" class="icon-button">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="24"
						height="24"
						fill="currentColor"
					>
						<path
							d="M13.5 2.6v2.8H12v-2.8h1.5zm5.1 2.1l-2 2-1.1-1.1 2-2 1.1 1.1zm-10.2 0l1.1-1.1 2 2-1.1 1.1-2-2zm5.1 1.3c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zM5.5 19.4l-2-2 1.1-1.1 2 2-1.1 1.1zm13-2l2 2-1.1 1.1-2-2 1.1-1.1zM12 21.4v-2.8h1.5v2.8H12z"
						/>
					</svg>
					<span>AI 助手</span>
				</router-link>
			</div>
		</div>
		<TodoInput
			:maxLength="MAX_TODO_LENGTH"
			@add="handleAddTodo"
			:duplicateError="duplicateError"
		/>
		<TodoFilters v-model:filter="filter" />
		<div class="todo-grid">
			<TodoItem
				v-for="todo in filteredTodos"
				:key="todo.id"
				:todo="todo"
				@toggle="toggleTodo"
				@remove="removeTodo"
			/>
		</div>
		<div class="actions">
			<button
				v-if="filter === 'active' && hasActiveTodos"
				@click="clearActive"
				class="clear-btn"
			>
				清除待完成
			</button>
			<button
				@click="generateSuggestedTodos"
				class="generate-btn"
				:disabled="isGenerating"
			>
				{{ isGenerating ? '正在生成...' : '生成建议待办事项' }}
			</button>
			<!-- 新增：AI 排序按钮 -->
			<button
				v-if="hasActiveTodos"
				@click="sortActiveTodosWithAI"
				class="sort-btn"
				:disabled="isSorting"
			>
				<span>AI 优先级排序</span>
			</button>
		</div>
		<ConfirmDialog
			:show="showConfirmDialog"
			:title="confirmDialogConfig.title"
			:message="confirmDialogConfig.message"
			:confirmText="confirmDialogConfig.confirmText"
			:cancelText="confirmDialogConfig.cancelText"
			@confirm="handleConfirm"
			@cancel="handleCancel"
		/>

		<!-- 新增：建议待办事项确认对话框 -->
		<div v-if="showSuggestedTodos" class="suggested-todos-dialog">
			<h3>建议的待办事项</h3>
			<p>请确认或修改以下建议的待办事项：</p>
			<ul>
				<li v-for="(todo, index) in suggestedTodos" :key="index">
					<input
						:value="todo"
						@input="(event: Event) => updateSuggestedTodo(index, (event.target as HTMLInputElement).value)"
						class="suggested-todo-input"
					/>
				</li>
			</ul>
			<div class="dialog-actions">
				<button @click="confirmSuggestedTodos" class="confirm-btn">确认添加</button>
				<button @click="cancelSuggestedTodos" class="cancel-btn">取消</button>
			</div>
		</div>
	</div>
	<transition name="slide">
		<HistorySidebar
			v-if="showHistory"
			:history="history"
			@restore="restoreHistory"
			@deleteItem="deleteHistoryItem"
			@deleteAll="deleteAllHistory"
			@close="closeHistory"
		/>
	</transition>
</template>

<style scoped>
.todo-list {
	font-family: 'LXGW WenKai Screen', sans-serif;
	max-width: 600px;
	width: 90%;
	margin: 0 auto;
	padding: 2rem;
	background-color: rgba(255, 255, 255, 0.9);
	border-radius: var(--border-radius);
	box-shadow: var(--box-shadow);
	backdrop-filter: blur(10px);
	position: relative;
	min-height: 300px;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
}

h1 {
	color: #ff7e67;
	font-size: 2.6rem;
	font-weight: 700;
	margin: 0;
}

.header-actions {
	display: flex;
	gap: 1rem;
}

.todo-grid {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 2rem;
}

.icon-button {
	background: none;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #ff9a8b;
	font-weight: bold;
	transition: all 0.3s ease;
}

.icon-button svg {
	fill: currentColor;
}

.icon-button:hover,
.icon-button.active {
	color: #ff7e67;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}

.actions {
	display: flex;
	justify-content: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
}

.clear-btn,
.generate-btn,
.sort-btn {
	padding: 0.5rem 1rem;
	font-size: 0.9rem;
	min-width: 120px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.clear-btn {
	background-color: #ffa8a8;
	color: white;
	border: none;
	border-radius: 20px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.clear-btn:hover {
	background-color: #ff9a9a;
}

.generate-btn {
	background-color: #ff9a8b;
	color: white;
	border: none;
	border-radius: 20px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.generate-btn:hover:not(:disabled) {
	background-color: #ff8c7f;
}

.generate-btn:disabled {
	background-color: #95a5a6;
	cursor: not-allowed;
}

.sort-btn {
	background-color: #3498db;
	color: white;
	position: relative;
}

.sort-btn:hover:not(:disabled) {
	background-color: #2980b9;
}

.sort-btn:disabled {
	background-color: #95a5a6;
	cursor: not-allowed;
}

.loading-spinner {
	display: inline-block;
	width: 20px;
	height: 20px;
	border: 2px solid #ffffff;
	border-radius: 50%;
	border-top: 2px solid #3498db;
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

.todo-list.is-loading {
	pointer-events: none;
	opacity: 0.7;
}

.loading-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(255, 255, 255, 0.8);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.loading-overlay p {
	margin-top: 1rem;
	font-size: 1.2rem;
	color: #3498db;
}

.loading-spinner {
	width: 50px;
	height: 50px;
	border: 4px solid #3498db;
	border-top: 4px solid transparent;
	border-radius: 50%;
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
	.todo-list {
		width: 95%;
		padding: 1rem;
	}

	.header {
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
	}

	h1 {
		font-size: 1.8rem;
	}

	.header-actions {
		width: 100%;
		justify-content: space-between;
	}

	.clear-btn {
		width: 100%;
	}

	.actions {
		flex-direction: column;
		align-items: stretch;
	}

	.clear-btn,
	.generate-btn,
	.sort-btn {
		width: 100%;
	}
}

.slide-enter-active,
.slide-leave-active,
.slide-fade-enter-active,
.slide-fade-leave-active {
	transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
	transform: translateX(100%);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
	transform: translateX(100%);
	opacity: 0;
}

.list-enter-active,
.list-leave-active {
	transition: all 0.5s ease;
}

.list-enter-from {
	opacity: 0;
	transform: translateY(-30px);
}

.list-leave-to {
	opacity: 0;
	transform: translateY(30px);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.suggested-todos-dialog {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: white;
	padding: 2rem;
	border-radius: var(--border-radius);
	box-shadow: var(--box-shadow);
	z-index: 1000;
	max-width: 90%;
	width: 400px;
}

.suggested-todo-input {
	width: 100%;
	padding: 0.5rem;
	margin-bottom: 0.5rem;
	border: 1px solid #d5d8dc;
	border-radius: calc(var(--border-radius) / 2);
}

.dialog-actions {
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 1rem;
}

.confirm-btn,
.cancel-btn {
	padding: 0.5rem 1rem;
	font-size: 0.9rem;
	border: none;
	border-radius: calc(var(--border-radius) / 2);
	cursor: pointer;
	transition: all 0.3s ease;
}

.confirm-btn {
	background-color: #4caf50;
	color: white;
}

.confirm-btn:hover {
	background-color: #45a049;
}

.cancel-btn {
	background-color: #ff7043;
	color: white;
}

.cancel-btn:hover {
	background-color: #f4511e;
}
</style>
