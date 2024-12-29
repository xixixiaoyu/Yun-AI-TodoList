import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '../types/web-speech-api'

// 添加 SpeechRecognition 类型声明
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition
    webkitSpeechRecognition?: typeof SpeechRecognition
  }
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const { t } = useI18n()
  const isListening = ref(false)
  const recognition = ref<any | null>(null)
  const errorCount = ref(0)
  const maxErrorRetries = 2
  const isRecognitionSupported = ref(true)
  const recognitionStatus = ref<'idle' | 'listening' | 'processing' | 'error'>('idle')
  const lastError = ref('')

  // 检查浏览器是否支持语音识别
  const checkSpeechRecognitionSupport = () => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      isRecognitionSupported.value = false
      console.error(t('browserSpeechNotSupported'))
      return false
    }
    return true
  }

  const initSpeechRecognition = async () => {
    try {
      // 1. 检查浏览器支持
      if (!checkSpeechRecognitionSupport()) {
        recognitionStatus.value = 'error'
        lastError.value = t('browserNotSupported')
        return
      }

      // 2. 检查麦克风权限
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log(t('micPermissionGranted'))
      } catch (error) {
        console.error(t('micPermissionError', { error }))
        recognitionStatus.value = 'error'
        lastError.value = t('microphonePermissionDenied')
        return
      }

      // 3. 创建新的识别实例前先停止和清理旧实例
      if (recognition.value) {
        try {
          recognition.value.stop()
        } catch (e) {
          console.log(t('stopOldInstance', { error: e }))
        }
        recognition.value = null
      }

      // 4. 创建新实例
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.value = new SpeechRecognitionAPI()

      // 5. 基本配置
      recognition.value.continuous = true
      recognition.value.interimResults = true
      recognition.value.maxAlternatives = 1

      // 6. 设置语言
      const preferredLang = t('locale') === 'zh' ? 'zh-CN' : 'en-US'
      recognition.value.lang = preferredLang

      // 7. 事件处理
      recognition.value.onstart = () => {
        isListening.value = true
        recognitionStatus.value = 'listening'
        errorCount.value = 0
        lastError.value = ''
      }

      recognition.value.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript)
        }
      }

      recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error(t('speechRecognitionError', { error: event.error }))
        recognitionStatus.value = 'error'
        lastError.value = t('speechRecognitionError')

        // 处理特定类型的错误
        switch (event.error) {
          case 'no-speech':
            // 无语音输入，可以继续
            break
          case 'network':
            // 网络错误，尝试重连
            errorCount.value++
            if (errorCount.value <= maxErrorRetries) {
              setTimeout(() => {
                console.log(t('retryingConnection'))
                restartRecognition()
              }, 1000 * errorCount.value) // 递增重试延迟
            }
            break
          case 'not-allowed':
          case 'service-not-allowed':
            // 权限错误，停止重试
            isListening.value = false
            break
          default:
            // 其他错误，如果次数未超过限制则重试
            errorCount.value++
            if (errorCount.value <= maxErrorRetries) {
              setTimeout(restartRecognition, 1000)
            }
        }
      }

      recognition.value.onend = () => {
        // 如果仍在监听状态但识别结束，说明是意外终止
        if (isListening.value && errorCount.value <= maxErrorRetries) {
          console.log(t('reconnecting'))
          setTimeout(restartRecognition, 1000)
        } else {
          isListening.value = false
          recognitionStatus.value = 'idle'
        }
      }

      // 添加音频级别监测
      recognition.value.onaudiostart = () => {
        console.log(t('audioDetected'))
      }

      recognition.value.onaudioend = () => {
        console.log(t('audioEnded'))
      }

      // 添加噪音处理
      recognition.value.onnomatch = () => {
        console.log(t('noMatchFound'))
      }
    } catch (error) {
      console.error(t('initRecognitionError', { error }))
      recognitionStatus.value = 'error'
      lastError.value = t('initializationError')
      isListening.value = false
    }
  }

  const restartRecognition = () => {
    if (isListening.value && recognition.value && recognitionStatus.value !== 'error') {
      try {
        setTimeout(() => {
          if (isListening.value) {
            recognition.value.start()
            recognitionStatus.value = 'listening'
          }
        }, 500)
      } catch (e) {
        console.error(t('restartRecognitionError', { error: e }))
        recognitionStatus.value = 'error'
        isListening.value = false
      }
    }
  }

  const startListening = async () => {
    try {
      if (!recognition.value) {
        await initSpeechRecognition()
      }

      if (recognition.value && recognitionStatus.value !== 'error') {
        errorCount.value = 0
        lastError.value = ''
        recognitionStatus.value = 'listening'
        recognition.value.start()
      }
    } catch (error) {
      console.error(t('startRecognitionError', { error }))
      recognitionStatus.value = 'error'
      lastError.value = t('speechRecognitionError')
      isListening.value = false
    }
  }

  const stopListening = () => {
    try {
      if (recognition.value) {
        isListening.value = false
        recognitionStatus.value = 'idle'
        recognition.value.stop()
        recognition.value = null
      }
    } catch (error) {
      console.error(t('stopRecognitionError', { error }))
      recognitionStatus.value = 'error'
      isListening.value = false
    }
  }

  return {
    isListening,
    recognitionStatus,
    lastError,
    isRecognitionSupported,
    startListening,
    stopListening,
  }
}
