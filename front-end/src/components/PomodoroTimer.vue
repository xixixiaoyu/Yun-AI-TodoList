<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePomodoroStats } from '../composables/usePomodoroStats'

const { t } = useI18n()

const WORK_TIME = 25 * 60 // 25 minutes in seconds
const BREAK_TIME = 5 * 60 // 5 minutes in seconds

const isActive = ref(false)
const isPaused = ref(false)
const isBreak = ref(false)
const isWorkCompleted = ref(false)
const timeLeft = ref(WORK_TIME)
let interval: number | null = null

const { addCompletedPomodoro } = usePomodoroStats()

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const startTimer = () => {
  isActive.value = true
  isPaused.value = false
  isWorkCompleted.value = false
  if (interval) clearInterval(interval)
  interval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      if (!isBreak.value) {
        // 工作时间结束
        isActive.value = false
        isBreak.value = true
        timeLeft.value = BREAK_TIME
        isWorkCompleted.value = false
        addCompletedPomodoro()
        notifyUser(false)
      } else {
        // 休息时间结束
        resetTimer()
        notifyUser(true)
      }
      if (interval) clearInterval(interval)
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
  isWorkCompleted.value = false
  timeLeft.value = WORK_TIME
}

const startBreak = () => {
  startTimer()
}

const notifyUser = (isWorkTime: boolean) => {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(t('pomodoroComplete'), {
          body: isWorkTime ? t('workTimeStarted') : t('breakTimeStarted'),
          icon: '/favicon.ico'
        })
      }
    })
  }
  emit('pomodoroComplete', !isWorkTime)
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
      <template v-if="!isActive && !isWorkCompleted">
        <button @click="startTimer">{{ t('start') }}</button>
      </template>
      <template v-else-if="isActive">
        <button v-if="!isPaused" @click="pauseTimer">{{ t('pause') }}</button>
        <button v-else @click="resumeTimer">{{ t('resume') }}</button>
      </template>
      <template v-if="isWorkCompleted">
        <button @click="startBreak">{{ t('startBreak') }}</button>
      </template>
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
  margin-right: 6px;
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
