<template>
  <div class="duplicate-cleaner">
    <div class="cleaner-header">
      <h3>🔧 重复数据清理工具</h3>
      <p class="description">检测并清理数据库中的重复Todo记录</p>
    </div>

    <div class="cleaner-content">
      <!-- 统计信息 -->
      <div class="stats-section">
        <h4>📊 数据统计</h4>
        <div v-if="loading.stats" class="loading">
          <div class="spinner"></div>
          <span>正在获取统计信息...</span>
        </div>
        <div v-else-if="stats" class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalTodos }}</div>
            <div class="stat-label">总Todo数</div>
          </div>
          <div class="stat-card" :class="{ warning: stats.duplicateGroups > 0 }">
            <div class="stat-value">{{ stats.duplicateGroups }}</div>
            <div class="stat-label">重复组数</div>
          </div>
          <div class="stat-card" :class="{ error: stats.totalDuplicates > 0 }">
            <div class="stat-value">{{ stats.totalDuplicates }}</div>
            <div class="stat-label">重复记录数</div>
          </div>
        </div>
        <button class="refresh-btn" :disabled="loading.stats" @click="loadStats">
          🔄 刷新统计
        </button>
      </div>

      <!-- 重复详情 -->
      <div v-if="stats && stats.duplicateGroups > 0" class="duplicates-section">
        <h4>🔍 重复数据详情</h4>
        <div class="duplicate-groups">
          <div
            v-for="(group, index) in stats.duplicateDetails"
            :key="index"
            class="duplicate-group"
          >
            <div class="group-header">
              <span class="group-title">标题: "{{ group.title }}"</span>
              <span class="group-count">{{ group.count }} 条记录</span>
            </div>
            <div class="group-records">
              <div v-for="(id, idx) in group.ids" :key="id" class="record-item">
                <span class="record-id">{{ id.substring(0, 8) }}...</span>
                <span class="record-time">{{ formatDate(group.createdAts[idx]) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 清理操作 -->
      <div class="cleanup-section">
        <h4>🛠️ 清理操作</h4>
        <div class="cleanup-options">
          <label class="checkbox-label">
            <input v-model="dryRun" type="checkbox" :disabled="loading.cleanup" />
            <span class="checkmark"></span>
            模拟运行（不实际删除数据）
          </label>
        </div>

        <div class="cleanup-actions">
          <button
            class="cleanup-btn"
            :class="{ danger: !dryRun }"
            :disabled="loading.cleanup || (stats && stats.duplicateGroups === 0)"
            @click="performCleanup"
          >
            <span v-if="loading.cleanup" class="spinner small"></span>
            {{ dryRun ? '🔍 模拟清理' : '🗑️ 执行清理' }}
          </button>

          <button class="validate-btn" :disabled="loading.validate" @click="validateResult">
            <span v-if="loading.validate" class="spinner small"></span>
            ✅ 验证结果
          </button>
        </div>
      </div>

      <!-- 清理结果 -->
      <div v-if="cleanupResult" class="result-section">
        <h4>📋 清理结果</h4>
        <div class="result-summary" :class="resultClass">
          <div class="result-stats">
            <p><strong>原始记录数:</strong> {{ cleanupResult.originalCount }}</p>
            <p><strong>清理后记录数:</strong> {{ cleanupResult.cleanedCount }}</p>
            <p><strong>移除记录数:</strong> {{ cleanupResult.removedCount }}</p>
            <p><strong>解决冲突数:</strong> {{ cleanupResult.conflicts.length }}</p>
          </div>

          <div v-if="cleanupResult.conflicts.length > 0" class="conflicts-detail">
            <h5>冲突解决详情:</h5>
            <div
              v-for="(conflict, index) in cleanupResult.conflicts"
              :key="index"
              class="conflict-item"
            >
              <p><strong>标题:</strong> "{{ conflict.title }}"</p>
              <p><strong>保留记录:</strong> {{ conflict.keptId.substring(0, 12) }}...</p>
              <p><strong>移除记录:</strong> {{ conflict.removedIds.length }} 条</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 验证结果 -->
      <div v-if="validationResult" class="validation-section">
        <h4>✅ 验证结果</h4>
        <div
          class="validation-summary"
          :class="{ success: validationResult.isValid, error: !validationResult.isValid }"
        >
          <p v-if="validationResult.isValid" class="success-message">
            ✅ 数据验证通过，没有发现重复数据
          </p>
          <div v-else class="error-message">
            ❌ 数据验证失败
            <p><strong>剩余重复组:</strong> {{ validationResult.remainingDuplicates }}</p>
            <ul v-if="validationResult.issues.length > 0">
              <li v-for="issue in validationResult.issues" :key="issue">{{ issue }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { logger } from '../utils/logger'

// 响应式数据
const stats = ref<Record<string, unknown> | null>(null)
const cleanupResult = ref<Record<string, unknown> | null>(null)
const validationResult = ref<Record<string, unknown> | null>(null)
const dryRun = ref(true)

const loading = ref({
  stats: false,
  cleanup: false,
  validate: false,
})

const { isAuthenticated } = useAuth()

// 计算属性
const resultClass = computed(() => {
  if (!cleanupResult.value) return ''
  return cleanupResult.value.removedCount > 0 ? 'success' : 'info'
})

// 方法
const loadStats = async () => {
  if (!isAuthenticated.value) {
    logger.warn('User not authenticated', {}, 'DuplicateDataCleaner')
    return
  }

  loading.value.stats = true
  try {
    const response = await fetch('/api/v1/todos/duplicates/stats', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (response.ok) {
      stats.value = await response.json()
      logger.info('Duplicate stats loaded', { stats: stats.value }, 'DuplicateDataCleaner')
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    logger.error('Failed to load duplicate stats', { error }, 'DuplicateDataCleaner')
    stats.value = null
  } finally {
    loading.value.stats = false
  }
}

const performCleanup = async () => {
  if (!isAuthenticated.value) return

  loading.value.cleanup = true
  cleanupResult.value = null

  try {
    const response = await fetch(`/api/v1/todos/duplicates/cleanup?dryRun=${dryRun.value}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      cleanupResult.value = await response.json()
      logger.info(
        'Cleanup completed',
        {
          result: cleanupResult.value,
          dryRun: dryRun.value,
        },
        'DuplicateDataCleaner'
      )

      // 刷新统计信息
      await loadStats()
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    logger.error('Cleanup failed', { error }, 'DuplicateDataCleaner')
  } finally {
    loading.value.cleanup = false
  }
}

const validateResult = async () => {
  if (!isAuthenticated.value) return

  loading.value.validate = true
  validationResult.value = null

  try {
    const response = await fetch('/api/v1/todos/duplicates/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (response.ok) {
      validationResult.value = await response.json()
      logger.info(
        'Validation completed',
        { result: validationResult.value },
        'DuplicateDataCleaner'
      )
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    logger.error('Validation failed', { error }, 'DuplicateDataCleaner')
  } finally {
    loading.value.validate = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 生命周期
onMounted(() => {
  if (isAuthenticated.value) {
    loadStats()
  }
})
</script>

<style scoped>
.duplicate-cleaner {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.cleaner-header {
  text-align: center;
  margin-bottom: 30px;
}

.cleaner-header h3 {
  color: #333;
  margin-bottom: 10px;
}

.description {
  color: #666;
  font-size: 14px;
}

.cleaner-content > div {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
}

.stat-card.warning {
  background: #fff3cd;
  border-color: #ffc107;
}

.stat-card.error {
  background: #f8d7da;
  border-color: #dc3545;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.duplicate-groups {
  max-height: 300px;
  overflow-y: auto;
}

.duplicate-group {
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 15px;
  overflow: hidden;
}

.group-header {
  background: #f8f9fa;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
}

.group-title {
  font-weight: bold;
  color: #333;
}

.group-count {
  background: #dc3545;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.group-records {
  padding: 10px 15px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-id {
  font-family: monospace;
  color: #666;
}

.record-time {
  color: #999;
  font-size: 12px;
}

.cleanup-options {
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type='checkbox'] {
  margin-right: 10px;
}

.cleanup-actions {
  display: flex;
  gap: 15px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  background: #6c757d;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a6268;
}

.cleanup-btn {
  background: #28a745;
  color: white;
}

.cleanup-btn.danger {
  background: #dc3545;
}

.cleanup-btn:hover:not(:disabled) {
  background: #218838;
}

.cleanup-btn.danger:hover:not(:disabled) {
  background: #c82333;
}

.validate-btn {
  background: #17a2b8;
  color: white;
}

.validate-btn:hover:not(:disabled) {
  background: #138496;
}

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner.small {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.result-summary,
.validation-summary {
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid;
}

.result-summary.success,
.validation-summary.success {
  background: #d4edda;
  border-left-color: #28a745;
}

.result-summary.info {
  background: #d1ecf1;
  border-left-color: #17a2b8;
}

.result-summary.error,
.validation-summary.error {
  background: #f8d7da;
  border-left-color: #dc3545;
}

.conflicts-detail {
  margin-top: 15px;
}

.conflict-item {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.conflict-item p {
  margin: 5px 0;
  font-size: 14px;
}

.success-message {
  color: #155724;
  font-weight: bold;
}

.error-message {
  color: #721c24;
}

.error-message ul {
  margin-top: 10px;
  padding-left: 20px;
}
</style>
