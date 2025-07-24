import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { UpdateUserDto, User } from '@shared/types'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UtilsService } from '../common/services/utils.service'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto'
import { UserPreferencesService } from './user-preferences.service'
import { UsersService } from './users.service'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly utilsService: UtilsService
  ) {}

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(@CurrentUser() user: User) {
    const userProfile = await this.usersService.findById(user.id)
    if (!userProfile) {
      throw new Error('用户不存在')
    }
    return {
      user: this.utilsService.sanitizeUser(userProfile),
    }
  }

  @Patch('profile')
  @ApiOperation({ summary: '更新用户基本信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async updateProfile(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(user.id, updateUserDto)
    return {
      user: this.utilsService.sanitizeUser(updatedUser),
      message: '用户信息更新成功',
    }
  }

  @Patch('preferences')
  @ApiOperation({ summary: '更新用户偏好设置' })
  @ApiResponse({ status: 200, description: '偏好设置更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() updatePreferencesDto: UpdateUserPreferencesDto
  ) {
    const updatedPreferences = await this.userPreferencesService.updateBulkPreferences(
      user.id,
      updatePreferencesDto
    )
    return {
      preferences: updatedPreferences,
      message: '偏好设置更新成功',
    }
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '原密码错误或新密码格式不正确' })
  async changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(user.id, changePasswordDto)
    return {
      message: '密码修改成功',
    }
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除用户账户（软删除）' })
  @ApiResponse({ status: 200, description: '账户删除成功' })
  async deleteAccount(@CurrentUser() user: User) {
    await this.usersService.delete(user.id)
    return {
      message: '账户已成功删除',
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取用户信息（管理员功能）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id)
    if (!user) {
      throw new Error('用户不存在')
    }
    return {
      user: this.utilsService.sanitizeUser(user),
    }
  }
}
