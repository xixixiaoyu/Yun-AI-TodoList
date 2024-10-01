<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

// 导入音频文件
import track1 from '../assets/audio/真正432Hz-适合睡眠版.mp3'
import track2 from '../assets/audio/1 Hour NEW Headset Immersion ❤️.mp3'
import track3 from '../assets/audio/真正432Hz-适合睡眠版.mp3'

const { t } = useI18n()

const audioElement = ref<HTMLAudioElement | null>(null)
const currentTrackIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isLoading = ref(false)
const volume = ref(1)
const error = ref('')

const playlist = [
	{ title: t('track1Title'), src: track1 },
	{ title: t('track2Title'), src: track2 },
	{ title: t('track3Title'), src: track3 },
]

const currentTrack = ref(playlist[currentTrackIndex.value])

const togglePlay = async () => {
	if (audioElement.value) {
		if (isPlaying.value) {
			audioElement.value.pause()
			isPlaying.value = false
		} else {
			try {
				isLoading.value = true
				await audioElement.value.play()
				isPlaying.value = true
			} catch (err) {
				console.error('播放失败:', err)
				error.value = t('playError')
			} finally {
				isLoading.value = false
			}
		}
	}
}

const playNext = () => {
	currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.length
	currentTrack.value = playlist[currentTrackIndex.value]
	resetAudioState()
	nextTick(() => {
		if (isPlaying.value) {
			togglePlay()
		}
	})
}

const playPrevious = () => {
	currentTrackIndex.value =
		(currentTrackIndex.value - 1 + playlist.length) % playlist.length
	currentTrack.value = playlist[currentTrackIndex.value]
	resetAudioState()
	nextTick(() => {
		if (isPlaying.value) {
			togglePlay()
		}
	})
}

const resetAudioState = () => {
	currentTime.value = 0
	duration.value = 0
	isLoading.value = true
	error.value = ''
}

