<template>
  <div class="pomodoro-timer">
    <div class="timer-content">
      <div class="timer-display">
        {{ formattedTime }}
      </div>
      <div class="timer-status">
        {{ isBreak ? t('breakTime') : t('workTime') }}
      </div>
    </div>
    <div class="timer-controls">
      <template v-if="!isActive && !isWorkCompleted">
        <button @click="startTimer">
          {{ t('start') }}
        </button>
      </template>
      <template v-else-if="isActive">
        <button v-if="!isPaused" @click="pauseTimer">
          {{ t('pause') }}
        </button>
        <button v-else @click="resumeTimer">
          {{ t('resume') }}
        </button>
      </template>
      <template v-if="isWorkCompleted">
        <button @click="startBreak">
          {{ t('startBreak') }}
        </button>
      </template>
      <button @click="resetTimer">
        {{ t('reset') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import TimerWorker from '../workers/timerWorker?worker'

const { t } = useI18n()

const WORK_TIME = 25 * 60
const BREAK_TIME = 5 * 60

const isActive = ref(false)
const isPaused = ref(false)
const isBreak = ref(false)
const isWorkCompleted = ref(false)
const timeLeft = ref(WORK_TIME)
const interval: number | null = null
let startTime: number | null = null
let animationFrameId: number | null = null
let initialTime = WORK_TIME

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const timerWorker = new TimerWorker()

timerWorker.onmessage = (e: MessageEvent) => {
  if (e.data.timeLeft !== undefined) {
    timeLeft.value = e.data.timeLeft
  }
  if (e.data.action === 'complete') {
    if (!isBreak.value) {
      isActive.value = false
      isBreak.value = true
      timeLeft.value = BREAK_TIME
      initialTime = BREAK_TIME
      isWorkCompleted.value = false

      notifyUser(false)
    } else {
      resetTimer()
      notifyUser(true)
    }
  }
}

const startTimer = () => {
  isActive.value = true
  isPaused.value = false
  isWorkCompleted.value = false
  startTime = null
  initialTime = isBreak.value ? BREAK_TIME : WORK_TIME
  animationFrameId = requestAnimationFrame(updateTimer)
}

const pauseTimer = () => {
  isPaused.value = true
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
}

const resumeTimer = () => {
  if (isPaused.value) {
    isPaused.value = false
    startTime = performance.now() - (initialTime - timeLeft.value) * 1000
    animationFrameId = requestAnimationFrame(updateTimer)
  }
}

const resetTimer = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  isActive.value = false
  isPaused.value = false
  isBreak.value = false
  isWorkCompleted.value = false
  timeLeft.value = WORK_TIME
  initialTime = WORK_TIME
  startTime = null
}

const startBreak = () => {
  startTimer()
}

const notifyUser = (isWorkTime: boolean) => {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(t('pomodoroComplete'), {
          body: isWorkTime ? t('workTimeStarted') : t('breakTimeStarted')
        })
      }
    })
  }
  emit('pomodoroComplete', !isWorkTime)
}

const updateTimer = (timestamp: number) => {
  if (!startTime) {
    startTime = timestamp
  }
  const elapsed = timestamp - startTime
  timeLeft.value = Math.max(0, initialTime - Math.floor(elapsed / 1000))

  if (timeLeft.value > 0 && isActive.value && !isPaused.value) {
    animationFrameId = requestAnimationFrame(updateTimer)
  } else if (timeLeft.value === 0) {
    if (!isBreak.value) {
      isActive.value = false
      isBreak.value = true
      timeLeft.value = BREAK_TIME
      initialTime = BREAK_TIME
      isWorkCompleted.value = false
      notifyUser(false)
      startTime = null
      startTimer()
    } else {
      resetTimer()
      notifyUser(true)
    }
  }
}

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})

const emit = defineEmits(['pomodoroComplete'])
</script>

<style scoped>
.pomodoro-timer {
  font-family: 'LXGW WenKai Lite Medium', sans-serif;
  background-color: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pomodoro-timer-integrated {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
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
