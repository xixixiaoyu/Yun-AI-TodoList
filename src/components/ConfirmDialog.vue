<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
	show: boolean
	title: string
	message: string
	confirmText: string
	cancelText: string
}>()

const emit = defineEmits(['confirm', 'cancel'])

const { t } = useI18n()

const isVisible = ref(props.show)

watch(
	() => props.show,
	(newValue) => {
		isVisible.value = newValue
	}
)

const confirm = () => {
	emit('confirm')
	isVisible.value = false
}

const cancel = () => {
	emit('cancel')
	isVisible.value = false
}
</script>

<template>
	<Transition name="fade">
		<div v-if="isVisible" class="dialog-overlay">
			<div class="dialog-content">
				<h2>{{ title }}</h2>
				<p>{{ message }}</p>
				<div class="dialog-buttons">
					<button @click="cancel" class="cancel-btn">{{ cancelText }}</button>
					<button @click="confirm" class="confirm-btn">
						{{ confirmText }}
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.dialog-overlay {
	font-family: 'LXGW WenKai Screen', sans-serif;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.dialog-content {
	background-color: white;
	padding: 2rem;
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	max-width: 90%;
	width: 400px;
}

h2 {
	margin-top: 0;
	color: #2c3e50;
}

p {
	color: #34495e;
}

.dialog-buttons {
	display: flex;
	justify-content: flex-end;
	margin-top: 1.5rem;
}

button {
	padding: 0.5rem 1rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 1rem;
	transition: background-color 0.3s ease;
}

.cancel-btn {
	background-color: #95a5a6;
	color: white;
	margin-right: 0.5rem;
}

.cancel-btn:hover {
	background-color: #7f8c8d;
}

.confirm-btn {
	background-color: #e74c3c;
	color: white;
}

.confirm-btn:hover {
	background-color: #c0392b;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
