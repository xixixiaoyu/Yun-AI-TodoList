<template>
  <div class="sync-manager">
    <!-- 同步状态显示 -->
    <div class="sync-status">
      <div class="status-indicator" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ syncStatusText }}</span>
      </div>

      <div v-if="syncState.conflictsCount > 0" class="conflict-indicator">
        <span class="conflict-count">{{ syncState.conflictsCount }} 个冲突</span>
        <button class="resolve-btn" @click="showConflictModal = true">解决冲突</button>
      </div>

      <button
        class="sync-btn"
        :disabled="syncState.syncInProgress || !canSync"
        @click="handleManualSync"
      >
        <span v-if="syncState.syncInProgress">同步中...</span>
        <span v-else>手动同步</span>
      </button>
    </div>

    <!-- 同步错误显示 -->
    <div v-if="syncState.syncError" class="sync-error">
      <span class="error-icon">⚠️</span>
      <span class="error-message">{{ syncState.syncError }}</span>
      <button class="retry-btn" @click="handleManualSync">重试</button>
    </div>

    <!-- 冲突解决模态框 -->
    <ConflictResolutionModal
      :conflicts="currentConflicts"
      :is-visible="showConflictModal"
      @close="closeConflictModal"
      @resolve="handleConflictResolution"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataSync } from '../../composables/useDataSync'
import ConflictResolutionModal from './ConflictResolutionModal.vue'

// 使用数据同步 composable
const {
  syncState,
  canSync,
  syncStatusText,
  currentConflicts,
  showConflictModal,
  manualSync,
  handleConflictResolution,
  closeConflictModal,
} = useDataSync()

// 计算状态样式类
const statusClass = computed(() => {
  if (syncState.syncInProgress) return 'syncing'
  if (syncState.syncError) return 'error'
  if (syncState.conflictsCount > 0) return 'conflict'
  if (!canSync.value) return 'offline'
  return 'success'
})

// 手动同步处理
const handleManualSync = async () => {
  try {
    await manualSync()
  } catch (error) {
    console.error('手动同步失败:', error)
  }
}
</script>

<style scoped>
.sync-manager {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

.sync-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.status-indicator.success .status-dot {
  background-color: #10b981;
}

.status-indicator.syncing .status-dot {
  background-color: #3b82f6;
  animation: pulse 1.5s infinite;
}

.status-indicator.error .status-dot {
  background-color: #ef4444;
}

.status-indicator.conflict .status-dot {
  background-color: #f59e0b;
}

.status-indicator.offline .status-dot {
  background-color: #6b7280;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.9rem;
  color: #374151;
}

.conflict-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 4px;
}

.conflict-count {
  font-size: 0.8rem;
  color: #92400e;
  font-weight: 500;
}

.resolve-btn {
  padding: 0.25rem 0.5rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.resolve-btn:hover {
  background: #d97706;
}

.sync-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.sync-btn:hover:not(:disabled) {
  background: #2563eb;
}

.sync-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.sync-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  margin-top: 1rem;
}

.error-icon {
  font-size: 1.2rem;
}

.error-message {
  flex: 1;
  color: #dc2626;
  font-size: 0.9rem;
}

.retry-btn {
  padding: 0.25rem 0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .sync-status {
    flex-direction: column;
    align-items: stretch;
  }

  .conflict-indicator {
    justify-content: space-between;
  }
}
</style>
