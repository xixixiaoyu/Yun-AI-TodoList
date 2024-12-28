<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TodoInput from './TodoInput.vue'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import HistorySidebar from './HistorySidebar.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useTodos } from '../composables/useTodos'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { getAIResponse } from '../services/deepseekService'
import { useTheme } from '../composables/useTheme'
import { useI18n } from 'vue-i18n'
import PomodoroTimer from './PomodoroTimer.vue'
import confetti from 'canvas-confetti'
import PomodoroStats from './PomodoroStats.vue'
import TodoHeatmap from './TodoHeatmap.vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useRouter } from 'vue-router'
import AddProjectModal from './AddProjectModal.vue'
import { useWindowSize } from '@vueuse/core'

const router = useRouter()

// useTodos 组合函数获取待办事项相关的状态和方
const {
	todos,
	projects,
	currentProjectId,
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
	addProject,
	removeProject,
	setCurrentProject,
	saveTodos,
} = useTodos()

// 创建待办事项列表的 ref，用于拖拽排序功能
const todoListRef = ref<HTMLElement | null>(null)
// 使用 useSortable 为待办事项列表添加拖拽排序功能
const { option } = useSortable(todoListRef, todos, {
	animation: 150,
})

option('animation', 150)
// 使用错误处理和确认对话框的组合式函数
const { error: duplicateError, showError } = useErrorHandler()
const { showConfirmDialog, confirmDialogConfig, handleConfirm, handleCancel } =
	useConfirmDialog()

// 使用主题和国际化的组合式函数
const { theme, toggleTheme } = useTheme()
const { t, locale } = useI18n()

// 定义过滤器状态和历史记录显示状态
const filter = ref('active')
const showHistory = ref(false)
const MAX_TODO_LENGTH = 50

// 根据过滤器计算待显示的待办事项
const filteredTodos = computed(() => {
	let filtered = todos.value
	if (currentProjectId.value !== null) {
		filtered = filtered.filter(todo => todo.projectId === currentProjectId.value)
	}
	if (filter.value === 'active') {
		return filtered.filter(todo => todo && !todo.completed)
	} else if (filter.value === 'completed') {
		return filtered.filter(todo => todo && todo.completed)
	}
	return filtered.filter(todo => todo !== null && todo !== undefined)
})

// 计算历史待办事项
const historicalTodos = computed(() => {
	return history.value.flatMap(item => item.todos.map(todo => todo.text))
})

// 切换历史记录显示状态
const toggleHistory = () => {
	showHistory.value = !showHistory.value
}

// 检查是否有未完成的待办事项
const hasActiveTodos = computed(() => {
	return todos.value.some(todo => todo && !todo.completed)
})

// 清除已完成的待办事项
const clearActive = () => {
	showConfirmDialog.value = true
	confirmDialogConfig.value = {
		title: t('clearCompleted'),
		message: t('confirmClearCompleted'),
		confirmText: t('confirm'),
		cancelText: t('cancel'),
		action: clearActiveTodos,
	}
}

// 定义建议待办事项相关的状态
const suggestedTodos = ref<string[]>([])
const showSuggestedTodos = ref(false)
const isGenerating = ref(false)

// 生成建议待办事项
const generateSuggestedTodos = async () => {
	isGenerating.value = true
	try {
		const response = await getAIResponse(
			`${t('generateSuggestionsPrompt')}`,
			locale.value,
			1.5
		)
		suggestedTodos.value = response
			.split(',')
			.filter((todo: string) => todo.trim() !== '')
			.slice(0, 5) // 确保只有 5 个建议
		showSuggestedTodos.value = true
	} catch (error) {
		console.error(t('generateSuggestionsError'), error)
		showError(error instanceof Error ? error.message : t('generateSuggestionsError'))
	} finally {
		isGenerating.value = false
	}
}

// 确认添加建议待办事项
const confirmSuggestedTodos = () => {
	const duplicates = addMultipleTodos(
		suggestedTodos.value.map(todo => ({
			text: todo,
			projectId: currentProjectId.value,
		}))
	)
	if (duplicates.length > 0) {
		showError(`${t('duplicateError')}：${duplicates.join(', ')}`)
	}
	showSuggestedTodos.value = false
	suggestedTodos.value = []
}

