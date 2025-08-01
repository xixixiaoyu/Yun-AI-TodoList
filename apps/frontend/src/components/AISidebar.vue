<template>
  <!-- 遮罩层 -->
  <Overlay :visible="isOpen" @click="handleOverlayClick" />

  <!-- 侧边栏 -->
  <Transition
    name="sidebar"
    enter-active-class="transition-transform duration-300 ease-in-out"
    leave-active-class="transition-transform duration-300 ease-in-out"
    enter-from-class="transform -translate-x-full"
    enter-to-class="transform translate-x-0"
    leave-from-class="transform translate-x-0"
    leave-to-class="transform -translate-x-full"
  >
    <div
      v-show="isOpen"
      ref="sidebarRef"
      :class="[
        'fixed top-0 left-0 h-full bg-bg/95 backdrop-blur-xl border-r border-input-border shadow-2xl z-[10000] flex flex-col',
        { 'fullscreen-mode': isFullscreen },
      ]"
      :style="sidebarStyle"
    >
      <!-- 拖拽调整手柄 -->
      <div
        v-show="!isFullscreen"
        class="resize-handle"
        :class="{ 'resize-handle-dragging': isDragging }"
        :title="t('dragToResize', '拖拽调整宽度，双击重置')"
        @mousedown="startDrag"
        @dblclick="resetWidth"
      >
        <div class="resize-handle-line"></div>
      </div>
      <!-- 侧边栏头部 -->
      <div
        class="sidebar-header flex items-center justify-between px-4 py-3.5 md:px-3 md:py-3 bg-gradient-to-r from-button-bg to-button-hover text-white shadow-lg border-b border-white/10"
      >
        <!-- 标题和关闭按钮容器 -->
        <div class="header-title-row flex items-center justify-between w-full">
          <h2 class="m-0 text-base md:text-sm font-semibold text-white leading-tight">
            {{ t('aiAssistant') }}
          </h2>

          <!-- 移动端按钮组 -->
          <div class="md:hidden flex items-center gap-2">
            <!-- 全屏模式切换按钮 - 移动端 -->
            <button
              class="fullscreen-btn-mobile p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
              :title="
                isFullscreen ? t('exitFullscreen', '退出全屏') : t('enterFullscreen', '进入全屏')
              "
              @click="toggleFullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="group-hover:scale-110 transition-transform duration-200"
              >
                <path
                  v-if="!isFullscreen"
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                />
                <path
                  v-else
                  d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
                />
              </svg>
            </button>

            <!-- 关闭按钮 - 移动端 -->
            <button
              class="close-btn-mobile p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              :title="t('close')"
              @click="closeSidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- 系统提示词选择器和桌面端关闭按钮 -->
        <div class="header-controls flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
          <div class="relative flex-1 md:flex-none">
            <select
              :value="config.enabled ? config.activePromptId || '' : ''"
              :disabled="!config.enabled"
              :class="[
                'w-full md:w-auto px-3 py-1.5 pr-8 text-xs border rounded-lg transition-all duration-200 focus:outline-none backdrop-blur-sm min-w-[140px] md:min-w-[120px] md:text-xs appearance-none',
                config.enabled
                  ? 'bg-white/10 text-white border-white/20 cursor-pointer hover:bg-white/15 focus:bg-white/15 focus:border-white/40'
                  : 'bg-white/5 text-white/50 border-white/10 cursor-not-allowed',
              ]"
              @change="handlePromptChange"
            >
              <option value="" class="text-gray-800">{{ t('noSystemPrompt') }}</option>
              <option
                v-for="prompt in enabledPrompts"
                :key="prompt.id"
                :value="prompt.id"
                class="text-gray-800"
              >
                {{ prompt.name }}
              </option>
            </select>

            <!-- 自定义下拉箭头 -->
            <div
              class="absolute right-2 top-0 bottom-0 flex items-center justify-center pointer-events-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-white/70 transition-colors duration-200"
              >
                <polyline points="6,8 10,12 14,8"></polyline>
              </svg>
            </div>
          </div>

          <!-- 全屏模式切换按钮 -->
          <button
            class="fullscreen-btn flex items-center justify-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
            :title="
              isFullscreen ? t('exitFullscreen', '退出全屏') : t('enterFullscreen', '进入全屏')
            "
            @click="toggleFullscreen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="group-hover:scale-110 transition-transform duration-200"
            >
              <path
                v-if="!isFullscreen"
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
              />
              <path
                v-else
                d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
              />
            </svg>
          </button>

          <!-- 桌面端关闭按钮 -->
          <button
            class="close-btn-desktop hidden md:flex items-center justify-center p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
            :title="t('close')"
            @click="closeSidebar"
          >
            <CloseIcon class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </div>

      <!-- AI 聊天内容 -->
      <AIChatContent
        ref="messageListRef"
        :is-drawer-open="isDrawerOpen"
        :conversation-history="conversationHistory"
        :current-conversation-id="currentConversationId"
        :chat-history="chatHistory"
        :current-ai-response="currentAIResponse"
        :current-thinking-content="currentThinkingContent"
        :user-message="userMessage"
        :is-generating="isGenerating"
        :is-optimizing="isOptimizing"
        :is-retrying="isRetrying"
        :retry-count="retryCount"
        :error="error"
        :is-regenerating="isRegenerating"
        :has-uploaded-file="hasUploadedFile"
        :uploaded-file-name="uploadedFileName"
        :uploaded-file-size="uploadedFileSize"
        @toggle-drawer="isDrawerOpen = !isDrawerOpen"
        @update:is-drawer-open="isDrawerOpen = $event"
        @switch-conversation="handleSwitchConversation"
        @delete-conversation="handleDeleteConversation"
        @clear-conversations="clearAllConversations"
        @new-conversation="newConversation"
        @optimize="optimizeMessage"
        @retry="retry"
        @send="sendMessage"
        @stop="stopGenerating"
        @scroll="handleScroll"
        @update:user-message="updateUserMessage"
        @generate-chart="handleGenerateChart"
        @edit-message="handleEditMessage"
        @file-upload="handleFileUploadWrapper"
        @clear-file="clearFileUpload"
        @clear-error="clearError"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAISidebar } from '../composables/useAISidebar'
