<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const WORK_TIME = 25 * 60 // 25 minutes in seconds
const BREAK_TIME = 5 * 60 // 5 minutes in seconds

const isActive = ref(false)
const isPaused = ref(false)
const isBreak = ref(false)
const timeLeft = ref(WORK_TIME)
let interval: number | null = null

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const startTimer = () => {
  isActive.value = true
  isPaused.value = false
  if (interval) clearInterval(interval)
  interval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      isBreak.value = !isBreak.value
      timeLeft.value = isBreak.value ? BREAK_TIME : WORK_TIME
      notifyUser()
    }
  }, 1000)
}

const pauseTimer = () => {
  if (interval) {
    clearInterval(interval)
    isPaused.value = true
  }
}

const resumeTimer = () => {
  if (isPaused.value) {
    startTimer()
  }
}

const resetTimer = () => {
  if (interval) {
    clearInterval(interval)
  }
  isActive.value = false
  isPaused.value = false
  isBreak.value = false
  timeLeft.value = WORK_TIME
}

const notifyUser = () => {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(t('pomodoroComplete'), {
          body: isBreak.value ? t('breakTimeStarted') : t('workTimeStarted'),
          icon: '/favicon.ico'
        })
      }
    })
  }
  // 修改这里，传递一个布尔值表示是否是休息时间开始
  emit('pomodoroComplete', isBreak.value)
}

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})

const emit = defineEmits(['pomodoroComplete'])
</script>

<template>
  <div class="pomodoro-timer">
    <div class="timer-content">
      <div class="timer-display">{{ formattedTime }}</div>
      <div class="timer-status">
        {{ isBreak ? t('breakTime') : t('workTime') }}
      </div>
    </div>
    <div class="timer-controls">
      <button v-if="!isActive" @click="startTimer">{{ t('start') }}</button>
      <button v-else-if="!isPaused" @click="pauseTimer">{{ t('pause') }}</button>
      <button v-else @click="resumeTimer">{{ t('resume') }}</button>
      <button @click="resetTimer">{{ t('reset') }}</button>
    </div>
  </div>
</template>

<style scoped>
.pomodoro-timer {
  font-family: 'LXGW WenKai Screen', sans-serif;
  background-color: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer-display {
  font-size: 1.5rem;
  font-weight: bold;
}

.timer-status {
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.8;
}

.timer-controls {
  display: flex;
  gap: 0.25rem;
}

button {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  background-color: var(--button-bg-color);
  color: var(--text-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  background-color: var(--button-hover-bg-color);
}

@media (max-width: 768px) {
  .pomodoro-timer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .timer-controls {
    justify-content: center;
  }
}
</style>
