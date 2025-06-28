<template>
  <Teleport to="body">
    <div v-if="typedNotifications.length > 0" class="notification-container" :class="positionClass">
      <TransitionGroup name="notification" tag="div" class="notification-list">
        <div
          v-for="notification in typedNotifications"
          :key="notification.id"
          class="notification-item"
          :class="notificationClass(notification)"
        >
          <!-- 图标 -->
          <div class="notification-icon">
            <i :class="getIcon(notification.type)" class="text-lg"></i>
          </div>

          <!-- 内容 -->
          <div class="notification-content">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <p v-if="notification.message" class="notification-message">
              {{ notification.message }}
            </p>

            <!-- 操作按钮 -->
            <div
              v-if="notification.actions && notification.actions.length > 0"
              class="notification-actions"
            >
              <button
                v-for="action in notification.actions"
                :key="action.label"
                class="notification-action-btn"
                :class="actionButtonClass(action.style)"
                @click="handleAction(action, notification.id)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>

          <!-- 关闭按钮 -->
          <button
            v-if="!notification.persistent"
            class="notification-close"
            @click="removeNotification(notification.id)"
          >
            <i class="i-carbon-close text-sm"></i>
          </button>

          <!-- 进度条（用于显示剩余时间） -->
          <div
            v-if="!notification.persistent && notification.duration"
            class="notification-progress"
            :style="{ animationDuration: `${notification.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotifications, type Notification } from '../../composables/useNotifications'

const { notifications, removeNotification, config } = useNotifications()

// 类型断言以解决 readonly 类型问题
type ReadonlyNotification = Readonly<Notification>
const typedNotifications = notifications as ReadonlyNotification[]

// 计算属性
const positionClass = computed(() => {
  const position = config.position
  return `position-${position}`
})

// 方法
const notificationClass = (notification: Notification) => {
  return [
    `notification-${notification.type}`,
    {
      'notification-persistent': notification.persistent,
    },
  ]
}

const getIcon = (type: string) => {
  const icons = {
    success: 'i-carbon-checkmark-filled',
    error: 'i-carbon-error-filled',
    warning: 'i-carbon-warning-filled',
    info: 'i-carbon-information-filled',
  }
  return icons[type as keyof typeof icons] || icons.info
}

const actionButtonClass = (style?: string) => {
  const baseClass = 'action-btn'
  switch (style) {
    case 'primary':
      return `${baseClass} action-btn-primary`
    case 'danger':
      return `${baseClass} action-btn-danger`
    case 'secondary':
    default:
      return `${baseClass} action-btn-secondary`
  }
}

const handleAction = (action: { action: () => void }, notificationId: string) => {
  action.action()
  removeNotification(notificationId)
}

defineOptions({
  name: 'NotificationContainer',
})
</script>

<style scoped>
.notification-container {
  @apply fixed pointer-events-none;
  @apply flex flex-col gap-3 p-4;
  z-index: 10002;
}

.notification-list {
  @apply flex flex-col gap-3;
}

.notification-item {
  @apply relative flex items-start gap-3 p-4 rounded-xl shadow-lg backdrop-blur-sm;
  @apply border border-border bg-card pointer-events-auto;
  @apply max-w-sm min-w-80;
}

/* 位置样式 */
.position-top-right {
  @apply top-0 right-0;
}

.position-top-left {
  @apply top-0 left-0;
}

.position-bottom-right {
  @apply bottom-0 right-0;
}

.position-bottom-left {
  @apply bottom-0 left-0;
}

.position-top-center {
  @apply top-0 left-1/2 transform -translate-x-1/2;
}

.position-bottom-center {
  @apply bottom-0 left-1/2 transform -translate-x-1/2;
}

/* 通知类型样式 */
.notification-success {
  @apply border-success/30 bg-success/5;
}

.notification-success .notification-icon {
  @apply text-success;
}

.notification-error {
  @apply border-error/30 bg-error/5;
}

.notification-error .notification-icon {
  @apply text-error;
}

.notification-warning {
  @apply border-warning/30 bg-warning/5;
}

.notification-warning .notification-icon {
  @apply text-warning;
}

.notification-info {
  @apply border-primary/30 bg-primary/5;
}

.notification-info .notification-icon {
  @apply text-primary;
}

/* 内容样式 */
.notification-icon {
  @apply flex-shrink-0 mt-0.5;
}

.notification-content {
  @apply flex-1 space-y-2;
}

.notification-title {
  @apply font-medium text-text text-sm;
}

.notification-message {
  @apply text-text-secondary text-xs leading-relaxed;
}

.notification-actions {
  @apply flex gap-2 mt-3;
}

.action-btn {
  @apply px-3 py-1.5 text-xs font-medium rounded-lg transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-1;
}

.action-btn-primary {
  @apply bg-primary text-white hover:bg-primary-hover focus:ring-primary;
}

.action-btn-secondary {
  @apply bg-bg-secondary text-text hover:bg-bg-tertiary focus:ring-primary;
}

.action-btn-danger {
  @apply bg-error text-white hover:bg-error/90 focus:ring-error;
}

.notification-close {
  @apply flex-shrink-0 p-1 rounded-lg text-text-secondary hover:text-text hover:bg-bg-secondary;
  @apply transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1;
}

.notification-progress {
  @apply absolute bottom-0 left-0 h-1 bg-primary rounded-b-xl;
  @apply w-full origin-left;
  animation: progress-shrink linear forwards;
}

/* 动画 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

@keyframes progress-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .notification-container {
    @apply p-2;
  }

  .notification-item {
    @apply min-w-0 max-w-none mx-2;
  }

  .position-top-center,
  .position-bottom-center {
    @apply left-0 right-0 transform-none;
  }
}

/* 深色主题适配 */
[data-theme='dark'] .notification-item {
  @apply bg-card-dark border-border-dark;
}

[data-theme='dark'] .notification-title {
  @apply text-text-dark;
}

[data-theme='dark'] .notification-message {
  @apply text-text-secondary-dark;
}

[data-theme='dark'] .notification-close {
  @apply text-text-secondary-dark hover:text-text-dark hover:bg-bg-secondary-dark;
}

[data-theme='dark'] .action-btn-secondary {
  @apply bg-bg-secondary-dark text-text-dark hover:bg-bg-tertiary-dark;
}
</style>