// 取消添加建议待办事项
const cancelSuggestedTodos = () => {
	showSuggestedTodos.value = false
	suggestedTodos.value = []
}

// 更新建议待办事项的内容
const updateSuggestedTodo = (index: number, newText: string) => {
	suggestedTodos.value[index] = newText
}

// 关闭历史记录侧边栏
const closeHistory = () => {
	showHistory.value = false
}

// 定义 AI 排序相关的状态
const isSorting = ref(false)

// 使用 AI 对未完成的待办事项进行排序
const sortActiveTodosWithAI = async () => {
	isSorting.value = true
	try {
		// 修改这里：确保过滤掉 null 和 undefined 的待办事项
		const activeTodos = todos.value.filter(todo => todo && !todo.completed)
		if (activeTodos.length === 0) {
			showError(t('noActiveTodosError'))
			return
		}
		const todoTexts = activeTodos
			.map((todo, index) => `${index + 1}. ${todo.text}`)
			.join('\n')
		const prompt = `${t('sortPrompt')}:\n${todoTexts}`
		const response = await getAIResponse(prompt, locale.value, 0.1)
		if (!response) {
			throw new Error(t('aiEmptyResponseError'))
		}
		const newOrder = response.split(',').map(Number)
		if (newOrder.length !== activeTodos.length) {
			throw new Error(t('aiSortMismatchError'))
		}

		// 修改这里：创建一个新的排序后的数组
		const sortedTodos = newOrder.map(index => activeTodos[index - 1])

		// 更新 todos 数组，保持已完成的待办事项在原位置
		todos.value = todos.value.map(todo => {
			if (!todo || todo.completed) {
				return todo
			}
			return sortedTodos.shift() || todo
		})

		// 保存更新后的待办事项列表
		saveTodos()
	} catch (error) {
		console.error(t('aiSortError'), error)
		showError(error instanceof Error ? error.message : t('aiSortError'))
	} finally {
		isSorting.value = false
	}
}

// 计算是否正在加载中
const isLoading = computed(() => isSorting.value)

// 处理添加新待办事项
const handleAddTodo = (text: string, tags: string[]) => {
	if (text && text.trim() !== '') {
		const success = addTodo(text, tags)
		if (!success) {
			showError(t('duplicateError'))
		}
	} else {
		showError(t('emptyTodoError'))
	}
}

// 计算主题图标
const themeIcon = computed(() => {
	if (theme.value === 'auto') {
		return 'auto'
	}
	return theme.value === 'light' ? 'moon' : 'sun'
})

// 计算主题切换提示文本
const themeTooltip = computed(() => {
	switch (theme.value) {
		case 'light':
			return t('switchToDarkMode')
		case 'dark':
			return t('switchToAutoMode')
		case 'auto':
			return t('switchToLightMode')
		default:
			return t('switchToLightMode')
	}
})

// 显示大型礼花效果
const showBigConfetti = () => {
	confetti({
		particleCount: 300,
		spread: 100,
		origin: { y: 0.6 },
	})
}

// 处理番茄钟完成事件
const handlePomodoroComplete = (isBreakStarted: boolean) => {
	if (isBreakStarted) {
		// 只有在休息时间开始时才显示礼花效果
		showBigConfetti()
		// 设置一个标志，表示番茄钟已完成，以便在页面重新获得焦点时再次显示
		localStorage.setItem('pomodoroCompleted', 'true')
	} else {
		// 工作时间开始时，不显示礼花，也不设置标志
		localStorage.removeItem('pomodoroCompleted')
	}
}

// 检查番茄钟完成状态并显示礼花效果
const checkPomodoroCompletion = () => {
	if (!document.hidden) {
		const pomodoroCompleted = localStorage.getItem('pomodoroCompleted')
		if (pomodoroCompleted === 'true') {
			showBigConfetti()
			localStorage.removeItem('pomodoroCompleted')
		}
	}
}

// 在组件挂载时添加事件监听器
onMounted(() => {
	document.addEventListener('visibilitychange', checkPomodoroCompletion)
	document.addEventListener('keydown', onKeyDown)
})

