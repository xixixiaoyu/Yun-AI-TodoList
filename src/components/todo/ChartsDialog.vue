<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 backdrop-blur z-1000 flex items-center justify-center p-4"
    @click="$emit('close')"
  >
    <div
      class="bg-card rounded-2xl p-8 max-w-[800px] max-h-[90vh] overflow-y-auto relative shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-input-border w-full md:p-6 sm:p-4 sm:rounded-xl sm:max-h-full"
      @click.stop
    >
      <button
        class="absolute top-4 right-4 bg-[rgba(255,126,103,0.1)] text-text border border-[rgba(255,126,103,0.2)] rounded-lg p-2 cursor-pointer transition-all-300 flex items-center justify-center w-9 h-9 hover:bg-[rgba(255,126,103,0.2)] hover:border-[rgba(255,126,103,0.4)] hover:transform-hover-up-1 md:top-3 md:right-3 md:w-8 md:h-8 md:p-1.5 sm:top-2 sm:right-2 sm:w-7 sm:h-7 sm:p-1"
        :aria-label="t('close')"
        @click="$emit('close')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="md:w-4 md:h-4 sm:w-3.5 sm:h-3.5"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <h2
        class="m-0 mb-8 text-2xl font-semibold text-text text-center pr-12 md:text-xl md:mb-6 md:pr-10 sm:text-lg sm:mb-4 sm:pr-8"
      >
        {{ t('productivityInsights') }}
      </h2>

      <TodoCompletionChart />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TodoCompletionChart from './TodoCompletionChart.vue'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

defineOptions({
  name: 'ChartsDialog',
})
</script>
