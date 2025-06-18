import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { SearchHistoryItem, SearchResponse, SearchResult, SearchStats } from '@shared/types'
import { UtilsService } from '../common/services/utils.service'
import { PrismaService } from '../database/prisma.service'
import { SearchHistoryQueryDto } from './dto/search-history.dto'
import { SearchDto } from './dto/search.dto'

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService
  ) {}

  async search(userId: string, searchDto: SearchDto): Promise<SearchResponse> {
    const { query, limit, language, safeSearch, timeRange, region, saveHistory } = searchDto
    const startTime = Date.now()

    try {
      // 执行搜索
      const results = await this.performGoogleSearch({
        query,
        limit,
        language,
        safeSearch,
        timeRange,
        region,
      })

      const searchTime = Date.now() - startTime

      // 保存搜索历史
      if (saveHistory) {
        await this.saveSearchHistory(userId, query, results, searchTime)
      }

      return {
        query,
        results,
        total: results.length,
        searchTime,
        suggestions: await this.generateSuggestions(query),
        relatedQueries: await this.getRelatedQueries(query),
      }
    } catch (error) {
      this.logger.error(`Search failed for query: ${query}`, error)
      throw new BadRequestException('搜索失败，请稍后重试')
    }
  }

  async getSearchHistory(userId: string, queryDto: SearchHistoryQueryDto) {
    const { page = 1, limit = 20, search, dateFrom, dateTo } = queryDto
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = { userId }

    if (search) {
      where.query = { contains: search, mode: 'insensitive' }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    const [history, total] = await Promise.all([
      this.prisma.searchHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.searchHistory.count({ where }),
    ])

    return {
      history: history.map((item) => this.mapPrismaSearchHistoryToSearchHistory(item)),
      total,
      page,
      limit,
    }
  }

  async deleteSearchHistory(userId: string, historyId?: string): Promise<void> {
    if (historyId) {
      // 删除单个历史记录
      const history = await this.prisma.searchHistory.findFirst({
        where: { id: historyId, userId },
      })

      if (!history) {
        throw new BadRequestException('搜索历史不存在')
      }

      await this.prisma.searchHistory.delete({
        where: { id: historyId },
      })
    } else {
      // 删除所有历史记录
      await this.prisma.searchHistory.deleteMany({
        where: { userId },
      })
    }
  }

  async getSearchStats(userId: string): Promise<SearchStats> {
    const [totalSearches, searchesByDate, topQueries] = await Promise.all([
      this.prisma.searchHistory.count({ where: { userId } }),
      this.getSearchesByDate(userId),
      this.getTopQueries(userId),
    ])

    const avgStats = await this.prisma.searchHistory.aggregate({
      where: { userId },
      _avg: {
        resultCount: true,
        searchTime: true,
      },
    })

    return {
      totalSearches,
      averageResultCount: Math.round(avgStats._avg.resultCount || 0),
      averageSearchTime: Math.round(avgStats._avg.searchTime || 0),
      topQueries,
      searchesByDate,
    }
  }

  private async performGoogleSearch(params: {
    query: string
    limit?: number
    language?: string
    safeSearch?: boolean
    timeRange?: string
    region?: string
  }): Promise<SearchResult[]> {
    // 模拟 Google Search API 调用
    // 实际项目中这里会调用真实的 Google Search API 或 MCP 服务

    const { query, limit = 10 } = params

    // 模拟搜索结果
    const mockResults: SearchResult[] = []

    for (let i = 0; i < Math.min(limit, 10); i++) {
      mockResults.push({
        id: this.utilsService.generateId(),
        title: `${query} - 搜索结果 ${i + 1}`,
        url: `https://example.com/result-${i + 1}`,
        snippet: `这是关于 "${query}" 的搜索结果摘要。包含相关信息和详细描述...`,
        displayUrl: `example.com/result-${i + 1}`,
        favicon: 'https://example.com/favicon.ico',
        publishedDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        source: 'Example Source',
      })
    }

    // 添加一些延迟来模拟网络请求
    await this.utilsService.delay(200 + Math.random() * 300)

    return mockResults
  }

  private async saveSearchHistory(
    userId: string,
    query: string,
    results: SearchResult[],
    searchTime: number
  ): Promise<void> {
    try {
      await this.prisma.searchHistory.create({
        data: {
          id: this.utilsService.generateId(),
          userId,
          query,
          results: JSON.stringify(results),
          resultCount: results.length,
          searchTime,
        },
      })
    } catch (error) {
      this.logger.error('Failed to save search history:', error)
      // 不抛出错误，避免影响搜索功能
    }
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    // 简单的搜索建议生成
    const suggestions = [
      `${query} 教程`,
      `${query} 最佳实践`,
      `${query} 示例`,
      `${query} 文档`,
      `${query} 指南`,
    ]

    return suggestions.slice(0, 3)
  }

  private async getRelatedQueries(query: string): Promise<string[]> {
    // 从历史搜索中获取相关查询
    const relatedHistory = await this.prisma.searchHistory.findMany({
      where: {
        query: { contains: query, mode: 'insensitive' },
      },
      select: { query: true },
      distinct: ['query'],
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    return relatedHistory.map((h) => h.query).filter((q) => q !== query)
  }

  private async getSearchesByDate(userId: string) {
    // 获取最近30天的搜索统计
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const searches = await this.prisma.searchHistory.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    })

    // 按日期分组
    const searchesByDate: Array<{ date: string; count: number }> = []
    const dateMap = new Map<string, number>()

    searches.forEach((search) => {
      const date = search.createdAt.toISOString().split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + search._count.id)
    })

    dateMap.forEach((count, date) => {
      searchesByDate.push({ date, count })
    })

    return searchesByDate.sort((a, b) => a.date.localeCompare(b.date))
  }

  private async getTopQueries(userId: string) {
    const topQueries = await this.prisma.searchHistory.groupBy({
      by: ['query'],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    return topQueries.map((item) => ({
      query: item.query,
      count: item._count.id,
    }))
  }

  private mapPrismaSearchHistoryToSearchHistory(prismaHistory: any): SearchHistoryItem {
    return {
      id: prismaHistory.id,
      query: prismaHistory.query,
      results: prismaHistory.results ? JSON.parse(prismaHistory.results) : [],
      timestamp: prismaHistory.createdAt.toISOString(),
      userId: prismaHistory.userId,
      resultCount: prismaHistory.resultCount,
      searchTime: prismaHistory.searchTime,
    }
  }
}
