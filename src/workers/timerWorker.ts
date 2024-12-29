let interval: number | null = null
let timeLeft: number = 0

self.onmessage = (e: MessageEvent) => {
  if (e.data.action === 'start') {
    timeLeft = e.data.duration
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      timeLeft--
      self.postMessage({ timeLeft })
      if (timeLeft <= 0) {
        clearInterval(interval)
        self.postMessage({ action: 'complete' })
      }
    }, 1000)
  } else if (e.data.action === 'pause') {
    if (interval) clearInterval(interval)
  } else if (e.data.action === 'resume') {
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      timeLeft--
      self.postMessage({ timeLeft })
      if (timeLeft <= 0) {
        clearInterval(interval)
        self.postMessage({ action: 'complete' })
      }
    }, 1000)
  } else if (e.data.action === 'reset') {
    if (interval) clearInterval(interval)
    timeLeft = e.data.duration
    self.postMessage({ timeLeft })
  }
}
