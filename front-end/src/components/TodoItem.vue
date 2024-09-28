<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
	todo: {
		id: number
		text: string
		completed: boolean
	}
}>()

const emit = defineEmits(['toggle', 'remove'])

const toggleTodo = () => {
	emit('toggle', props.todo.id)
}

const removeTodo = () => {
	emit('remove', props.todo.id)
}

const formattedTitle = computed(() => {
	return props.todo.text.length > 50
		? `${props.todo.text.slice(0, 50)}...`
		: props.todo.text
})
</script>

<template>
	<div class="todo-item" :class="{ completed: todo.completed }">
		<div class="todo-content">
			<span @click="toggleTodo" class="checkbox-wrapper">
				<transition name="fade">
					<i class="checkbox" :class="{ checked: todo.completed }"></i>
				</transition>
			</span>
			<span @click="toggleTodo" class="todo-text" :title="formattedTitle">
				<span class="text-content">{{ todo.text }}</span>
			</span>
		</div>
		<button @click="removeTodo" class="delete-btn">删除</button>
	</div>
</template>

<style scoped>
.todo-item {
	font-family: 'LXGW WenKai Screen', sans-serif;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.7rem;
	margin-bottom: 0.5rem;
	background-color: #fff6f6;
	border: 1px solid #ffe0e0;
	transition: all 0.3s ease;
	width: 100%;
	box-sizing: border-box;
}

.todo-item:hover {
	background-color: #fff0f0;
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.todo-item.completed .text-content {
	text-decoration: line-through;
	color: #95a5a6;
}

.todo-content {
	display: flex;
	align-items: center;
	flex-grow: 1;
	min-width: 0;
}

.checkbox-wrapper {
	flex-shrink: 0;
	margin-right: 10px;
}

.todo-text {
	display: flex;
	align-items: center;
	cursor: pointer;
	flex-grow: 1;
	min-width: 0;
}

.text-content {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	transition: all 0.3s ease;
}

.checkbox {
	display: inline-block;
	width: 18px;
	height: 18px;
	border: 2px solid #ff9a8b;
	border-radius: 50%;
	vertical-align: middle;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
	flex-shrink: 0;
}

.checkbox.checked {
	background-color: #ff9a8b;
}

.delete-btn {
	width: 50px;
	background-color: #ffa8a8;
	color: white;
	border: none;
	border-radius: calc(var(--border-radius) / 2);
	padding: 0.25rem 0.5rem;
	font-size: 0.8rem;
	cursor: pointer;
	transition: all 0.3s ease;
	opacity: 0.7;
	margin-left: 10px;
}

.delete-btn:hover {
	background-color: #ff9a9a;
}

@media (max-width: 768px) {
	.todo-item {
		flex-direction: column;
		align-items: flex-start;
	}

	.todo-content {
		width: 100%;
		margin-bottom: 0.5rem;
	}

	.delete-btn {
		align-self: flex-end;
	}
}
</style>
