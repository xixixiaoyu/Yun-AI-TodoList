import { googleSearchService, type SearchOptions, type SearchResult } from './searchService'

/**
 * AI 搜索工具配置
 */
export interface AISearchConfig {
  enabled: boolean
  maxResults: number
  timeout: number
  locale: string
  intelligentSearch: boolean // 智能搜索（包含自动搜索和不确定性检测）
}

/**
 * 搜索上下文信息
 */
export interface SearchContext {
  query: string
  results: SearchResult[]
  timestamp: number
  source: 'google'
}

/**
 * AI 搜索工具类
 * 为 AI 助手提供智能搜索能力
 */
export class AISearchTool {
  private config: AISearchConfig = {
    enabled: true,
    maxResults: 10,
    timeout: 10000,
    locale: 'zh-CN',
    intelligentSearch: true,
  }

  private searchHistory: SearchContext[] = []

  /**
   * 更新搜索配置
   */
  updateConfig(config: Partial<AISearchConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AISearchConfig {
    return { ...this.config }
  }

  /**
   * 判断用户问题是否需要搜索
   */
  shouldSearch(userMessage: string): boolean {
    if (!this.config.enabled || !this.config.intelligentSearch) {
      return false
    }

    return this.analyzeSearchNeed(userMessage).needsSearch
  }

  /**
   * 分析用户消息是否需要搜索（更详细的分析）
   */
  analyzeSearchNeed(userMessage: string): {
    needsSearch: boolean
    confidence: number
    reasons: string[]
  } {
    const reasons: string[] = []
    let searchScore = 0
    let noSearchScore = 0

    // 时效性关键词 - 强烈需要搜索
    const timePatterns = [
      /最新|最近|现在|当前|今天|昨天|本周|本月|今年|2024|2025/,
      /刚刚|刚才|目前|现阶段|近期|新出|新发布/,
      /实时|即时|当下|此时|现状|现况/,
    ]
    if (timePatterns.some((pattern) => pattern.test(userMessage))) {
      searchScore += 3
      reasons.push('包含时效性关键词')
    }

    // 事实性查询 - 需要搜索
    const factualPatterns = [
      /新闻|消息|动态|发生|事件|报道|爆料/,
      /价格|股价|汇率|行情|市值|涨跌/,
      /天气|温度|气候|降雨|台风|地震/,
      /什么是|介绍|了解|查询|搜索|百科/,
      /谁是|什么人|人物|明星|名人|CEO|创始人/,
      /公司|企业|品牌|产品|发布|上市/,
      /政策|法律|规定|条例|法规|通知/,
      /数据|统计|排名|榜单|报告|调查/,
    ]
    if (factualPatterns.some((pattern) => pattern.test(userMessage))) {
      searchScore += 2
      reasons.push('包含事实性查询关键词')
    }

    // 指导性查询 - 可能需要搜索
    const guidancePatterns = [
      /怎么|如何|方法|步骤|教程|攻略/,
      /哪里|在哪|地址|位置|路线|导航/,
      /推荐|建议|选择|比较|评测/,
      /健康|医疗|疾病|症状|治疗|药物/,
      /旅游|景点|酒店|机票|签证/,
      /学习|教育|课程|考试|培训/,
      /技术|科技|软件|硬件|编程|开发/,
    ]
    if (guidancePatterns.some((pattern) => pattern.test(userMessage))) {
      searchScore += 1
      reasons.push('包含指导性查询关键词')
    }

    // 专业领域查询 - 可能需要搜索
    const professionalPatterns = [
      /AI|人工智能|机器学习|深度学习|ChatGPT/,
      /区块链|比特币|以太坊|NFT|Web3/,
      /投资|理财|基金|股票|债券/,
      /创业|融资|IPO|估值|商业模式/,
      /医学|生物|化学|物理|数学/,
      /法律|合同|专利|版权|商标/,
    ]
    if (professionalPatterns.some((pattern) => pattern.test(userMessage))) {
      searchScore += 1
      reasons.push('包含专业领域关键词')
    }

    // 明确的搜索意图
    const explicitSearchPatterns = [
      /搜索|查找|找一下|帮我找|搜一下/,
      /网上|在线|互联网|百度|谷歌/,
      /资料|信息|内容|文章|新闻/,
    ]
    if (explicitSearchPatterns.some((pattern) => pattern.test(userMessage))) {
      searchScore += 4
      reasons.push('明确表达搜索意图')
    }

    // 不需要搜索的模式
    const noSearchPatterns = [
      /你好|谢谢|再见|没事|算了|好的|知道了/,
      /帮我写|生成|创建|制作|写一个|做一个/,
      /翻译|解释|分析|总结|改写|润色/,
      /计算|数学|公式|算一下|计算器/,
      /个人|隐私|秘密|私人|不要告诉/,
      /聊天|闲聊|随便聊|陪我聊/,
      /测试|试试|看看|玩玩/,
    ]
    if (noSearchPatterns.some((pattern) => pattern.test(userMessage))) {
      noSearchScore += 3
      reasons.push('包含不需要搜索的关键词')
    }

    // 创作类请求 - 不需要搜索
    const creativePatterns = [
      /写|编写|创作|作文|小说|诗歌|故事/,
      /设计|画|绘制|制图|UI|界面/,
      /代码|编程|程序|脚本|函数|算法/,
      /方案|计划|策略|思路|想法/,
    ]
    if (creativePatterns.some((pattern) => pattern.test(userMessage))) {
      noSearchScore += 2
      reasons.push('属于创作类请求')
    }

    // 计算最终得分
    const finalScore = searchScore - noSearchScore
    const needsSearch = finalScore > 0
    const confidence = Math.min(Math.abs(finalScore) / 5, 1) // 归一化到 0-1

    return {
      needsSearch,
      confidence,
      reasons,
    }
  }

  /**
   * 从用户消息中提取搜索关键词
   */
  extractSearchKeywords(userMessage: string): string[] {
    // 移除常见的停用词
    const stopWords = [
      '的',
      '了',
      '在',
      '是',
      '我',
      '有',
      '和',
      '就',
      '不',
      '人',
      '都',
      '一',
      '一个',
      '上',
      '也',
      '很',
      '到',
      '说',
      '要',
      '去',
      '你',
      '会',
      '着',
      '没有',
      '看',
      '好',
      '自己',
      '这',
      '那',
      '什么',
      '怎么',
      '为什么',
      '哪里',
      '谁',
      '如何',
      '请',
      '帮我',
      '告诉我',
    ]

    // 提取关键词
    let keywords = userMessage
      .replace(/[？！。，、；：""''（）【】《》]/g, ' ') // 移除标点符号
      .split(/\s+/) // 按空格分割
      .filter((word) => word.length > 1 && !stopWords.includes(word)) // 过滤停用词和单字符

    // 如果关键词太少，使用整个问题作为搜索词
    if (keywords.length === 0) {
      keywords = [userMessage.replace(/[？！。，、；：""''（）【】《》]/g, '').trim()]
    }

    // 限制关键词数量
    return keywords.slice(0, 3)
  }

  /**
   * 执行搜索
   */
  async search(userMessage: string): Promise<SearchContext | null> {
    if (!this.config.enabled) {
      return null
    }

    try {
      const keywords = this.extractSearchKeywords(userMessage)
      if (keywords.length === 0) {
        return null
      }

      console.warn('AI 搜索关键词:', keywords)

      const searchOptions: SearchOptions = {
        limit: this.config.maxResults,
        timeout: this.config.timeout,
        locale: this.config.locale,
      }

      const searchResult = await googleSearchService.search(keywords, searchOptions)

      // 合并所有搜索结果
      const allResults: SearchResult[] = []
      searchResult.searches.forEach((search) => {
        allResults.push(...search.results)
      })

      const context: SearchContext = {
        query: keywords.join(' '),
        results: allResults.slice(0, this.config.maxResults),
        timestamp: Date.now(),
        source: 'google',
      }

      // 保存到搜索历史
      this.searchHistory.unshift(context)
      if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(0, 10)
      }

      console.warn('AI 搜索结果:', context)
      return context
    } catch (error) {
      console.error('AI 搜索失败:', error)
      return null
    }
  }

