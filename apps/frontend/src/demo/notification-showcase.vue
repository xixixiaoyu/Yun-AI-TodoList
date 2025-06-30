<template>
  <div class="notification-showcase">
    <div class="showcase-header">
      <h2>🔔 通知系统展示</h2>
      <p>体验全新优化的通知系统，包含自动消失、防重复、视觉效果等功能</p>
    </div>

    <div class="showcase-controls">
      <div class="control-section">
        <h3>基础通知类型</h3>
        <div class="button-grid">
          <button class="btn btn-success" @click="testSuccess">
            <i class="i-carbon-checkmark-filled"></i>
            成功通知 (3秒)
          </button>
          <button class="btn btn-danger" @click="testError">
            <i class="i-carbon-error-filled"></i>
            错误通知 (8秒)
          </button>
          <button class="btn btn-warning" @click="testWarning">
            <i class="i-carbon-warning-filled"></i>
            警告通知 (6秒)
          </button>
          <button class="btn btn-info" @click="testInfo">
            <i class="i-carbon-information-filled"></i>
            信息通知 (4秒)
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>同步相关通知</h3>
        <div class="button-grid">
          <button class="btn btn-success" @click="testSyncSuccess">
            <i class="i-carbon-cloud-upload"></i>
            同步成功
          </button>
          <button class="btn btn-danger" @click="testSyncError">
            <i class="i-carbon-cloud-offline"></i>
            同步失败
          </button>
          <button class="btn btn-info" @click="testNetworkOnline">
            <i class="i-carbon-wifi"></i>
            网络恢复
          </button>
          <button class="btn btn-warning" @click="testNetworkOffline">
            <i class="i-carbon-wifi-off"></i>
            网络断开
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>特殊功能测试</h3>
        <div class="button-grid">
          <button class="btn btn-info" @click="testCustomDuration">
            <i class="i-carbon-timer"></i>
            自定义时长 (2秒)
          </button>
          <button class="btn btn-warning" @click="testPersistent">
            <i class="i-carbon-pin-filled"></i>
            持久化通知
          </button>
          <button class="btn btn-secondary" @click="testDuplicate">
            <i class="i-carbon-copy"></i>
            重复通知测试
          </button>
          <button class="btn btn-primary" @click="testBatch">
            <i class="i-carbon-batch-job"></i>
            批量通知
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>管理操作</h3>
        <div class="button-grid">
          <button class="btn btn-danger" @click="clearAll">
            <i class="i-carbon-trash-can"></i>
            清除所有通知
          </button>
          <button class="btn btn-secondary" @click="showDebugInfo">
            <i class="i-carbon-debug"></i>
            显示调试信息
          </button>
        </div>
      </div>
    </div>

    <div class="showcase-stats">
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalNotifications }}</div>
        <div class="stat-label">当前通知数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.activeTimers }}</div>
        <div class="stat-label">活跃定时器</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.cacheEntries }}</div>
        <div class="stat-label">缓存条目</div>
      </div>
    </div>

    <!-- 调试信息弹窗 -->
    <div v-if="showDebug" class="debug-modal" @click="showDebug = false">
      <div class="debug-content" @click.stop>
        <div class="debug-header">
          <h3>调试信息</h3>
          <button class="close-btn" @click="showDebug = false">
            <i class="i-carbon-close"></i>
          </button>
        </div>
        <pre class="debug-data">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '../composables/useNotifications'

const {
  success,
  error,
  warning,
  info,
  loading,
  syncSuccess,
  syncError,
  networkOnline,
  networkOffline,
  clearNotifications,
  getDebugInfo,
} = useNotifications()

const showDebug = ref(false)
const stats = ref({
  totalNotifications: 0,
  activeTimers: 0,
  cacheEntries: 0,
})
const debugInfo = ref({})

let refreshInterval: number | null = null

// 基础通知测试
const testSuccess = () => {
  success('操作成功', '您的操作已成功完成，数据已保存')
  updateStats()
}

const testError = () => {
  error('操作失败', '网络连接超时，请检查您的网络设置后重试')
  updateStats()
}

const testWarning = () => {
  warning('注意事项', '您有未保存的更改，离开页面前请确保保存数据')
  updateStats()
}

const testInfo = () => {
  info('系统提示', '新版本已发布，建议您更新到最新版本以获得更好体验')
  updateStats()
}

// 同步通知测试
const testSyncSuccess = () => {
  syncSuccess({ uploaded: 5, downloaded: 3, conflicts: 0 })
  updateStats()
}

const testSyncError = () => {
  syncError({ message: '服务器连接失败，请稍后重试' })
  updateStats()
}

const testNetworkOnline = () => {
  networkOnline()
  updateStats()
}

const testNetworkOffline = () => {
  networkOffline()
  updateStats()
}

// 特殊功能测试
const testCustomDuration = () => {
  success('快速通知', '这个通知将在2秒后消失', { duration: 2000 })
  updateStats()
}

const testPersistent = () => {
  loading('处理中', '正在处理您的请求，请稍候...')
  updateStats()
}

const testDuplicate = () => {
  // 连续创建相同通知，测试防重复功能
  success('重复测试', '第一个通知')
  setTimeout(() => success('重复测试', '第一个通知'), 100) // 应该被阻止
  setTimeout(() => success('重复测试', '第一个通知'), 200) // 应该被阻止
  updateStats()
}

const testBatch = () => {
  // 批量创建不同类型的通知
  success('批量通知 1', '成功消息')
  setTimeout(() => info('批量通知 2', '信息消息'), 200)
  setTimeout(() => warning('批量通知 3', '警告消息'), 400)
  setTimeout(() => error('批量通知 4', '错误消息'), 600)
  updateStats()
}

const clearAll = () => {
  clearNotifications()
  updateStats()
}

const showDebugInfo = () => {
  debugInfo.value = getDebugInfo()
  showDebug.value = true
}

const updateStats = () => {
  const info = getDebugInfo()
  stats.value = info.stats
}

onMounted(() => {
  updateStats()
  // 每秒更新统计信息
  refreshInterval = window.setInterval(updateStats, 1000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

defineOptions({
  name: 'NotificationShowcase',
})
</script>

<style scoped>
.notification-showcase {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.showcase-header {
  text-align: center;
  margin-bottom: 40px;
}

.showcase-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 2rem;
}

.showcase-header p {
  color: #666;
  font-size: 1.1rem;
}

.showcase-controls {
  display: grid;
  gap: 30px;
  margin-bottom: 40px;
}

.control-section h3 {
  margin-bottom: 15px;
  color: #444;
  font-size: 1.2rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: left;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn i {
  font-size: 16px;
}

.btn-success {
  background: #10b981;
  color: white;
}
.btn-danger {
  background: #ef4444;
  color: white;
}
.btn-warning {
  background: #f59e0b;
  color: white;
}
.btn-info {
  background: #3b82f6;
  color: white;
}
.btn-primary {
  background: #8b5cf6;
  color: white;
}
.btn-secondary {
  background: #6b7280;
  color: white;
}

.showcase-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.debug-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.debug-content {
  background: white;
  border-radius: 12px;
  max-width: 80vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.debug-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #333;
}

.debug-data {
  padding: 20px;
  margin: 0;
  background: #f8f9fa;
  overflow: auto;
  max-height: 60vh;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .button-grid {
    grid-template-columns: 1fr;
  }

  .showcase-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .debug-content {
    max-width: 95vw;
    max-height: 90vh;
  }
}
</style>
