<template>
  <div v-if="show" class="api-key-prompt">
    <div class="prompt-content">
      <div class="prompt-header">
        <h3>🔑 需要配置 API Key</h3>
        <button class="close-btn" @click="closePrompt">×</button>
      </div>
      <p>要使用 AI 优先级排序功能，请先配置 DeepSeek API Key。</p>
      <div class="prompt-actions">
        <button class="primary-btn" @click="openSettings">前往设置</button>
        <button class="secondary-btn" @click="closePrompt">稍后配置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'openSettings'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const closePrompt = () => {
  emit('close')
}

const openSettings = () => {
  emit('openSettings')
  closePrompt()
}
</script>

<style scoped>
.api-key-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.prompt-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.prompt-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.prompt-content p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.prompt-actions {
  display: flex;
  gap: 12px;
}

.primary-btn {
  flex: 1;
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.primary-btn:hover {
  background: #0056b3;
}

.secondary-btn {
  flex: 1;
  background: #f8f9fa;
  color: #666;
  border: 1px solid #dee2e6;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #e9ecef;
  color: #495057;
}

@media (prefers-color-scheme: dark) {
  .prompt-content {
    background: #2d3748;
    color: #e2e8f0;
  }

  .prompt-header h3 {
    color: #e2e8f0;
  }

  .close-btn {
    color: #a0aec0;
  }

  .close-btn:hover {
    color: #e2e8f0;
  }

  .prompt-content p {
    color: #a0aec0;
  }

  .secondary-btn {
    background: #4a5568;
    color: #a0aec0;
    border-color: #2d3748;
  }

  .secondary-btn:hover {
    background: #2d3748;
    color: #e2e8f0;
  }
}
</style>