import { useChat } from '../composables/useChat'
import { useSystemPrompts } from '../composables/useSystemPrompts'
import AIChatContent from './chat/AIChatContent.vue'
import Overlay from './common/Overlay.vue'
import CloseIcon from './common/icons/CloseIcon.vue'

const { t } = useI18n()

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 使用 AI 侧边栏状态管理（包含宽度调整功能）
const {
  sidebarStyle,
  isDragging,
  startDrag,
  resetWidth,
  createOverlayClickHandler,
  isFullscreen,
  toggleFullscreen,
} = useAISidebar()

const {
  chatHistory,
  currentAIResponse,
  currentThinkingContent,
  isGenerating,
  userMessage,
  isOptimizing,
  isLoading,
  error,
  conversationHistory,
  currentConversationId,
  uploadedFileContent,
  uploadedFileName,
  uploadedFileSize,
  hasUploadedFile,
  loadConversationHistory,
  createNewConversation,
  switchConversation,
  deleteConversation,
  clearAllConversations,
  sendMessage,
  stopGenerating,
  optimizeMessage,
  clearError,
  // 重试相关
  retryLastMessage,
  isRetrying,
  retryCount,
  // 编辑相关
  editMessage,
  isRegenerating,
  // 文件上传相关
  handleFileUpload,
  clearFileUpload,
} = useChat()

// 系统提示词管理
const {
  config,
  enabledPrompts,
  setActivePrompt,
  updateConfig,
  initialize: initializeSystemPrompts,
} = useSystemPrompts()

// 处理系统提示词切换
const handlePromptChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const promptId = target.value || null
  try {
    // 如果选择了具体的系统提示词，自动启用系统提示词功能
    if (promptId && !config.value.enabled) {
      await updateConfig({ enabled: true })
    }
    await setActivePrompt(promptId)
  } catch (error) {
    console.error('切换系统提示词失败:', error)
  }
}

// 刷新系统提示词列表
const refreshSystemPrompts = () => {
  initializeSystemPrompts()
}

const isDrawerOpen = ref(false)
const messageListRef = ref<InstanceType<typeof AIChatContent> | null>(null)

const handleScroll = () => {
  // 滚动信息传递给父组件或用于其他用途
  // 自动滚动逻辑现在由 ChatMessageList 内部处理
}

const handleGenerateChart = async (...args: unknown[]) => {
  const [content] = args as [string]
  // 构造生成图表的提示词
  const chartPrompt = `请根据以下内容生成一个或多个 mermaid 格式的图表，要求：
1. 使用标准的 mermaid 语法
2. 选择合适的图表类型（flowchart、sequenceDiagram、pie 等）
3. 使用简洁的节点标签，避免特殊字符
4. 如需颜色，使用标准的 style 语法，并使用 # 开头的十六进制柔和颜色代码
5. 确保语法完全正确
6.请只返回 mermaid 代码块，不要包含其他解释文字。

内容：${content}
`

  // 临时保存当前用户消息
  const originalMessage = userMessage.value

  // 设置图表生成提示词作为用户消息
  userMessage.value = chartPrompt

  try {
    // 发送消息
    await sendMessage()
  } finally {
    // 恢复原始用户消息（如果有的话）
    userMessage.value = originalMessage
  }
}

// 重试函数
const retry = (...args: unknown[]) => {
  const [messageIndex] = args as [number?]
  retryLastMessage(messageIndex)
}

