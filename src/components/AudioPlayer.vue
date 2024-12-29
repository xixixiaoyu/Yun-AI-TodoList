<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

// 导入音频文件
import track1 from '../assets/audio/真正432Hz-适合睡眠版.mp3'
import track2 from '../assets/audio/1 Hour NEW Headset Immersion ❤️.mp3'
import track3 from '../assets/audio/ASMR-假人头麦克风保证全程1小时的良好睡眠.mp3'
import track4 from '../assets/audio/执迷不悟.mp3'
const { t } = useI18n()

const audioElement = ref<HTMLAudioElement | null>(null)
const currentTrackIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isLoading = ref(false)
const volume = ref(1)
const error = ref('')
const progress = ref(0)
const repeat = ref(false)

const playlist = computed(() => [
  { title: t('track1Title'), src: track1 },
  { title: t('track2Title'), src: track2 },
  { title: t('track3Title'), src: track3 },
  { title: t('track4Title'), src: track4 },
])

const currentTrack = computed(() => playlist.value[currentTrackIndex.value])

const togglePlay = async () => {
  if (audioElement.value) {
    try {
      if (isPlaying.value) {
        await audioElement.value.pause()
        isPlaying.value = false
      } else {
        isLoading.value = true
        // 添加超时处理
        const playPromise = audioElement.value.play()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(t('playbackTimeout'))), 5000)
        })

        await Promise.race([playPromise, timeoutPromise])
        isPlaying.value = true
      }
    } catch (err) {
      console.error(t('playbackError', { error: err }))
      error.value = err instanceof Error ? err.message : t('playError')
      isPlaying.value = false
    } finally {
      isLoading.value = false
    }
  }
}

const playNext = () => {
  try {
    if (playlist.value.length === 0) return
    const index = (currentTrackIndex.value + 1) % playlist.value.length
    currentTrackIndex.value = index
    resetAudioState()
    if (isPlaying.value) {
      nextTick(() => togglePlay())
    }
  } catch (error) {
    console.error(t('playbackError', { error }))
    showError(t('nextTrackError'))
  }
}

const playPrevious = () => {
  try {
    if (playlist.value.length === 0) return
    currentTrackIndex.value =
      (currentTrackIndex.value - 1 + playlist.value.length) % playlist.value.length
    resetAudioState()
    if (isPlaying.value) {
      nextTick(() => togglePlay())
    }
  } catch (error) {
    console.error(t('playbackError', { error }))
    showError(t('previousTrackError'))
  }
}

const resetAudioState = () => {
  currentTime.value = 0
  duration.value = 0
  isLoading.value = true
  error.value = ''
  progress.value = 0
}

const showError = (message: string) => {
  error.value = message
  const timer = setTimeout(() => {
    error.value = ''
    clearTimeout(timer)
  }, 3000)
}

const formatTime = (time: number) => {
  if (!isFinite(time) || isNaN(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const updateProgress = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
    progress.value = (currentTime.value / duration.value) * 100 || 0
  }
}

const switchToTrack = (index: number) => {
  if (currentTrackIndex.value === index) return
  currentTrackIndex.value = index
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
    audioElement.value.addEventListener('timeupdate', updateProgress)
    audioElement.value.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.value?.duration || 0
      isLoading.value = false
    })
    audioElement.value.addEventListener('ended', () => {
      isPlaying.value = false
      if (repeat.value) {
        togglePlay()
      } else {
        playNext()
      }
    })
    audioElement.value.addEventListener('error', (e) => {
      const error = e.target as HTMLAudioElement
      console.error('Audio error:', error.error)
      showError(t('audioLoadError'))
      isLoading.value = false
      isPlaying.value = false
    })
  }
})

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.removeEventListener('timeupdate', updateProgress)
    audioElement.value.removeEventListener('loadedmetadata', () => {})
    audioElement.value.removeEventListener('ended', () => {})
    audioElement.value.removeEventListener('error', () => {})
  }
})
</script>

<template>
  <div class="audio-player">
    <audio ref="audioElement" :src="currentTrack.src" preload="metadata" />
    <div class="track-info">
      <transition name="fade" mode="out-in">
        <div :key="currentTrack.title" class="track-details">
          <h3 :title="currentTrack.title">
            {{ currentTrack.title }}
          </h3>
        </div>
      </transition>
    </div>
    <div class="controls">
      <button :disabled="isLoading" @click="playPrevious">
        {{ t('previous') }}
      </button>
      <button :disabled="isLoading" @click="togglePlay">
        {{ isPlaying ? t('pause') : t('play') }}
      </button>
      <button :disabled="isLoading" @click="playNext">
        {{ t('next') }}
      </button>
      <div class="playlist-container">
        <button class="playlist-toggle" @click="togglePlaylist">
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
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div class="progress-container">
      <div class="progress">
        <input
          type="range"
          min="0"
          max="100"
          :value="duration > 0 ? (currentTime / duration) * 100 : 0"
          :disabled="isLoading || duration === 0"
          @input="updateProgress"
        />
        <div class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
      </div>
    </div>
    <div class="volume-control">
      <input
        v-model="volume"
        type="range"
        min="0"
        max="1"
        step="0.1"
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
  width: 300px;
  position: fixed;
  top: calc(1rem + 150px); /* 假设每日激励卡片高度约为150px */
  left: 1rem;
  z-index: 1000;
}

.track-info {
  text-align: center;
  margin-bottom: 1rem;
  height: 1.5em; /* 设置固定高度 */
  overflow: hidden; /* 隐藏溢出内容 */
}

.track-details h3 {
  margin: 0;
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 使用省略号表示溢出 */
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

.progress-container {
  height: 50px; /* Set a fixed height for the container */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease; /* Add smooth transition */
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
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
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

@media (max-width: 1200px) {
  .audio-player {
    position: static;
    width: 100%;
    max-width: 600px;
    margin: 0 auto 1rem;
  }
}

@media (max-width: 768px) {
  .audio-player {
    width: calc(100% - 2rem);
    margin: 1rem auto;
  }
}
</style>