// 在组件卸载时移除事件监听器
onUnmounted(() => {
	document.removeEventListener('visibilitychange', checkPomodoroCompletion)
	document.removeEventListener('keydown', onKeyDown)
})

// 格式化日期函数
const formatDate = (date: string | Date) => {
	return format(new Date(date), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
}

// 添加新的 ref 来控制模态框的显示
const showAddProjectModal = ref(false)

// 修改 addNewProject 函数
const addNewProject = (name: string) => {
	addProject(name)
	showAddProjectModal.value = false
}

const currentProjectName = computed(() => {
	if (currentProjectId.value === null) {
		return t('allProjects')
	}
	const currentProject = projects.value.find(p => p.id === currentProjectId.value)
	return currentProject ? currentProject.name : ''
})

// 计算属性：获取最多3个项目
const displayedProjects = computed(() => {
	return [{ id: null, name: t('allProjects') }, ...projects.value.slice(0, 3)]
})

// 添加删除项目的函数
const deleteProject = (projectId: number) => {
	const project = projects.value.find(p => p.id === projectId)
	if (!project) return

	showConfirmDialog.value = true
	confirmDialogConfig.value = {
		title: t('deleteProject'),
		message: t('confirmDeleteProject', { name: project.name }),
		confirmText: t('confirm'),
		cancelText: t('cancel'),
		action: () => {
			removeProject(projectId)
			if (currentProjectId.value === projectId) {
				setCurrentProject(null)
			}
		},
	}
}

// 添加新的响应式变量
const showCharts = ref(false)

const { width } = useWindowSize()
const isSmallScreen = computed(() => width.value < 768)

// 添加 onKeyDown 函数
const onKeyDown = (event: KeyboardEvent) => {
	if (event.key === 'Escape' && showCharts.value) {
		showCharts.value = false
	}
}

// 添加 closeCharts 函数
const closeCharts = () => {
	showCharts.value = false
}
</script>

<template>
	<div class="todo-container" :class="{ 'small-screen': isSmallScreen }">
		<!-- 番茄钟计时器组件 -->
		<PomodoroTimer
			class="pomodoro-timer"
			:class="{ 'top-clock': !isSmallScreen }"
			@pomodoro-complete="handlePomodoroComplete"
		/>

		<div class="todo-list scrollable-container">
			<!-- 加载中遮罩层 -->
			<div v-if="isLoading" class="loading-overlay">
				<div class="loading-spinner"></div>
				<p>{{ t('sorting') }}</p>
			</div>
			<div class="header">
				<!-- 应用标题 -->
				<h1 style="margin-right: 10px">{{ t('appTitle') }}</h1>
				<div class="header-actions">
					<!-- 主题切换按钮 -->
					<button
						@click="toggleTheme"
						class="icon-button theme-toggle"
						:title="themeTooltip"
						:aria-label="themeTooltip"
					>
						<!-- 根据当前主题显示不同的图标 -->
						<svg
							v-if="themeIcon === 'moon'"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="24"
							height="24"
							fill="currentColor"
						>
							<path
								d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
							/>
						</svg>
						<svg
							v-else-if="themeIcon === 'sun'"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="24"
							height="24"
							fill="currentColor"
						>
							<path
								d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-4V3a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm0 18v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm10-10h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zM2 12h2a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2zm16.95-5.66l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm-14.9 14.9l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414zm14.9 0a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 1.414-1.414l1.414 1.414zm-14.9-14.9a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 1.414l-1.414 1.414z"
							/>
						</svg>
						<svg
							v-else
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="24"
							height="24"
							fill="currentColor"
						>
							<path
								d="M12 2C6.47 2 2 17.523 2 12S6.47 2 12 2s10 4.477 10 10-4.47 10-10 10-10-4.47-10-10zm0-2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.5 9.5h5v5h-5v-5z"
							/>
						</svg>
						{{ t('theme') }}
					</button>
					<!-- 历史记录按钮 -->
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
						<span>{{ t('history') }}</span>
					</button>

					<button @click="showCharts = !showCharts" class="icon-button">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="24"
							height="24"
							fill="currentColor"
						>
							<path
								d="M3 3v18h18v-2H5V3H3zm4 14h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-7h-2v7z"
							/>
						</svg>
						<span>{{ t('showCharts') }}</span>
					</button>
				</div>
			</div>

			<!-- 项目选择器和添加项目按钮 -->
			<div class="project-header" :class="{ 'small-screen': isSmallScreen }">
				<div class="project-tabs">
					<button
						v-for="project in displayedProjects"
						:key="project.id"
						:title="project.name"
						@click="setCurrentProject(project.id)"
						:class="{ active: currentProjectId === project.id }"
						class="project-tab"
					>
						{{ project.name }}
						<span
							v-if="project.id !== null"
							class="delete-project"
							@click.stop="deleteProject(project.id)"
							:title="t('deleteProject')"
						>
							&times;
						</span>
					</button>
				</div>
				<button @click="showAddProjectModal = true" class="add-project-btn">
					<i class="fas fa-plus"></i> {{ t('addProject') }}
				</button>
			</div>

			<!-- 待办事项输入组 -->
			<TodoInput
				:maxLength="MAX_TODO_LENGTH"
				@add="handleAddTodo"
				:duplicateError="duplicateError"
				:placeholder="t('addTodo')"
			/>

			<!-- 待办事项过滤器组件 -->
			<TodoFilters v-model:filter="filter" />
			<!-- 待办事项列表 -->
			<div ref="todoListRef" class="todo-grid">
				<TodoItem
					v-for="todo in filteredTodos"
					:key="todo.id"
					:todo="todo"
					@toggle="toggleTodo"
					@remove="removeTodo"
				/>
			</div>
			<!-- 操作按钮区域 -->
			<div class="actions">
				<!-- 清除已完成待办事项按钮 -->
				<button
					v-if="filter === 'active' && hasActiveTodos"
					@click="clearActive"
					class="clear-btn"
				>
					{{ t('clearCompleted') }}
				</button>
				<!-- 生成建议待办事项按钮 -->
				<button
					@click="generateSuggestedTodos"
					class="generate-btn"
					:disabled="isGenerating"
				>
					{{ isGenerating ? t('generating') : t('generateSuggestions') }}
				</button>
				<!-- AI优先级排序按钮 -->
				<button
					v-if="hasActiveTodos"
					@click="sortActiveTodosWithAI"
					class="sort-btn"
					:disabled="isSorting"
				>
					<span>{{ t('aiPrioritySort') }}</span>
				</button>
			</div>
			<!-- 确认对话框组件 -->
			<ConfirmDialog
				:show="showConfirmDialog"
				:title="confirmDialogConfig.title"
				:message="confirmDialogConfig.message"
				:confirmText="confirmDialogConfig.confirmText"
				:cancelText="confirmDialogConfig.cancelText"
				@confirm="handleConfirm"
				@cancel="handleCancel"
			/>

			<!-- 建议待办事确认对话框 -->
			<div v-if="showSuggestedTodos" class="suggested-todos-dialog">
				<h3>{{ t('suggestedTodos') }}</h3>
				<p>{{ t('confirmOrModify') }}</p>
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
					<button @click="confirmSuggestedTodos" class="confirm-btn">
						{{ t('confirmAdd') }}
					</button>
					<button @click="cancelSuggestedTodos" class="cancel-btn">
						{{ t('cancel') }}
					</button>
				</div>
			</div>
		</div>
		<!-- 历史记录侧边栏 -->
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
		<!-- 添加项目模态框 -->
		<AddProjectModal
			v-if="showAddProjectModal"
			@add="addNewProject"
			@close="showAddProjectModal = false"
		/>

		<!-- 图表详情对话框 -->
		<div v-if="showCharts" class="charts-dialog" @click="closeCharts">
			<div class="charts-content" @click.stop>
				<button @click="showCharts = false" class="close-btn">
					{{ t('close') }}
				</button>
				<h2>{{ t('todoCharts') }}</h2>
				<!-- 待办事项热力图组件 -->
				<TodoHeatmap />
				<!-- 番茄钟统计组件 -->
				<PomodoroStats />
			</div>
		</div>
	</div>
</template>

<style scoped>
.todo-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1rem;
	box-sizing: border-box;
}

