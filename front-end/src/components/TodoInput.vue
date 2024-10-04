<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAITagSuggestions } from '../services/deepseekService'

const props = defineProps<{
	maxLength: number
	duplicateError: string
	placeholder: string
}>()

const emit = defineEmits(['add'])

const { t, locale } = useI18n()

const newTodo = ref('')
const newTags = ref('')
const errorMessage = ref('')
const isGeneratingTags = ref(false)

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

	isGeneratingTags.value = true
	try {
		const suggestedTags = await getAITagSuggestions(trimmedTodo, locale.value)
		const tags = [
			...new Set([...newTags.value.split(',').map(tag => tag.trim()), ...suggestedTags]),
		].filter(tag => tag !== '')
		emit('add', trimmedTodo, tags)
		newTodo.value = ''
		newTags.value = ''
		errorMessage.value = ''
	} catch (error) {
		console.error('生成标签时出错:', error)
		errorMessage.value = t('tagGenerationError')
	} finally {
		isGeneratingTags.value = false
	}
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
		<div class="input-wrapper" style="width: 100%">
			<input v-model.trim="newTags" :placeholder="t('addTags')" />
		</div>
		<button type="submit" class="add-btn" :disabled="isGeneratingTags">
			{{ isGeneratingTags ? t('generatingTags') : t('add') }}
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
	position: relative;
	flex-grow: 1;
	display: flex;
	min-width: 200px;
}

input {
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
