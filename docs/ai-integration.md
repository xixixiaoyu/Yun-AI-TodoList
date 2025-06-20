# AI 集成解决方案：DeepSeek API 智能功能实现

## 技术概述

本项目深度集成 DeepSeek
AI 模型，实现智能任务分析、自动优先级评估、时间预估、个性化建议等功能，为用户提供智能化的待办事项管理体验。

## 🤖 AI 服务架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 AI 交互层                            │
│  ├─ AI Chat Interface    ├─ Smart Suggestions              │
│  ├─ Voice Input          ├─ Auto Categorization            │
│  └─ Real-time Analysis   └─ Priority Assessment            │
├─────────────────────────────────────────────────────────────┤
│                    AI 服务抽象层                            │
│  ├─ DeepSeek Service     ├─ Prompt Engineering             │
│  ├─ Response Parser      ├─ Error Handling                 │
│  └─ Rate Limiting        └─ Caching Strategy               │
├─────────────────────────────────────────────────────────────┤
│                    后端 AI 集成层                           │
│  ├─ AI Controller        ├─ Task Analysis                  │
│  ├─ Suggestion Engine    ├─ User Context                   │
│  └─ Learning Algorithm   └─ Performance Metrics            │
├─────────────────────────────────────────────────────────────┤
│                   DeepSeek API                             │
│  ├─ Chat Completions     ├─ Model Selection                │
│  ├─ Token Management     ├─ Response Streaming             │
│  └─ Error Codes          └─ Usage Analytics                │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 前端 AI 服务实现

### DeepSeek 服务配置

````typescript
// services/deepseekService.ts
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  timeout: number
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  finishReason?: string
}

export class DeepSeekService {
  private config = ref<AIConfig>({
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 30000
  })

  private systemPrompts = useLocalStorage('ai-system-prompts', {
    taskAnalysis: `你是一个专业的任务管理助手。请分析用户的待办事项，并提供以下信息：
1. 优先级评分（1-5，5为最高优先级）
2. 预估完成时间
3. 任务分类建议
4. 改进建议
5. 相关子任务建议

请以 JSON 格式返回结果：
{
  "priority": 数字,
  "estimatedTime": "字符串（如：30分钟、2小时）",
  "category": "字符串",
  "suggestions": ["建议1", "建议2"],
  "subtasks": ["子任务1", "子任务2"]
}`,

    smartSuggestions: `你是一个智能的待办事项建议助手。基于用户的历史记录和当前上下文，生成5个实用的待办事项建议。

要求：
1. 建议应该具体、可执行
2. 考虑用户的工作/生活模式
3. 包含不同优先级的任务
4. 建议应该多样化（工作、学习、生活、健康等）

请直接返回建议列表，每行一个建议。`,

    chatAssistant: `你是 Yun AI TodoList 的智能助手。你可以帮助用户：
1. 分析和优化待办事项
2. 提供时间管理建议
3. 协助任务规划和分解
4. 回答关于生产力和效率的问题

请用友好、专业的语气回答用户问题，并尽可能提供实用的建议。`
  })

  private requestQueue = ref<Array<() => Promise<any>>>([])
  private isProcessing = ref(false)
  private rateLimitDelay = 1000 // 1秒间隔

  constructor() {
    this.loadConfig()
    this.startRequestProcessor()
  }

  // 配置管理
  loadConfig() {
    const savedConfig = localStorage.getItem('deepseek-config')
    if (savedConfig) {
      try {
        this.config.value = { ...this.config.value, ...JSON.parse(savedConfig) }
      } catch (error) {
        console.warn('加载 AI 配置失败:', error)
      }
    }
  }

  saveConfig(newConfig: Partial<AIConfig>) {
    this.config.value = { ...this.config.value, ...newConfig }
    localStorage.setItem('deepseek-config', JSON.stringify(this.config.value))
  }

  // API 密钥管理
  setApiKey(apiKey: string) {
    this.config.value.apiKey = apiKey
    this.saveConfig({ apiKey })
  }

  getApiKey(): string {
    return this.config.value.apiKey
  }

  isConfigured = computed(() => {
    return !!this.config.value.apiKey
  })