.todo-list {
	width: 100%;
	max-width: 600px;
	margin: 0 auto;
	font-family: 'LXGW WenKai Screen', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
		Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
	padding: 2rem;
	background-color: var(--card-bg-color);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
	backdrop-filter: blur(10px);
	position: relative;
	min-height: 300px;
	box-sizing: border-box;
}

.header {
	margin-bottom: 1rem;
}

h1 {
	color: #ff7e67;
	font-size: 2.6rem;
	font-weight: 700;
	margin: 0;
	text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
	margin-bottom: 0.5rem;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-left: auto;
	white-space: nowrap;
}

.todo-grid {
	overflow: auto;
	display: flex;
	height: 460px;
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
	color: var(--text-color);
	font-weight: bold;
	transition: all 0.3s ease;
	opacity: 0.8;
}

.icon-button svg {
	fill: currentColor;
}

.icon-button:hover,
.icon-button.active {
	color: #ff7e67;
	opacity: 1;
}

.actions {
	display: flex;
	justify-content: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	flex-wrap: wrap; /* 允许按钮在需要时换行 */
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
	background-color: var(--button-bg-color);
	color: var(--text-color);
	border: none;
	border-radius: 20px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-weight: var(--font-weight);
	letter-spacing: 0.5px;
	margin-bottom: 0.5rem; /* 添加底部间距，防止按钮紧贴 */
}

