import type {
  AITaskGenerationRequest,
  AITaskGenerationResult,
  GeneratedTask,
  TaskGenerationConfig,
  TimeEstimate,
  Todo,
  TodoPriority,
  UserTaskPreferences,
} from '@/types/todo'
import { handleError } from '@/utils/logger'
import { getAIResponse } from './deepseekService'

/**
 * AI 任务生成服务
 * 提供智能任务分解和生成功能
 */

// 默认配置
const DEFAULT_CONFIG: Required<TaskGenerationConfig> & {
  model: string
  temperature: number
  maxTokens: number
} = {
  maxTasks: 0, // 0 表示自动判断
  enablePriorityAnalysis: true,
  enableTimeEstimation: true,
  includeSubtasks: false,
  taskComplexity: 'medium',
  model: 'deepseek',
  temperature: 0.3,
  maxTokens: 2000,
}

// 任务生成缓存
const generationCache = new Map<string, AITaskGenerationResult>()
const CACHE_EXPIRY = 30 * 60 * 1000 // 30分钟

// 缓存统计
interface CacheStats {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  lastResetTime: number
}

const cacheStats: CacheStats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  lastResetTime: Date.now(),
}

// 服务健康状态
interface ServiceHealth {
  isHealthy: boolean
  lastHealthCheck: number
  consecutiveFailures: number
  lastError?: string
}

const serviceHealth: ServiceHealth = {
  isHealthy: true,
  lastHealthCheck: Date.now(),
  consecutiveFailures: 0,
}

/**
 * 生成任务的核心函数
 * @param request 任务生成请求
 * @returns AI 任务生成结果
 */
export async function generateTasksFromDescription(
  request: AITaskGenerationRequest
): Promise<AITaskGenerationResult> {
  const startTime = Date.now()

  try {
    // 更新请求统计
    cacheStats.totalRequests++

    // 检查缓存
    const cacheKey = generateCacheKey(request.description, request.config)
    const cached = generationCache.get(cacheKey)
    if (
      cached &&
      cached.metadata &&
      Date.now() - new Date(cached.metadata.generatedAt).getTime() < CACHE_EXPIRY
    ) {
      // 缓存命中
      cacheStats.cacheHits++
      return cached
    }

    // 缓存未命中
    cacheStats.cacheMisses++

    // 合并配置
    const config = { ...DEFAULT_CONFIG, ...request.config }

    // 构建 AI 提示词
    const prompt = buildTaskGenerationPrompt(request, config)

    // 调用 AI 服务
    const response = await getAIResponse(prompt, config.temperature)

    // 解析响应
    const result = parseAIResponse(response, request, startTime)

    // 缓存结果
    generationCache.set(cacheKey, result)

    // 更新健康状态 - 成功
    updateServiceHealth(true)

    return result
  } catch (error) {
    console.error('AI 任务生成失败:', error)
    handleError(error, 'AI 任务生成失败')

    // 更新健康状态 - 失败
    updateServiceHealth(false, error instanceof Error ? error.message : '未知错误')

    // 返回降级结果
    return createFallbackResult(request, startTime)
  }
}

/**
 * 构建任务生成提示词
 */
