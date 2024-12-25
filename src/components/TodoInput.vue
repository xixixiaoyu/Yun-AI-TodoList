<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
	maxLength: number
	duplicateError: string
	placeholder: string
}>()

const emit = defineEmits(['add'])

const { t, locale } = useI18n()

const newTodo = ref('')
const errorMessage = ref('')

const charCount = computed(() => {
	return `${newTodo.value.length}/${props.maxLength}`
})

const addTodo = async () => {
	const trimmedTodo = newTodo.value.trim()
	if (trimmedTodo.length === 0) {
		errorMessage.value = t('emptyTodoError')
		setTimeout(() => {
			errorMessage.value = ''
		}, 3000)
		return
	}
	if (trimmedTodo.length > props.maxLength) {
		errorMessage.value = t('maxLengthError', { maxLength: props.maxLength })
		setTimeout(() => {
			errorMessage.value = ''
		}, 3000)
		return
	}

	emit('add', trimmedTodo, [])
	newTodo.value = ''
	errorMessage.value = ''
}
</script>

<template>
	<form @submit.prevent="addTodo" class="add-todo">
		<div class="input-wrapper">
			<input
				v-model.trim="newTodo"
				class="todo-input"
				:placeholder="placeholder"
				:maxlength="maxLength"
			/>
		</div>
		<button type="submit" class="add-btn">
			{{ t('add') }}
		</button>
	</form>
	<p v-if="errorMessage || duplicateError" class="error-message">
		{{ errorMessage || duplicateError }}
	</p>
</template>

<style scoped>
.add-todo {
	font-family: 'LXGW WenKai Screen', sans-serif;
	display: flex;
	margin-bottom: 1rem;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.input-wrapper {
	display: flex;
	gap: 0.5rem;
	position: relative;
	flex-grow: 1;
	min-width: 200px;
}

.todo-input {
	flex-grow: 1;
	padding: 0.7rem;
	font-size: 1rem;
	border: 1px solid var(--input-border-color);
	border-radius: calc(var(--border-radius) / 2);
	outline: none;
	transition: all 0.3s ease;
	background-color: var(--input-bg-color);
	color: var(--text-color);
}

input:focus {
	border-color: #85c1e9;
	box-shadow: 0 0 5px rgba(133, 193, 233, 0.5);
}

.add-btn {
	padding: 0.5rem 0.8rem;
	font-size: 0.9rem;
	background-color: var(--button-bg-color);
	color: var(--text-color);
	border: none;
	border-radius: calc(var(--border-radius) / 2);
	cursor: pointer;
	transition: all 0.3s ease;
	font-weight: var(--font-weight);
	letter-spacing: 0.5px;
	height: 42px;
	min-width: 80px;
}

.add-btn:hover {
	background-color: var(--button-hover-bg-color);
}

.error-message {
	color: #e74c3c;
	font-size: 0.9rem;
	margin-top: 0.5rem;
	width: 100%;
	font-weight: var(--font-weight);
}

@media (max-width: 768px) {
	.add-todo {
		flex-direction: column;
	}

	.input-wrapper {
		margin-bottom: 0.5rem;
		width: 100%;
	}

	.add-btn {
		width: 100%;
		padding: 0.5rem 1rem;
	}
}
</style>
