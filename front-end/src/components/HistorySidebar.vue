<script setup lang="ts">
import { defineProps, defineEmits, onMounted } from 'vue'

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

const restoreHistory = (date: string) => {
	emit('restore', date)
}

const deleteHistoryItem = (event: Event, date: string) => {
	event.stopPropagation()
	emit('deleteItem', date)
}

const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

const getTodoSummary = (todos: Todo[]) => {
	const total = todos.length
	const completed = todos.filter(todo => todo.completed).length
	return `${completed}/${total} 已完成`
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
			<h2>历史记录</h2>
			<button @click="$emit('close')" class="close-button">&times;</button>
		</div>
		<ul>
			<li v-for="item in history" :key="item.date" @click="restoreHistory(item.date)">
				<div class="history-item-header">
					<h3>{{ formatDate(item.date) }}</h3>
					<button
						@click.stop="deleteHistoryItem($event, item.date)"
						class="delete-item-btn"
					>
						删除
					</button>
				</div>
				<div class="todo-summary">{{ getTodoSummary(item.todos) }}</div>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.history-sidebar {
	font-family: 'LXGW WenKai Screen', sans-serif;
	width: 300px;
	height: 100vh;
	position: fixed;
	top: 0;
	right: 0;
	background-color: var(--card-bg-color);
	box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
	overflow-y: auto;
	padding: 1.5rem;
	color: var(--text-color);
}

h2 {
	color: var(--text-color);
	margin-bottom: 1.5rem;
	font-weight: 300;
	font-size: 1.8rem;
}

ul {
	list-style-type: none;
	padding: 0;
}

li {
	margin-bottom: 1rem;
	padding: 1rem;
	background-color: var(--input-bg-color);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
}

li:hover {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
}

.history-item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
}

h3 {
	margin: 0;
	color: inherit;
	font-weight: 400;
}

.todo-summary {
	font-size: 0.9rem;
	color: inherit;
	opacity: 0.8;
}

.delete-all-btn,
.delete-item-btn {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 5px;
	padding: 0.4rem 0.8rem;
	font-size: 0.8rem;
	cursor: pointer;
	transition: all 0.3s ease;
	opacity: 0.7;
}

.delete-all-btn {
	margin-bottom: 1.5rem;
}

.delete-all-btn:hover,
.delete-item-btn:hover {
	opacity: 1;
	background-color: var(--button-hover-bg-color);
}

.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
}

.close-button {
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: var(--text-color);
	transition: color 0.3s ease;
}

.close-button:hover {
	color: var(--button-bg-color);
}
</style>
