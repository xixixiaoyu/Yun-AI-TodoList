import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码', example: 'currentPassword123' })
  @IsString()
  currentPassword!: string

  @ApiProperty({ description: '新密码', minLength: 6, example: 'newPassword123' })
  @IsString()
  @MinLength(6, { message: '新密码长度至少为6位' })
  newPassword!: string
}
