import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { User } from '@shared/types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { BatchAnalyzeDto } from './dto/batch-analyze.dto'
import { CreateTodoDto } from './dto/create-todo.dto'
import { QueryTodosDto } from './dto/query-todos.dto'
import { ReorderTodosDto } from './dto/reorder-todos.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { TodosService } from './todos.service'

@ApiTags('todos')
@Controller('todos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: '创建 Todo' })
  @ApiResponse({ status: 201, description: 'Todo 创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(@CurrentUser() user: User, @Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(user.id, createTodoDto)
  }

  @Get()
  @ApiOperation({ summary: '获取 Todo 列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'type', required: false, description: '过滤类型' })
  @ApiQuery({ name: 'tags', required: false, description: '标签过滤' })
  @ApiQuery({ name: 'priority', required: false, description: '优先级过滤' })
  @ApiQuery({ name: 'sortBy', required: false, description: '排序字段' })
  @ApiQuery({ name: 'sortOrder', required: false, description: '排序方向' })
  @ApiQuery({ name: 'includeStats', required: false, description: '是否包含统计信息' })
  async findAll(@CurrentUser() user: User, @Query() queryDto: QueryTodosDto) {
    return this.todosService.findAll(user.id, queryDto)
  }

  @Get('stats')
  @ApiOperation({ summary: '获取 Todo 统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats(@CurrentUser() user: User) {
    return this.todosService.getStats(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个 Todo' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: 'Todo 不存在' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.todosService.findOne(user.id, id)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新 Todo' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: 'Todo 不存在' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto
  ) {
    return this.todosService.update(user.id, id, updateTodoDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 Todo' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: 'Todo 不存在' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.todosService.remove(user.id, id)
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重新排序 Todo' })
  @ApiResponse({ status: 200, description: '排序成功' })
  @ApiResponse({ status: 403, description: '无权限访问部分 Todo' })
  async reorder(@CurrentUser() user: User, @Body() reorderDto: ReorderTodosDto) {
    await this.todosService.reorder(user.id, reorderDto)
    return { message: '排序成功' }
  }

  @Post('batch-analyze')
  @ApiOperation({ summary: '批量 AI 分析 Todo' })
  @ApiResponse({ status: 200, description: '分析完成' })
  @ApiResponse({ status: 403, description: '无权限访问部分 Todo' })
  async batchAnalyze(@CurrentUser() user: User, @Body() batchAnalyzeDto: BatchAnalyzeDto) {
    return this.todosService.batchAnalyze(user.id, batchAnalyzeDto)
  }
}