function buildTaskGenerationPrompt(
  request: AITaskGenerationRequest,
  config: Required<TaskGenerationConfig>
): string {
  const { description, context } = request

  // 处理任务数量限制
  const taskCountInstruction =
    config.maxTasks === 0
      ? '根据任务复杂度自动判断合适的任务数量，简单任务2-3个，中等复杂任务4-6个，复杂任务7-9个'
      : `将复杂任务分解为${config.maxTasks}个以内的具体可执行步骤`

  let prompt = `作为一个专业的任务管理助手，请将以下描述分解为具体可执行的待办任务：

任务描述：${description}

分析要求：
1. ${taskCountInstruction}
2. 每个任务应该是独立可完成的，有明确的完成标准
3. 任务应该按照逻辑顺序排列，体现执行的先后关系
4. 任务粒度适中，既不过于细碎也不过于宽泛

`

  // 添加上下文信息
  if (context?.existingTodos?.length) {
    const todoTitles = context.existingTodos
      .slice(0, 10)
      .map((t) => t.title)
      .join('、')
    prompt += `现有任务参考：${todoTitles}\n请避免重复，确保新任务与现有任务互补。\n\n`
  }

  // 添加用户偏好
  if (context?.userPreferences) {
    const prefs = context.userPreferences
    // 根据用户偏好调整提示词
    if (prefs.defaultTaskCount) {
      prompt += `\n用户偏好任务数量: ${prefs.defaultTaskCount}个\n`
    }
    if (prefs.preferredTopics?.length) {
      prompt += `\n用户感兴趣的领域: ${prefs.preferredTopics.join(', ')}\n`
    }
    if (prefs.difficulty) {
      prompt += `\n用户偏好的任务难度: ${prefs.difficulty}\n`
    }
  }

  // 添加时间框架
  if (context?.timeframe) {
    prompt += `完成时间框架：${context.timeframe}\n`
  }

  prompt += `
请严格按照以下JSON格式返回结果，不要包含任何其他文字：
{
  "tasks": [
    {
      "title": "任务标题",
      "description": "详细描述",
      "priority": 1-5,
      "estimatedTime": "预估时间（如：30分钟、2小时、1天）",
      "category": "任务分类",
      "tags": ["标签1", "标签2"],
      "reasoning": "生成此任务的理由",
      "confidence": 0.0-1.0
    }
  ],
  "suggestions": {
    "timeframe": "建议完成时间",
    "totalEstimatedTime": "总预估时间",
    "priorityDistribution": {"high": 0, "medium": 0, "low": 0},
    "recommendedOrder": [0, 1, 2]
  }
}`

  return prompt
}

/**
 * 解析 AI 响应
 */
function parseAIResponse(
  response: string,
  request: AITaskGenerationRequest,
  startTime: number
): AITaskGenerationResult {
  try {
    // 提取 JSON 部分
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('未找到有效的JSON格式')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // 验证和清理数据
    const tasks: GeneratedTask[] = (parsed.tasks || []).map(
      (
        task: {
          title?: unknown
          description?: unknown
          priority?: unknown
          estimatedTime?: unknown
          category?: unknown
          tags?: unknown[]
          reasoning?: unknown
        },
        index: number
      ): GeneratedTask => ({
        title: String(task.title || `任务 ${index + 1}`),
        description: task.description ? String(task.description) : undefined,
        priority: typeof task.priority === 'number' ? Math.max(1, Math.min(5, task.priority)) : 3,
        estimatedTime: task.estimatedTime ? String(task.estimatedTime) : undefined,
        category: task.category ? String(task.category) : undefined,
        tags: Array.isArray(task.tags) ? task.tags.map(String) : [],
        reasoning: task.reasoning ? String(task.reasoning) : undefined,
      })
    )

    return {
      success: true,
      tasks,
      originalDescription: request.description,
      totalTasks: tasks.length,
      processingTime: Date.now() - startTime,
      suggestions: parsed.suggestions || {},
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'deepseek',
        version: '1.0.0',
      },
    }
  } catch (error) {
    console.warn('解析AI任务生成响应失败:', error)
    console.warn('原始响应:', response)

    // 返回降级结果
    return createFallbackResult(request, startTime)
  }
}

/**
 * 创建降级结果
 */
function createFallbackResult(
  request: AITaskGenerationRequest,
  startTime: number
): AITaskGenerationResult {
  // 简单的任务分解逻辑
  const tasks: GeneratedTask[] = [
    {
      title: request.description,
      description: '请手动细化此任务的具体步骤',
      priority: 3,
      estimatedTime: '待评估',
      tags: [],
      reasoning: 'AI 分析失败，使用原始描述作为任务',
    },
  ]

  return {
    success: false,
    tasks,
    originalDescription: request.description,
    totalTasks: tasks.length,
    processingTime: Date.now() - startTime,
    error: 'AI 分析失败，已创建基础任务',
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'fallback',
      version: '1.0.0',
    },
  }
}

/**
 * 更新服务健康状态
 */
function updateServiceHealth(success: boolean, errorMessage?: string): void {
  serviceHealth.lastHealthCheck = Date.now()

  if (success) {
    serviceHealth.isHealthy = true
    serviceHealth.consecutiveFailures = 0
    delete serviceHealth.lastError
  } else {
    serviceHealth.consecutiveFailures++
    serviceHealth.lastError = errorMessage

    // 连续失败3次以上认为服务不健康
    if (serviceHealth.consecutiveFailures >= 3) {
      serviceHealth.isHealthy = false
    }
  }
}

