<template>
  <div
    class="bg-card rounded-[var(--border-radius)] shadow-card p-6 text-center transition-all-300"
    :class="{
      'fixed top-0 left-0 right-0 bottom-0 z-[9999] rounded-none p-8 bg-bg': isFullscreen
    }"
  >
    <div class="flex justify-between items-center mb-8">
      <h3 class="m-0 text-text text-xl">
        {{ isBreak ? t('pomodoro.breakTime', 'Break Time') : t('pomodoro.workTime', 'Work Time') }}
      </h3>
      <div class="flex gap-2">
        <button
          class="bg-transparent border border-input-border rounded px-2 py-2 cursor-pointer text-text transition-all duration-200 hover:bg-hover"
          :title="t('pomodoro.fullscreen', 'Fullscreen')"
          @click="toggleFullscreen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            />
          </svg>
        </button>
        <button
          class="bg-transparent border border-input-border rounded px-2 py-2 cursor-pointer text-text transition-all duration-200 hover:bg-hover"
          :title="t('pomodoro.settings', 'Settings')"
          @click="openSettings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
          </svg>
        </button>
      </div>
    </div>

    <div class="my-8">
      <div class="relative inline-block" :style="circleStyle">
        <svg class="rotate-[-90deg]" width="200" height="200">
          <circle
            class="fill-transparent stroke-[var(--border-color)] stroke-[8px]"
            cx="100"
            cy="100"
            r="90"
          />
          <circle
            class="fill-transparent stroke-[8px] stroke-round transition-all duration-500"
            cx="100"
            cy="100"
            r="90"
            :stroke="progressColor"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-4xl font-bold text-text mb-2">{{ formattedTime }}</div>
          <div class="text-lg text-text-secondary mb-1">
            {{ isBreak ? t('pomodoro.break', 'Break') : t('pomodoro.focus', 'Focus') }}
          </div>
          <div class="text-sm text-text-secondary">
            {{ t('pomodoro.session', 'Session') }} {{ completedSessions + 1 }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-3 justify-center mb-8">
      <button
        class="px-6 py-3 bg-button-bg text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-button-hover hover:transform-hover-up active:scale-95"
        :disabled="timeLeft === 0"
        @click="toggleTimer"
      >
        {{
          isActive
            ? isPaused
              ? t('pomodoro.resume', 'Resume')
              : t('pomodoro.pause', 'Pause')
            : t('pomodoro.start', 'Start')
        }}
      </button>
      <button
        class="px-6 py-3 bg-input-bg text-text border border-input-border rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 hover:bg-hover hover:transform-hover-up active:scale-95"
        @click="resetTimer"
      >
        {{ t('pomodoro.reset', 'Reset') }}
      </button>
      <button
        class="px-6 py-3 bg-input-bg text-text border border-input-border rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 hover:bg-hover hover:transform-hover-up active:scale-95"
        @click="skipSession"
      >
        {{ t('pomodoro.skip', 'Skip') }}
      </button>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="text-center p-4 bg-input-bg rounded-lg border border-input-border">
        <div class="text-2xl font-bold text-text mb-1">{{ completedSessions }}</div>
        <div class="text-sm text-text-secondary">{{ t('pomodoro.completed', 'Completed') }}</div>
      </div>
      <div class="text-center p-4 bg-input-bg rounded-lg border border-input-border">
        <div class="text-2xl font-bold text-text mb-1">{{ totalFocusTime }}</div>
        <div class="text-sm text-text-secondary">{{ t('pomodoro.totalTime', 'Total Time') }}</div>
      </div>
      <div class="text-center p-4 bg-input-bg rounded-lg border border-input-border">
        <div class="text-2xl font-bold text-text mb-1">{{ todaysSessions }}</div>
        <div class="text-sm text-text-secondary">{{ t('pomodoro.today', 'Today') }}</div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div
      v-if="showSettings"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      @click="closeSettings"
    >
      <div
        class="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex justify-between items-center p-6 border-b border-input-border">
          <h4 class="m-0 text-lg font-semibold text-text">
            {{ t('pomodoro.timerSettings', 'Timer Settings') }}
          </h4>
          <button
            class="bg-transparent border-none text-2xl cursor-pointer text-text-secondary hover:text-text transition-colors duration-200 w-8 h-8 flex items-center justify-center"
            @click="closeSettings"
          >
            ×
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-text">
              {{ t('pomodoro.workDuration', 'Work Duration') }} ({{
                t('pomodoro.minutes', 'minutes')
              }})
            </label>
            <input
              v-model.number="settings.workTime"
              type="number"
              min="1"
              max="60"
              class="px-3 py-2 border border-input-border rounded-lg bg-input-bg text-text focus:outline-none focus:border-button-bg"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-text">
              {{ t('pomodoro.shortBreak', 'Short Break') }} ({{ t('pomodoro.minutes', 'minutes') }})
            </label>
            <input
              v-model.number="settings.shortBreak"
              type="number"
              min="1"
              max="30"
              class="px-3 py-2 border border-input-border rounded-lg bg-input-bg text-text focus:outline-none focus:border-button-bg"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-text">
              {{ t('pomodoro.longBreak', 'Long Break') }} ({{ t('pomodoro.minutes', 'minutes') }})
            </label>
            <input
              v-model.number="settings.longBreak"
              type="number"
              min="1"
              max="60"
              class="px-3 py-2 border border-input-border rounded-lg bg-input-bg text-text focus:outline-none focus:border-button-bg"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-text">{{
              t('pomodoro.sessionsBeforeLongBreak', 'Sessions before long break')
            }}</label>
            <input
              v-model.number="settings.sessionsBeforeLongBreak"
              type="number"
              min="2"
              max="10"
              class="px-3 py-2 border border-input-border rounded-lg bg-input-bg text-text focus:outline-none focus:border-button-bg"
            />
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model="settings.autoStartBreaks"
              type="checkbox"
              class="w-4 h-4 text-button-bg bg-input-bg border-input-border rounded focus:ring-button-bg"
            />
            <label class="text-sm font-medium text-text">
              {{ t('pomodoro.autoStartBreaks', 'Auto-start breaks') }}
            </label>
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model="settings.autoStartWork"
              type="checkbox"
              class="w-4 h-4 text-button-bg bg-input-bg border-input-border rounded focus:ring-button-bg"
            />
            <label class="text-sm font-medium text-text">
              {{ t('pomodoro.autoStartWork', 'Auto-start work sessions') }}
            </label>
          </div>
        </div>
        <div class="flex gap-3 p-6 border-t border-input-border">
          <button
            class="flex-1 px-4 py-2 bg-input-bg text-text border border-input-border rounded-lg cursor-pointer font-semibold transition-all duration-200 hover:bg-hover hover:transform-hover-up active:scale-95"
            @click="resetSettings"
          >
            {{ t('pomodoro.resetDefaults', 'Reset to Defaults') }}
          </button>
          <button
            class="flex-1 px-4 py-2 bg-button-bg text-white border-none rounded-lg cursor-pointer font-semibold transition-all duration-200 hover:bg-button-hover hover:transform-hover-up active:scale-95"
            @click="saveSettings"
          >
            {{ t('pomodoro.saveSettings', 'Save Settings') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TimerWorker from '@/workers/timerWorker?worker'

interface PomodoroSettings {
  workTime: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartWork: boolean
}

const { t } = useI18n()

// 默认设置
const defaultSettings: PomodoroSettings = {
  workTime: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false
}

// 响应式状态
const isActive = ref(false)
const isPaused = ref(false)
const isBreak = ref(false)
const timeLeft = ref(0)
const completedSessions = ref(0)
const totalFocusTime = ref(0)
const todaysSessions = ref(0)
const isFullscreen = ref(false)
const showSettings = ref(false)

// 设置
const settings = ref<PomodoroSettings>({ ...defaultSettings })

// 计算属性
const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const circumference = computed(() => 2 * Math.PI * 90)

const strokeDashoffset = computed(() => {
  const currentTime = isBreak.value
    ? completedSessions.value % settings.value.sessionsBeforeLongBreak === 0 &&
      completedSessions.value > 0
      ? settings.value.longBreak * 60
      : settings.value.shortBreak * 60
    : settings.value.workTime * 60

  const progress = (currentTime - timeLeft.value) / currentTime
  return circumference.value - progress * circumference.value
})

const progressColor = computed(() => {
  if (isBreak.value) return '#4CAF50'
  return timeLeft.value < 300 ? '#FF5722' : '#2196F3'
})

const circleStyle = computed(() => ({
  '--progress-color': progressColor.value
}))

// Worker 实例
let timerWorker: Worker | null = null

// 方法
const initTimer = () => {
  timeLeft.value = settings.value.workTime * 60
  isBreak.value = false
  isActive.value = false
  isPaused.value = false
}

const toggleTimer = () => {
  if (!isActive.value) {
    startTimer()
  } else if (isPaused.value) {
    resumeTimer()
  } else {
    pauseTimer()
  }
}

const startTimer = () => {
  isActive.value = true
  isPaused.value = false

  if (!timerWorker) {
    timerWorker = new TimerWorker()
    timerWorker.onmessage = handleWorkerMessage
  }

  timerWorker.postMessage({ action: 'start', duration: timeLeft.value })
}

const pauseTimer = () => {
  isPaused.value = true
  timerWorker?.postMessage({ action: 'pause' })
}

const resumeTimer = () => {
  isPaused.value = false
  timerWorker?.postMessage({ action: 'resume' })
}

const resetTimer = () => {
  isActive.value = false
  isPaused.value = false
  timerWorker?.postMessage({ action: 'stop' })
  initTimer()
}

const skipSession = () => {
  timerWorker?.postMessage({ action: 'stop' })
  completeSession()
}

const completeSession = () => {
  if (!isBreak.value) {
    completedSessions.value++
    todaysSessions.value++
    totalFocusTime.value += settings.value.workTime

    // 判断是长休息还是短休息
    const isLongBreak = completedSessions.value % settings.value.sessionsBeforeLongBreak === 0
    const breakDuration = isLongBreak ? settings.value.longBreak : settings.value.shortBreak

    isBreak.value = true
    timeLeft.value = breakDuration * 60

    if (settings.value.autoStartBreaks) {
      startTimer()
    } else {
      isActive.value = false
    }
  } else {
    isBreak.value = false
    timeLeft.value = settings.value.workTime * 60

    if (settings.value.autoStartWork) {
      startTimer()
    } else {
      isActive.value = false
    }
  }

  // 发送完成事件
  emit('pomodoroComplete', { isBreak: !isBreak.value, completedSessions: completedSessions.value })
}

const handleWorkerMessage = (e: MessageEvent) => {
  const { action, timeLeft: newTimeLeft } = e.data

  if (action === 'tick') {
    timeLeft.value = newTimeLeft
  } else if (action === 'complete') {
    isActive.value = false
    completeSession()
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const saveSettings = () => {
  localStorage.setItem('pomodoroSettings', JSON.stringify(settings.value))
  closeSettings()
  if (!isActive.value) {
    initTimer()
  }
}

const resetSettings = () => {
  settings.value = { ...defaultSettings }
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('pomodoroSettings')
  if (saved) {
    try {
      settings.value = { ...defaultSettings, ...JSON.parse(saved) }
    } catch (error) {
      console.error('Failed to load pomodoro settings:', error)
    }
  }
}

// 加载今日统计
const loadTodayStats = () => {
  const today = new Date().toDateString()
  const savedStats = localStorage.getItem('pomodoroStats')

  if (savedStats) {
    try {
      const stats = JSON.parse(savedStats)
      if (stats.date === today) {
        todaysSessions.value = stats.sessions || 0
        totalFocusTime.value = stats.totalTime || 0
      }
    } catch (error) {
      console.error('Failed to load pomodoro stats:', error)
    }
  }
}

// 保存今日统计
const saveTodayStats = () => {
  const today = new Date().toDateString()
  const stats = {
    date: today,
    sessions: todaysSessions.value,
    totalTime: totalFocusTime.value
  }
  localStorage.setItem('pomodoroStats', JSON.stringify(stats))
}

// 生命周期
onMounted(() => {
  loadSettings()
  loadTodayStats()
  initTimer()
})

onUnmounted(() => {
  timerWorker?.terminate()
  saveTodayStats()
})

// 监听设置变化
watch(() => settings.value, saveTodayStats, { deep: true })

const emit = defineEmits(['pomodoroComplete'])
</script>
