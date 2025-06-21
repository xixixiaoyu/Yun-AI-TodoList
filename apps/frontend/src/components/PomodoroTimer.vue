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
        <button @click="toggleSettings" class="settings-btn">⚙️</button>
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

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <h4>{{ t('pomodoroSettings') }}</h4>
        <button @click="toggleSettings" class="close-btn">×</button>
      </div>
      <div class="settings-content">
        <div class="setting-item">
          <label>{{ t('workDuration') }}</label>
          <div class="time-input">
            <input
              v-model.number="customWorkMinutes"
              type="number"
              min="1"
              max="120"
              :disabled="isActive"
            />
            <span>{{ t('minutes') }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label>{{ t('breakDuration') }}</label>
          <div class="time-input">
            <input
              v-model.number="customBreakMinutes"
              type="number"
              min="1"
              max="60"
              :disabled="isActive"
            />
            <span>{{ t('minutes') }}</span>
          </div>
        </div>
        <div class="settings-actions">
          <button @click="applySettings" :disabled="isActive" class="apply-btn">
            {{ t('apply') }}
          </button>
          <button @click="resetToDefault" :disabled="isActive" class="reset-btn">
            {{ t('resetToDefault') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

// 默认时间设置
const DEFAULT_WORK_TIME = 25
const DEFAULT_BREAK_TIME = 5

// 状态管理
const isActive = ref(false)
const isPaused = ref(false)
const isBreak = ref(false)
const isWorkCompleted = ref(false)
const showSettings = ref(false)

// 自定义时间设置
const customWorkMinutes = ref(DEFAULT_WORK_TIME)
const customBreakMinutes = ref(DEFAULT_BREAK_TIME)
const workTime = ref(DEFAULT_WORK_TIME * 60)
const breakTime = ref(DEFAULT_BREAK_TIME * 60)

const timeLeft = ref(workTime.value)
let initialTime = workTime.value

// 从 localStorage 加载设置
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('pomodoroSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      customWorkMinutes.value = settings.workMinutes || DEFAULT_WORK_TIME
      customBreakMinutes.value = settings.breakMinutes || DEFAULT_BREAK_TIME
      workTime.value = customWorkMinutes.value * 60
      breakTime.value = customBreakMinutes.value * 60
      timeLeft.value = workTime.value
      initialTime = workTime.value
    }
  } catch (error) {
    console.error('Failed to load pomodoro settings:', error)
  }
}

// 保存设置到 localStorage
const saveSettings = () => {
  try {
    const settings = {
      workMinutes: customWorkMinutes.value,
      breakMinutes: customBreakMinutes.value,
    }
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save pomodoro settings:', error)
  }
}

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 设置相关方法
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const applySettings = () => {
  workTime.value = customWorkMinutes.value * 60
  breakTime.value = customBreakMinutes.value * 60

  if (!isActive.value) {
    timeLeft.value = isBreak.value ? breakTime.value : workTime.value
    initialTime = timeLeft.value
  }

  saveSettings()
  showSettings.value = false
}

const resetToDefault = () => {
  customWorkMinutes.value = DEFAULT_WORK_TIME
  customBreakMinutes.value = DEFAULT_BREAK_TIME
  applySettings()
}

// 计时器逻辑使用 requestAnimationFrame 实现

let timerInterval: ReturnType<typeof setInterval> | null = null

const startTimer = () => {
  if (!isActive.value && !isPaused.value) {
    initialTime = isBreak.value ? breakTime.value : workTime.value
    timeLeft.value = initialTime
  }
  isActive.value = true
  isPaused.value = false

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timerInterval!)
      timerInterval = null

      if (!isBreak.value) {
        isActive.value = false
        isBreak.value = true
        timeLeft.value = breakTime.value
        initialTime = breakTime.value
        isWorkCompleted.value = false
        notifyUser(false)
      } else {
        resetTimer()
        notifyUser(true)
      }
    }
  }, 1000)
}

