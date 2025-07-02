import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'currentPassword123',
  })
  @IsString({ message: '当前密码必须是字符串' })
  @IsNotEmpty({ message: '当前密码不能为空' })
  currentPassword!: string

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123',
    minLength: 8,
  })
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度至少为8位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: '新密码必须包含至少一个字母和一个数字',
  })
  newPassword!: string
}