// 更新用户消息
const updateUserMessage = (...args: unknown[]) => {
  const [value] = args as [string]
  userMessage.value = value
}

// 切换对话包装函数
const handleSwitchConversation = (...args: unknown[]) => {
  const [id] = args as [string]
  switchConversation(id)
}

// 删除对话包装函数
const handleDeleteConversation = (...args: unknown[]) => {
  const [id] = args as [string]
  deleteConversation(id)
}

// 文件上传包装函数
const handleFileUploadWrapper = (...args: unknown[]) => {
  const [payload] = args as [{ file: File; content: string }]
  handleFileUpload(payload)
}

// 编辑消息函数
const handleEditMessage = (...args: unknown[]) => {
  const [messageIndex, newContent] = args as [number, string]
  editMessage(messageIndex, newContent)
}

// 新建对话函数
const newConversation = () => {
  createNewConversation()
}

// 清空所有对话函数
const _clearConversations = () => {
  clearAllConversations()
}

const closeSidebar = () => {
  emit('close')
}

// 创建遮罩层点击处理函数
const handleOverlayClick = createOverlayClickHandler(closeSidebar)

// 监听侧边栏打开状态，打开时刷新系统提示词列表
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      refreshSystemPrompts()
    }
  }
)

onMounted(() => {
  loadConversationHistory()
  refreshSystemPrompts()
})

defineOptions({
  name: 'AISidebar',
})
</script>

<style scoped>
/* 拖拽调整手柄样式 - 优化版 */
.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.1) 0%,
    rgba(148, 163, 184, 0.2) 50%,
    rgba(148, 163, 184, 0.1) 100%
  );
  border-radius: 0 6px 6px 0;
  backdrop-filter: blur(4px);
}

.resize-handle:hover {
  right: -8px;
  width: 16px;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(59, 130, 246, 0.15) 50%,
    rgba(59, 130, 246, 0.08) 100%
  );
  box-shadow:
    0 0 20px rgba(59, 130, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.resize-handle-line {
  width: 2px;
  height: 32px;
  background: linear-gradient(
    180deg,
    rgba(148, 163, 184, 0.4) 0%,
    rgba(148, 163, 184, 0.8) 50%,
    rgba(148, 163, 184, 0.4) 100%
  );
  border-radius: 1px;
  opacity: 0.6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
}

.resize-handle-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1px;
  height: 16px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  border-radius: 0.5px;
}

.resize-handle:hover .resize-handle-line {
  background: linear-gradient(
    180deg,
    rgba(59, 130, 246, 0.5) 0%,
    rgba(59, 130, 246, 0.9) 50%,
    rgba(59, 130, 246, 0.5) 100%
  );
  opacity: 1;
  width: 3px;
  height: 48px;
  box-shadow:
    0 2px 8px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 12px rgba(59, 130, 246, 0.2);
  transform: scale(1.1);
}

.resize-handle:hover .resize-handle-line::before {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  height: 24px;
}

.resize-handle-dragging {
  right: -10px;
  width: 20px;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(59, 130, 246, 0.2) 50%,
    rgba(59, 130, 246, 0.1) 100%
  );
  box-shadow:
    0 0 24px rgba(59, 130, 246, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 4px 16px rgba(59, 130, 246, 0.1);
  backdrop-filter: blur(12px);
}

.resize-handle-dragging .resize-handle-line {
  background: linear-gradient(
    180deg,
    rgba(59, 130, 246, 0.7) 0%,
    rgba(59, 130, 246, 1) 50%,
    rgba(59, 130, 246, 0.7) 100%
  );
  opacity: 1;
  width: 4px;
  height: 64px;
  box-shadow:
    0 4px 12px rgba(59, 130, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 0 16px rgba(59, 130, 246, 0.3),
    0 8px 24px rgba(59, 130, 246, 0.15);
  transform: scale(1.2);
  animation: pulse-glow 2s ease-in-out infinite;
}

.resize-handle-dragging .resize-handle-line::before {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.8) 50%,
    transparent 100%
  );
  height: 32px;
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow:
      0 4px 12px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      0 0 16px rgba(59, 130, 246, 0.3),
      0 8px 24px rgba(59, 130, 246, 0.15);
  }
  50% {
    box-shadow:
      0 4px 16px rgba(59, 130, 246, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 0 20px rgba(59, 130, 246, 0.4),
      0 8px 32px rgba(59, 130, 246, 0.2);
  }
}

/* 拖拽时的全局样式 */
:global(body.dragging-sidebar) {
  cursor: ew-resize !important;
  user-select: none !important;
}

/* ===== 响应式设计 ===== */

/* 超大屏幕 (1536px+) */
@media (min-width: 1536px) {
  /* 在超大屏幕上允许更大的最大宽度 */
  .resize-handle {
    /* 可以考虑调整手柄大小 */
  }
}

