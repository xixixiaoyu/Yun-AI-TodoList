<template>
  <div class="flex flex-col gap-2 md:gap-2">
    <button
      v-if="!isGenerating"
      class="px-4 py-3 text-sm bg-button-bg text-white border-none rounded-xl cursor-pointer h-[44px] min-w-[80px] flex items-center justify-center gap-2 hover:bg-button-hover hover:shadow-[0_4px_12px_rgba(121,180,166,0.3)] disabled:bg-input-border disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200 font-medium md:h-[40px] md:min-w-[75px] md:text-[13px] md:px-3 md:py-2"
      @click="$emit('send')"
    >
      <SendIcon class="w-4 h-4" />
      {{ t('send') }}
    </button>
    <button
      v-else
      class="px-4 py-3 text-sm bg-red-500 text-white border-none rounded-xl cursor-pointer h-[44px] min-w-[80px] flex items-center justify-center gap-2 hover:bg-red-600 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] disabled:bg-input-border disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200 font-medium md:h-[40px] md:min-w-[75px] md:text-[13px] md:px-3 md:py-2"
      @click="$emit('stop')"
    >
      <StopIcon class="w-4 h-4" />
      {{ t('stop') }}
    </button>
    <button
      class="relative px-4 py-3 text-sm bg-input-bg text-text border border-input-border rounded-xl cursor-pointer h-[44px] min-w-[100px] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-button-hover hover:text-white hover:border-button-bg md:px-3.5 md:text-[13px] md:h-[40px] md:min-w-[85px] md:py-2"
      :class="{
        'bg-button-bg text-white border-button-bg animate-pulse shadow-[0_4px_12px_rgba(121,180,166,0.3)]':
          isListening,
        'bg-red-500 text-white border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.3)]':
          recognitionStatus === 'error',
        'bg-button-hover text-white border-button-hover': recognitionStatus === 'processing'
      }"
      :disabled="!isRecognitionSupported"
      :title="lastError || t(isListening ? 'stopListening' : 'startListening')"
      @click="isListening ? $emit('stopListening') : $emit('startListening')"
    >
      <MicrophoneIcon class="w-4 h-4" />
      <span class="font-medium">{{ isListening ? t('stopListening') : t('startListening') }}</span>
      <span
        v-if="lastError"
        class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-red-500 bg-bg px-3 py-1.5 rounded-lg shadow-lg border border-red-200"
      >
        {{ lastError }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MicrophoneIcon from '../common/icons/MicrophoneIcon.vue'
import SendIcon from '../common/icons/SendIcon.vue'
import StopIcon from '../common/icons/StopIcon.vue'

interface Props {
  isGenerating: boolean
  isListening: boolean
  recognitionStatus: string
  lastError: string | null
  isRecognitionSupported: boolean
}

interface Emits {
  (e: 'send'): void
  (e: 'stop'): void
  (e: 'startListening'): void
  (e: 'stopListening'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ChatInputControls'
})
</script>
