<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const currentTime = ref(new Date())
let timer: number | null = null

const updateTime = () => {
	currentTime.value = new Date()
}

onMounted(() => {
	updateTime()
	timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
	if (timer) {
		clearInterval(timer)
	}
})
</script>

<template>
	<div class="clock">
		{{ currentTime.toLocaleTimeString(t('locale')) }}
	</div>
</template>

<style scoped>
.clock {
	font-family: 'LXGW WenKai Screen', sans-serif;
	font-size: 1.2rem;
	color: var(--text-color);
	background-color: var(--card-bg-color);
	padding: 0.5rem 1rem;
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
	display: inline-block;
	transition: all 0.3s ease;
}
</style>
