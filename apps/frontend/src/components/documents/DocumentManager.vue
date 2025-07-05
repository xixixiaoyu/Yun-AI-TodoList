<template>
  <div class="document-manager">
    <div class="document-header">
      <h2>文档管理</h2>
      <div class="document-actions">
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json"
          @change="handleFileUpload"
        />
        <button @click="triggerFileUpload" class="btn btn-primary" :disabled="isUploading">
          <span v-if="isUploading">上传中...</span>
          <span v-else>上传文档</span>
        </button>
      </div>
    </div>

    <!-- 文档统计 -->
    <div v-if="stats" class="document-stats">
      <div class="stat-item">
        <span class="stat-label">总文档数</span>
        <span class="stat-value">{{ stats.totalDocuments }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已处理</span>
        <span class="stat-value">{{ stats.processedDocuments }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">待处理</span>
        <span class="stat-value">{{ stats.pendingDocuments }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总大小</span>
        <span class="stat-value">{{ formatFileSize(stats.totalSize) }}</span>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="document-search">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索文档内容..."
        class="search-input"
        @keyup.enter="performSearch"
      />
      <button @click="performSearch" class="btn btn-secondary" :disabled="isSearching">
        <span v-if="isSearching">搜索中...</span>
        <span v-else>搜索</span>
      </button>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="search-results">
      <h3>搜索结果</h3>
      <div v-for="(result, index) in searchResults" :key="index" class="search-result-item">
        <div class="result-content">{{ result.content.substring(0, 200) }}...</div>
        <div class="result-meta">
          <span class="result-score">相似度: {{ (result.score * 100).toFixed(1) }}%</span>
          <span v-if="result.document" class="result-document">
            来源: {{ result.document.filename }}
          </span>
        </div>
      </div>
    </div>

    <!-- 文档列表 -->
    <div class="document-list">
      <h3>我的文档</h3>
      <div v-if="isLoading" class="loading">加载中...</div>
      <div v-else-if="documents.length === 0" class="empty-state">暂无文档，请上传文档开始使用</div>
      <div v-else>
        <div v-for="document in documents" :key="document.id" class="document-item">
          <div class="document-info">
            <div class="document-name">{{ document.filename }}</div>
            <div class="document-meta">
              <span class="document-size">{{ formatFileSize(document.fileSize) }}</span>
              <span class="document-type">{{ document.fileType }}</span>
              <span class="document-status" :class="{ processed: document.processed }">
                {{ document.processed ? '已处理' : '处理中' }}
              </span>
              <span class="document-date">{{ formatDate(document.createdAt) }}</span>
            </div>
          </div>
          <div class="document-actions">
            <button @click="viewDocument(document)" class="btn btn-sm btn-secondary">查看</button>
            <button @click="deleteDocument(document.id)" class="btn btn-sm btn-danger">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination && pagination.totalPages > 1" class="pagination">
      <button
        @click="loadPage(pagination.page - 1)"
        :disabled="pagination.page <= 1"
        class="btn btn-sm"
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ pagination.page }} 页，共 {{ pagination.totalPages }} 页
      </span>
      <button
        @click="loadPage(pagination.page + 1)"
        :disabled="pagination.page >= pagination.totalPages"
        class="btn btn-sm"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getUserDocuments,
  uploadDocument,
  deleteDocument as deleteDocumentApi,
  searchDocuments,
  getDocumentStats,
  type Document,
  type DocumentStats,
  type SearchResult,
} from '@/services/documentService'
import { formatFileSize } from '@yun-ai-todolist/shared/utils'

// 响应式数据
const documents = ref<Document[]>([])
const stats = ref<DocumentStats | null>(null)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const pagination = ref<any>(null)
const fileInputRef = ref<HTMLInputElement>()

// 状态
const isLoading = ref(false)
const isUploading = ref(false)
const isSearching = ref(false)

// 生命周期
onMounted(() => {
  loadDocuments()
  loadStats()
})

// 方法
const loadDocuments = async (page: number = 1) => {
  isLoading.value = true
  try {
    const result = await getUserDocuments(page, 10)
    if (result.success && result.data) {
      documents.value = result.data.documents
      pagination.value = result.data.pagination
    }
  } catch (error) {
    console.error('加载文档列表失败:', error)
  } finally {
    isLoading.value = false
  }
}

const loadStats = async () => {
  try {
    const result = await getDocumentStats()
    if (result.success && result.data) {
      stats.value = result.data
    }
  } catch (error) {
    console.error('加载文档统计失败:', error)
  }
}

const loadPage = (page: number) => {
  loadDocuments(page)
}

const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  isUploading.value = true
  try {
    const result = await uploadDocument(file)
    if (result.success) {
      // 重新加载文档列表和统计
      await Promise.all([loadDocuments(), loadStats()])
      alert('文档上传成功！')
    } else {
      alert(result.error || '文档上传失败')
    }
  } catch (error) {
    console.error('文档上传失败:', error)
    alert('文档上传失败')
  } finally {
    isUploading.value = false
    target.value = ''
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  try {
    const result = await searchDocuments(searchQuery.value, 5, 0.6)
    if (result.success && result.data) {
      searchResults.value = result.data.results
    }
  } catch (error) {
    console.error('文档搜索失败:', error)
  } finally {
    isSearching.value = false
  }
}

const viewDocument = (document: Document) => {
  // 这里可以实现文档查看功能
  console.log('查看文档:', document)
}

const deleteDocument = async (documentId: string) => {
  if (!confirm('确定要删除这个文档吗？')) return

  try {
    const result = await deleteDocumentApi(documentId)
    if (result.success) {
      // 重新加载文档列表和统计
      await Promise.all([loadDocuments(), loadStats()])
      alert('文档删除成功！')
    } else {
      alert(result.error || '文档删除失败')
    }
  } catch (error) {
    console.error('文档删除失败:', error)
    alert('文档删除失败')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.document-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.document-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.document-search {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-results {
  margin-bottom: 20px;
}

.search-result-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 10px;
}

.result-content {
  margin-bottom: 5px;
  color: #333;
}

.result-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.document-list h3 {
  margin-bottom: 15px;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
}

.document-info {
  flex: 1;
}

.document-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.document-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.document-status.processed {
  color: #28a745;
}

.document-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hidden {
  display: none;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
