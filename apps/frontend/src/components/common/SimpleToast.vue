<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast--${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <!-- 图标 -->
          <div class="toast__icon">
            <CheckIcon v-if="toast.type === 'success'" />
            <ExclamationIcon v-else-if="toast.type === 'error'" />
            <InfoIcon v-else />
          </div>

          <!-- 内容 -->
          <div class="toast__content">
            <div class="toast__message">{{ toast.message }}</div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import CheckIcon from './icons/CheckIcon.vue'
import ExclamationIcon from './icons/ExclamationIcon.vue'
import InfoIcon from './icons/InfoIcon.vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

const generateId = () => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = generateId()
  const newToast: Toast = {
    id,
    type: 'info',
    duration: 3000,
    ...toast,
  }

  toasts.value.push(newToast)

  // 设置自动移除定时器
  if (newToast.duration && newToast.duration > 0) {
    const timer = setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
    timers.set(id, timer)
  }

  return id
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)

    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }
}

// 便捷方法
const success = (message: string) => {
  return addToast({ type: 'success', message, duration: 2000 })
}

const error = (message: string) => {
  return addToast({ type: 'error', message, duration: 4000 })
}

const info = (message: string) => {
  return addToast({ type: 'info', message, duration: 3000 })
}

// 清理定时器
onUnmounted(() => {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
})

// 暴露方法
defineExpose({
  addToast,
  removeToast,
  success,
  error,
  info,
})

defineOptions({
  name: 'SimpleToast',
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10001;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  pointer-events: auto;
  cursor: pointer;
  min-width: 16rem;
  max-width: 20rem;
  transition: all 0.3s ease;
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.toast--success {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.toast--error {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.toast--info {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

.toast__icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.toast__content {
  flex: 1;
}

.toast__message {
  font-size: 0.875rem;
  font-weight: 500;
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 响应式 */
@media (max-width: 640px) {
  .toast-container {
    left: 1rem;
    right: 1rem;
  }

  .toast {
    min-width: 0;
    max-width: none;
  }
}
</style>