/**
 * 重置缓存统计
 */
function resetCacheStats(): void {
  cacheStats.totalRequests = 0
  cacheStats.cacheHits = 0
  cacheStats.cacheMisses = 0
  cacheStats.lastResetTime = Date.now()
}

/**
 * 计算缓存命中率
 */
function calculateCacheHitRate(): number {
  if (cacheStats.totalRequests === 0) return 0
  return Math.round((cacheStats.cacheHits / cacheStats.totalRequests) * 100) / 100
}

/**
 * 生成缓存键
 */
function generateCacheKey(description: string, config?: TaskGenerationConfig): string {
  const key = {
    description: description,
    config: config,
  }

  // 使用简单的哈希函数替代 btoa，支持 Unicode 字符
  const keyString = JSON.stringify(key)
  let hash = 0
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 转换为32位整数
  }

  // 转换为正数并生成32位十六进制字符串
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 32)
}

/**
 * 分析用户上下文
 * @param todos 用户的待办事项列表
 * @returns 用户偏好分析结果
 */
export function analyzeUserContext(todos: Todo[]): Partial<UserTaskPreferences> {
  if (!todos.length) {
    return {}
  }

  // 分析任务时长偏好
  const estimatedTimes = todos
    .map((t) => t.estimatedTime)
    .filter((time): time is TimeEstimate => Boolean(time))

  // 分析优先级分布
  const priorities = todos
    .map((t) => t.priority)
    .filter((p): p is TodoPriority => typeof p === 'number' && p > 0)

  const avgPriority =
    priorities.length > 0 ? priorities.reduce((sum, p) => sum + p, 0) / priorities.length : 3

  // 分析任务分类
  const categories = todos
    .map((t) => t.description?.split(/[，。、]/)[0])
    .filter(Boolean)
    .slice(0, 5)

  return {
    preferredTaskDuration: estimatedTimes.length > 0 ? '中等时长' : undefined,
    priorityStyle:
      avgPriority > 3.5 ? 'urgent-first' : avgPriority < 2.5 ? 'balanced' : 'important-first',
    taskCategories: categories as string[],
  }
}

/**
 * 高级上下文分析
 * 提供更详细的用户行为分析和个性化建议
 * @param todos 用户的待办事项列表
 * @returns 详细的上下文分析结果
 */
export function analyzeAdvancedUserContext(todos: Todo[]): UserTaskPreferences {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // 基础分析
  const basePreferences: Partial<UserTaskPreferences> = {
    ...analyzeUserContext(todos),
  }

  // 完成率分析
  const completedTodos = todos.filter((t) => t.completed)
  const completionRate = todos.length > 0 ? completedTodos.length / todos.length : 0

  // 时间分析
  const recentTodos = todos.filter((t) => new Date(t.createdAt) > oneWeekAgo)
  const olderTodos = todos.filter(
    (t) => new Date(t.createdAt) <= oneWeekAgo && new Date(t.createdAt) > oneMonthAgo
  )

  const workloadTrend: 'increasing' | 'stable' | 'decreasing' =
    recentTodos.length > olderTodos.length * 1.2
      ? 'increasing'
      : recentTodos.length < olderTodos.length * 0.8
        ? 'decreasing'
        : 'stable'

  // 任务模式分析
  const taskTitles = todos.map((t) => t.title.toLowerCase())
  const commonWords = extractCommonWords(taskTitles)
  const commonTaskPatterns = commonWords.slice(0, 5)

  // 任务大小推荐
  const avgEstimatedTime = calculateAverageEstimatedTime(todos)
  const recommendedTaskSize: 'small' | 'medium' | 'large' =
    avgEstimatedTime < 60 ? 'small' : avgEstimatedTime > 240 ? 'large' : 'medium'

  // 生成建议
  const suggestions = generateContextualSuggestions(
    completionRate,
    workloadTrend,
    recommendedTaskSize,
    basePreferences.priorityStyle || 'balanced'
  )

  return {
    defaultTaskCount: 5, // 确保 defaultTaskCount 属性始终有值
    preferredTopics: [],
    difficulty: 'medium',
    autoGenerateSubtasks: true,
    ...basePreferences,
    insights: {
      completionRate: Math.round(completionRate * 100) / 100,
      averageTaskDuration: formatDuration(avgEstimatedTime),
      mostProductiveTimeframe: determineMostProductiveTime(completedTodos),
      commonTaskPatterns,
      recommendedTaskSize,
      workloadTrend,
    },
    suggestions,
  } as UserTaskPreferences
}

