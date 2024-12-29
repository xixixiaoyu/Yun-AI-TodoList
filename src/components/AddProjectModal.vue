<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits(['add', 'close'])

const projectName = ref('')

const addProject = () => {
	if (projectName.value.trim()) {
		emit('add', projectName.value.trim())
		projectName.value = ''
		emit('close')
	}
}
</script>

<template>
  <div
    class="modal-overlay"
    @click.self="emit('close')"
  >
    <div class="modal-content">
      <h2>{{ t('addProject') }}</h2>
      <input
        ref="inputRef"
        v-model="projectName"
        :placeholder="t('newProjectName')"
        @keyup.enter="addProject"
      >
      <div class="modal-actions">
        <button
          class="add-btn"
          @click="addProject"
        >
          {{ t('add') }}
        </button>
        <button
          class="cancel-btn"
          @click="emit('close')"
        >
          {{ t('cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.modal-content {
	background-color: var(--card-bg-color);
	padding: 2rem;
	border-radius: 8px;
	width: 300px;
	max-width: 90%;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
	margin-top: 0;
	margin-bottom: 1rem;
	color: var(--text-color);
}

input {
	width: 100%;
	padding: 0.5rem;
	margin-bottom: 1rem;
	border: 1px solid var(--input-border-color);
	border-radius: 4px;
	background-color: var(--input-bg-color);
	color: var(--text-color);
	font-size: 1rem;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
}

button {
	padding: 0.5rem 1rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	transition:
		background-color 0.3s,
		transform 0.1s;
	font-size: 1rem;
}

button:active {
	transform: scale(0.98);
}

.add-btn {
	background-color: var(--button-bg-color);
	color: var(--button-text-color);
}

.cancel-btn {
	background-color: var(--button-secondary-bg-color);
	color: var(--button-secondary-text-color);
}

button:hover {
	opacity: 0.9;
}
</style>
