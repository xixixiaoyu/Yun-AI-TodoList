<script setup lang="ts">
import { onErrorCaptured } from 'vue'

onErrorCaptured((err, instance, info) => {
	console.error('Captured error:', err, instance, info)
	return false
})
</script>

<template>
	<div class="app">
		<router-view></router-view>
	</div>
</template>

<style>
body {
	font-family: 'Helvetica Neue', Arial, sans-serif;
	background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
	margin: 0;
	padding: 0;
	min-height: 100vh;
}

.app {
	display: flex;
	justify-content: center;
	align-items: flex-start;
}
</style>