  /**
   * 格式化搜索结果为 AI 可理解的文本
   */
  formatSearchResultsForAI(context: SearchContext): string {
    if (!context || context.results.length === 0) {
      return ''
    }

    let formattedText = `\n\n**搜索结果参考** (关键词: ${context.query}):\n\n`

    context.results.forEach((result, index) => {
      formattedText += `${index + 1}. **${result.title}**\n`
      formattedText += `   ${result.snippet}\n`
      formattedText += `   来源: ${result.link}\n\n`
    })

    formattedText += `\n*以上信息来自网络搜索，请结合这些信息回答用户问题。*\n`

    return formattedText
  }

  /**
   * 格式化搜索结果为用户可见的展示
   */
  formatSearchResultsForUser(context: SearchContext): string {
    if (!context || context.results.length === 0) {
      return ''
    }

    let formattedText = `\n\n---\n\n### 📊 相关搜索结果\n\n`
    formattedText += `> 🔍 搜索关键词: **${context.query}**\n\n`

    context.results.forEach((result, index) => {
      formattedText += `#### ${index + 1}. ${result.title}\n\n`
      formattedText += `${result.snippet}\n\n`
      formattedText += `🔗 **[查看原文](${result.link})**\n\n`
      if (index < context.results.length - 1) {
        formattedText += `---\n\n`
      }
    })

    formattedText += `\n*💡 以上信息来自网络搜索，仅供参考*\n\n`

    return formattedText
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory(): SearchContext[] {
    return [...this.searchHistory]
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory(): void {
    this.searchHistory = []
  }

  /**
   * 手动触发搜索（用户明确要求搜索时）
   */
  async manualSearch(query: string): Promise<SearchContext | null> {
    const originalIntelligentSearch = this.config.intelligentSearch
    this.config.intelligentSearch = true

    try {
      return await this.search(query)
    } finally {
      this.config.intelligentSearch = originalIntelligentSearch
    }
  }

  /**
   * 分析 AI 响应的不确定性
   * 检测 AI 是否对回答不够确定，需要搜索补充信息
   */
  analyzeResponseUncertainty(aiResponse: string): {
    isUncertain: boolean
    confidence: number
    reasons: string[]
    suggestedSearchQuery?: string
  } {
    const reasons: string[] = []
    let uncertaintyScore = 0

    // 不确定性表达模式
    const uncertaintyPatterns = [
      { pattern: /我不确定|不太确定|不能确定|无法确定/, score: 3, reason: '明确表达不确定' },
      { pattern: /可能|也许|大概|估计|应该是|似乎/, score: 2, reason: '使用不确定词汇' },
      { pattern: /我不知道|不清楚|不了解|没有信息/, score: 3, reason: '承认缺乏信息' },
      { pattern: /需要更多信息|建议查询|建议搜索/, score: 3, reason: '建议获取更多信息' },
      { pattern: /据我所知|就我了解|在我的知识范围内/, score: 1, reason: '限定知识范围' },
      { pattern: /最新|最近的|当前的.*可能已经变化/, score: 2, reason: '提及信息时效性' },
      { pattern: /抱歉|很遗憾|无法提供/, score: 2, reason: '表达歉意或无法提供' },
      { pattern: /建议您.*查看|建议您.*了解/, score: 1, reason: '建议用户自行查询' },
    ]

    // 检查不确定性模式
    for (const { pattern, score, reason } of uncertaintyPatterns) {
      if (pattern.test(aiResponse)) {
        uncertaintyScore += score
        reasons.push(reason)
      }
    }

    // 检查回答长度（过短可能表示信息不足）
    if (aiResponse.length < 50) {
      uncertaintyScore += 1
      reasons.push('回答过于简短')
    }

    // 检查是否包含具体数据或事实
    const hasSpecificInfo = /\d{4}年|\d+月|\d+日|具体|详细|准确/.test(aiResponse)
    if (!hasSpecificInfo && aiResponse.length > 100) {
      uncertaintyScore += 1
      reasons.push('缺乏具体信息')
    }

    // 提取可能的搜索查询
    let suggestedSearchQuery: string | undefined
    const searchSuggestionMatch = aiResponse.match(/建议.*?搜索["""]([^"""]+)["""]/)
    if (searchSuggestionMatch) {
      suggestedSearchQuery = searchSuggestionMatch[1]
    }

    const isUncertain = uncertaintyScore >= 2
    const confidence = Math.min(uncertaintyScore / 5, 1)

    return {
      isUncertain,
      confidence,
      reasons,
      suggestedSearchQuery,
    }
  }

  /**
   * 从 AI 响应中提取搜索关键词
   */
  extractSearchQueryFromResponse(aiResponse: string, originalQuery: string): string[] {
    const queries: string[] = []

    // 从原始查询中提取关键词
    const originalKeywords = this.extractSearchKeywords(originalQuery)
    queries.push(...originalKeywords)

    // 从 AI 响应中提取可能的搜索词
    const responseKeywords = aiResponse
      .match(/["""]([^"""]+)["""]/g) // 提取引号中的内容
      ?.map((match) => match.replace(/["""]/g, ''))
      .filter((keyword) => keyword.length > 2)

    if (responseKeywords) {
      queries.push(...responseKeywords.slice(0, 2))
    }

    // 去重并限制数量
    return [...new Set(queries)].slice(0, 3)
  }
}

// 创建全局 AI 搜索工具实例
export const aiSearchTool = new AISearchTool()

/**
 * AI 搜索 Composable
 * 为 Vue 组件提供 AI 搜索功能
 */
export function useAISearch() {
  const updateConfig = (config: Partial<AISearchConfig>) => {
    aiSearchTool.updateConfig(config)
  }

  const getConfig = () => {
    return aiSearchTool.getConfig()
  }

  const shouldSearch = (message: string) => {
    return aiSearchTool.shouldSearch(message)
  }

  const analyzeSearchNeed = (message: string) => {
    return aiSearchTool.analyzeSearchNeed(message)
  }

  const analyzeResponseUncertainty = (aiResponse: string) => {
    return aiSearchTool.analyzeResponseUncertainty(aiResponse)
  }

  const search = async (message: string) => {
    return await aiSearchTool.search(message)
  }

  const manualSearch = async (query: string) => {
    return await aiSearchTool.manualSearch(query)
  }

  const formatForAI = (context: SearchContext | null) => {
    return context ? aiSearchTool.formatSearchResultsForAI(context) : ''
  }

  const formatForUser = (context: SearchContext | null) => {
    return context ? aiSearchTool.formatSearchResultsForUser(context) : ''
  }

  const getHistory = () => {
    return aiSearchTool.getSearchHistory()
  }

  const clearHistory = () => {
    aiSearchTool.clearSearchHistory()
  }

  const extractSearchQueryFromResponse = (aiResponse: string, originalQuery: string) => {
    return aiSearchTool.extractSearchQueryFromResponse(aiResponse, originalQuery)
  }

  return {
    updateConfig,
    getConfig,
    shouldSearch,
    analyzeSearchNeed,
    analyzeResponseUncertainty,
    search,
    manualSearch,
    formatForAI,
    formatForUser,
    getHistory,
    clearHistory,
    extractSearchQueryFromResponse,
  }
}