  // 请求队列处理
  private async startRequestProcessor() {
    while (true) {
      if (this.requestQueue.value.length > 0 && !this.isProcessing.value) {
        this.isProcessing.value = true
        const request = this.requestQueue.value.shift()

        if (request) {
          try {
            await request()
          } catch (error) {
            console.error('AI 请求处理失败:', error)
          }

          // 速率限制
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
        }

        this.isProcessing.value = false
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 核心 API 调用方法
  private async callAPI(
    messages: ChatMessage[],
    options: Partial<AIConfig> = {}
  ): Promise<AIResponse> {
    const config = { ...this.config.value, ...options }

    if (!config.apiKey) {
      throw new Error('请先配置 DeepSeek API 密钥')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API 请求失败: ${response.status} ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()

      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        finishReason: data.choices[0]?.finish_reason
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试')
      }

      throw error
    }
  }

  // 任务分析
  async analyzeTask(title: string, description?: string, context?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.value.push(async () => {
        try {
          const messages: ChatMessage[] = [
            {
              role: 'system',
              content: this.systemPrompts.value.taskAnalysis
            },
            {
              role: 'user',
              content: `请分析以下待办事项：

标题：${title}
描述：${description || '无'}
${context ? `\n上下文：${JSON.stringify(context)}` : ''}`
            }
          ]

          const response = await this.callAPI(messages)
          const result = this.parseJSONResponse(response.content)

          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // 智能建议生成
  async generateSuggestions(
    domain: string = '通用',
    userHistory: string[] = [],
    preferences: any = {}
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.value.push(async () => {
        try {
          let prompt = `请为${domain}领域生成5个实用的待办事项建议。`

          if (userHistory.length > 0) {
            prompt += `\n\n用户最近的任务历史：\n${userHistory.slice(-10).join('\n')}`
          }

          if (Object.keys(preferences).length > 0) {
            prompt += `\n\n用户偏好：${JSON.stringify(preferences)}`
          }

          const messages: ChatMessage[] = [
            {
              role: 'system',
              content: this.systemPrompts.value.smartSuggestions
            },
            {
              role: 'user',
              content: prompt
            }
          ]

          const response = await this.callAPI(messages)
          const suggestions = this.parseSuggestions(response.content)

          resolve(suggestions)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // 聊天对话
  async chat(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.value.push(async () => {
        try {
          const messages: ChatMessage[] = [
            {
              role: 'system',
              content: this.systemPrompts.value.chatAssistant
            },
            ...conversationHistory.slice(-10), // 保留最近10条对话
            {
              role: 'user',
              content: message
            }
          ]

          const response = await this.callAPI(messages)
          resolve(response.content)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // 批量任务分析
  async batchAnalyzeTasks(tasks: Array<{ title: string; description?: string }>): Promise<any[]> {
    const results = []

    for (const task of tasks) {
      try {
        const analysis = await this.analyzeTask(task.title, task.description)
        results.push({ ...task, analysis })
      } catch (error) {
        console.error(`分析任务失败: ${task.title}`, error)
        results.push({ ...task, analysis: null, error: error.message })
      }
    }

    return results
  }

  // 响应解析
  private parseJSONResponse(content: string): any {
    try {
      // 尝试直接解析 JSON
      return JSON.parse(content)
    } catch {
      try {
        // 尝试提取 JSON 块
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                         content.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
          return JSON.parse(jsonMatch[1] || jsonMatch[0])
        }

        // 如果没有 JSON，尝试解析文本
        return this.parseTextResponse(content)
      } catch (error) {
        console.warn('JSON 解析失败，返回原始内容:', error)
        return { content, parsed: false }
      }
    }
  }

  private parseTextResponse(content: string): any {
    const lines = content.split('\n').filter(line => line.trim())
    const result: any = {}

    // 尝试提取优先级
    const priorityMatch = content.match(/优先级[：:]?\s*(\d+)/i)
    if (priorityMatch) {
      result.priority = parseInt(priorityMatch[1])
    }

    // 尝试提取时间估算
    const timeMatch = content.match(/时间[：:]?\s*([^\n]+)/i) ||
                     content.match /(\d+[小时分钟天周月年]+)/)
    if (timeMatch) {
      result.estimatedTime = timeMatch[1].trim()
    }

    // 尝试提取分类
    const categoryMatch = content.match(/分类[：:]?\s*([^\n]+)/i)
    if (categoryMatch) {
      result.category = categoryMatch[1].trim()
    }

    return result
  }

  private parseSuggestions(content: string): string[] {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
      .filter(suggestion => suggestion.length > 5)
      .slice(0, 5)
  }

  // 系统提示词管理
  updateSystemPrompt(type: keyof typeof this.systemPrompts.value, prompt: string) {
    this.systemPrompts.value[type] = prompt
  }

  getSystemPrompt(type: keyof typeof this.systemPrompts.value): string {
    return this.systemPrompts.value[type]
  }

  // 使用统计
  private usage = ref({
    totalRequests: 0,
    totalTokens: 0,
    averageResponseTime: 0,
    errorCount: 0
  })

  getUsageStats() {
    return this.usage.value
  }

  resetUsageStats() {
    this.usage.value = {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      errorCount: 0
    }
  }
}

// 单例实例
export const deepseekService = new DeepSeekService()
````

### AI 功能 Composable

```typescript
// composables/useAI.ts
import { ref, computed } from 'vue'
import { deepseekService } from '@/services/deepseekService'
import { useNotification } from './useNotification'
import { useLoading } from './useLoading'

export function useAI() {
  const { showNotification } = useNotification()
  const { setLoading } = useLoading()

  const isConfigured = computed(() => deepseekService.isConfigured.value)
  const analysisCache = ref(new Map())

  // 任务分析
  const analyzeTask = async (task: { title: string; description?: string }) => {
    const cacheKey = `${task.title}-${task.description || ''}`

    if (analysisCache.value.has(cacheKey)) {
      return analysisCache.value.get(cacheKey)
    }

    try {
      setLoading('ai-analysis', true)

      const analysis = await deepseekService.analyzeTask(
        task.title,
        task.description
      )

      // 缓存结果
      analysisCache.value.set(cacheKey, analysis)

      return analysis
    } catch (error) {
      console.error('AI 分析失败:', error)
      showNotification({
        type: 'error',
        title: 'AI 分析失败',
        message: error.message,
      })
      return null
    } finally {
      setLoading('ai-analysis', false)
    }
  }

  // 智能建议
  const generateSuggestions = async (
    domain: string = '通用',
    userHistory: string[] = []
  ) => {
    try {
      setLoading('ai-suggestions', true)

      const suggestions = await deepseekService.generateSuggestions(
        domain,
        userHistory
      )

      return suggestions
    } catch (error) {
      console.error('生成建议失败:', error)
      showNotification({
        type: 'error',
        title: '生成建议失败',
        message: error.message,
      })
      return []
    } finally {
      setLoading('ai-suggestions', false)
    }
  }

  // AI 聊天
  const chatHistory = ref<
    Array<{ role: string; content: string; timestamp: number }>
  >([])

  const sendMessage = async (message: string) => {
    try {
      // 添加用户消息
      chatHistory.value.push({
        role: 'user',
        content: message,
        timestamp: Date.now(),
      })

      setLoading('ai-chat', true)

      const response = await deepseekService.chat(message, chatHistory.value)

      // 添加 AI 回复
      chatHistory.value.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      })

      return response
    } catch (error) {
      console.error('AI 聊天失败:', error)
      showNotification({
        type: 'error',
        title: 'AI 聊天失败',
        message: error.message,
      })
      return null
    } finally {
      setLoading('ai-chat', false)
    }
  }

  const clearChatHistory = () => {
    chatHistory.value = []
  }

  // 批量分析
  const batchAnalyze = async (
    tasks: Array<{ title: string; description?: string }>
  ) => {
    try {
      setLoading('ai-batch', true)

      const results = await deepseekService.batchAnalyzeTasks(tasks)

      showNotification({
        type: 'success',
        title: '批量分析完成',
        message: `成功分析 ${results.filter((r) => r.analysis).length} 个任务`,
      })

      return results
    } catch (error) {
      console.error('批量分析失败:', error)
      showNotification({
        type: 'error',
        title: '批量分析失败',
        message: error.message,
      })
      return []
    } finally {
      setLoading('ai-batch', false)
    }
  }

  // 配置管理
  const updateConfig = (config: any) => {
    deepseekService.saveConfig(config)
    showNotification({
      type: 'success',
      title: '配置已保存',
      message: 'AI 配置更新成功',
    })
  }

  const setApiKey = (apiKey: string) => {
    deepseekService.setApiKey(apiKey)
    showNotification({
      type: 'success',
      title: 'API 密钥已设置',
      message: 'DeepSeek API 密钥配置成功',
    })
  }

  // 使用统计
  const getUsageStats = () => {
    return deepseekService.getUsageStats()
  }

  return {
    // 状态
    isConfigured,
    chatHistory,

    // 方法
    analyzeTask,
    generateSuggestions,
    sendMessage,
    clearChatHistory,
    batchAnalyze,
    updateConfig,
    setApiKey,
    getUsageStats,
  }
}
```

## 🎨 AI 交互组件

### AI 聊天组件

```vue
<!-- components/AIChat.vue -->
<template>
  <div class="ai-chat">
    <div class="chat-header">
      <div class="ai-avatar">
        <i class="i-carbon-watson-health-cognitive" />
      </div>
      <div class="ai-info">
        <h3>AI 助手</h3>
        <p class="status" :class="{ online: isConfigured }">
          {{ isConfigured ? '在线' : '未配置' }}
        </p>
      </div>
      <button @click="clearHistory" class="btn-clear">
        <i class="i-carbon-clean" />
      </button>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="message in chatHistory"
        :key="message.timestamp"
        class="message"
        :class="message.role"
      >
        <div class="message-avatar">
          <i
            :class="
              message.role === 'user'
                ? 'i-carbon-user'
                : 'i-carbon-watson-health-cognitive'
            "
          />
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(message.content)" />
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>

      <div v-if="isLoading('ai-chat')" class="message assistant typing">
        <div class="message-avatar">
          <i class="i-carbon-watson-health-cognitive" />
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <div class="input-container">
        <input
          v-model="inputMessage"
          @keydown.enter="sendMessage"
          :disabled="!isConfigured || isLoading('ai-chat')"
          placeholder="输入消息...按 Enter 发送"
          class="message-input"
        />
        <button
          @click="sendMessage"
          :disabled="
            !inputMessage.trim() || !isConfigured || isLoading('ai-chat')
          "
          class="send-button"
        >
          <i class="i-carbon-send" />
        </button>
      </div>

      <div class="quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.text"
          @click="sendQuickMessage(action.text)"
          class="quick-action"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useAI } from '@/composables/useAI'
import { useLoading } from '@/composables/useLoading'
import { marked } from 'marked'

const {
  isConfigured,
  chatHistory,
  sendMessage: sendAIMessage,
  clearChatHistory,
} = useAI()

const { isLoading } = useLoading()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

const quickActions = [
  { label: '任务建议', text: '请给我一些今天的任务建议' },
  { label: '时间管理', text: '如何更好地管理时间？' },
  { label: '优先级排序', text: '如何确定任务的优先级？' },
  { label: '效率提升', text: '有什么提高工作效率的方法？' },
]

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  const message = inputMessage.value
  inputMessage.value = ''

  await sendAIMessage(message)
  scrollToBottom()
}

const sendQuickMessage = async (message: string) => {
  await sendAIMessage(message)
  scrollToBottom()
}

const clearHistory = () => {
  clearChatHistory()
}

const formatMessage = (content: string) => {
  return marked(content)
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听聊天历史变化，自动滚动到底部
watch(
  () => chatHistory.value.length,
  () => {
    scrollToBottom()
  }
)
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--bg-color-soft);
  border-bottom: 1px solid var(--border-color);
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.ai-info {
  flex: 1;
  margin-left: 0.75rem;
}

.ai-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.status {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color-soft);
}

.status.online {
  color: var(--color-success);
}

.btn-clear {
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--text-color-soft);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: var(--bg-color-mute);
  color: var(--text-color);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: var(--color-primary);
  color: white;
}

.message.assistant .message-avatar {
  background: var(--bg-color-soft);
  color: var(--text-color-soft);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  background: var(--bg-color-soft);
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  word-wrap: break-word;
}

.message.user .message-text {
  background: var(--color-primary);
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.message.assistant .message-text {
  border-bottom-left-radius: 0.25rem;
}

.message-time {
  font-size: 0.7rem;
  color: var(--text-color-soft);
  margin-top: 0.25rem;
  padding: 0 0.5rem;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 1rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-color-soft);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input {
  padding: 1rem;
  background: var(--bg-color-soft);
  border-top: 1px solid var(--border-color);
}

.input-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 1.5rem;
  background: var(--bg-color);
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: var(--color-primary);
}

.send-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: scale(1.05);
}

.send-button:disabled {
  background: var(--bg-color-mute);
  color: var(--text-color-soft);
  cursor: not-allowed;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-action {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  background: var(--bg-color);
  color: var(--text-color-soft);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.quick-action:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
```

### 智能建议组件

```vue
<!-- components/SmartSuggestions.vue -->
<template>
  <div class="smart-suggestions">
    <div class="suggestions-header">
      <h3>
        <i class="i-carbon-idea" />
        智能建议
      </h3>
      <div class="header-actions">
        <select
          v-model="selectedDomain"
          @change="loadSuggestions"
          class="domain-select"
        >
          <option value="通用">通用</option>
          <option value="工作">工作</option>
          <option value="学习">学习</option>
          <option value="生活">生活</option>
          <option value="健康">健康</option>
          <option value="娱乐">娱乐</option>
        </select>
        <button
          @click="loadSuggestions"
          :disabled="isLoading('ai-suggestions')"
          class="refresh-btn"
        >
          <i
            class="i-carbon-refresh"
            :class="{ spinning: isLoading('ai-suggestions') }"
          />
        </button>
      </div>
    </div>

    <div class="suggestions-content">
      <div v-if="isLoading('ai-suggestions')" class="loading-state">
        <div class="loading-spinner" />
        <p>AI 正在生成建议...</p>
      </div>

      <div v-else-if="suggestions.length === 0" class="empty-state">
        <i class="i-carbon-idea" />
        <p>暂无建议</p>
        <button @click="loadSuggestions" class="btn-primary">生成建议</button>
      </div>

      <div v-else class="suggestions-list">
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="suggestion-item"
          @click="addSuggestion(suggestion)"
        >
          <div class="suggestion-content">
            <p>{{ suggestion }}</p>
          </div>
          <div class="suggestion-actions">
            <button @click.stop="addSuggestion(suggestion)" class="add-btn">
              <i class="i-carbon-add" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="suggestions-footer">
      <p class="tip">
        <i class="i-carbon-information" />
        点击建议可快速添加到待办事项
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAI } from '@/composables/useAI'
import { useLoading } from '@/composables/useLoading'
import { useTodos } from '@/composables/useTodos'
import { useNotification } from '@/composables/useNotification'

const { generateSuggestions } = useAI()
const { isLoading } = useLoading()
const { addTodo, getRecentTodos } = useTodos()
const { showNotification } = useNotification()

const suggestions = ref<string[]>([])
const selectedDomain = ref('通用')

const loadSuggestions = async () => {
  try {
    const recentTodos = await getRecentTodos(10)
    const userHistory = recentTodos.map((todo) => todo.title)

    const newSuggestions = await generateSuggestions(
      selectedDomain.value,
      userHistory
    )
    suggestions.value = newSuggestions
  } catch (error) {
    console.error('加载建议失败:', error)
  }
}

const addSuggestion = async (suggestion: string) => {
  try {
    await addTodo({
      title: suggestion,
      description: `来自 AI 建议 - ${selectedDomain.value}领域`,
      category: selectedDomain.value,
    })

    showNotification({
      type: 'success',
      title: '添加成功',
      message: '已将建议添加到待办事项',
    })
  } catch (error) {
    console.error('添加建议失败:', error)
    showNotification({
      type: 'error',
      title: '添加失败',
      message: error.message,
    })
  }
}

onMounted(() => {
  loadSuggestions()
})
</script>

<style scoped>
.smart-suggestions {
  background: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-color-soft);
  border-bottom: 1px solid var(--border-color);
}

.suggestions-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.domain-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  font-size: 0.9rem;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-color-soft);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.suggestions-content {
  min-height: 200px;
  padding: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-color-soft);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-item:hover {
  border-color: var(--color-primary);
  background: var(--bg-color-soft);
}

.suggestion-content {
  flex: 1;
}

.suggestion-content p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.suggestion-actions {
  margin-left: 0.5rem;
}

.add-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.add-btn:hover {
  background: var(--color-primary-dark);
  transform: scale(1.1);
}

.suggestions-footer {
  padding: 0.75rem 1rem;
  background: var(--bg-color-soft);
  border-top: 1px solid var(--border-color);
}

.tip {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color-soft);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
```

## 🔧 后端 AI 集成

### AI Controller

```typescript
// ai/ai.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AIService } from './ai.service'
import {
  AnalyzeTaskDto,
  GenerateSuggestionsDto,
  ChatMessageDto,
  BatchAnalyzeDto,
} from './dto'

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('analyze-task')
  @ApiOperation({ summary: '分析单个任务' })
  async analyzeTask(@Request() req, @Body() analyzeTaskDto: AnalyzeTaskDto) {
    return this.aiService.analyzeTask(
      req.user.id,
      analyzeTaskDto.title,
      analyzeTaskDto.description,
      analyzeTaskDto.context
    )
  }

  @Post('batch-analyze')
  @ApiOperation({ summary: '批量分析任务' })
  async batchAnalyze(@Request() req, @Body() batchAnalyzeDto: BatchAnalyzeDto) {
    return this.aiService.batchAnalyzeTasks(req.user.id, batchAnalyzeDto.tasks)
  }

  @Post('generate-suggestions')
  @ApiOperation({ summary: '生成智能建议' })
  async generateSuggestions(
    @Request() req,
    @Body() generateSuggestionsDto: GenerateSuggestionsDto
  ) {
    return this.aiService.generateSuggestions(
      req.user.id,
      generateSuggestionsDto.domain,
      generateSuggestionsDto.count
    )
  }

  @Post('chat')
  @ApiOperation({ summary: 'AI 聊天对话' })
  async chat(@Request() req, @Body() chatMessageDto: ChatMessageDto) {
    return this.aiService.chat(
      req.user.id,
      chatMessageDto.message,
      chatMessageDto.conversationId
    )
  }

  @Get('usage-stats')
  @ApiOperation({ summary: '获取 AI 使用统计' })
  async getUsageStats(@Request() req) {
    return this.aiService.getUserUsageStats(req.user.id)
  }

  @Get('models')
  @ApiOperation({ summary: '获取可用的 AI 模型' })
  async getAvailableModels() {
    return this.aiService.getAvailableModels()
  }
}
```

### AI Service (后端)

```typescript
// ai/ai.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpService } from '@nestjs/axios'
import { PrismaService } from '../prisma/prisma.service'
import { CacheService } from '../cache/cache.service'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class AIService {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly defaultModel: string

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
    private cacheService: CacheService
  ) {
    this.apiKey = this.configService.get('DEEPSEEK_API_KEY')
    this.baseUrl = this.configService.get(
      'DEEPSEEK_BASE_URL',
      'https://api.deepseek.com'
    )
    this.defaultModel = this.configService.get(
      'DEEPSEEK_MODEL',
      'deepseek-chat'
    )
  }

  async analyzeTask(
    userId: string,
    title: string,
    description?: string,
    context?: any
  ) {
    // 检查缓存
    const cacheKey = `ai:analyze:${userId}:${this.hashString(title + (description || ''))}`
    const cached = await this.cacheService.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // 获取用户历史数据用于上下文
      const userContext = await this.getUserContext(userId)

      const prompt = this.buildTaskAnalysisPrompt(
        title,
        description,
        userContext,
        context
      )
      const response = await this.callDeepSeekAPI([
        {
          role: 'system',
          content:
            'You are a professional task management assistant. Analyze tasks and provide structured insights in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ])

      const analysis = this.parseAnalysisResponse(response.content)

      // 缓存结果
      await this.cacheService.set(cacheKey, analysis, 3600) // 1小时

      // 记录使用统计
      await this.recordUsage(userId, 'task_analysis', response.usage)

      return analysis
    } catch (error) {
      console.error('AI 任务分析失败:', error)
      throw new HttpException(
        'AI 分析服务暂时不可用',
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  async batchAnalyzeTasks(
    userId: string,
    tasks: Array<{ title: string; description?: string }>
  ) {
    const results = []
    const batchSize = 5 // 批量处理大小

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize)
      const batchPromises = batch.map((task) =>
        this.analyzeTask(userId, task.title, task.description).catch(
          (error) => ({ error: error.message })
        )
      )

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // 避免 API 限流
      if (i + batchSize < tasks.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  async generateSuggestions(
    userId: string,
    domain: string = '通用',
    count: number = 5
  ) {
    const cacheKey = `ai:suggestions:${userId}:${domain}:${count}`
    const cached = await this.cacheService.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // 获取用户历史任务
      const userHistory = await this.getUserTaskHistory(userId, 20)
      const userPreferences = await this.getUserPreferences(userId)

      const prompt = this.buildSuggestionsPrompt(
        domain,
        userHistory,
        userPreferences,
        count
      )
      const response = await this.callDeepSeekAPI([
        {
          role: 'system',
          content:
            'You are a smart productivity assistant. Generate practical and personalized task suggestions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ])

      const suggestions = this.parseSuggestionsResponse(response.content)

      // 缓存结果
      await this.cacheService.set(cacheKey, suggestions, 1800) // 30分钟

      // 记录使用统计
      await this.recordUsage(userId, 'suggestions', response.usage)

      return suggestions
    } catch (error) {
      console.error('AI 建议生成失败:', error)
      throw new HttpException(
        'AI 建议服务暂时不可用',
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  async chat(userId: string, message: string, conversationId?: string) {
    try {
      // 获取对话历史
      const conversationHistory = conversationId
        ? await this.getConversationHistory(userId, conversationId)
        : []

      // 构建消息
      const messages = [
        {
          role: 'system',
          content:
            'You are Yun AI TodoList assistant. Help users with task management, productivity, and organization.',
        },
        ...conversationHistory.slice(-10), // 保留最近10条消息
        {
          role: 'user',
          content: message,
        },
      ]

      const response = await this.callDeepSeekAPI(messages)

      // 保存对话记录
      await this.saveConversationMessage(
        userId,
        conversationId,
        'user',
        message
      )
      await this.saveConversationMessage(
        userId,
        conversationId,
        'assistant',
        response.content
      )

      // 记录使用统计
      await this.recordUsage(userId, 'chat', response.usage)

      return {
        message: response.content,
        conversationId: conversationId || this.generateConversationId(),
      }
    } catch (error) {
      console.error('AI 聊天失败:', error)
      throw new HttpException(
        'AI 聊天服务暂时不可用',
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  private async callDeepSeekAPI(messages: any[], options: any = {}) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )
    )

    if (!response.data.choices?.[0]?.message?.content) {
      throw new Error('AI API 返回无效响应')
    }

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
    }
  }

  private buildTaskAnalysisPrompt(
    title: string,
    description?: string,
    userContext?: any,
    context?: any
  ): string {
    let prompt = `请分析以下待办事项并提供结构化的分析结果：

`
    prompt += `标题：${title}\n`

    if (description) {
      prompt += `描述：${description}\n`
    }

    if (userContext?.recentTasks?.length > 0) {
      prompt += `\n用户最近的任务：\n${userContext.recentTasks
        .slice(0, 5)
        .map((t) => `- ${t.title}`)
        .join('\n')}\n`
    }

    if (userContext?.preferences) {
      prompt += `\n用户偏好：${JSON.stringify(userContext.preferences)}\n`
    }

    if (context) {
      prompt += `\n额外上下文：${JSON.stringify(context)}\n`
    }

    prompt += `
请以 JSON 格式返回分析结果，包含以下字段：
{
  "priority": 1-5的优先级评分,
  "estimatedTime": "预估完成时间",
  "category": "任务分类",
  "difficulty": 1-5的难度评分,
  "suggestions": ["改进建议数组"],
  "subtasks": ["子任务建议数组"],
  "tags": ["相关标签数组"]
}`

    return prompt
  }

  private buildSuggestionsPrompt(
    domain: string,
    userHistory: any[],
    userPreferences: any,
    count: number
  ): string {
    let prompt = `请为${domain}领域生成${count}个实用的待办事项建议。\n\n`

    if (userHistory.length > 0) {
      prompt += `用户历史任务：\n${userHistory.map((t) => `- ${t.title}`).join('\n')}\n\n`
    }

    if (userPreferences) {
      prompt += `用户偏好：${JSON.stringify(userPreferences)}\n\n`
    }

    prompt += `要求：
1. 建议应该具体、可执行
2. 考虑用户的历史模式
3. 包含不同优先级的任务
4. 建议应该多样化

请直接返回建议列表，每行一个建议，总共${count}个建议。`

    return prompt
  }

  private parseAnalysisResponse(content: string): any {
    try {
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // 如果没有 JSON，返回默认结构
      return {
        priority: 3,
        estimatedTime: '未知',
        category: '其他',
        difficulty: 3,
        suggestions: ['请提供更多详细信息以获得更好的分析'],
        subtasks: [],
        tags: [],
      }
    } catch (error) {
      console.error('解析 AI 分析响应失败:', error)
      return {
        priority: 3,
        estimatedTime: '未知',
        category: '其他',
        difficulty: 3,
        suggestions: ['AI 分析解析失败'],
        subtasks: [],
        tags: [],
      }
    }
  }

  private parseSuggestionsResponse(content: string): string[] {
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
      .filter((suggestion) => suggestion.length > 5)
      .slice(0, 10)
  }

  private async getUserContext(userId: string) {
    const recentTasks = await this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { title: true, category: true, priority: true },
    })

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    return {
      recentTasks,
      preferences: user?.preferences,
    }
  }

  private async getUserTaskHistory(userId: string, limit: number = 20) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { title: true, category: true, completed: true },
    })
  }

  private async getUserPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    return user?.preferences || {}
  }

  private async recordUsage(userId: string, type: string, usage: any) {
    try {
      await this.prisma.aiUsage.create({
        data: {
          userId,
          type,
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
      })
    } catch (error) {
      console.error('记录 AI 使用统计失败:', error)
    }
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getUserUsageStats(userId: string) {
    const stats = await this.prisma.aiUsage.aggregate({
      where: { userId },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      totalRequests: stats._count.id || 0,
      totalTokens: stats._sum.totalTokens || 0,
      promptTokens: stats._sum.promptTokens || 0,
      completionTokens: stats._sum.completionTokens || 0,
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: '通用对话模型，适合任务分析和建议生成',
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        description: '代码专用模型，适合技术任务分析',
      },
    ]
  }
}
```

## 📊 AI 使用统计与监控

### 使用统计数据模型

```typescript
// prisma/schema.prisma (AI 相关部分)
model AIUsage {
  id               String   @id @default(cuid())
  userId           String
  type             String   // 'task_analysis', 'suggestions', 'chat'
  promptTokens     Int      @default(0)
  completionTokens Int      @default(0)
  totalTokens      Int      @default(0)
  model            String?  @default("deepseek-chat")
  createdAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("ai_usage")
}

model Conversation {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages ConversationMessage[]
  user     User                  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("conversations")
}

model ConversationMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // 'user', 'assistant', 'system'
  content        String
  tokens         Int?     @default(0)
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("conversation_messages")
}
```

### AI 监控仪表板组件

```vue
<!-- components/AIMonitorDashboard.vue -->
<template>
  <div class="ai-monitor-dashboard">
    <div class="dashboard-header">
      <h2>
        <i class="i-carbon-analytics" />
        AI 使用统计
      </h2>
      <div class="time-range-selector">
        <select v-model="selectedTimeRange" @change="loadStats">
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="all">全部</option>
        </select>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="i-carbon-request-quote" />
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalRequests }}</h3>
          <p>总请求数</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="i-carbon-token" />
        </div>
        <div class="stat-content">
          <h3>{{ formatNumber(stats.totalTokens) }}</h3>
          <p>总 Token 数</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="i-carbon-time" />
        </div>
        <div class="stat-content">
          <h3>{{ stats.averageResponseTime }}ms</h3>
          <p>平均响应时间</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="i-carbon-checkmark" />
        </div>
        <div class="stat-content">
          <h3>{{ stats.successRate }}%</h3>
          <p>成功率</p>
        </div>
      </div>
    </div>

    <div class="charts-section">
      <div class="chart-container">
        <h3>使用趋势</h3>
        <canvas ref="usageChart" />
      </div>

      <div class="chart-container">
        <h3>功能分布</h3>
        <canvas ref="featureChart" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useAI } from '@/composables/useAI'

Chart.register(...registerables)

const { getUsageStats } = useAI()

const selectedTimeRange = ref('week')
const stats = ref({
  totalRequests: 0,
  totalTokens: 0,
  averageResponseTime: 0,
  successRate: 100,
})

const usageChart = ref<HTMLCanvasElement>()
const featureChart = ref<HTMLCanvasElement>()

const loadStats = async () => {
  try {
    const data = await getUsageStats()
    stats.value = data

    // 更新图表
    updateCharts()
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const updateCharts = () => {
  // 使用趋势图表
  if (usageChart.value) {
    new Chart(usageChart.value, {
      type: 'line',
      data: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: [
          {
            label: '请求数',
            data: [12, 19, 3, 5, 2, 3, 9],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  }

  // 功能分布图表
  if (featureChart.value) {
    new Chart(featureChart.value, {
      type: 'doughnut',
      data: {
        labels: ['任务分析', '智能建议', 'AI 聊天', '批量分析'],
        datasets: [
          {
            data: [30, 25, 35, 10],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
          },
        ],
      },
      options: {
        responsive: true,
      },
    })
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.ai-monitor-dashboard {
  padding: 1.5rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.time-range-selector select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.stat-content p {
  margin: 0;
  color: var(--text-color-soft);
  font-size: 0.9rem;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.chart-container {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}

.chart-container h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}
</style>
```

## 🎯 核心学习要点

### 1. AI 服务架构设计

- **分层架构**：前端服务层、后端集成层、API 抽象层
- **缓存策略**：Redis 缓存 AI 分析结果，减少重复请求
- **错误处理**：完善的异常处理和降级策略
- **速率限制**：请求队列管理，避免 API 限流

### 2. DeepSeek API 集成

- **HTTP 客户端封装**：统一的 API 调用接口
- **响应解析**：JSON 和文本响应的智能解析
- **Token 管理**：使用量统计和成本控制
- **模型选择**：根据任务类型选择合适的模型

### 3. 智能功能实现

- **任务分析**：优先级评估、时间预估、分类建议
- **智能建议**：基于用户历史的个性化建议
- **对话系统**：上下文感知的 AI 助手
- **批量处理**：高效的批量任务分析

### 4. 用户体验优化

- **实时交互**：流式响应和打字效果
- **智能缓存**：减少等待时间
- **离线降级**：网络异常时的备用方案
- **个性化**：基于用户偏好的定制化服务

### 5. 性能与监控

- **使用统计**：详细的 API 使用数据
- **性能监控**：响应时间和成功率追踪
- **成本控制**：Token 使用量管理
- **数据可视化**：直观的统计图表

## 📝 简历技术亮点

### 前端技术亮点

- **Vue 3 + TypeScript**：现代化前端架构
- **Composables 设计模式**：可复用的业务逻辑
- **实时 AI 交互**：流畅的用户体验
- **智能缓存策略**：优化性能和用户体验

### 后端技术亮点

- **NestJS 微服务架构**：模块化的 AI 服务
- **DeepSeek API 深度集成**：企业级 AI 能力
- **Redis 缓存优化**：高性能数据访问
- **完善的监控体系**：可观测性设计

### AI 技术亮点

- **多模态 AI 集成**：任务分析、建议生成、对话系统
- **智能提示词工程**：优化 AI 响应质量
- **个性化推荐算法**：基于用户行为的智能建议
- **批量处理优化**：高效的 AI 服务调用

### 工程技术亮点

- **错误处理与降级**：健壮的系统设计
- **性能监控与优化**：数据驱动的改进
- **成本控制策略**：合理的资源使用
- **用户体验设计**：直观的 AI 交互界面