/* 大屏幕 (1024px - 1535px) */
@media (min-width: 1024px) and (max-width: 1535px) {
  /* 大屏幕优化 */
}

/* 中等屏幕 (768px - 1023px) - 平板横屏 */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 平板横屏时减少默认宽度 */
  .resize-handle {
    /* 保持拖拽功能 */
  }

  /* 调整头部间距 */
  .flex.items-center.justify-between {
    padding: 0.75rem 1rem;
  }

  /* 调整系统提示词选择器 */
  select {
    min-width: 120px !important;
    font-size: 0.875rem;
  }
}

/* 小屏幕 (640px - 767px) - 平板竖屏 */
@media (min-width: 640px) and (max-width: 767px) {
  /* 隐藏拖拽手柄，使用固定宽度 */
  .resize-handle {
    display: none;
  }

  /* 调整头部布局 */
  .flex.items-center.justify-between {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  h2 {
    font-size: 1rem;
    flex: 1;
  }

  /* 系统提示词选择器优化 */
  select {
    min-width: 100px !important;
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
}

/* 移动端 (639px 及以下) */
@media (max-width: 639px) {
  /* 隐藏拖拽手柄 */
  .resize-handle {
    display: none;
  }

  /* 移动端头部优化 */
  .sidebar-header {
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  /* 标题行 */
  .header-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  /* 控制区域 */
  .header-controls {
    width: 100%;
    margin-top: 0.75rem;
  }

  h2 {
    font-size: 1rem;
    margin: 0;
  }

  /* 系统提示词选择器移动端优化 */
  .header-controls .relative {
    width: 100%;
    flex: 1;
  }

  .header-controls select {
    width: 100% !important;
    min-width: unset !important;
    font-size: 0.875rem;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
  }

  /* 移动端按钮优化 */
  .close-btn-mobile,
  .close-btn-desktop {
    min-height: 44px; /* 符合移动端触摸标准 */
    min-width: 44px;
    padding: 0.5rem;
  }
}

/* 超小屏幕 (480px 及以下) */
@media (max-width: 480px) {
  /* 进一步优化小屏幕体验 */
  .flex.items-center.justify-between {
    padding: 0.5rem 0.75rem;
  }

  h2 {
    font-size: 0.875rem;
  }

  select {
    font-size: 0.75rem;
    padding: 0.375rem 1.5rem 0.375rem 0.5rem;
  }
}

/* 横屏模式优化 */
@media (max-height: 500px) and (orientation: landscape) {
  /* 横屏时优化头部高度 */
  .flex.items-center.justify-between {
    padding: 0.5rem 1rem;
  }

  h2 {
    font-size: 0.875rem;
  }

  select {
    padding: 0.25rem 1.5rem 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .resize-handle-line {
    /* 在高分辨率屏幕上优化线条显示 */
    transform: translateZ(0);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .resize-handle {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.03) 0%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0.03) 100%
    );
  }

  .resize-handle:hover {
    background: linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.1) 0%,
      rgba(59, 130, 246, 0.2) 50%,
      rgba(59, 130, 246, 0.1) 100%
    );
    box-shadow:
      0 0 20px rgba(59, 130, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .resize-handle-line {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0.2) 100%
    );
  }

  .resize-handle-line::before {
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
  }

  .resize-handle-dragging {
    background: linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(59, 130, 246, 0.25) 50%,
      rgba(59, 130, 246, 0.15) 100%
    );
    box-shadow:
      0 0 24px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 4px 16px rgba(59, 130, 246, 0.15);
  }
}

/* 减少动画偏好设置 */
@media (prefers-reduced-motion: reduce) {
  .resize-handle,
  .resize-handle-line {
    transition: none;
  }
}

/* 全屏模式样式 */
.fullscreen-mode {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border: none !important;
  border-radius: 0 !important;
}

/* 全屏模式下的头部样式调整 */
.fullscreen-mode .sidebar-header {
  border-radius: 0;
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 触摸设备上增大可触摸区域 */
  .resize-handle {
    width: 16px;
    right: -8px;
    background: linear-gradient(
      90deg,
      rgba(148, 163, 184, 0.15) 0%,
      rgba(148, 163, 184, 0.25) 50%,
      rgba(148, 163, 184, 0.15) 100%
    );
  }

  .resize-handle:hover {
    width: 16px;
    right: -8px;
  }

  .resize-handle-line {
    width: 3px;
    height: 40px;
    opacity: 0.8;
  }

  .resize-handle-dragging {
    width: 20px;
    right: -10px;
  }

  .resize-handle-dragging .resize-handle-line {
    width: 4px;
    height: 56px;
  }

  /* 增大按钮触摸区域 */
  button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 打印样式 */
@media print {
  .resize-handle {
    display: none;
  }
}
</style>