const formatTime = (time: number) => {
	if (!isFinite(time) || isNaN(time)) return '0:00'
	const minutes = Math.floor(time / 60)
	const seconds = Math.floor(time % 60)
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const updateProgress = (event: Event) => {
	const target = event.target as HTMLInputElement
	if (audioElement.value) {
		const time = (parseFloat(target.value) / 100) * audioElement.value.duration
		audioElement.value.currentTime = time
	}
}

const switchToTrack = (index: number) => {
	if (currentTrackIndex.value === index) return
	currentTrackIndex.value = index
	currentTrack.value = playlist[currentTrackIndex.value]
	// 只有当前不在播放状态时才重置音频状态
	if (!isPlaying.value) {
		resetAudioState()
	} else {
		// 如果当前正在播放，我们只重置部分状态
		currentTime.value = 0
		duration.value = 0
		error.value = ''
	}
	nextTick(() => {
		if (isPlaying.value) {
			togglePlay()
		}
	})
}

const isPlaylistOpen = ref(false)

const togglePlaylist = () => {
	isPlaylistOpen.value = !isPlaylistOpen.value
}

const updateVolume = () => {
	if (audioElement.value) {
		audioElement.value.volume = volume.value
	}
}

onMounted(() => {
	if (audioElement.value) {
		audioElement.value.addEventListener('timeupdate', () => {
			if (audioElement.value) {
				currentTime.value = audioElement.value.currentTime
				if (!isNaN(audioElement.value.duration)) {
					duration.value = audioElement.value.duration
				}
			}
		})
		audioElement.value.addEventListener('loadedmetadata', () => {
			if (audioElement.value) {
				duration.value = audioElement.value.duration
				isLoading.value = false
			}
		})
		audioElement.value.addEventListener('ended', () => {
			playNext()
		})
		audioElement.value.addEventListener('canplay', () => {
			isLoading.value = false
		})
		audioElement.value.addEventListener('error', e => {
			console.error('Audio error:', e)
			error.value = t('audioError')
			isLoading.value = false
		})
	}
})

watch(currentTrack, () => {
	if (audioElement.value) {
		resetAudioState()
		audioElement.value.src = currentTrack.value.src
		if (isPlaying.value) {
			togglePlay()
		}
	}
})
</script>

<template>
	<div class="audio-player">
		<audio ref="audioElement" :src="currentTrack.src" preload="metadata"></audio>
		<div class="track-info">
			<transition name="fade" mode="out-in">
				<div :key="currentTrack.title" class="track-details">
					<h3>{{ $t(currentTrack.title) }}</h3>
				</div>
			</transition>
		</div>
		<div class="controls">
			<button @click="playPrevious" :disabled="isLoading">{{ t('previous') }}</button>
			<button @click="togglePlay" :disabled="isLoading">
				{{ isPlaying ? t('pause') : t('play') }}
			</button>
			<button @click="playNext" :disabled="isLoading">{{ t('next') }}</button>
			<div class="playlist-container">
				<button @click="togglePlaylist" class="playlist-toggle">
					{{ t('playlist') }}
				</button>
				<div v-if="isPlaylistOpen" class="playlist-dropdown">
					<ul>
						<li
							v-for="(track, index) in playlist"
							:key="index"
							:class="{ active: index === currentTrackIndex }"
							@click="switchToTrack(index)"
						>
							{{ track.title }}
						</li>
					</ul>
				</div>
			</div>
		</div>
		<div :class="['loading', { active: isLoading }]">
			{{ t('loading') }}
		</div>
		<div v-if="error" class="error">{{ error }}</div>
		<div class="progress">
			<input
				type="range"
				min="0"
				max="100"
				:value="duration > 0 ? (currentTime / duration) * 100 : 0"
				@input="updateProgress"
				:disabled="isLoading || duration === 0"
			/>
			<div class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
		</div>
		<div class="volume-control">
			<input
				type="range"
				min="0"
				max="1"
				step="0.1"
				v-model="volume"
				@input="updateVolume"
			/>
			<span>{{ t('volume') }}: {{ Math.round(volume * 100) }}%</span>
		</div>
	</div>
</template>

<style scoped>
.audio-player {
	font-family: 'LXGW WenKai Screen', sans-serif;
	background-color: var(--card-bg-color);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
	padding: 1rem;
	margin-bottom: 1rem;
}

.track-info {
	text-align: center;
	margin-bottom: 1rem;
}

.controls {
	display: flex;
	justify-content: center;
	gap: 1rem;
	margin-bottom: 1rem;
	position: relative;
	flex-wrap: wrap;
}

.controls button {
	padding: 0.5rem 1rem;
	font-size: 1rem;
	background-color: var(--button-bg-color);
	color: var(--text-color);
	border: none;
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.controls button:hover {
	background-color: var(--button-hover-bg-color);
}

.progress {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.progress input[type='range'] {
	width: 100%;
	margin-bottom: 0.5rem;
}

.time {
	font-size: 0.8rem;
	color: var(--text-color);
}

.loading,
.error {
	text-align: center;
	margin: 10px 0;
	color: var(--text-color);
}

.error {
	color: #e74c3c;
}

.controls button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.playlist-toggle {
	padding: 0.5rem 1rem;
	font-size: 1rem;
	background-color: var(--button-bg-color);
	color: var(--text-color);
	border: none;
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.playlist-toggle:hover {
	background-color: var(--button-hover-bg-color);
}

.playlist-container {
	position: relative;
}

.playlist-dropdown {
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	background-color: var(--card-bg-color);
	border: 1px solid var(--input-border-color);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
	z-index: 10;
	max-height: 200px;
	overflow-y: auto;
	width: 200px;
}

.playlist-dropdown ul {
	list-style-type: none;
	padding: 0;
	margin: 0;
}

.playlist-dropdown li {
	padding: 0.5rem 1rem;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

.playlist-dropdown li:hover {
	background-color: var(--button-hover-bg-color);
}

.playlist-dropdown li.active {
	background-color: var(--button-bg-color);
	color: var(--card-bg-color);
}

.volume-control {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 1rem;
}

.volume-control input[type='range'] {
	width: 100px;
	margin-right: 0.5rem;
}

.loading {
	transition: opacity 0.3s ease;
	opacity: 0;
	height: 0;
	overflow: hidden;
}

.loading.active {
	opacity: 1;
	height: auto;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(10px);
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
	transform: translateY(0);
}

.track-info {
	position: relative;
	height: 60px; /* Adjust based on your design */
	overflow: hidden;
}

.track-details {
	position: absolute;
	width: 100%;
}

@media (max-width: 768px) {
	.controls {
		flex-direction: column;
		align-items: center;
	}

	.controls button {
		width: 100%;
	}

	.playlist-dropdown {
		left: 0;
		transform: none;
		width: 100%;
	}
}
</style>