const pauseTimer = () => {
  isPaused.value = true
  isActive.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resumeTimer = () => {
  if (isPaused.value) {
    startTimer() // 直接调用 startTimer 来恢复计时
  }
}

const resetTimer = () => {
  isActive.value = false
  isPaused.value = false
  isBreak.value = false
  timeLeft.value = workTime.value
  initialTime = workTime.value
  isWorkCompleted.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const startBreak = () => {
  isBreak.value = true
  timeLeft.value = breakTime.value
  initialTime = breakTime.value
  isWorkCompleted.value = false
}

const notifyUser = (isWorkTime: boolean) => {
  // 浏览器通知
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      // 已有权限，直接发送通知
      const notification = new Notification(t('pomodoroComplete'), {
        body: isWorkTime ? t('workTimeStarted') : t('breakTimeStarted'),
        icon: '/favicon.ico', // 添加图标
        tag: 'pomodoro-timer', // 防止重复通知
        requireInteraction: true, // 需要用户交互才能关闭
        silent: true, // 静音，不播放系统通知声音
      })

      // 3秒后自动关闭通知
      setTimeout(() => {
        notification.close()
      }, 3000)
    } else if (Notification.permission === 'default') {
      // 请求权限
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const notification = new Notification(t('pomodoroComplete'), {
            body: isWorkTime ? t('workTimeStarted') : t('breakTimeStarted'),
            icon: '/favicon.ico',
            tag: 'pomodoro-timer',
            requireInteraction: true,
            silent: true, // 静音，不播放系统通知声音
          })

          setTimeout(() => {
            notification.close()
          }, 3000)
        }
      })
    }
    // 如果权限被拒绝，不显示通知但继续其他逻辑
  }

  // 页面内视觉提醒（即使没有通知权限也会显示）
  showVisualAlert(isWorkTime)

  // 发出事件
  emit('pomodoroComplete', !isWorkTime)
}

// 页面内视觉提醒
const showVisualAlert = (isWorkTime: boolean) => {
  // 显示页面内弹窗提醒
  showInPageAlert(isWorkTime)

  // 控制台日志（开发调试用）
  console.log(
    `🍅 ${t('pomodoroComplete')} - ${isWorkTime ? t('workTimeStarted') : t('breakTimeStarted')}`
  )
}

// 页面内弹窗提醒
const showInPageAlert = (isWorkTime: boolean) => {
  // 创建临时的页面内提醒元素
  const alertDiv = document.createElement('div')
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: 'LXGW WenKai Lite Medium', sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
  `

  alertDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 20px;">🍅</span>
      <div>
        <div style="font-weight: bold; margin-bottom: 4px;">${t('pomodoroComplete')}</div>
        <div style="font-size: 12px; opacity: 0.9;">${isWorkTime ? t('workTimeStarted') : t('breakTimeStarted')}</div>
      </div>
    </div>
  `

  // 添加动画样式
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)

  document.body.appendChild(alertDiv)

  // 3秒后移除提醒
  setTimeout(() => {
    alertDiv.style.animation = 'slideOutRight 0.3s ease-in'
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv)
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }, 300)
  }, 3000)
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
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

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-btn {
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
}

.settings-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  z-index: 1000;
  margin-top: 0.5rem;
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
  font-size: 1rem;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-color);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: var(--button-hover-bg-color);
  border-radius: 50%;
}

.settings-content {
  padding: 1rem;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color);
  font-weight: 500;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-input input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.9rem;
}

.time-input input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.time-input input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-input span {
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.8;
}

.settings-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.apply-btn {
  background-color: var(--primary-color);
  color: white;
}

.apply-btn:hover:not(:disabled) {
  background-color: var(--primary-hover-color);
}

.reset-btn {
  background-color: var(--secondary-color);
  color: var(--text-color);
}

.reset-btn:hover:not(:disabled) {
  background-color: var(--secondary-hover-color);
}

.pomodoro-timer {
  position: relative;
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
