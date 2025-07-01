import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { User } from '@shared/types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateUserSettingDto } from './dto/create-user-setting.dto'
import { UpdateUserSettingDto } from './dto/update-user-setting.dto'
import { UserSettingsService } from './user-settings.service'

@ApiTags('user-settings')
@Controller('user-settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Post()
  @ApiOperation({ summary: '创建用户设置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '设置键已存在' })
  async create(@CurrentUser() user: User, @Body() createDto: CreateUserSettingDto) {
    return this.userSettingsService.create(user.id, createDto)
  }

  @Get()
  @ApiOperation({ summary: '获取用户所有设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@CurrentUser() user: User) {
    return this.userSettingsService.findAll(user.id)
  }

  @Get(':key')
  @ApiOperation({ summary: '根据键名获取用户设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '设置不存在' })
  async findByKey(@CurrentUser() user: User, @Param('key') key: string) {
    return this.userSettingsService.findByKey(user.id, key)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '设置不存在' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateUserSettingDto
  ) {
    return this.userSettingsService.update(user.id, id, updateDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户设置' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '设置不存在' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userSettingsService.remove(user.id, id)
  }

  @Post('batch')
  @ApiOperation({ summary: '批量设置用户配置' })
  @ApiResponse({ status: 200, description: '批量设置成功' })
  async setBatch(@CurrentUser() user: User, @Body() settings: Record<string, string>) {
    return this.userSettingsService.setBatch(user.id, settings)
  }
}