/**
 * 提取常见词汇
 */
function extractCommonWords(texts: string[]): string[] {
  const wordCount = new Map<string, number>()
  const stopWords = new Set([
    '的',
    '了',
    '和',
    '与',
    '或',
    '但',
    '然后',
    '因为',
    '所以',
    '如果',
    '这个',
    '那个',
  ])

  texts.forEach((text) => {
    const words = text
      .split(/[\s，。、！？；：""''（）【】]/g)
      .filter((word) => word.length > 1 && !stopWords.has(word))

    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })
  })

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

/**
 * 计算平均预估时间（分钟）
 */
function calculateAverageEstimatedTime(todos: Todo[]): number {
  const times = todos
    .map((t) => t.estimatedTime)
    .filter((time): time is TimeEstimate => Boolean(time))
    .map((timeStr) => parseEstimatedTime(timeStr))
    .filter((t) => t > 0)

  return times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 120
}

/**
 * 解析预估时间字符串为分钟数
 */
function parseEstimatedTime(timeEstimate: TimeEstimate | string): number {
  // 处理 undefined 情况
  if (!timeEstimate) return 0

  // 如果是 TimeEstimate 对象，直接返回分钟数
  if (typeof timeEstimate === 'object' && timeEstimate.minutes) {
    return timeEstimate.minutes
  }

  // 如果是字符串，解析字符串
  const timeStr = typeof timeEstimate === 'string' ? timeEstimate : timeEstimate.text
  const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*[小时|hour|h]/i)
  const minuteMatch = timeStr.match(/(\d+)\s*[分钟|minute|min|m]/i)
  const dayMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*[天|day|d]/i)

  if (dayMatch) return parseFloat(dayMatch[1]) * 8 * 60 // 假设一天工作8小时
  if (hourMatch) return parseFloat(hourMatch[1]) * 60
  if (minuteMatch) return parseInt(minuteMatch[1])

  return 0
}

/**
 * 格式化时长
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}分钟`
  if (minutes < 480) return `${Math.round((minutes / 60) * 10) / 10}小时`
  return `${Math.round((minutes / 480) * 10) / 10}天`
}

/**
 * 确定最高效时间段
 */
function determineMostProductiveTime(completedTodos: Todo[]): string {
  const completionTimes = completedTodos
    .filter((t) => t.completedAt)
    .map((t) => new Date(t.completedAt as string).getHours())

  if (completionTimes.length === 0) return '全天'

  const timeSlots = {
    '早晨 (6-9点)': completionTimes.filter((h) => h >= 6 && h < 9).length,
    '上午 (9-12点)': completionTimes.filter((h) => h >= 9 && h < 12).length,
    '下午 (12-18点)': completionTimes.filter((h) => h >= 12 && h < 18).length,
    '晚上 (18-22点)': completionTimes.filter((h) => h >= 18 && h < 22).length,
  }

  const mostProductive = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0]

  return mostProductive[0]
}

/**
 * 生成上下文建议
 */
function generateContextualSuggestions(
  completionRate: number,
  workloadTrend: string,
  taskSize: string,
  priorityStyle: string
): {
  taskBreakdown: string
  priorityStrategy: string
  timeManagement: string
} {
  const taskBreakdown =
    taskSize === 'large'
      ? '建议将大任务分解为更小的子任务，提高完成率'
      : taskSize === 'small'
        ? '可以适当合并相关的小任务，提高效率'
        : '当前任务大小适中，保持现有的任务分解方式'

  const priorityStrategy =
    completionRate < 0.5
      ? '建议专注于高优先级任务，减少同时进行的任务数量'
      : priorityStyle === 'urgent-first'
        ? '继续优先处理紧急任务，但注意平衡重要性'
        : '当前优先级策略效果良好，建议保持'

  const timeManagement =
    workloadTrend === 'increasing'
      ? '工作量呈上升趋势，建议合理安排时间，避免过度承诺'
      : workloadTrend === 'decreasing'
        ? '工作量有所减少，可以考虑承担更多挑战性任务'
        : '工作量保持稳定，建议继续保持当前的时间管理方式'

  return {
    taskBreakdown,
    priorityStrategy,
    timeManagement,
  }
}

