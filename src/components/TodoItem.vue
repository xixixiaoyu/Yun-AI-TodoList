<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import confetti from 'canvas-confetti'
import { useTodos } from '../composables/useTodos'

const props = defineProps<{
	todo: {
		id: number
		text: string
		completed: boolean
		projectId: number
	}
}>()

const { projects } = useTodos()

const emit = defineEmits(['toggle', 'remove'])

const { t } = useI18n()

const isCompleted = ref(props.todo.completed)

watch(
	() => props.todo.completed,
	newValue => {
		isCompleted.value = newValue
	}
)

const toggleTodo = () => {
	emit('toggle', props.todo.id)
	if (!isCompleted.value) {
		// 当任务从未完成变为完成时，触发礼花效果
		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
		})
	}
	isCompleted.value = !isCompleted.value
}

const removeTodo = () => {
	emit('remove', props.todo.id)
}

const formattedTitle = computed(() => {
	// 添加防御性检查
	if (!props.todo || typeof props.todo.text !== 'string') {
		return ''
	}
	return props.todo.text.length > 50
		? `${props.todo.text.slice(0, 50)}...`
		: props.todo.text
})

const projectName = computed(() => {
	const project = projects.value.find(p => p.id === props.todo.projectId)
	return project ? project.name : ''
})
</script>

<template>
	<div class="todo-item" :class="{ completed: isCompleted }" @click="toggleTodo">
		<div class="todo-content">
			<span class="checkbox-wrapper">
				<transition name="fade">
					<i class="checkbox" :class="{ checked: isCompleted }"></i>
				</transition>
			</span>
			<div class="todo-text-wrapper">
				<span class="todo-text" :title="formattedTitle">
					<span class="text-content">{{ formattedTitle }}</span>
				</span>
				<span v-if="projectName" class="project-tag">{{ projectName }}</span>
			</div>
		</div>
		<button @click.stop="removeTodo" class="delete-btn">{{ t('delete') }}</button>
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
	background-color: var(--input-bg-color);
	border: 1px solid var(--input-border-color);
	transition: all 0.3s ease;
	width: 100%;
	box-sizing: border-box;
	border-radius: 8px;
}

.todo-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.todo-item.completed .text-content {
	text-decoration: line-through;
	opacity: 0.6;
	color: var(--completed-todo-text-color);
}

.todo-content {
	display: flex;
	align-items: flex-start;
	flex-grow: 1;
	min-width: 0;
}

.todo-text-wrapper {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	min-width: 0;
}

.todo-text {
	display: flex;
	align-items: center;
	cursor: pointer;
	color: var(--todo-text-color);
	margin-bottom: 0.25rem;
	margin-left: 0.5rem;
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
	border: 2px solid var(--button-bg-color);
	border-radius: 50%;
	vertical-align: middle;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
	flex-shrink: 0;
}

.checkbox.checked {
	background-color: var(--button-bg-color);
}

.checkbox.checked::after {
	content: '✓';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: var(--card-bg-color);
	font-size: 12px;
}

.delete-btn {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
	border: none;
	border-radius: 4px;
	padding: 0.25rem 0.5rem;
	font-size: 0.8rem;
	cursor: pointer;
	transition: all 0.3s ease;
	opacity: 0.7;
	margin-left: 10px;
}

.delete-btn:hover {
	opacity: 1;
	background-color: var(--button-hover-bg-color);
}

.project-tag {
	background-color: var(--project-tag-bg-color, #4a5568);
	color: var(--project-tag-text-color, #fff);
	padding: 0.1rem 0.3rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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

.project-name {
	font-size: 0.8em;
	color: var(--completed-todo-text-color);
	margin-left: 0.5rem;
}
</style>
