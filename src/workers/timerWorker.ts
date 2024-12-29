let interval: ReturnType<typeof setInterval> | null = null
let timeLeft: number = 0

const cleanup = () => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

self.onmessage = (e: MessageEvent) => {
  try {
    if (e.data.action === 'start') {
      cleanup()
      timeLeft = e.data.duration
      interval = setInterval(() => {
        timeLeft--
        self.postMessage({ timeLeft })
        if (timeLeft <= 0) {
          cleanup()
          self.postMessage({ action: 'complete' })
        }
      }, 1000)
    } else if (e.data.action === 'pause') {
      cleanup()
    } else if (e.data.action === 'resume') {
      cleanup()
      interval = setInterval(() => {
        timeLeft--
        self.postMessage({ timeLeft })
        if (timeLeft <= 0) {
          cleanup()
          self.postMessage({ action: 'complete' })
        }
      }, 1000)
    } else if (e.data.action === 'reset') {
      cleanup()
      timeLeft = e.data.duration
      self.postMessage({ timeLeft })
    }
  } catch (error) {
    cleanup()
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

// 确保在 worker 终止时清理资源
self.addEventListener('unload', cleanup)
