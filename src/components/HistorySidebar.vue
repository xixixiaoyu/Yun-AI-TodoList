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
	const completed = todos.filter(todo => todo.completed).length
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
				&times;
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
							<button @click.stop="cancelDelete($event)" class="cancel-delete-btn">
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
	box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
	overflow-y: auto;
	padding: 1.5rem;
	color: var(--text-color);
	z-index: 100000;
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
}

.empty-history {
	text-align: center;
	padding: 2rem;
	color: var(--text-color-light);
}

.history-item {
	margin-bottom: 1rem;
	padding: 1rem;
	background-color: var(--input-bg-color);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
	border: 1px solid transparent;
}

.history-item:hover {
	background-color: var(--button-hover-bg-color);
	border-color: var(--border-color);
	transform: translateY(-2px);
}

.history-item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
}

.history-item-actions {
	display: flex;
	gap: 0.5rem;
}

.delete-item-btn,
.confirm-delete-btn,
.cancel-delete-btn {
	padding: 0.3rem 0.6rem;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	font-size: 0.8rem;
	transition: all 0.2s ease;
}

.delete-item-btn {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
}

.confirm-delete-btn {
	background-color: var(--error-color);
	color: white;
}

.cancel-delete-btn {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
}

.restore-hint {
	margin-top: 0.5rem;
	font-size: 0.8rem;
	color: var(--text-color-light);
	opacity: 0;
	transition: opacity 0.2s ease;
}

.history-item:hover .restore-hint {
	opacity: 0.8;
}

@media (max-width: 768px) {
	.history-sidebar {
		width: 100%;
	}

	.history-item {
		padding: 0.8rem;
	}

	.history-item-actions {
		flex-direction: column;
		gap: 0.3rem;
	}
}
</style>