/**
 * 清理过期缓存
 */
export function clearExpiredCache(): void {
  const now = Date.now()
  for (const [key, result] of generationCache.entries()) {
    // 正确处理不同的时间格式
    let generatedAt: number
    if (typeof result.metadata?.generatedAt === 'string') {
      generatedAt = new Date(result.metadata.generatedAt).getTime()
    } else if (typeof result.metadata?.generatedAt === 'number') {
      generatedAt = result.metadata.generatedAt
    } else {
      generatedAt = 0
    }

    if (now - generatedAt > CACHE_EXPIRY) {
      generationCache.delete(key)
    }
  }
}

/**
 * 清除所有缓存（用于测试）
 */
export function clearAllCache(): void {
  generationCache.clear()
}

// 定期清理缓存
setInterval(
  () => {
    clearExpiredCache()
  },
  10 * 60 * 1000
) // 每10分钟清理一次

/**
 * 重试配置
 */
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffFactor: 2,
}

/**
 * 带重试的任务生成
 * @param request 任务生成请求
 * @param retryConfig 重试配置
 * @returns AI 任务生成结果
 */
export async function generateTasksWithRetry(
  request: AITaskGenerationRequest,
  retryConfig: Partial<RetryConfig> = {}
): Promise<AITaskGenerationResult> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await generateTasksFromDescription(request)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 最后一次尝试失败，不再重试
      if (attempt === config.maxRetries) {
        break
      }

      // 计算延迟时间
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      )

      console.warn(
        `AI 任务生成失败，${delay}ms 后重试 (${attempt + 1}/${config.maxRetries})`,
        error
      )

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // 所有重试都失败，返回降级结果
  console.error('AI 任务生成重试失败，使用降级方案', lastError)
  return createFallbackResult(request, Date.now())
}

/**
 * 验证生成的任务质量
 * @param tasks 生成的任务列表
 * @returns 验证结果
 */
export function validateGeneratedTasks(tasks: GeneratedTask[]): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // 检查任务数量
  if (tasks.length === 0) {
    issues.push('未生成任何任务')
  } else if (tasks.length > 10) {
    issues.push('生成的任务过多，可能过于细碎')
    suggestions.push('考虑合并相关任务或提高任务粒度')
  }

  // 检查任务标题
  const emptyTitles = tasks.filter((t) => !t.title || t.title.trim().length === 0)
  if (emptyTitles.length > 0) {
    issues.push(`${emptyTitles.length} 个任务缺少标题`)
  }

  // 检查重复任务
  const titles = tasks.map((t) => t.title.toLowerCase().trim())
  const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index)
  if (duplicates.length > 0) {
    issues.push(`发现 ${duplicates.length} 个重复任务`)
    suggestions.push('移除或合并重复的任务')
  }

  // 检查优先级分布
  const priorities = tasks
    .map((t) => t.priority)
    .filter((p): p is TodoPriority => typeof p === 'number' && p > 0)
  const highPriorityCount = priorities.filter((p) => p >= 4).length
  const totalTasks = tasks.length

  if (highPriorityCount > totalTasks * 0.7) {
    issues.push('高优先级任务过多')
    suggestions.push('重新评估任务优先级，避免所有任务都是高优先级')
  }

  // 检查时间估算
  const withTimeEstimate = tasks.filter((t) => t.estimatedTime !== undefined).length
  if (withTimeEstimate < totalTasks * 0.5) {
    suggestions.push('建议为更多任务添加时间估算')
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  }
}

/**
 * 智能任务优化
 * 对生成的任务进行自动优化
 * @param tasks 原始任务列表
 * @returns 优化后的任务列表
 */
export function optimizeGeneratedTasks(tasks: GeneratedTask[]): GeneratedTask[] {
  if (tasks.length === 0) return tasks

  let optimizedTasks = [...tasks]

  // 1. 移除重复任务
  optimizedTasks = removeDuplicateTasks(optimizedTasks)

  // 2. 优化任务顺序
  optimizedTasks = optimizeTaskOrder(optimizedTasks)

  // 3. 调整优先级分布
  optimizedTasks = balancePriorities(optimizedTasks)

  // 4. 优化时间估算
  optimizedTasks = normalizeTimeEstimates(optimizedTasks)

  return optimizedTasks
}

