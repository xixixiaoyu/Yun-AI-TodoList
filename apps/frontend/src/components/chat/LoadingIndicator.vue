<template>
  <!-- 精致的加载动画 -->
  <div class="loading-animation">
    <!-- 主要的脉冲圆圈 -->
    <div class="pulse-circle pulse-1"></div>
    <div class="pulse-circle pulse-2"></div>
    <div class="pulse-circle pulse-3"></div>

    <!-- 中心的 AI 图标 -->
    <div class="ai-icon">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
          fill="currentColor"
          class="ai-star"
        />
        <path
          d="M19 15L19.5 17L21.5 17.5L19.5 18L19 20L18.5 18L16.5 17.5L18.5 17L19 15Z"
          fill="currentColor"
          class="ai-sparkle-1"
        />
        <path
          d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z"
          fill="currentColor"
          class="ai-sparkle-2"
        />
      </svg>
    </div>

    <!-- 打字机点点 (保留这个简洁的指示器) -->
    <div class="typing-dots">
      <span class="dot dot-1"></span>
      <span class="dot dot-2"></span>
      <span class="dot dot-3"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineOptions({
  name: 'LoadingIndicator',
})
</script>

<style scoped>
/* 加载动画容器 */
.loading-animation {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  z-index: 2;
}

/* 脉冲圆圈 */
.pulse-circle {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(var(--primary-color-rgb), 0.3);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.pulse-1 {
  width: 32px;
  height: 32px;
  animation-delay: 0s;
}

.pulse-2 {
  width: 26px;
  height: 26px;
  animation-delay: 0.3s;
  border-color: rgba(var(--primary-color-rgb), 0.4);
}

.pulse-3 {
  width: 20px;
  height: 20px;
  animation-delay: 0.6s;
  border-color: rgba(var(--primary-color-rgb), 0.5);
}

/* AI 图标 */
.ai-icon {
  position: relative;
  z-index: 3;
  color: var(--primary-color);
  animation: float 3s ease-in-out infinite;
}

.ai-star {
  animation: rotate 4s linear infinite;
  transform-origin: center;
}

.ai-sparkle-1 {
  animation: sparkle 2s ease-in-out infinite;
  animation-delay: 0.5s;
}

.ai-sparkle-2 {
  animation: sparkle 2s ease-in-out infinite;
  animation-delay: 1s;
}

/* 打字机点点 */
.typing-dots {
  position: absolute;
  bottom: -8px;
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--primary-color);
  opacity: 0.4;
  animation: typing 1.4s ease-in-out infinite;
}

.dot-1 {
  animation-delay: 0s;
}

.dot-2 {
  animation-delay: 0.2s;
}

.dot-3 {
  animation-delay: 0.4s;
}

/* 动画定义 */
@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(5deg);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

@keyframes float-particle {
  0%,
  100% {
    transform: translateY(0px) translateX(0px);
    opacity: 0.2;
  }
  33% {
    transform: translateY(-8px) translateX(4px);
    opacity: 0.4;
  }
  66% {
    transform: translateY(4px) translateX(-2px);
    opacity: 0.3;
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .loading-animation {
    width: 28px;
    height: 28px;
  }

  .pulse-1 {
    width: 28px;
    height: 28px;
  }

  .pulse-2 {
    width: 22px;
    height: 22px;
  }

  .pulse-3 {
    width: 16px;
    height: 16px;
  }
}
</style>
