<template>
  <Transition
    name="overlay"
    enter-active-class="transition-opacity duration-300 ease-in-out"
    leave-active-class="transition-opacity duration-300 ease-in-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999]"
      @click="$emit('click', $event)"
    />
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
}

interface Emits {
  (e: 'click', event: Event): void
}

defineProps<Props>()
defineEmits<Emits>()

defineOptions({
  name: 'Overlay',
})
</script>
