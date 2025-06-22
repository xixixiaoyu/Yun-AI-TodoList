<template>
  <div class="flex flex-col gap-2 md:gap-2">
    <button
      v-if="!isGenerating"
      class="w-11 h-11 bg-button-bg text-white border-none rounded-xl cursor-pointer flex items-center justify-center hover:bg-button-hover hover:shadow-[0_4px_12px_rgba(121,180,166,0.3)] disabled:bg-input-border disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200 md:w-10 md:h-10"
      :title="t('send')"
      @click="$emit('send')"
    >
      <SendIcon class="w-5 h-5 md:w-4 md:h-4" />
    </button>
    <button
      v-else
      class="w-11 h-11 bg-red-300 text-white border-none rounded-xl cursor-pointer flex items-center justify-center hover:bg-red-400 hover:shadow-[0_4px_12px_rgba(252,165,165,0.3)] disabled:bg-input-border disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200 md:w-10 md:h-10"
      :title="t('stop')"
      @click="$emit('stop')"
    >
      <StopIcon class="w-5 h-5 md:w-4 md:h-4" />
    </button>
    <button
      class="relative w-11 h-11 bg-input-bg text-text border border-input-border rounded-xl cursor-pointer flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-button-hover hover:text-white hover:border-button-bg md:w-10 md:h-10"
      :class="{
        'bg-button-bg text-white border-button-bg animate-pulse shadow-[0_4px_12px_rgba(121,180,166,0.3)]':
          isListening,
        'bg-red-300 text-white border-red-300 shadow-[0_4px_12px_rgba(252,165,165,0.3)]':
          recognitionStatus === 'error',
        'bg-button-hover text-white border-button-hover': recognitionStatus === 'processing',
      }"
      :disabled="!isRecognitionSupported"
      :title="lastError || t(isListening ? 'stopListening' : 'listening')"
      @click="isListening ? $emit('stopListening') : $emit('startListening')"
    >
      <MicrophoneIcon class="w-5 h-5 md:w-4 md:h-4" />
      <span
        v-if="lastError"
        class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-red-400 bg-bg px-3 py-1.5 rounded-lg shadow-lg border border-red-100"
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
  name: 'ChatInputControls',
})
</script>
