<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
	maxLength: number
	duplicateError: string
	placeholder: string
}>()

const emit = defineEmits(['add'])

const { t } = useI18n()

const newTodo = ref('')
const errorMessage = ref('')

const charCount = computed(() => {
	return `${newTodo.value.length}/${props.maxLength}`
})

const addTodo = () => {
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
	emit('add', trimmedTodo)
	newTodo.value = ''
	errorMessage.value = ''
}
</script>

<template>
	<form @submit.prevent="addTodo" class="add-todo">
		<div class="input-wrapper">
			<input v-model.trim="newTodo" :placeholder="placeholder" :maxlength="maxLength" />
			<span class="char-count">
				{{ charCount }}
			</span>
		</div>
		<button type="submit" class="add-btn">{{ t('add') }}</button>
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
}

.input-wrapper {
	position: relative;
	flex-grow: 1;
	display: flex;
	min-width: 200px;
	margin-bottom: 0.5rem;
}

input {
	flex-grow: 1;
	padding: 0.7rem;
	padding-right: 3rem;
	font-size: 1rem;
	border: 1px solid #d5d8dc;
	border-radius: calc(var(--border-radius) / 2);
	outline: none;
	transition: all 0.3s ease;
}

input:focus {
	border-color: #85c1e9;
	box-shadow: 0 0 5px rgba(133, 193, 233, 0.5);
}

.char-count {
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);
	font-size: 0.8rem;
	color: #7f8c8d;
	opacity: 0.7;
}

.add-btn {
	padding: 0.7rem 1rem;
	font-size: 1rem;
	background-color: var(--button-bg-color);
	color: var(--text-color);
	border: none;
	border-radius: calc(var(--border-radius) / 2);
	cursor: pointer;
	transition: all 0.3s ease;
	margin-left: 0.5rem;
	font-weight: var(--font-weight);
	letter-spacing: 0.5px;
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
		margin-left: 0;
	}
}

.add-todo input {
	background-color: var(--input-bg-color);
	border-color: var(--input-border-color);
	color: var(--text-color);
	transition: all 0.3s ease;
	font-weight: var(--font-weight);
	letter-spacing: 0.5px;
}

.add-todo input:focus {
	border-color: #ff9a8b;
	box-shadow: 0 0 0 2px rgba(255, 154, 139, 0.2);
}

.add-btn {
	background-color: var(--button-bg-color);
	color: var(--text-color);
}

.add-btn:hover {
	background-color: var(--button-hover-bg-color);
}

@media (prefers-color-scheme: dark) {
	.add-todo input {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) inset;
	}
}
</style>
