<template>
  <Transition name="fade">
    <div v-if="isVisible" class="dialog-overlay">
      <div class="dialog-content">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="cancel">{{ cancelText }}</button>
          <button class="confirm-btn" @click="confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
}>()

const emit = defineEmits(['confirm', 'cancel'])

const isVisible = ref(false)

watch(
  () => props.show,
  newValue => {
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
  background-color: var(--card-bg-color);
  color: var(--text-color);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  width: 400px;
  border: 1px solid var(--input-border-color);
}

h2 {
  margin-top: 0;
  color: var(--text-color);
}

p {
  color: var(--text-color);
  opacity: 0.8;
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
  background-color: var(--input-bg-color);
  color: var(--text-color);
  border: 1px solid var(--input-border-color);
  margin-right: 0.5rem;
}

.cancel-btn:hover {
  background-color: var(--button-bg-color);
  color: var(--button-text-color);
  border-color: var(--button-bg-color);
}

.confirm-btn {
  background-color: var(--error-color);
  color: white;
  border: 1px solid var(--error-color);
}

.confirm-btn:hover {
  background-color: #f56565;
  border-color: #f56565;
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
