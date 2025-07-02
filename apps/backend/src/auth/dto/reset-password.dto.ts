import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator'

export class ResetPasswordDto {
  @ApiProperty({
    description: '重置令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: '重置令牌必须是字符串' })
  @IsNotEmpty({ message: '重置令牌不能为空' })
  token!: string

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123',
    minLength: 8,
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度至少为8位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password!: string
}
