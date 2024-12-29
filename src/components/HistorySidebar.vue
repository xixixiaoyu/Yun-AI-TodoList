<script setup lang="ts">
import { defineProps, defineEmits, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Todo {
	id: number
	text: string
	completed: boolean
}

interface HistoryItem {
	date: string
	todos: Todo[]
}

const props = defineProps<{
	history: HistoryItem[]
}>()

const emit = defineEmits(['restore', 'deleteItem', 'close'])

const { t } = useI18n()

const deleteConfirmId = ref<string | null>(null)

const restoreHistory = (date: string) => {
	emit('restore', date)
}

const deleteHistoryItem = (event: Event, date: string) => {
	event.stopPropagation()
	deleteConfirmId.value = date
}

const confirmDelete = (event: Event, date: string) => {
	event.stopPropagation()
	emit('deleteItem', date)
	deleteConfirmId.value = null
}

const cancelDelete = (event: Event) => {
	event.stopPropagation()
	deleteConfirmId.value = null
}

const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	return date.toLocaleDateString(t('locale'), {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

const getTodoSummary = (todos: Todo[]) => {
	const total = todos.length
	const completed = todos.filter((todo) => todo.completed).length
	return t('todoSummary', { completed, total })
}

const handleEscKey = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		emit('close')
	}
}

onMounted(() => {
	document.addEventListener('keydown', handleEscKey)
})
</script>

<template>
	<div class="history-sidebar">
		<div class="history-header">
			<h2>{{ t('history') }}</h2>
			<button @click="$emit('close')" class="close-button" :title="t('close')">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>

		<div v-if="history.length === 0" class="empty-history">
			<p>{{ t('noHistory') }}</p>
		</div>

		<ul v-else>
			<li
				v-for="item in history"
				:key="item.date"
				@click="restoreHistory(item.date)"
				class="history-item"
			>
				<div class="history-item-header">
					<h3>{{ formatDate(item.date) }}</h3>
					<div class="history-item-actions">
						<template v-if="deleteConfirmId === item.date">
							<button
								@click.stop="confirmDelete($event, item.date)"
								class="confirm-delete-btn"
							>
								{{ t('confirm') }}
							</button>
							<button
								@click.stop="cancelDelete($event)"
								class="cancel-delete-btn"
							>
								{{ t('cancel') }}
							</button>
						</template>
						<button
							v-else
							@click.stop="deleteHistoryItem($event, item.date)"
							class="delete-item-btn"
							:title="t('delete')"
						>
							{{ t('delete') }}
						</button>
					</div>
				</div>
				<div class="todo-summary">{{ getTodoSummary(item.todos) }}</div>
				<div class="restore-hint">{{ t('clickToRestore') }}</div>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.history-sidebar {
	font-family: 'LXGW WenKai Screen', sans-serif;
	width: 350px;
	height: 100vh;
	position: fixed;
	top: 0;
	right: 0;
	background-color: var(--card-bg-color);
	box-shadow: -2px 0 20px rgba(0, 0, 0, 0.15);
	overflow-y: auto;
	padding: 1.5rem;
	color: var(--text-color);
	z-index: 100000;
	animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
	from {
		transform: translateX(100%);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--border-color);
	position: sticky;
	top: 0;
	background-color: var(--card-bg-color);
	z-index: 1;
	backdrop-filter: blur(8px);
}

.history-header h2 {
	font-size: 1.5rem;
	margin: 0;
	color: var(--text-color);
}

.close-button {
	background: none;
	border: none;
	color: var(--text-color);
	cursor: pointer;
	width: 32px;
	height: 32px;
	padding: 4px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	opacity: 0.6;
}

.close-button:hover {
	background-color: var(--button-hover-bg-color);
	opacity: 1;
}

.close-button svg {
	width: 20px;
	height: 20px;
}

.empty-history {
	text-align: center;
	padding: 2rem;
	color: var(--text-color-light);
	background-color: var(--input-bg-color);
	border-radius: 8px;
	margin: 1rem 0;
}

.history-item {
	margin-bottom: 1rem;
	padding: 1.2rem;
	background-color: var(--input-bg-color);
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.3s ease;
	border: 1px solid transparent;
	position: relative;
	overflow: hidden;
}

.history-item:hover {
	background-color: var(--button-hover-bg-color);
	border-color: var(--border-color);
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-item::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	width: 4px;
	background-color: var(--primary-color);
	opacity: 0;
	transition: opacity 0.3s ease;
}

.history-item:hover::before {
	opacity: 1;
}

.history-item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.8rem;
}

.history-item-header h3 {
	margin: 0;
	font-size: 1.1rem;
	color: var(--text-color);
}

.history-item-actions {
	display: flex;
	gap: 0.5rem;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.history-item:hover .history-item-actions {
	opacity: 1;
}

.delete-item-btn,
.confirm-delete-btn,
.cancel-delete-btn {
	padding: 0.4rem 0.8rem;
	border-radius: 6px;
	border: none;
	cursor: pointer;
	font-size: 0.9rem;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.3rem;
}

.delete-item-btn {
	background-color: transparent;
	color: var(--error-color);
}

.delete-item-btn:hover {
	background-color: var(--error-color);
	color: white;
}

.confirm-delete-btn {
	background-color: var(--error-color);
	color: white;
}

.confirm-delete-btn:hover {
	background-color: var(--error-color-dark);
}

.cancel-delete-btn {
	background-color: var(--button-bg-color);
	color: var(--text-color);
}

.cancel-delete-btn:hover {
	background-color: var(--button-hover-bg-color);
}

.todo-summary {
	font-size: 0.9rem;
	color: var(--text-color-light);
	margin-bottom: 0.5rem;
}

.restore-hint {
	font-size: 0.8rem;
	color: var(--primary-color);
	opacity: 0;
	transition: opacity 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.3rem;
}

.restore-hint::before {
	content: '↺';
	font-size: 1rem;
}

.history-item:hover .restore-hint {
	opacity: 1;
}

@media (max-width: 768px) {
	.history-sidebar {
		width: 100%;
		padding: 1rem;
	}

	.history-item {
		padding: 1rem;
	}

	.history-item-actions {
		opacity: 1;
		position: relative;
		z-index: 2;
	}

	.delete-item-btn,
	.confirm-delete-btn,
	.cancel-delete-btn {
		padding: 0.3rem 0.6rem;
		font-size: 0.8rem;
	}

	.restore-hint {
		opacity: 0.8;
	}
}
</style>
