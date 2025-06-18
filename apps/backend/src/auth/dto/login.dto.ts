import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(1, { message: '密码不能为空' })
  password!: string
}
