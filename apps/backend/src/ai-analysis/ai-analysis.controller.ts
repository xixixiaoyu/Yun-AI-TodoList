/**
 * AI 分析控制器
 */

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { User } from '@shared/types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AIAnalysisService, CreateAIAnalysisDto } from './ai-analysis.service'

@ApiTags('ai-analysis')
@Controller('ai-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIAnalysisController {
  constructor(private readonly aiAnalysisService: AIAnalysisService) {}

  @Post()
  @ApiOperation({ summary: '创建 AI 分析记录' })
  @ApiResponse({ status: 201, description: 'AI 分析记录创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: 'Todo 不存在' })
  async createAnalysis(@CurrentUser() user: User, @Body() createDto: CreateAIAnalysisDto) {
    return this.aiAnalysisService.createAnalysis(user.id, createDto)
  }

  @Post('document-based/:todoId')
  @ApiOperation({ summary: '基于文档内容创建 AI 分析' })
  @ApiResponse({ status: 201, description: 'AI 分析记录创建成功' })
  @ApiResponse({ status: 404, description: 'Todo 不存在' })
  async createDocumentBasedAnalysis(
    @CurrentUser() user: User,
    @Param('todoId') todoId: string,
    @Body() body?: { query?: string }
  ) {
    return this.aiAnalysisService.createDocumentBasedAnalysis(user.id, todoId, body?.query)
  }

  @Post('batch-document-based')
  @ApiOperation({ summary: '批量基于文档的 AI 分析' })
  @ApiResponse({ status: 200, description: '批量分析完成' })
  async batchDocumentBasedAnalysis(@CurrentUser() user: User, @Body() body: { todoIds: string[] }) {
    return this.aiAnalysisService.batchDocumentBasedAnalysis(user.id, body.todoIds)
  }

  @Get('todo/:todoId/latest')
  @ApiOperation({ summary: '获取 Todo 的最新 AI 分析' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: 'AI 分析不存在' })
  async getLatestAnalysis(@CurrentUser() user: User, @Param('todoId') todoId: string) {
    return this.aiAnalysisService.getLatestAnalysis(user.id, todoId)
  }
}