/**
 * 移除重复任务
 */
function removeDuplicateTasks(tasks: GeneratedTask[]): GeneratedTask[] {
  const seen = new Set<string>()
  return tasks.filter((task) => {
    const key = task.title.toLowerCase().trim()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * 优化任务顺序
 */
function optimizeTaskOrder(tasks: GeneratedTask[]): GeneratedTask[] {
  // 按优先级排序，保持 AI 生成的逻辑顺序
  return tasks.sort((a, b) => {
    const aPriority = a.priority || 3
    const bPriority = b.priority || 3

    // 优先级相同时保持原有顺序
    if (aPriority === bPriority) return 0

    return bPriority - aPriority
  })
}

/**
 * 平衡优先级分布
 */
function balancePriorities(tasks: GeneratedTask[]): GeneratedTask[] {
  // 只对没有设置优先级或优先级不合理的任务进行调整
  return tasks.map((task) => {
    // 如果任务已有合理优先级(1-5)，则保留
    if (task.priority !== undefined && task.priority >= 1 && task.priority <= 5) {
      return task
    }

    // 否则根据任务描述长度设置优先级
    const descriptionLength = task.description?.length || 0
    let priority: number
    if (descriptionLength > 200) {
      priority = 5 // 很长的描述通常是重要任务
    } else if (descriptionLength > 100) {
      priority = 4
    } else if (descriptionLength > 50) {
      priority = 3
    } else {
      priority = 2
    }

    // 确保优先级在 1-5 范围内
    const validPriority = Math.max(1, Math.min(5, priority))
    return {
      ...task,
      priority: validPriority,
    }
  })
}

/**
 * 标准化时间估算
 */
function normalizeTimeEstimates(tasks: GeneratedTask[]): GeneratedTask[] {
  return tasks.map((task) => {
    if (!task.estimatedTime) {
      // 根据任务复杂度和优先级估算时间
      const priority = task.priority || 3
      const complexity = task.description?.length || 50

      let minutes = 60 // 默认1小时
      if (complexity > 100) minutes = 120 // 2小时
      if (complexity > 200) minutes = 240 // 4小时
      if (priority >= 4) minutes = Math.max(30, minutes * 0.8) // 高优先级任务通常更紧急，时间更短

      return {
        ...task,
        estimatedTime: formatDuration(minutes),
      }
    }
    return task
  })
}

/**
 * 检查服务健康状态
 * @returns 服务是否可用
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    // 发送一个简单的测试请求，使用唯一描述避免缓存
    const testRequest: AITaskGenerationRequest = {
      description: `健康检查-${Date.now()}-${Math.random()}`, // 添加随机数确保唯一性
      config: {
        maxTasks: 1,
        enablePriorityAnalysis: true,
        enableTimeEstimation: true,
        includeSubtasks: false,
        taskComplexity: 'medium',
      },
    }

    const result = await generateTasksFromDescription(testRequest)
    return result.success
  } catch (error) {
    console.warn('AI 任务生成服务健康检查失败:', error)
    // 即使是单次失败，健康检查也应该返回 false
    updateServiceHealth(false, error instanceof Error ? error.message : '未知错误')
    return false
  }
}

/**
 * 获取服务状态信息
 */
export function getServiceStatus(): {
  cacheSize: number
  cacheHitRate: number
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  lastError?: string
  isHealthy: boolean
  consecutiveFailures: number
  lastHealthCheck: number
  uptime: number
} {
  // 确保 lastResetTime 有默认值
  const lastResetTime = cacheStats.lastResetTime || Date.now()
  return {
    cacheSize: generationCache.size,
    cacheHitRate: calculateCacheHitRate(),
    totalRequests: cacheStats.totalRequests,
    cacheHits: cacheStats.cacheHits,
    cacheMisses: cacheStats.cacheMisses,
    lastError: serviceHealth.lastError,
    isHealthy: serviceHealth.isHealthy,
    consecutiveFailures: serviceHealth.consecutiveFailures,
    lastHealthCheck: serviceHealth.lastHealthCheck,
    uptime: Date.now() - lastResetTime,
  }
}

/**
 * 重置服务统计
 */
export function resetServiceStats(): void {
  resetCacheStats()
  serviceHealth.consecutiveFailures = 0
  serviceHealth.isHealthy = true
  delete serviceHealth.lastError
}
