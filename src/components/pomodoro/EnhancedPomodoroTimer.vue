<template>
  <div class="enhanced-pomodoro-timer" :class="{ fullscreen: isFullscreen }">
    <div class="timer-header">
      <h3 class="timer-title">
        {{ isBreak ? t('pomodoro.breakTime', 'Break Time') : t('pomodoro.workTime', 'Work Time') }}
      </h3>
      <div class="timer-controls">
        <button
          class="control-button"
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
          class="control-button"
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

    <div class="timer-display-container">
      <div class="timer-circle" :style="circleStyle">
        <svg class="progress-ring" width="200" height="200">
          <circle
            class="progress-ring-background"
            cx="100"
            cy="100"
            r="90"
            fill="transparent"
            stroke="var(--border-color)"
            stroke-width="8"
          />
          <circle
            class="progress-ring-progress"
            cx="100"
            cy="100"
            r="90"
            fill="transparent"
            :stroke="progressColor"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div class="timer-content">
          <div class="timer-display">{{ formattedTime }}</div>
          <div class="timer-status">
            {{ isBreak ? t('pomodoro.break', 'Break') : t('pomodoro.focus', 'Focus') }}
          </div>
          <div class="session-counter">
            {{ t('pomodoro.session', 'Session') }} {{ completedSessions + 1 }}
          </div>
        </div>
      </div>
    </div>

    <div class="timer-actions">
      <button class="action-button primary" :disabled="timeLeft === 0" @click="toggleTimer">
        {{
          isActive
            ? isPaused
              ? t('pomodoro.resume', 'Resume')
              : t('pomodoro.pause', 'Pause')
            : t('pomodoro.start', 'Start')
        }}
      </button>
      <button class="action-button secondary" @click="resetTimer">
        {{ t('pomodoro.reset', 'Reset') }}
      </button>
      <button class="action-button secondary" @click="skipSession">
        {{ t('pomodoro.skip', 'Skip') }}
      </button>
    </div>

    <div class="timer-stats">
      <div class="stat-item">
        <div class="stat-value">{{ completedSessions }}</div>
        <div class="stat-label">{{ t('pomodoro.completed', 'Completed') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ totalFocusTime }}</div>
        <div class="stat-label">{{ t('pomodoro.totalTime', 'Total Time') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ todaysSessions }}</div>
        <div class="stat-label">{{ t('pomodoro.today', 'Today') }}</div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-overlay" @click="closeSettings">
      <div class="settings-modal" @click.stop>
        <div class="settings-header">
          <h4>{{ t('pomodoro.timerSettings', 'Timer Settings') }}</h4>
          <button class="close-button" @click="closeSettings">×</button>
        </div>
        <div class="settings-content">
          <div class="setting-group">
            <label
              >{{ t('pomodoro.workDuration', 'Work Duration') }} ({{
                t('pomodoro.minutes', 'minutes')
              }})</label
            >
            <input v-model.number="settings.workTime" type="number" min="1" max="60" />
          </div>
          <div class="setting-group">
            <label
              >{{ t('pomodoro.shortBreak', 'Short Break') }} ({{
                t('pomodoro.minutes', 'minutes')
              }})</label
            >
            <input v-model.number="settings.shortBreak" type="number" min="1" max="30" />
          </div>
          <div class="setting-group">
            <label
              >{{ t('pomodoro.longBreak', 'Long Break') }} ({{
                t('pomodoro.minutes', 'minutes')
              }})</label
            >
            <input v-model.number="settings.longBreak" type="number" min="1" max="60" />
          </div>
          <div class="setting-group">
            <label>{{ t('pomodoro.sessionsBeforeLongBreak', 'Sessions before long break') }}</label>
            <input
              v-model.number="settings.sessionsBeforeLongBreak"
              type="number"
              min="2"
              max="10"
            />
          </div>
          <div class="setting-group">
            <label>
              <input v-model="settings.autoStartBreaks" type="checkbox" />
              {{ t('pomodoro.autoStartBreaks', 'Auto-start breaks') }}
            </label>
          </div>
          <div class="setting-group">
            <label>
              <input v-model="settings.autoStartWork" type="checkbox" />
              {{ t('pomodoro.autoStartWork', 'Auto-start work sessions') }}
            </label>
          </div>
        </div>
        <div class="settings-actions">
          <button class="action-button secondary" @click="resetSettings">
            {{ t('pomodoro.resetDefaults', 'Reset to Defaults') }}
          </button>
          <button class="action-button primary" @click="saveSettings">
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

<style scoped>
.enhanced-pomodoro-timer {
  background: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
}

.enhanced-pomodoro-timer.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border-radius: 0;
  padding: 2rem;
  background: var(--bg-color);
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.timer-title {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
}

.timer-controls {
  display: flex;
  gap: 0.5rem;
}

.control-button {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;
}

.control-button:hover {
  background: var(--hover-bg-color);
}

.timer-display-container {
  margin: 2rem 0;
}

.timer-circle {
  position: relative;
  display: inline-block;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.3s ease;
}

.timer-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.timer-display {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.timer-status {
  font-size: 1rem;
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 0.25rem;
}

.session-counter {
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.6;
}

.timer-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-button.primary {
  background: var(--primary-color);
  color: white;
}

.action-button.primary:hover {
  background: var(--primary-hover-color);
}

.action-button.secondary {
  background: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.action-button.secondary:hover {
  background: var(--hover-bg-color);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timer-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.7;
}

/* 设置弹窗样式 */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.settings-modal {
  background: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.settings-header h4 {
  margin: 0;
  color: var(--text-color);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-color);
  padding: 0.25rem;
}

.settings-content {
  padding: 1rem;
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-size: 0.9rem;
}

.setting-group input[type='number'] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg-color);
  color: var(--text-color);
}

.setting-group input[type='checkbox'] {
  margin-right: 0.5rem;
}

.settings-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.settings-actions .action-button {
  flex: 1;
}

@media (max-width: 768px) {
  .enhanced-pomodoro-timer {
    padding: 1rem;
  }

  .timer-actions {
    flex-direction: column;
  }

  .timer-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .timer-display {
    font-size: 2rem;
  }
}
</style>
