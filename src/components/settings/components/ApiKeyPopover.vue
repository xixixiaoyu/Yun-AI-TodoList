<template>
  <div class="api-key-popover">
    <ApiKeyPopoverHeader @close="$emit('close')" />

    <div class="popover-content">
      <ApiKeySecurityInfo />

      <ApiKeyInputSection
        :local-api-key="localApiKey"
        :show-api-key="showApiKey"
        @update:local-api-key="$emit('update:localApiKey', $event)"
        @toggle-show-api-key="toggleShowApiKey"
      />

      <ApiKeyActionButtons
        :local-api-key="localApiKey"
        @save="$emit('save')"
        @clear="$emit('clear')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ApiKeyPopoverHeader from './ApiKeyPopoverHeader.vue'
import ApiKeySecurityInfo from './ApiKeySecurityInfo.vue'
import ApiKeyInputSection from './ApiKeyInputSection.vue'
import ApiKeyActionButtons from './ApiKeyActionButtons.vue'

interface Props {
  localApiKey: string
  showApiKey: boolean
}

interface Emits {
  (e: 'update:localApiKey', value: string): void
  (e: 'update:showApiKey', value: boolean): void
  (e: 'close'): void
  (e: 'save'): void
  (e: 'clear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toggleShowApiKey = () => {
  emit('update:showApiKey', !props.showApiKey)
}

defineOptions({
  name: 'ApiKeyPopover',
})
</script>

<style scoped>
.api-key-popover {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 2rem);
  max-width: 520px;
  background-color: var(--card-bg-color);
  border-radius: 24px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 1001;
  animation: popoverIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.popover-content {
  padding: 1rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@keyframes popoverIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -45%) scale(0.9);
    filter: blur(10px);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -48%) scale(1.02);
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    filter: blur(0);
  }
}

@media (max-width: 768px) {
  .api-key-popover {
    width: calc(100% - 1rem);
    max-width: none;
    border-radius: 20px;
  }

  .popover-content {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .api-key-popover {
    width: calc(100% - 0.75rem);
    border-radius: 16px;
  }

  .popover-content {
    padding: 0.75rem 1.25rem 1.25rem 1.25rem;
    gap: 1.25rem;
  }
}
</style>
