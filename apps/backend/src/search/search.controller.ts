import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { User } from '@shared/types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SearchHistoryQueryDto } from './dto/search-history.dto'
import { SearchDto } from './dto/search.dto'
import { SearchService } from './search.service'

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: '执行搜索' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiResponse({ status: 400, description: '搜索参数错误' })
  async search(@CurrentUser() user: User, @Body() searchDto: SearchDto) {
    return this.searchService.search(user.id, searchDto)
  }

  @Get('history')
  @ApiOperation({ summary: '获取搜索历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词过滤' })
  @ApiQuery({ name: 'dateFrom', required: false, description: '开始日期' })
  @ApiQuery({ name: 'dateTo', required: false, description: '结束日期' })
  async getSearchHistory(@CurrentUser() user: User, @Query() queryDto: SearchHistoryQueryDto) {
    return this.searchService.getSearchHistory(user.id, queryDto)
  }

  @Delete('history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除搜索历史记录' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 400, description: '历史记录不存在' })
  async deleteSearchHistoryItem(@CurrentUser() user: User, @Param('id') id: string) {
    await this.searchService.deleteSearchHistory(user.id, id)
  }

  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '清空搜索历史' })
  @ApiResponse({ status: 204, description: '清空成功' })
  async clearSearchHistory(@CurrentUser() user: User) {
    await this.searchService.deleteSearchHistory(user.id)
  }

  @Get('stats')
  @ApiOperation({ summary: '获取搜索统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSearchStats(@CurrentUser() user: User) {
    return this.searchService.getSearchStats(user.id)
  }
}