.clear-btn:hover {
	background-color: var(--button-hover-bg-color);
}

.generate-btn:hover:not(:disabled) {
	background-color: var(--button-hover-bg-color);
}

.generate-btn:disabled {
	background-color: #95a5a6;
	cursor: not-allowed;
}

.sort-btn:hover:not(:disabled) {
	background-color: var(--button-hover-bg-color);
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
	background-color: var(--card-bg-color);
	opacity: 0.9;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.loading-overlay p {
	margin-top: 1rem;
	font-size: 1.2rem;
	color: var(--text-color);
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

@media (min-width: 1201px) {
	.todo-container {
		padding-left: 1rem;
		padding-right: 1rem;
	}
}

@media (max-width: 1200px) {
	.todo-container {
		padding-left: 1rem;
		padding-right: 1rem;
	}

	.todo-list {
		width: 100%;
		max-width: 600px;
	}
}

@media (max-width: 768px) {
	.todo-container {
		padding: 0.5rem;
	}

	.todo-list {
		width: 100%;
		max-width: 100%;
		padding: 0.5rem;
		margin-top: 1rem; /* 为固定位置的时钟和每日激励留出空间 */
	}

	.actions {
		flex-direction: column; /* 在小屏幕上垂直排列按钮 */
		align-items: stretch; /* 让按钮宽度填满容器 */
	}

	.clear-btn,
	.generate-btn,
	.sort-btn {
		width: 100%; /* 按钮宽度填满容 */
		margin-bottom: 0.5rem; /* 增加按钮之间间距 */
	}

	.header {
		flex-direction: column; /* 标题和操作按钮垂直排列 */
		align-items: flex-start;
	}

	.header-actions {
		margin-top: 1rem; /* 增加标题和操作按钮之间的间 */
		width: 100%; /* 让操作按钮占满宽度 */
		justify-content: space-between; /* 均匀分布操作按钮 */
	}

	h1 {
		font-size: 1.5rem; /* 减小标题字体大小 */
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
	background-color: var(--card-bg-color);
	color: var(--text-color);
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
	border: 1px solid var(--input-border-color);
	border-radius: calc(var(--border-radius) / 2);
	background-color: var(--input-bg-color);
	color: var(--text-color);
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

.theme-toggle {
	margin-right: 10px;
	position: relative;
}

/* 可以考虑添加一个自定义的工具提示样式，如果你想要更好的视觉效果 */
.theme-toggle::after {
	content: attr(title);
	position: absolute;
	bottom: 100%;
	left: 50%;
	transform: translateX(-50%);
	background-color: var(--text-color);
	color: var(--bg-color);
	padding: 5px 10px;
	border-radius: 4px;
	font-size: 12px;
	white-space: nowrap;
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.3s, visibility 0.3s;
}

.theme-toggle:hover::after {
	opacity: 1;
	visibility: visible;
}

@media (prefers-color-scheme: dark) {
	.todo-list {
		backdrop-filter: blur(20px);
	}
}

.top-clock {
	position: fixed;
	top: 1rem;
	left: 4%;
	z-index: 1001;
	padding: 0.5rem;
}

.pomodoro-timer {
	flex-grow: 1;
	max-width: 300px;
	margin-bottom: 1rem;
}

@media (max-width: 768px) {
	.header-actions {
		flex-direction: column;
		align-items: stretch;
	}

	.pomodoro-timer {
		order: -1; /* 在移动设备上将番茄钟计时器移到顶部 */
		max-width: none;
	}
}

.project-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
}

.project-tabs {
	display: flex;
	gap: 0.5rem;
}

.project-tab {
	position: relative;
	padding-right: 2rem; /* 为删除按钮留出空间 */
}

.delete-project {
	position: absolute;
	top: 46%;
	right: 0.5rem;
	transform: translateY(-50%);
	cursor: pointer;
	font-size: 1.2rem;
	line-height: 1;
	opacity: 0.7;
	transition: opacity 0.3s;
}

.delete-project:hover {
	opacity: 1;
}

.project-tab {
	position: relative;
	padding: 0.5rem 1rem;
	line-height: 1;
	background-color: var(--filter-btn-bg);
	color: var(--filter-btn-text);
	border: 1px solid var(--filter-btn-border);
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s ease;
	width: 100px; /* 固定宽度 */
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.project-tab.active {
	background-color: var(--filter-btn-active-bg);
	color: var(--filter-btn-active-text);
	border-color: var(--filter-btn-active-border);
}

.add-project-btn {
	padding: 0.5rem 1rem;
	background-color: var(--button-bg-color);
	color: var(--button-text-color);
	border: none;
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.3s;
	display: flex;
	align-items: center;
	font-size: 1rem;
}

.add-project-btn i {
	margin-right: 0.5rem;
}

.add-project-btn:hover {
	background-color: var(--button-hover-bg-color);
}

.project-title {
	font-size: 1.2rem;
	margin: 1rem 0;
	color: var(--text-color);
}

/* 添加响应式样式 */
@media (max-width: 768px) {
	.project-header {
		flex-direction: column;
		align-items: stretch;
	}

	.project-tabs {
		margin-bottom: 0.5rem;
	}

	.add-project-btn {
		width: 100%;
		justify-content: center;
	}
}

.charts-dialog {
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
}

.charts-content {
	background-color: var(--card-bg-color);
	padding: 2rem;
	border-radius: var(--border-radius);
	max-width: 90%;
	max-height: 90%;
	overflow-y: auto;
	position: relative; /* 添加这行 */
}

.close-btn {
	position: absolute;
	top: 1rem;
	right: 1rem;
	background-color: var(--button-bg-color);
	color: var(--text-color);
	border: none;
	padding: 0.5rem 1rem;
	border-radius: var(--border-radius);
	cursor: pointer;
}

/* 其他现有的样式 */

.todo-container.small-screen {
	padding: 0.5rem;
}

.project-header.small-screen {
	flex-direction: column;
	align-items: stretch;
}

.project-header.small-screen .project-tabs {
	margin-bottom: 0.5rem;
}

.project-header.small-screen .add-project-btn {
	width: 100%;
}

.pomodoro-timer.small-screen {
	position: static;
	margin-bottom: 1rem;
}

@media (max-width: 768px) {
	.todo-list {
		padding: 0.5rem;
	}

	.actions {
		flex-direction: column;
		align-items: stretch;
	}

	.clear-btn,
	.generate-btn,
	.sort-btn {
		width: 100%;
		margin-bottom: 0.5rem;
	}

	.header {
		flex-direction: column;
		align-items: flex-start;
	}

	.header-actions {
		margin-top: 1rem;
		width: 100%;
		justify-content: space-between;
	}

	h1 {
		font-size: 1.5rem;
	}
}
</style>
