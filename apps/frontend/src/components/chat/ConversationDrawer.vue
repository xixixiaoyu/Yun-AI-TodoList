<template>
  <div
    class="absolute top-0 left-0 h-full bg-bg/95 backdrop-blur-sm transition-transform duration-300 shadow-lg z-[1001] drawer-responsive w-80 md:w-72 sm:w-64"
    :class="{
      'translate-x-0': isOpen,
      '-translate-x-full': !isOpen,
    }"
  >
    <div class="h-full flex flex-col">
      <!-- 头部区域 -->
      <div class="drawer-header">
        <div class="header-title">
          <h3 class="title-text">
            {{ t('conversations') }}
          </h3>
          <span class="conversation-count">{{ conversations.length }}</span>
        </div>

        <div class="header-actions">
          <button class="action-button export-button" title="导出对话" @click="handleExport">
            <DownloadIcon class="action-icon" />
          </button>

          <button
            class="action-button clear-button"
            :title="t('clearAllConversations')"
            @click="handleClearAll"
          >
            <TrashIcon class="action-icon" />
          </button>

          <button class="action-button close-button" @click="$emit('update:isOpen', false)">
            <XIcon class="action-icon" />
          </button>
        </div>
      </div>

      <!-- 对话列表 -->
      <div class="conversations-list">
        <div v-if="conversations.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <p class="empty-text">
            {{ t('noConversationRecords') }}
          </p>
        </div>

        <div
          v-for="conversation in conversations"
          :key="conversation.id"
          class="conversation-item"
          :class="{ 'conversation-active': currentConversationId === conversation.id }"
          @click.stop="$emit('switch', conversation.id)"
        >
          <div class="conversation-content">
            <div class="conversation-header">
              <h4 class="conversation-title">{{ conversation.title }}</h4>
              <span class="conversation-date">
                {{ formatDate(conversation.lastUpdated) }}
              </span>
            </div>

            <div class="conversation-meta">
              <span class="message-count">{{ conversation.messages.length }} 条消息</span>
              <div v-if="conversation.tags?.length" class="conversation-tags">
                <span
                  v-for="tag in conversation.tags.slice(0, 2)"
                  :key="tag"
                  class="conversation-tag"
                >
                  {{ tag }}
                </span>
                <span v-if="conversation.tags.length > 2" class="more-tags">
                  +{{ conversation.tags.length - 2 }}
                </span>
              </div>
            </div>
          </div>

          <div class="conversation-actions">
            <button
              class="conversation-action-button"
              :title="t('deleteConversation')"
              @click.stop="handleDeleteConversation(conversation.id)"
            >
              <TrashIcon class="action-icon-small" />
            </button>
          </div>
        </div>
      </div>

      <!-- 底部统计信息 -->
      <div class="drawer-footer">
        <div class="stats-info">
          <span class="stats-text">
            {{
              t('conversationStats', {
                conversations: conversations.length,
                messages: totalMessages,
              })
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ConversationHistoryService } from '../../services/conversationHistoryService'
import type { Conversation } from '../../services/types'

import DownloadIcon from '../common/icons/DownloadIcon.vue'
import TrashIcon from '../common/icons/TrashIcon.vue'
import XIcon from '../common/icons/XIcon.vue'

interface Props {
  isOpen: boolean
  conversations: Conversation[]
  currentConversationId: string | null
}

interface ExportOptions {
  format: 'json' | 'markdown' | 'txt'
  includeMetadata: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  conversations?: string[] // conversation IDs
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'switch', id: string): void
  (e: 'delete', id: string): void
  (e: 'clear'): void
  (e: 'export', options: ExportOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

// 计算属性
const totalMessages = computed(() =>
  props.conversations.reduce((sum, conv) => sum + conv.messages.length, 0)
)

// 方法

const handleExport = async () => {
  try {
    const exportData = await ConversationHistoryService.exportConversations({
      format: 'json',
      includeMetadata: true,
    })

    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversations-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    emit('export', { format: 'json', success: true })
  } catch (error) {
    console.error(t('exportFailed'), error)
    emit('export', { format: 'json', success: false, error })
  }
}

const handleClearAll = () => {
  if (confirm(t('confirmClearAllConversations'))) {
    emit('clear')
  }
}

const handleDeleteConversation = (id: string) => {
  if (confirm(t('confirmDeleteConversation'))) {
    emit('delete', id)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return t('today')
  if (diffDays === 2) return t('yesterday')
  if (diffDays <= 7) return t('daysAgo', { days: diffDays })

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

defineOptions({
  name: 'ConversationDrawer',
})
</script>

<style scoped>
.drawer-header {
  @apply flex items-center justify-between p-4 border-b border-input-border;
}

.header-title {
  @apply flex items-center gap-3;
}

.title-text {
  @apply text-lg font-semibold text-text m-0;
}

.conversation-count {
  @apply px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full;
}

.header-actions {
  @apply flex items-center gap-2;
}

.action-button {
  @apply p-2 bg-transparent border border-input-border rounded-lg;
  @apply text-text-secondary hover:text-text hover:bg-input-bg;
  @apply transition-all duration-200 cursor-pointer;
}

.action-icon {
  @apply w-4 h-4;
}

.conversations-list {
  @apply flex-1 overflow-y-auto p-2 space-y-2;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply text-4xl mb-3 opacity-50;
}

.empty-text {
  @apply text-text-secondary text-sm;
}

.conversation-item {
  @apply flex items-center gap-3 p-3 rounded-lg cursor-pointer;
  @apply bg-input-bg hover:bg-primary/5 border border-transparent;
  @apply transition-all duration-200;
}

.conversation-item:hover {
  @apply border-primary/20;
}

.conversation-active {
  @apply bg-primary/10 border-primary/30 text-primary;
}

.conversation-content {
  @apply flex-1 min-w-0;
}

.conversation-header {
  @apply flex items-start justify-between gap-2 mb-1;
}

.conversation-title {
  @apply text-sm font-medium text-text truncate m-0;
  @apply group-hover:text-primary transition-colors;
}

.conversation-active .conversation-title {
  @apply text-primary;
}

.conversation-date {
  @apply text-xs text-text-secondary whitespace-nowrap;
}

.conversation-meta {
  @apply flex items-center justify-between gap-2;
}

.message-count {
  @apply text-xs text-text-secondary;
}

.conversation-tags {
  @apply flex items-center gap-1;
}

.conversation-tag {
  @apply px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full;
}

.more-tags {
  @apply text-xs text-text-secondary;
}

.conversation-actions {
  @apply flex items-center gap-1;
}

.conversation-action-button {
  @apply p-1.5 text-text-secondary hover:text-red-500;
  @apply bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20;
  @apply rounded-md transition-all duration-200;
}

.action-icon-small {
  @apply w-3.5 h-3.5;
}

.drawer-footer {
  @apply p-4 border-t border-input-border bg-bg-card;
}

.stats-info {
  @apply text-center;
}

.stats-text {
  @apply text-xs text-text-secondary;
}

.drawer-overlay {
  @apply fixed inset-0 bg-black/30 z-[1000];
  animation: overlayIn 0.3s ease-out;
}

/* 响应式调整 */
.drawer-responsive {
  width: 320px;
}

@media (max-width: 768px) {
  .drawer-responsive {
    width: 280px;
  }

  .conversation-item {
    @apply p-2;
  }

  .conversation-title {
    @apply text-xs;
  }

  .conversation-date {
    @apply text-xs;
  }

  .drawer-header {
    @apply p-3;
  }

  .title-text {
    @apply text-base;
  }
}

@media (max-width: 640px) {
  .drawer-responsive {
    width: 260px;
  }

  .conversation-item {
    @apply p-1.5;
  }

  .conversation-title {
    @apply text-xs;
  }

  .header-actions {
    @apply gap-1;
  }

  .action-button {
    @apply p-1.5;
  }
}
</style>
